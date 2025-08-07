import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Flex, SegmentedControl, Card, Switch, Button } from "@radix-ui/themes";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import Loading from "@/components/loading";
import { Eye, EyeOff, Signal, Camera } from "lucide-react";
import domtoimage from "dom-to-image-more";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
} from "recharts";
import { motion } from "framer-motion";
import fillMissingTimePoints, {
  cutPeakValues,
  calculateLossRate,
  sampleDataByRetention,
} from "@/utils/RecordHelper";
import Tips from "@/components/ui/tips";
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

// 专业的配色方案 - 渐变色系
const colorSchemes = [
  { 
    primary: "#8B5CF6", 
    secondary: "#A78BFA", 
    gradient: { from: "#8B5CF6", to: "#EC4899" },
    shadow: "rgba(139, 92, 246, 0.3)"
  },
  { 
    primary: "#06B6D4", 
    secondary: "#22D3EE", 
    gradient: { from: "#06B6D4", to: "#3B82F6" },
    shadow: "rgba(6, 182, 212, 0.3)"
  },
  { 
    primary: "#10B981", 
    secondary: "#34D399", 
    gradient: { from: "#10B981", to: "#84CC16" },
    shadow: "rgba(16, 185, 129, 0.3)"
  },
  { 
    primary: "#F59E0B", 
    secondary: "#FCD34D", 
    gradient: { from: "#F59E0B", to: "#EF4444" },
    shadow: "rgba(245, 158, 11, 0.3)"
  },
  { 
    primary: "#EC4899", 
    secondary: "#F9A8D4", 
    gradient: { from: "#EC4899", to: "#F43F5E" },
    shadow: "rgba(236, 72, 153, 0.3)"
  },
  { 
    primary: "#14B8A6", 
    secondary: "#5EEAD4", 
    gradient: { from: "#14B8A6", to: "#0EA5E9" },
    shadow: "rgba(20, 184, 166, 0.3)"
  },
];

