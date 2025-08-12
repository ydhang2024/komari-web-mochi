import { useEffect, useMemo, useState, useCallback } from "react";
import { Card, Switch } from "@radix-ui/themes";
import Loading from "@/components/loading";
import { useTranslation } from "react-i18next";
import fillMissingTimePoints, { cutPeakValues, sampleDataByRetention } from "@/utils/RecordHelper";
import Tips from "./ui/tips";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";

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
  loss?: number; // 后端计算的丢包率（新版本API提供）
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

// 简化的配色方案
const colorSchemes = [
  { primary: "#8B5CF6", secondary: "#A78BFA", shadow: "rgba(139, 92, 246, 0.2)" },
  { primary: "#06B6D4", secondary: "#22D3EE", shadow: "rgba(6, 182, 212, 0.2)" },
  { primary: "#10B981", secondary: "#34D399", shadow: "rgba(16, 185, 129, 0.2)" },
  { primary: "#F59E0B", secondary: "#FCD34D", shadow: "rgba(245, 158, 11, 0.2)" },
];

interface MiniPingChartProps {
  uuid: string;
  width?: string | number;
  height?: string | number;
  hours?: number;
}

const MiniPingChartV2 = ({
  uuid,
  width = "100%",
  height = 280,
  hours = 12,
}: MiniPingChartProps) => {
  const [remoteData, setRemoteData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [t] = useTranslation();
  const [cutPeak, setCutPeak] = useState(false);

  // 获取数据
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

  // 处理数据
  const chartData = useMemo(() => {
    const data = remoteData || [];
    if (!data.length) return [];
    
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
    
    // 额外限制：MiniChart 最多显示 300 个点
    const maxPoints = 300;
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

  const handleLegendClick = useCallback((taskId: string) => {
    setHiddenLines((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  // 时间格式化
  const timeFormatter = (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card 
      style={{ 
        width, 
        height,
        borderRadius: "12px",
        background: "linear-gradient(135deg, var(--color-panel-solid) 0%, var(--gray-a1) 100%)",
        border: "1px solid var(--gray-a3)",
        backdropFilter: "blur(12px)",
        padding: "0.75rem",
      }} 
      className="flex flex-col"
    >
      {loading && (
        <div className="w-full h-full flex items-center justify-center">
          <Loading size={2} />
        </div>
      )}
      
      {error && (
        <div className="w-full h-full flex items-center justify-center text-red-500 text-sm">
          {error}
        </div>
      )}
      
      {!loading && !error && chartData.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          {t("common.none")}
        </div>
      ) : (
        !loading && !error && (
          <>
            {/* Chart */}
            <div className="flex-1 w-full relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                  >
                    <defs>
                      {colorSchemes.map((scheme, idx) => (
                        <linearGradient key={idx} id={`mini-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={scheme.primary} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={scheme.secondary} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--gray-a3)"
                      strokeOpacity={0.2}
                      vertical={false}
                    />
                    
                    <XAxis
                      dataKey="time"
                      tickFormatter={timeFormatter}
                      stroke="var(--gray-a6)"
                      tick={{ fill: "var(--gray-a11)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    
                    <YAxis
                      stroke="var(--gray-a6)"
                      tick={{ fill: "var(--gray-a11)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      unit="ms"
                      width={35}
                    />
                    
                    {/* Areas for gradient fill */}
                    {tasks.map((task, idx) => {
                      const isHidden = hiddenLines[String(task.id)];
                      if (isHidden) return null;
                      
                      return (
                        <Area
                          key={`area-${task.id}`}
                          type={cutPeak ? "monotone" : "linear"}
                          dataKey={String(task.id)}
                          fill={`url(#mini-gradient-${idx % colorSchemes.length})`}
                          stroke="none"
                          isAnimationActive={false}
                        />
                      );
                    })}
                    
                    {/* Lines */}
                    {tasks.map((task, idx) => {
                      const isHidden = hiddenLines[String(task.id)];
                      const colorScheme = colorSchemes[idx % colorSchemes.length];
                      
                      return (
                        <Line
                          key={task.id}
                          type={cutPeak ? "monotone" : "linear"}
                          dataKey={String(task.id)}
                          stroke={colorScheme.primary}
                          strokeWidth={1.5}
                          dot={false}
                          hide={isHidden}
                          isAnimationActive={false}
                          strokeOpacity={0.9}
                        />
                      );
                    })}
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Legend and Controls */}
            <div className="flex items-center justify-between mt-2 gap-2">
              {/* Legend */}
              <div className="flex items-center gap-2 flex-wrap">
                {tasks.map((task, idx) => {
                  const isHidden = hiddenLines[String(task.id)];
                  const color = colorSchemes[idx % colorSchemes.length];
                  
                  return (
                    <motion.div
                      key={task.id}
                      className="flex items-center gap-1 cursor-pointer px-2 py-1 rounded-md transition-all"
                      style={{
                        background: isHidden ? "transparent" : `${color.primary}10`,
                        opacity: isHidden ? 0.5 : 1,
                      }}
                      onClick={() => handleLegendClick(String(task.id))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          background: color.primary,
                          boxShadow: isHidden ? 'none' : `0 0 4px ${color.shadow}`,
                        }}
                      />
                      <span className="text-xs font-medium">
                        {task.name}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              {/* Cut Peak Switch */}
              <div className="flex items-center gap-1">
                <Switch 
                  size="1" 
                  checked={cutPeak} 
                  onCheckedChange={setCutPeak}
                />
                <label className="text-xs font-medium flex items-center gap-1">
                  {t("chart.cutPeak")}
                  <Tips>
                    <span dangerouslySetInnerHTML={{ __html: t("chart.cutPeak_tips") }} />
                  </Tips>
                </label>
              </div>
            </div>
          </>
        )
      )}
    </Card>
  );
};

export default MiniPingChartV2;