import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Card, Switch } from "@radix-ui/themes";
import Loading from "@/components/loading";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useTranslation } from "react-i18next";
import fillMissingTimePoints, { cutPeakValues, sampleDataByRetention } from "@/utils/RecordHelper";
import Tips from "./ui/tips";

interface PingRecord {
  client: string;
  task_id: number;
  time: string;
  value: number;
}
interface TaskInfo {
  id: number;
  name: string;
  interval: number;
}
interface PingApiResp {
  status: string;
  message: string;
  data: {
    count: number;
    records: PingRecord[];
    tasks: TaskInfo[];
  };
}

//const MAX_POINTS = 1000;
const colors = [
  "#F38181",
  "#347433",
  "#898AC4",
  "#03A6A1",
  "#7AD6F0",
  "#B388FF",
  "#FF8A65",
  "#FFD600",
];

interface MiniPingChartProps {
  uuid: string;
  width?: string | number;
  height?: string | number;
  hours?: number; // Add hours as an optional prop
}

const MiniPingChart = ({
  uuid,
  width = "100%",
  height = 300,
  hours = 12,
}: MiniPingChartProps) => {
  const [remoteData, setRemoteData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [t] = useTranslation();
  const [cutPeak, setCutPeak] = useState(false);
  const [renderedDataCount, setRenderedDataCount] = useState(0);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const renderingRef = useRef<boolean>(false);
  const [isSwitchingCutPeak, setIsSwitchingCutPeak] = useState(false);
  useEffect(() => {
    if (!uuid) return;

    setLoading(true);
    setError(null);
    fetch(`/api/records/ping?uuid=${uuid}&hours=${hours}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((resp: PingApiResp) => {
        const records = resp.data?.records || [];
        records.sort(
          (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
        );
        setRemoteData(records);
        setTasks(resp.data?.tasks || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error");
        setLoading(false);
      });
  }, [uuid, hours]);

  const fullChartData = useMemo(() => {
    const data = remoteData || [];
    if (!data.length) return [];
    //const sliced = data.slice(-MAX_POINTS);
    const grouped: Record<string, any> = {};
    const timeKeys: number[] = [];
    
    for (const rec of data) {
      const t = new Date(rec.time).getTime();
      let foundKey = null;
      for (const key of timeKeys) {
        if (Math.abs(key - t) <= 1500) {
          foundKey = key;
          break;
        }
      }
      const useKey = foundKey !== null ? foundKey : t;
      if (!grouped[useKey]) {
        grouped[useKey] = { time: new Date(useKey).toISOString() };
        if (foundKey === null) timeKeys.push(useKey);
      }
      grouped[useKey][rec.task_id] = rec.value;
    }
    
    let full = Object.values(grouped).sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    
    // 填充缺失的时间点
    full = fillMissingTimePoints(full, tasks[0]?.interval || 60, null, tasks[0]?.interval * 1.2 || 72);
    
    // 应用数据采样以减少渲染的点数（MiniChart 使用更激进的采样）
    full = sampleDataByRetention(full, hours, true);
    
    // 如果开启削峰，应用削峰处理
    if (cutPeak && tasks.length > 0) {
      const taskKeys = tasks.map(task => String(task.id));
      full = cutPeakValues(full, taskKeys);
    }
    
    // 额外限制：MiniChart 最多显示 500 个点
    const maxPoints = 500;
    if (full.length > maxPoints) {
      const step = Math.ceil(full.length / maxPoints);
      const sampled = [];
      for (let i = 0; i < full.length; i += step) {
        sampled.push(full[i]);
      }
      // 确保包含最后一个点
      if (sampled[sampled.length - 1] !== full[full.length - 1]) {
        sampled[sampled.length - 1] = full[full.length - 1];
      }
      return sampled;
    }
    
    return full;
  }, [remoteData, cutPeak, tasks, hours]);

  // 分批渲染的数据
  const chartData = useMemo(() => {
    if (renderedDataCount === 0) return [];
    return fullChartData.slice(0, renderedDataCount);
  }, [fullChartData, renderedDataCount]);

  // 实现分批渲染以提高性能
  useEffect(() => {
    if (renderingRef.current) return;
    
    if (fullChartData.length === 0) {
      setRenderedDataCount(0);
      setIsRenderingComplete(true);
      return;
    }

    renderingRef.current = true;
    setRenderedDataCount(0);
    setIsRenderingComplete(false);

    const batchSize = 50; // 增加批处理大小，减少渲染次数
    const totalBatches = Math.ceil(fullChartData.length / batchSize);
    let currentBatch = 0;

    const renderBatch = () => {
      if (currentBatch >= totalBatches) {
        setIsRenderingComplete(true);
        renderingRef.current = false;
        return;
      }

      // 一次渲染多批，加快速度
      const batchesToRender = Math.min(2, totalBatches - currentBatch);
      const nextCount = Math.min((currentBatch + batchesToRender) * batchSize, fullChartData.length);
      setRenderedDataCount(nextCount);
      currentBatch += batchesToRender;

      // 使用 requestAnimationFrame 来优化渲染性能
      requestAnimationFrame(renderBatch);
    };

    // 立即开始渲染，不等待下一帧
    renderBatch();

    return () => {
      renderingRef.current = false;
    };
  }, [fullChartData]);

  // 处理削峰切换
  const handleCutPeakChange = useCallback((checked: boolean) => {
    setIsSwitchingCutPeak(true);
    setCutPeak(checked);
  }, []);

  // 当数据处理完成后，隐藏加载状态
  useEffect(() => {
    if (isSwitchingCutPeak && isRenderingComplete) {
      setIsSwitchingCutPeak(false);
    }
  }, [isRenderingComplete, isSwitchingCutPeak]);

  const timeFormatter = (value: any, index: number) => {
    if (!chartData.length) return "";
    if (index === 0 || index === chartData.length - 1) {
      return new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return "";
  };

  const lableFormatter = (value: any) => {
    const date = new Date(value);
    return date.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const chartConfig = useMemo(() => {
    const config: Record<string, any> = {};
    tasks.forEach((task, idx) => {
      config[task.id] = {
        label: task.name,
        color: colors[idx % colors.length],
      };
    });
    return config;
  }, [tasks]);

  const handleLegendClick = useCallback((e: any) => {
    const key = e.dataKey;
    setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <Card style={{ width, height}} className="flex flex-col">
      {loading && (
        <div
          style={{
            textAlign: "center",
            width: "100%",
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Loading />
        </div>
      )}
      {error && (
        <div
          style={{
            color: "red",
            textAlign: "center",
            width: "100%",
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {error}
        </div>
      )}
      {!loading && !error && chartData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
          {t("common.none")}
        </div>
      ) : (
        !loading &&
        !error && (
          <div className="w-full h-full relative">
            {(!isRenderingComplete || isSwitchingCutPeak) && fullChartData.length > 0 && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
                <Loading size={2} />
              </div>
            )}
            <ChartContainer config={chartConfig} className="w-full h-full">
              <LineChart
              data={chartData}
              accessibilityLayer
              margin={{ top: 10, right: 16, bottom: 10, left: 16 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                tickFormatter={timeFormatter}
                interval="preserveStartEnd" // Preserve start and end ticks
                minTickGap={30} // Minimum gap between ticks to prevent overlap
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                unit="ms"
                allowDecimals={false}
                orientation="left"
                type="number"
                tick={{ dx: -10 }}
                mirror={true}
              />
              <ChartTooltip
                cursor={false}
                formatter={(v: any) => `${Math.round(v)} ms`}
                content={
                  <ChartTooltipContent
                    labelFormatter={lableFormatter}
                    indicator="dot"
                  />
                }
              />
              <ChartLegend onClick={handleLegendClick} />
              {tasks.map((task, idx) => (
                <Line
                  key={task.id}
                  dataKey={String(task.id)}
                  name={task.name}
                  stroke={colors[idx % colors.length]}
                  dot={false}
                  isAnimationActive={isRenderingComplete}
                  strokeWidth={2}
                  connectNulls={false}
                  type={cutPeak ? "basisOpen" : "linear"}
                  hide={!!hiddenLines[task.id]}
                />
              ))}
            </LineChart>
          </ChartContainer>
          </div>
        )
      )}
      <div className="-mt-3 flex items-center" style={{ display: loading ? "none" : "flex" }}>
        <Switch size="1" checked={cutPeak} onCheckedChange={handleCutPeakChange} />
        <label htmlFor="cut-peak" className="text-sm font-medium flex items-center gap-1 flex-row">
          {t("chart.cutPeak")}
          <Tips><span dangerouslySetInnerHTML={{ __html: t("chart.cutPeak_tips") }} /></Tips>
        </label>
      </div>
    </Card>
  );
};

export default MiniPingChart;