const PingChartV2 = ({ uuid }: { uuid: string }) => {
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
  if (typeof max_record_preserve_time === "number" && max_record_preserve_time > 0) {
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
    }
  }

  const initialView = avaliableView.find((v) => v.hours === 1)?.label || avaliableView[0]?.label || "";
  const [view, setView] = useState<string>(initialView);
  const [hours, setHours] = useState<number>(
    avaliableView.find((v) => v.label === initialView)?.hours || 1
  );

  const [remoteData, setRemoteData] = useState<PingRecord[] | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cutPeak, setCutPeak] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});
  const [hoveredTask, setHoveredTask] = useState<number | null>(null);
  const [renderedDataCount, setRenderedDataCount] = useState(0);
  const [isRenderingComplete, setIsRenderingComplete] = useState(false);
  const renderingRef = useRef<boolean>(false);
  const chartCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // 更新时间范围
  useEffect(() => {
    const selected = avaliableView.find((v) => v.label === view);
    if (selected && selected.hours !== undefined) {
      setHours(selected.hours);
    }
  }, [view, avaliableView]);

  // 拉取历史数据
  useEffect(() => {
    if (!uuid || !hours) return;
    
    setLoading(true);
    setError(null);
    fetch(`/api/records/ping?uuid=${uuid}&hours=${hours}`)
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((resp: PingApiResp) => {
        const records = resp.data?.records || [];
        records.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setRemoteData(records);
        setTasks(resp.data?.tasks || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Error");
        setLoading(false);
      });
  }, [hours, uuid]);

  // 处理数据
  const midData = useMemo(() => {
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
      (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    
    const full1 = fillMissingTimePoints(
      full,
      tasks[0]?.interval || 60,
      hours * 60 * 60,
      tasks[0]?.interval ? tasks[0]?.interval * 1.2 : 60 * 1.2
    );
    
    return full1;
  }, [remoteData, tasks, hours]);

  // 完整图表数据
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

  // 分批渲染数据
  const chartData = useMemo(() => {
    if (renderedDataCount === 0) return [];
    return fullChartData.slice(0, renderedDataCount);
  }, [fullChartData, renderedDataCount]);

  // 分批渲染实现
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

    const batchSize = 50;
    let currentIndex = 0;

    const renderBatch = () => {
      if (currentIndex >= fullChartData.length) {
        setIsRenderingComplete(true);
        renderingRef.current = false;
        return;
      }

      const nextIndex = Math.min(currentIndex + batchSize, fullChartData.length);
      setRenderedDataCount(nextIndex);
      currentIndex = nextIndex;

      requestAnimationFrame(renderBatch);
    };

    renderBatch();

    return () => {
      renderingRef.current = false;
    };
  }, [fullChartData]);

  // 最新值
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
      color: colorSchemes[idx % colorSchemes.length],
    }));
  }, [remoteData, tasks]);

  // 计算统计信息
  const statistics = useMemo(() => {
    if (!chartData.length || !tasks.length) return null;
    
    const stats: any = {};
    tasks.forEach(task => {
      const values = chartData
        .map(d => d[task.id])
        .filter(v => v != null && v > 0);
      
      if (values.length > 0) {
        stats[task.id] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          current: values[values.length - 1] || null,
        };
      }
    });
    
    return stats;
  }, [chartData, tasks]);

  const handleLegendClick = useCallback((taskId: string) => {
    setHiddenLines((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  }, []);

  const toggleAllLines = useCallback(() => {
    const allHidden = tasks.every((task) => hiddenLines[String(task.id)]);
    const newHiddenState: Record<string, boolean> = {};
    tasks.forEach((task) => {
      newHiddenState[String(task.id)] = !allHidden;
    });
    setHiddenLines(newHiddenState);
  }, [tasks, hiddenLines]);

  // 导出图片功能
  const handleExportImage = useCallback(async () => {
    if (!chartCardRef.current) {
      console.error('Chart card ref not found');
      return;
    }
    
    setIsExporting(true);
    
    try {
      console.log('Starting chart export...');
      
      // 获取当前主题以设置正确的背景色
      const isDarkMode = document.documentElement.classList.contains('dark');
      const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
      
      // 配置选项
      const options = {
        quality: 1.0,
        bgcolor: backgroundColor,
        width: chartCardRef.current.scrollWidth * 2,
        height: chartCardRef.current.scrollHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left',
        },
        filter: (node: Element) => {
          // 过滤掉可能导致问题的元素
          return !node.classList?.contains('ignore-export');
        },
        // 处理字体
        fontEmbedCSS: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          * { font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
        `,
      };
      
      console.log('Generating image with dom-to-image...');
      
      // 使用 dom-to-image 生成图片
      const dataUrl = await domtoimage.toPng(chartCardRef.current, options);
      
      console.log('Image generated, triggering download...');
      
      // 创建下载链接
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      link.download = `ping-chart-${timestamp}.png`;
      link.href = dataUrl;
      link.style.display = 'none';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      
      // 清理
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
      console.log('Download triggered successfully');
      
    } catch (error) {
      console.error('Failed to export chart:', error);
      
      // 如果 dom-to-image 也失败，尝试备用方案
      try {
        console.log('Trying fallback method...');
        
        // 使用更简单的 toBlob 方法
        const blob = await domtoimage.toBlob(chartCardRef.current, {
          bgcolor: '#ffffff',
          quality: 0.95,
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        link.download = `ping-chart-${timestamp}.png`;
        link.href = url;
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        console.log('Fallback download successful');
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to export chart. This might be due to browser compatibility issues. Please try using a different browser or take a screenshot instead.');
      }
    } finally {
      setTimeout(() => {
        setIsExporting(false);
      }, 1000);
    }
  }, []);

  // 时间格式化
  const timeFormatter = (value: any) => {
    if (!value) return "";
    const date = new Date(value);
    if (hours < 24) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleDateString([], {
      month: "2-digit",
      day: "2-digit",
    });
  };

  const tooltipFormatter = (value: any) => {
    const date = new Date(value);
    if (hours < 24) {
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

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-black/90 backdrop-blur-xl p-3 rounded-xl border border-white/10 shadow-2xl"
        style={{ minWidth: "200px" }}
      >
        <p className="text-white font-medium text-sm mb-2">
          {tooltipFormatter(label)}
        </p>
        {payload.map((entry: any, index: number) => {
          const task = tasks.find(t => String(t.id) === entry.dataKey);
          if (!task || entry.value == null) return null;
          
          const colorScheme = colorSchemes[tasks.indexOf(task) % colorSchemes.length];
          
          return (
            <div key={index} className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    background: colorScheme.primary,
                    boxShadow: `0 0 8px ${colorScheme.shadow}`
                  }}
                />
                <span className="text-gray-300 text-xs">{task.name}</span>
              </div>
              <span className="text-white font-semibold text-xs">
                {entry.value.toFixed(1)} ms
              </span>
            </div>
          );
        })}
        {statistics && payload.length > 0 && payload.length < 5 && (
          <div className="mt-2 pt-2 border-t border-white/10">
            {payload.map((entry: any) => {
              const task = tasks.find(t => String(t.id) === entry.dataKey);
              if (!task) return null;
              const stat = statistics[task.id];
              if (!stat) return null;
              
              return (
                <div key={task.id} className="text-xs text-gray-400 mb-1">
                  <span className="text-gray-500">{task.name}: </span>
                  <span>Avg {stat.avg.toFixed(1)}ms</span>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };


  return (
    <Flex direction="column" align="center" gap="3" className="w-full">
      {/* 时间范围选择器 */}
      <div className="w-full px-3 md:px-0 mb-2">
        <div 
          className="w-full overflow-x-auto md:overflow-x-visible pb-2 md:pb-0"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--gray-a6) var(--gray-a3)",
            WebkitOverflowScrolling: "touch",
            maxWidth: "100%",
          }}
        >
          <Flex justify="center" className="w-full min-w-max md:min-w-0">
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
              className="flex-shrink-0"
              style={{ 
                transform: "scale(0.95)",
                transformOrigin: "center",
                height: "36px",
                minWidth: "fit-content"
              }}
            >
              {avaliableView.map((v) => (
                <SegmentedControl.Item
                  key={v.label}
                  value={v.label}
                  className="whitespace-nowrap px-3 py-1"
                  style={{ 
                    fontSize: "13px",
                    minWidth: "65px",
                    height: "100%"
                  }}
                >
                  {v.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </Flex>
        </div>
      </div>

      {/* 加载和错误状态 */}
      {loading && (
        <div className="w-full flex justify-center items-center h-64">
          <Loading />
        </div>
      )}
      
      {error && (
        <div className="w-full text-center text-red-500 py-4">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      {!loading && !error && latestValues.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <Card
            className="w-full mb-3"
            style={{
              borderRadius: "16px",
              padding: "1.25rem",
              background: "linear-gradient(135deg, var(--color-panel-solid) 0%, var(--gray-a2) 100%)",
              border: "1px solid var(--gray-a3)",
              backdropFilter: "blur(20px)",
            }}
          >
            <Tips className="absolute top-0 right-0 m-2">
              <label>{t("chart.loss_tips")}</label>
            </Tips>
            
            <div
              className="grid gap-3 mb-1 w-full"
              style={{
                gridTemplateColumns: `repeat(auto-fit, minmax(240px, 1fr))`,
              }}
            >
              {latestValues.map((task) => {
                const isHidden = hiddenLines[String(task.id)];
                const stat = statistics?.[task.id];
                
                return (
                  <motion.div
                    key={task.id}
                    className="relative overflow-hidden rounded-xl p-4 cursor-pointer transition-all"
                    style={{
                      background: isHidden
                        ? "var(--gray-a2)"
                        : `linear-gradient(135deg, ${task.color.primary}10 0%, ${task.color.secondary}05 100%)`,
                      border: `1px solid ${isHidden ? "var(--gray-a4)" : task.color.primary}20`,
                      opacity: isHidden ? 0.5 : 1,
                    }}
                    onClick={() => handleLegendClick(String(task.id))}
                    whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={() => setHoveredTask(task.id)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* 背景装饰 */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        background: `radial-gradient(circle at top right, ${task.color.primary}40, transparent 70%)`,
                      }}
                    />
                    
                    <div className="relative flex items-start gap-3">
                      <div
                        className="w-1.5 h-12 rounded-full flex-shrink-0"
                        style={{
                          background: `linear-gradient(180deg, ${task.color.primary}, ${task.color.secondary})`,
                          opacity: isHidden ? 0.3 : 1,
                          boxShadow: isHidden ? 'none' : `0 4px 12px ${task.color.shadow}`,
                        }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <label
                            className="font-semibold text-sm cursor-pointer truncate"
                            style={{
                              textDecoration: isHidden ? "line-through" : "none",
                            }}
                          >
                            {task.name}
                          </label>
                          {!isHidden && task.value !== null && (
                            <Signal size={12} className="text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Current:</span>
                            <span className="ml-1 font-semibold" style={{ color: task.color.primary }}>
                              {task.value !== null ? `${task.value}ms` : "-"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Loss:</span>
                            <span className="ml-1 font-medium">
                              {midData && midData.length > 0
                                ? `${calculateLossRate(midData, task.id)}%`
                                : "-"}
                            </span>
                          </div>
                          {stat && (
                            <>
                              <div>
                                <span className="text-muted-foreground">Avg:</span>
                                <span className="ml-1">{stat.avg.toFixed(1)}ms</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Range:</span>
                                <span className="ml-1">{stat.min.toFixed(1)}-{stat.max.toFixed(1)}ms</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {isHidden && (
                        <EyeOff size={16} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>
      )}

      {/* 主图表 */}
      {!loading && !error && chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <Card
            ref={chartCardRef}
            className="w-full"
            data-chart-export="true"
            style={{
              borderRadius: "16px",
              padding: "1.5rem",
              background: "linear-gradient(135deg, var(--color-panel-solid) 0%, var(--gray-a1) 100%)",
              border: "1px solid var(--gray-a3)",
              backdropFilter: "blur(20px)",
              minHeight: "450px",
            }}
          >
            <div className="relative">
              {!isRenderingComplete && fullChartData.length > 0 && (
                <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
                  <Loading size={3} />
                </div>
              )}
              
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <defs>
                    {colorSchemes.map((scheme, idx) => (
                      <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={scheme.primary} stopOpacity={0.5} />
                        <stop offset="50%" stopColor={scheme.primary} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={scheme.secondary} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--gray-a3)"
                    strokeOpacity={0.3}
                    vertical={false}
                  />
                  
                  <XAxis
                    dataKey="time"
                    tickFormatter={timeFormatter}
                    stroke="var(--gray-a6)"
                    tick={{ fill: "var(--gray-a11)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  
                  <YAxis
                    stroke="var(--gray-a6)"
                    tick={{ fill: "var(--gray-a11)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    unit="ms"
                  />
                  
                  <Tooltip
                    content={(props: any) => {
                      if (!props || !props.active) return null;
                      // 创建新的 payload，只包含未隐藏的线条，并去重
                      const seen = new Set();
                      const filteredPayload = props.payload?.filter((entry: any) => {
                        const taskId = String(entry.dataKey);
                        // 检查是否在 hiddenLines 中
                        if (hiddenLines[taskId]) return false;
                        // 检查值是否存在
                        if (entry.value == null) return false;
                        // 去重 - 如果已经看到这个 dataKey，跳过
                        if (seen.has(taskId)) return false;
                        seen.add(taskId);
                        return true;
                      }) || [];
                      
                      return <CustomTooltip {...props} payload={filteredPayload} />;
                    }}
                    cursor={{
                      stroke: "var(--gray-a6)",
                      strokeWidth: 1,
                      strokeDasharray: "3 3",
                    }}
                    wrapperStyle={{ zIndex: 1000 }}
                    isAnimationActive={false}
                    filterNull={false}
                  />
                  
                  {/* Lines with gradient fill */}
                  {(() => {
                    // 计算当前显示的曲线数量
                    const visibleCount = tasks.filter(task => !hiddenLines[String(task.id)]).length;
                    const showFill = visibleCount === 1;
                    
                    return tasks.map((task, idx) => {
                      const isHidden = hiddenLines[String(task.id)];
                      const colorScheme = colorSchemes[idx % colorSchemes.length];
                      const isHovered = hoveredTask === task.id;
                      
                      return (
                        <Line
                          key={task.id}
                          type={cutPeak ? "monotone" : "linear"}
                          dataKey={String(task.id)}
                          stroke={colorScheme.primary}
                          strokeWidth={isHovered ? 3 : showFill && !isHidden ? 2.5 : 2}
                          fill={`url(#gradient-${idx % colorSchemes.length})`}
                          fillOpacity={showFill && !isHidden ? 0.4 : 0}
                          dot={false}
                          hide={isHidden}
                          isAnimationActive={isRenderingComplete}
                          animationDuration={500}
                          strokeOpacity={isHovered ? 1 : 0.9}
                          style={{
                            filter: isHovered || (showFill && !isHidden) 
                              ? `drop-shadow(0 0 ${showFill ? 12 : 8}px ${colorScheme.shadow})` 
                              : 'none',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={() => setHoveredTask(task.id)}
                          onMouseLeave={() => setHoveredTask(null)}
                        />
                      );
                    });
                  })()}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Switch
                  id="cut-peak"
                  checked={cutPeak}
                  onCheckedChange={setCutPeak}
                  size="1"
                />
                <label
                  htmlFor="cut-peak"
                  className="text-xs font-medium flex items-center gap-1"
                >
                  {t("chart.cutPeak")}
                  <Tips>
                    <span dangerouslySetInnerHTML={{ __html: t("chart.cutPeak_tips") }} />
                  </Tips>
                </label>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="soft"
                  size="1"
                  onClick={handleExportImage}
                  disabled={isExporting}
                  className="flex items-center gap-1"
                >
                  {isExporting ? (
                    <Loading size={1} />
                  ) : (
                    <>
                      <Camera size={14} />
                      {t("chart.export")}
                    </>
                  )}
                </Button>
                
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
            </div>
          </Card>
        </motion.div>
      )}
    </Flex>
  );
};

export default PingChartV2;