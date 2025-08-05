import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Flex, SegmentedControl, Card, Switch, Button } from "@radix-ui/themes";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import Loading from "@/components/loading";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import fillMissingTimePoints, {
  cutPeakValues,
  calculateLossRate,
  sampleDataByRetention,
} from "@/utils/RecordHelper";
import Tips from "@/components/ui/tips";
import { Eye, EyeOff } from "lucide-react";
import "@/components/MobileChart.css";
import "@/components/DesktopChart.css";

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

const PingChart = ({ uuid }: { uuid: string }) => {
  const { t } = useTranslation();
  const { publicInfo } = usePublicInfo();
  const max_record_preserve_time = publicInfo?.ping_record_preserve_time || 0;
  // 视图选项
  const presetViews = [
    { label: t("chart.hours", { count: 1 }), hours: 1 },
    { label: t("chart.hours", { count: 6 }), hours: 6 },
    { label: t("chart.hours", { count: 12 }), hours: 12 },
    { label: t("chart.days", { count: 1 }), hours: 24 },
  ];
  const avaliableView: { label: string; hours?: number }[] = [];
  if (
    typeof max_record_preserve_time === "number" &&
    max_record_preserve_time > 0
  ) {
    for (const v of presetViews) {
      if (max_record_preserve_time >= v.hours) {
        avaliableView.push({ label: v.label, hours: v.hours });
      }
    }
    const maxPreset = presetViews[presetViews.length - 1];
    if (max_record_preserve_time > maxPreset.hours) {
      avaliableView.push({
        label: `${t("chart.hours", { count: max_record_preserve_time })}`,
        hours: max_record_preserve_time,
      });
    } else if (
      max_record_preserve_time > 1 &&
      !presetViews.some((v) => v.hours === max_record_preserve_time)
    ) {
      avaliableView.push({
        label: `${t("chart.hours", { count: max_record_preserve_time })}`,
        hours: max_record_preserve_time,
      });
    }
  }

  // 默认视图设为1小时
  const initialView =
    avaliableView.find((v) => v.hours === 1)?.label ||
    avaliableView[0]?.label ||
    "";
  const [view, setView] = useState<string>(initialView);
  const [hours, setHours] = useState<number>(
    avaliableView.find((v) => v.label === initialView)?.hours || 1
  ); // Add hours state

  const [remoteData, setRemoteData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cutPeak, setCutPeak] = useState(false); // 平滑开关，默认关闭
  const [renderedDataCount, setRenderedDataCount] = useState(0);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const renderingRef = useRef<boolean>(false);
  const [isSwitchingCutPeak, setIsSwitchingCutPeak] = useState(false);

  // Update hours state when view changes
  useEffect(() => {
    const selected = avaliableView.find((v) => v.label === view);
    if (selected && selected.hours !== undefined) {
      setHours(selected.hours);
    }
  }, [view, avaliableView]);

  // 拉取历史数据
  useEffect(() => {
    if (!uuid) return;
    if (!hours) {
      // Use hours directly
      setRemoteData(null);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/records/ping?uuid=${uuid}&hours=${hours}`) // Use hours directly
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
  }, [hours, uuid]); // Depend on hours

  const midData = useMemo(() => {
    const data = remoteData || [];
    if (!data.length) return [];

    const grouped: Record<string, any> = {};
    const timeKeys: number[] = [];

    //for (const rec of sliced) {
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
    const full1 = fillMissingTimePoints(
      full,
      tasks[0]?.interval || 60,
      hours * 60 * 60,
      tasks[0]?.interval ? tasks[0]?.interval * 1.2 : 60 * 1.2
    );
    return full1;
  }, [remoteData, cutPeak, tasks, hours]);

  // 组装完整图表数据
  const fullChartData = useMemo(() => {
    let full = midData;
    
    // 应用数据采样以减少渲染的点数
    full = sampleDataByRetention(full, hours);
    
    // 如果开启削峰，应用削峰处理
    if (cutPeak && tasks.length > 0) {
      const taskKeys = tasks.map((task) => String(task.id));
      full = cutPeakValues(full, taskKeys);
    }
    return full;
  }, [midData, cutPeak, tasks, hours]);

  // 分批渲染的数据
  const chartData = useMemo(() => {
    if (renderedDataCount === 0) return [];
    return fullChartData.slice(0, renderedDataCount);
  }, [fullChartData, renderedDataCount]);

  // 实现分批渲染（使用 Web Workers 多线程）
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

    const batchSize = 30; // 每批渲染的数据点数
    // 桌面端使用 CPU 核心数的 80%，取整数
    const cpuCores = navigator.hardwareConcurrency || 4;
    const numWorkers = Math.max(1, Math.floor(cpuCores * 0.8));
    const workers: Worker[] = [];
    const results: { [key: number]: any } = {};
    let processedBatches = 0;
    const totalBatches = Math.ceil(fullChartData.length / batchSize);

    // 创建 workers
    for (let i = 0; i < Math.min(numWorkers, totalBatches); i++) {
      const worker = new Worker('/chartDataWorker.js');
      workers.push(worker);
      
      worker.onmessage = (e) => {
        const { startIndex, data } = e.data;
        results[startIndex] = data;
        processedBatches++;

        // 实时更新渲染进度，不等待所有批次完成
        setRenderedDataCount(prevCount => {
          const newCount = Math.min(startIndex + data.length, fullChartData.length);
          return Math.max(prevCount, newCount);
        });

        // 检查是否所有批次都已处理
        if (processedBatches === totalBatches) {
          setIsRenderingComplete(true);
          renderingRef.current = false;
          
          // 清理 workers
          workers.forEach(w => w.terminate());
        }
      };
    }

    // 优化的任务分配策略
    let batchIndex = 0;
    
    // 为每个 Worker 分配初始任务
    const assignNextBatch = (worker: Worker) => {
      if (batchIndex < totalBatches) {
        const currentBatchIndex = batchIndex++;
        const startIndex = currentBatchIndex * batchSize;
        const endIndex = Math.min((currentBatchIndex + 1) * batchSize, fullChartData.length);
        
        // 立即发送任务，减少延迟
        worker.postMessage({
          chartData: fullChartData,
          startIndex,
          endIndex
        });
        
        return true;
      }
      return false;
    };
    
    // 修改 worker 的消息处理器，完成后立即分配下一个任务
    workers.forEach((worker) => {
      const originalHandler = worker.onmessage!;
      worker.onmessage = (e) => {
        originalHandler.call(worker, e);
        // 立即尝试分配下一个任务
        assignNextBatch(worker);
      };
      
      // 为每个 Worker 分配初始任务
      assignNextBatch(worker);
    });

    return () => {
      workers.forEach(w => w.terminate());
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

  // 时间格式化
  const timeFormatter = (value: any, index: number) => {
    if (!chartData.length) return "";
    if (index === 0 || index === chartData.length - 1) {
      if (hours < 24) {
        // Use hours for conditional formatting
        return new Date(value).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return new Date(value).toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
      });
    }
    return "";
  };
  const lableFormatter = (value: any) => {
    const date = new Date(value);
    if (hours < 24) {
      // Use hours for conditional formatting
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return date.toLocaleString([], {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 颜色配置
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

  const latestValues = useMemo(() => {
    if (!remoteData || !tasks.length) return [];
    const map = new Map<number, PingRecord>();
    for (let i = remoteData.length - 1; i >= 0; i--) {
      const rec = remoteData[i];
      if (!map.has(rec.task_id)) {
        map.set(rec.task_id, rec);
      }
    }
    return tasks.map((task, idx) => ({
      ...task,
      value: map.get(task.id)?.value ?? null,
      time: map.get(task.id)?.time ?? null,
      color: colors[idx % colors.length],
    }));
  }, [remoteData, tasks]);

  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const handleLegendClick = useCallback((e: any) => {
    const key = e.dataKey;
    setHiddenLines((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleAllLines = useCallback(() => {
    const allHidden = tasks.every((task) => hiddenLines[String(task.id)]);
    const newHiddenState: Record<string, boolean> = {};
    tasks.forEach((task) => {
      newHiddenState[String(task.id)] = !allHidden;
    });
    setHiddenLines(newHiddenState);
  }, [tasks, hiddenLines]);

  return (
    <Flex direction="column" align="center" gap="3" className="w-full">
      <div className="w-full px-3 md:px-0 mb-2 overflow-x-auto timeline-scroll">
        <Flex justify="center" className="w-full min-w-fit">
          <SegmentedControl.Root
            radius="full"
            value={view}
            onValueChange={(newView) => {
              setView(newView);
              const selected = avaliableView.find((v) => v.label === newView);
              if (selected && selected.hours !== undefined) {
                setHours(selected.hours);
              }
            }}
            className="w-full max-w-[600px] min-w-fit"
            style={{
              minWidth: 'max-content'
            }}
          >
            {avaliableView.map((v) => (
              <SegmentedControl.Item
                key={v.label}
                value={v.label}
                className="flex-1 capitalize whitespace-nowrap"
                style={{
                  minWidth: '80px'
                }}
              >
                {v.label}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Flex>
      </div>

      {loading && (
        <div style={{ textAlign: "center", width: "100%" }}>
          <Loading />
        </div>
      )}
      {error && (
        <div style={{ color: "red", textAlign: "center", width: "100%" }}>
          {error}
        </div>
      )}
      {latestValues.length > 0 ? (
        <Card className="w-full mb-3" style={{
          borderRadius: "12px",
          padding: "1rem",
          background: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a4)"
        }}>
          <Tips className="absolute top-0 right-0 m-2">
            <label>
              {t("chart.loss_tips")}
            </label>
          </Tips>
          <div
            className="grid gap-2 mb-1 w-full"
            style={{
              gridTemplateColumns: `repeat(auto-fit, minmax(200px,1fr))`,
            }}
          >
            {latestValues.map((task) => (
              <div 
                key={task.id} 
                className="flex flex-row items-center rounded-lg p-2 cursor-pointer hover:shadow-md transition-all" 
                style={{
                  background: hiddenLines[String(task.id)] ? "var(--gray-a1)" : "var(--gray-a2)",
                  border: `1px solid ${hiddenLines[String(task.id)] ? "var(--gray-a3)" : "var(--gray-a4)"}`,
                  transition: "all 0.2s ease",
                  opacity: hiddenLines[String(task.id)] ? 0.6 : 1
                }}
                onClick={() => handleLegendClick({ dataKey: String(task.id) })}
                title={hiddenLines[String(task.id)] ? t("chart.clickToShow") : t("chart.clickToHide")}
              >
                <div
                  className="w-1.5 h-6 rounded-sm mr-2"
                  style={{ 
                    backgroundColor: task.color,
                    opacity: hiddenLines[String(task.id)] ? 0.5 : 1
                  }}
                />
                <div className="flex items-start justify-center flex-col flex-1">
                  <label className="font-semibold text-sm cursor-pointer" style={{
                    textDecoration: hiddenLines[String(task.id)] ? "line-through" : "none"
                  }}>{task.name}</label>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span style={{ fontWeight: 500 }}>
                      {task.value !== null ? `${task.value} ms` : "-"}
                    </span>
                    <span>
                      {fullChartData && fullChartData.length > 0
                        ? `${calculateLossRate(midData, task.id)}% ${t("chart.lossRate")}`
                        : "-"}
                    </span>
                  </div>
                </div>
                {hiddenLines[String(task.id)] && (
                  <EyeOff size={12} className="text-muted-foreground ml-1" />
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="w-full text-center text-muted-foreground mb-2">
          暂无数据
        </div>
      )}
      <Card className="w-full" style={{
        borderRadius: "12px",
        padding: "1rem",
        background: "var(--color-panel-solid)",
        border: "1px solid var(--gray-a4)",
        minHeight: "250px"
      }}>
        {fullChartData.length === 0 ? (
          <div className="w-full h-40 flex items-center justify-center text-muted-foreground">
            暂无数据
          </div>
        ) : (
          <div className="relative">
            {(!isRenderingComplete || isSwitchingCutPeak) && fullChartData.length > 0 && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
                <Loading size={3} />
              </div>
            )}
            <ChartContainer config={chartConfig}>
              <LineChart
                data={chartData}
                accessibilityLayer
                margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
              <CartesianGrid vertical={false} strokeDasharray="2 4" stroke="var(--gray-a3)" />
              <XAxis
                dataKey="time"
                tickLine={false}
                tickFormatter={timeFormatter}
                interval={0}
                tick={{ fontSize: 11 }}
                axisLine={false}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                unit="ms"
                allowDecimals={false}
                orientation="left"
                type="number"
                tick={{ dx: -10, fontSize: 11 }}
                mirror={true}
                width={45}
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
                  type={cutPeak ? "basis" : "linear"}
                  hide={!!hiddenLines[String(task.id)]}
                />
              ))}
            </LineChart>
          </ChartContainer>
          </div>
        )}
        {/* Cut Peak 开关和显示/隐藏所有按钮 */}
        <div
          className="flex items-center justify-between gap-4 mt-2"
          style={{ display: loading ? "none" : "flex" }}
        >
          <div className="flex items-center gap-2">
            <Switch
              id="cut-peak"
              checked={cutPeak}
              onCheckedChange={handleCutPeakChange}
              size="1"
            />
            <label htmlFor="cut-peak" className="text-xs font-medium flex items-center gap-1 flex-row">
              {t("chart.cutPeak")}
              <Tips><span dangerouslySetInnerHTML={{ __html: t("chart.cutPeak_tips") }} /></Tips>
            </label>
          </div>
          <Button
            variant="soft"
            size="1"
            onClick={toggleAllLines}
            className="flex items-center gap-1"
          >
            {tasks.every((task) => hiddenLines[String(task.id)]) ? (
              <>
                <Eye size={14} />
                {t("chart.showAll")}
              </>
            ) : (
              <>
                <EyeOff size={14} />
                {t("chart.hideAll")}
              </>
            )}
          </Button>
        </div>
      </Card>
    </Flex>
  );
};

export default PingChart;
