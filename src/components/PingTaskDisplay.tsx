import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Card, Switch, Button, Badge, Text, SegmentedControl, Box } from "@radix-ui/themes";
import { usePublicInfo } from "@/contexts/PublicInfoContext";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData } from "@/types/LiveData";
import Loading from "@/components/loading";
import { Eye, EyeOff, Radar, CheckCircle, XCircle, Activity, Signal, Zap, Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import domtoimage from "dom-to-image-more";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Area,
  AreaChart,
  ComposedChart,
} from "recharts";
import { motion } from "framer-motion";
import fillMissingTimePoints, {
  cutPeakValues,
  sampleDataByRetention,
} from "@/utils/RecordHelper";
import Flag from "@/components/Flag";

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

interface PingTaskDisplayProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
}

// 专业配色方案 - 每个节点独特的配色
const nodeColorSchemes = [
  { 
    primary: "#3B82F6", // Blue
    secondary: "#60A5FA", 
    gradient: { from: "#3B82F6", to: "#1E40AF" },
    shadow: "rgba(59, 130, 246, 0.4)",
    light: "#DBEAFE"
  },
  { 
    primary: "#10B981", // Emerald
    secondary: "#34D399", 
    gradient: { from: "#10B981", to: "#047857" },
    shadow: "rgba(16, 185, 129, 0.4)",
    light: "#D1FAE5"
  },
  { 
    primary: "#8B5CF6", // Violet
    secondary: "#A78BFA", 
    gradient: { from: "#8B5CF6", to: "#6D28D9" },
    shadow: "rgba(139, 92, 246, 0.4)",
    light: "#EDE9FE"
  },
  { 
    primary: "#F59E0B", // Amber
    secondary: "#FCD34D", 
    gradient: { from: "#F59E0B", to: "#D97706" },
    shadow: "rgba(245, 158, 11, 0.4)",
    light: "#FEF3C7"
  },
  { 
    primary: "#EF4444", // Red
    secondary: "#F87171", 
    gradient: { from: "#EF4444", to: "#B91C1C" },
    shadow: "rgba(239, 68, 68, 0.4)",
    light: "#FEE2E2"
  },
  { 
    primary: "#14B8A6", // Teal
    secondary: "#5EEAD4", 
    gradient: { from: "#14B8A6", to: "#0F766E" },
    shadow: "rgba(20, 184, 166, 0.4)",
    light: "#CCFBF1"
  },
  { 
    primary: "#EC4899", // Pink
    secondary: "#F9A8D4", 
    gradient: { from: "#EC4899", to: "#BE185D" },
    shadow: "rgba(236, 72, 153, 0.4)",
    light: "#FCE7F3"
  },
  { 
    primary: "#6366F1", // Indigo
    secondary: "#818CF8", 
    gradient: { from: "#6366F1", to: "#4338CA" },
    shadow: "rgba(99, 102, 241, 0.4)",
    light: "#E0E7FF"
  },
];

const PingTaskDisplay: React.FC<PingTaskDisplayProps> = ({ nodes, liveData }) => {
  const { t } = useTranslation();
  const { publicInfo } = usePublicInfo();
  const max_record_preserve_time = publicInfo?.ping_record_preserve_time || 0;
  const isMobile = useIsMobile();
  const chartCardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // 检测是否为 Safari 浏览器
  const isSafari = useMemo(() => {
    const ua = navigator.userAgent.toLowerCase();
    return ua.includes('safari') && !ua.includes('chrome') && !ua.includes('android');
  }, []);
  
  // 当前选中的Ping任务
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [taskData, setTaskData] = useState<Record<number, PingRecord[]>>({});
  const [taskLossRates, setTaskLossRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cutPeak, setCutPeak] = useState(false);
  const [hiddenNodes, setHiddenNodes] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<"line" | "area" | "composed">("line");
  
  // 构建可用的时间范围选项（参考PingChartV2）
  const presetViews = [
    { label: t("chart.hours", { count: 1 }), hours: 1 },
    { label: t("chart.hours", { count: 6 }), hours: 6 },
    { label: t("chart.hours", { count: 12 }), hours: 12 },
    { label: t("chart.days", { count: 1 }), hours: 24 },
    { label: t("chart.days", { count: 7 }), hours: 168 }, // 1 week = 168 hours
  ];
  
  const availableViews: { label: string; hours: number }[] = [];
  if (typeof max_record_preserve_time === "number" && max_record_preserve_time > 0) {
    for (const v of presetViews) {
      if (max_record_preserve_time >= v.hours) {
        availableViews.push({ label: v.label, hours: v.hours });
      }
    }
    // 如果最大保存时间超过了所有预设值，添加最大时间选项
    const maxPreset = presetViews[presetViews.length - 1];
    if (max_record_preserve_time > maxPreset.hours) {
      availableViews.push({
        label: `${t("chart.hours", { count: max_record_preserve_time })}`,
        hours: max_record_preserve_time,
      });
    }
  } else {
    // 如果没有设置最大保存时间，使用默认的选项
    availableViews.push(...presetViews);
  }
  
  const initialView = availableViews.find((v) => v.hours === 6) || availableViews[0];
  const [viewHours, setViewHours] = useState(initialView?.hours || 6);

  // 获取所有Ping任务 - 优先使用admin API，失败则从所有节点获取
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    // 首先尝试从admin API获取任务列表
    fetch('/api/admin/ping')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Admin API failed: ${res.status}`);
        }
        return res.json();
      })
      .then(resp => {
        // 假设admin API返回任务列表
        const taskList = resp.data?.tasks || resp.tasks || resp || [];
        if (Array.isArray(taskList) && taskList.length > 0) {
          setTasks(taskList);
          if (!selectedTaskId) {
            setSelectedTaskId(taskList[0].id);
          }
          setLoading(false);
        } else {
          throw new Error("No tasks from admin API");
        }
      })
      .catch(adminErr => {
        console.log("Admin API failed, trying nodes:", adminErr.message);
        
        // Admin API失败，从所有节点获取任务列表并合并
        const taskPromises = nodes.map(node => 
          fetch(`/api/records/ping?uuid=${node.uuid}&hours=1`)
            .then(res => res.ok ? res.json() : null)
            .then(resp => resp?.data?.tasks || [])
            .catch(() => [])
        );
        
        Promise.all(taskPromises)
          .then(allTaskLists => {
            // 合并所有节点的任务列表，去重
            const taskMap = new Map<number, TaskInfo>();
            
            allTaskLists.forEach(taskList => {
              if (Array.isArray(taskList)) {
                taskList.forEach((task: TaskInfo) => {
                  if (task && task.id && !taskMap.has(task.id)) {
                    taskMap.set(task.id, task);
                  }
                });
              }
            });
            
            const mergedTasks = Array.from(taskMap.values()).sort((a, b) => a.id - b.id);
            
            if (mergedTasks.length > 0) {
              setTasks(mergedTasks);
              if (!selectedTaskId) {
                setSelectedTaskId(mergedTasks[0].id);
              }
              setLoading(false);
            } else {
              setError("No ping tasks found from any node");
              setLoading(false);
            }
          })
          .catch(() => {
            setError("Failed to fetch ping tasks from nodes");
            setLoading(false);
          });
      });
  }, [nodes?.length]); // Only re-run when nodes count changes

  // 获取选中任务的所有节点数据
  useEffect(() => {
    if (!selectedTaskId || !nodes || nodes.length === 0) return;
    
    setLoading(true);
    const promises = nodes.map(node => 
      fetch(`/api/records/ping?uuid=${node.uuid}&hours=${viewHours}`)
        .then(res => res.ok ? res.json() : null)
        .then(resp => {
          // 提取后端计算的丢包率（如果存在）
          const tasks = resp?.data?.tasks || [];
          const lossRates: Record<string, number> = {};
          tasks.forEach((task: TaskInfo) => {
            if (task.id && typeof task.loss === 'number') {
              lossRates[`${node.uuid}_${task.id}`] = task.loss;
            }
          });
          
          return {
            nodeId: node.uuid,
            records: resp?.data?.records?.filter((r: PingRecord) => r.task_id === selectedTaskId) || [],
            lossRates
          };
        })
        .catch(() => ({ nodeId: node.uuid, records: [], lossRates: {} }))
    );
    
    Promise.all(promises)
      .then(results => {
        const newData: Record<number, PingRecord[]> = {};
        const allLossRates: Record<string, number> = {};
        
        results.forEach(result => {
          // 合并丢包率数据
          Object.assign(allLossRates, result.lossRates);
          
          if (result.records.length > 0) {
            result.records.forEach((record: PingRecord) => {
              if (!newData[selectedTaskId]) {
                newData[selectedTaskId] = [];
              }
              newData[selectedTaskId].push({
                ...record,
                client: result.nodeId
              });
            });
          }
        });
        
        setTaskData(newData);
        setTaskLossRates(allLossRates);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching ping data:", err);
        setLoading(false);
      });
  }, [selectedTaskId, nodes, viewHours]);

  // 获取当前选中的任务
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  // 处理图表数据（参考PingChartV2的数据处理逻辑）
  const chartData = useMemo(() => {
    if (!selectedTaskId || !taskData[selectedTaskId] || !selectedTask) return [];
    
    const records = taskData[selectedTaskId];
    if (!records.length) return [];
    
    const grouped: Record<string, any> = {};
    const timeKeys: number[] = [];
    
    // 按时间分组，处理容差（参考PingChartV2）
    records.forEach(record => {
      const t = new Date(record.time).getTime();
      let foundKey = null;
      
      // 检查是否有接近的时间点（1.5秒容差）
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
      
      // 将-1视为null（表示无数据）
      const value = record.value === -1 ? null : record.value;
      grouped[useKey][record.client] = value;
    });
    
    let data = Object.values(grouped).sort(
      (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );
    
    // 使用fillMissingTimePoints填充缺失的时间点
    const taskInterval = selectedTask?.interval || 60;
    data = fillMissingTimePoints(
      data,
      taskInterval, // 任务间隔
      viewHours * 60 * 60, // 总时间（秒）
      taskInterval * 1.2 // 匹配容差（间隔的1.2倍）
    );
    
    // 应用数据采样以减少渲染的点数
    data = sampleDataByRetention(data, viewHours);
    
    // 如果开启削峰，应用削峰处理
    if (cutPeak && nodes) {
      const nodeKeys = nodes.map(n => n.uuid);
      data = cutPeakValues(data, nodeKeys);
    }
    
    return data;
  }, [taskData, selectedTaskId, selectedTask, cutPeak, nodes, viewHours]);

  // 计算每个节点的统计信息
  const nodeStatistics = useMemo(() => {
    if (!chartData.length || !nodes) return {};
    
    const stats: Record<string, any> = {};
    
    nodes.forEach(node => {
      const values = chartData
        .map(d => d[node.uuid])
        .filter(v => v != null && v > 0);
      
      if (values.length > 0) {
        // 优先使用后端计算的丢包率，如果不存在则使用前端计算
        const backendLossRate = selectedTaskId ? taskLossRates[`${node.uuid}_${selectedTaskId}`] : undefined;
        const lossRate = typeof backendLossRate === 'number' 
          ? backendLossRate 
          : Math.round((1 - values.length / chartData.length) * 1000) / 10;
        
        // 打印丢包率计算来源
        console.log(`[PingTaskDisplay] Node: ${node.name} (${node.uuid}), Task ID: ${selectedTaskId}`, {
          lossRate,
          source: typeof backendLossRate === 'number' ? 'Backend API' : 'Frontend Calculation',
          backendValue: backendLossRate,
          frontendValue: Math.round((1 - values.length / chartData.length) * 1000) / 10,
          validSamples: values.length,
          totalSamples: chartData.length
        });
        
        const isOnline = liveData?.online?.includes(node.uuid) || false;
        stats[node.uuid] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          current: values[values.length - 1] || null,
          lossRate,
          totalSamples: chartData.length,
          validSamples: values.length,
          isOnline,
          isBackendCalculated: typeof backendLossRate === 'number', // 标记是否使用后端计算的值
        };
      }
    });
    
    return stats;
  }, [chartData, nodes, liveData, selectedTaskId, taskLossRates]);

  // 切换节点显示/隐藏
  const toggleNode = useCallback((nodeId: string) => {
    setHiddenNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  }, []);

  // 切换所有节点
  const toggleAllNodes = useCallback(() => {
    if (!nodes) return;
    const allHidden = nodes.every(node => hiddenNodes[node.uuid]);
    const newHiddenState: Record<string, boolean> = {};
    nodes.forEach(node => {
      newHiddenState[node.uuid] = !allHidden;
    });
    setHiddenNodes(newHiddenState);
  }, [nodes, hiddenNodes]);

  // 导出图片功能（参考PingChartV2）
  const handleExportImage = useCallback(async () => {
    if (!chartCardRef.current) {
      console.error('Chart card ref not found');
      return;
    }
    
    setIsExporting(true);
    
    try {
      const isDarkMode = document.documentElement.classList.contains('dark');
      const backgroundColor = isDarkMode ? '#1a1a1a' : '#ffffff';
      
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
          return !node.classList?.contains('ignore-export');
        },
      };
      
      const dataUrl = await domtoimage.toPng(chartCardRef.current, options);
      
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
      link.download = `ping-task-chart-${timestamp}.png`;
      link.href = dataUrl;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error('Failed to export chart:', error);
      
      // 尝试备用方案
      try {
        const blob = await domtoimage.toBlob(chartCardRef.current, {
          bgcolor: '#ffffff',
          quality: 0.95,
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        link.download = `ping-task-chart-${timestamp}.png`;
        link.href = url;
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert('Failed to export chart. Please try using a different browser or take a screenshot instead.');
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
    if (viewHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "2-digit", day: "2-digit" });
  };

  // 自定义Tooltip
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length || !nodes) return null;

    const validPayload = payload.filter((entry: any) => 
      !hiddenNodes[entry.dataKey] && entry.value != null
    );

    if (!validPayload.length) return null;

    // 只显示前10个节点，避免Tooltip过长
    const displayPayload = validPayload.slice(0, 10);
    const hasMore = validPayload.length > 10;

    return (
      <div className="bg-black/90 backdrop-blur-sm p-3 rounded-lg border border-white/10 shadow-xl" 
           style={{ minWidth: "180px", maxWidth: "300px" }}>
        <p className="text-white font-medium text-xs mb-2">
          {new Date(label).toLocaleString([], { 
            month: "short",
            day: "numeric",
            hour: "2-digit", 
            minute: "2-digit",
            second: "2-digit"
          })}
        </p>
        <div className="space-y-1">
          {displayPayload.map((entry: any, index: number) => {
            const node = nodes.find(n => n.uuid === entry.dataKey);
            if (!node) return null;
            
            const colorScheme = nodeColorSchemes[nodes.indexOf(node) % nodeColorSchemes.length];
            
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ 
                      background: colorScheme.primary,
                    }}
                  />
                  <span className="text-gray-300 text-xs truncate">
                    {node.name}
                  </span>
                </div>
                <span className="text-white font-semibold text-xs tabular-nums flex-shrink-0">
                  {entry.value.toFixed(1)}ms
                </span>
              </div>
            );
          })}
          {hasMore && (
            <div className="text-gray-400 text-xs pt-1 border-t border-white/10">
              +{validPayload.length - 10} more...
            </div>
          )}
        </div>
        {displayPayload.length <= 5 && (
          <div className="mt-2 pt-2 border-t border-white/10 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Avg:</span>
              <span className="font-medium text-gray-300">
                {(displayPayload.reduce((sum: number, p: any) => sum + p.value, 0) / displayPayload.length).toFixed(1)}ms
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }, [hiddenNodes, nodes]);

  if (error) {
    return (
      <Box className="flex items-center justify-center h-96">
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <Text size="3" color="red" className="mb-2">{t("Error loading ping tasks")}</Text>
          <Text size="2" color="gray">{error}</Text>
        </Card>
      </Box>
    );
  }

  if (tasks.length === 0 && !loading) {
    return (
      <Box className="flex items-center justify-center h-96">
        <Card style={{ padding: "2rem", textAlign: "center" }}>
          <Text size="3" color="gray">{t("No ping tasks configured")}</Text>
          <Text size="2" color="gray" className="mt-2">{t("Please configure ping tasks in admin panel")}</Text>
        </Card>
      </Box>
    );
  }

  return (
    <Flex direction="column" gap="4" className="w-full px-4">
      {/* 任务选择器和控制面板 */}
      <Card style={{ borderRadius: "12px", padding: "1.25rem", background: "var(--color-panel-solid)" }}>
        <Flex direction="column" gap="4">
          {/* 标题栏 */}
          <Flex align="center" justify="between">
            <Flex align="center" gap="3">
              <Radar className="text-accent-9" size={24} />
              <Text size="4" weight="bold">{t("Ping Task Monitor")}</Text>
            </Flex>
            <Badge color="blue" variant="soft" size="2">
              {tasks.length} {t("Tasks")}
            </Badge>
          </Flex>
          
          {/* 任务选择网格 */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {tasks.map(task => (
              <motion.button
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTaskId === task.id
                    ? "bg-accent-3 border-accent-7 shadow-lg"
                    : "bg-gray-a2 border-gray-a4 hover:bg-gray-a3 hover:border-gray-a5"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Flex direction="column" align="start" gap="2">
                  <Text size="2" weight="bold">{task.name}</Text>
                  <Flex align="center" gap="1">
                    <Activity size={12} className="text-gray-9" />
                    <Text size="1" color="gray">
                      {task.interval}s interval
                    </Text>
                  </Flex>
                </Flex>
              </motion.button>
            ))}
          </div>

          {/* 控制选项 - 移动端优化 */}
          {isMobile ? (
            // 移动端布局：时间范围选择 + 削峰开关
            <Flex direction="column" gap="3">
              {/* 时间范围选择 - 可横向滚动 */}
              <div>
                <Flex align="center" justify="between" className="mb-2">
                  <Text size="1" weight="medium">{t("Time Range")}</Text>
                  <Flex gap="2" align="center">
                    <Switch
                      id="cut-peak"
                      checked={cutPeak}
                      onCheckedChange={setCutPeak}
                      size="1"
                    />
                    <label htmlFor="cut-peak" className="text-xs whitespace-nowrap">
                      {t("chart.cutPeak")}
                    </label>
                  </Flex>
                </Flex>
                <div 
                  className="overflow-x-auto pb-2 -mx-2 px-2"
                  style={{
                    scrollbarWidth: "thin",
                    scrollbarColor: "var(--gray-a6) var(--gray-a3)",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div className="inline-flex">
                    <SegmentedControl.Root
                      value={String(viewHours)}
                      onValueChange={(value) => setViewHours(Number(value))}
                      size="1"
                      style={{ minWidth: "max-content" }}
                    >
                      {availableViews.map(view => (
                        <SegmentedControl.Item 
                          key={view.hours} 
                          value={String(view.hours)}
                          className="whitespace-nowrap px-2"
                          style={{ fontSize: "12px" }}
                        >
                          {view.label}
                        </SegmentedControl.Item>
                      ))}
                    </SegmentedControl.Root>
                  </div>
                </div>
              </div>
            </Flex>
          ) : (
            // 桌面端布局：保持原样
            <Flex justify="between" align="center" gap="4" wrap="wrap">
              <Flex gap="3" align="center">
                <Text size="2" weight="medium">{t("Time Range")}:</Text>
                <SegmentedControl.Root
                  value={String(viewHours)}
                  onValueChange={(value) => setViewHours(Number(value))}
                  size="2"
                >
                  {availableViews.map(view => (
                    <SegmentedControl.Item key={view.hours} value={String(view.hours)}>
                      {view.label}
                    </SegmentedControl.Item>
                  ))}
                </SegmentedControl.Root>
              </Flex>
              
              <Flex gap="3" align="center">
                <Text size="2" weight="medium">{t("Chart Type")}:</Text>
                <SegmentedControl.Root
                  value={chartType}
                  onValueChange={(value) => setChartType(value as any)}
                  size="2"
                >
                  <SegmentedControl.Item value="line">{t("Line")}</SegmentedControl.Item>
                  <SegmentedControl.Item value="area">{t("Area")}</SegmentedControl.Item>
                  <SegmentedControl.Item value="composed">{t("Combined")}</SegmentedControl.Item>
                </SegmentedControl.Root>
              </Flex>

              <Flex gap="3" align="center">
                <Switch
                  id="cut-peak"
                  checked={cutPeak}
                  onCheckedChange={setCutPeak}
                  size="2"
                />
                <label htmlFor="cut-peak" className="text-sm font-medium cursor-pointer">
                  {t("chart.cutPeak")}
                </label>
              </Flex>
            </Flex>
          )}
        </Flex>
      </Card>

      {/* 移动端Chart Type选择器 - 放在时间轴和节点统计之间 */}
      {isMobile && selectedTask && (
        <Card style={{ 
          borderRadius: "12px", 
          padding: "0.75rem",
          background: "var(--color-panel-solid)",
          border: "1px solid var(--gray-a3)"
        }}>
          <div>
            <Text size="2" weight="medium" className="mb-2">{t("Chart Type")}</Text>
            <div 
              className="overflow-x-auto pb-2 -mx-2 px-2"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--gray-a6) var(--gray-a3)",
                WebkitOverflowScrolling: "touch",
              }}
            >
              <div className="inline-flex w-full">
                <SegmentedControl.Root
                  value={chartType}
                  onValueChange={(value) => setChartType(value as any)}
                  size="2"
                  className="w-full"
                >
                  <SegmentedControl.Item value="line" className="flex-1">
                    {t("Line")}
                  </SegmentedControl.Item>
                  <SegmentedControl.Item value="area" className="flex-1">
                    {t("Area")}
                  </SegmentedControl.Item>
                  <SegmentedControl.Item value="composed" className="flex-1">
                    {t("Combined")}
                  </SegmentedControl.Item>
                </SegmentedControl.Root>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 节点统计卡片网格 */}
      {selectedTask && nodes && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card style={{ 
            borderRadius: "16px", 
            padding: "1.5rem",
            background: "linear-gradient(135deg, var(--color-panel-solid) 0%, var(--gray-a2) 100%)",
            border: "1px solid var(--gray-a3)"
          }}>
            <Flex direction="column" gap="4">
              <Flex align="center" justify="between">
                <Flex align="center" gap="3">
                  <Signal className="text-accent-9" size={20} />
                  <Text size="3" weight="bold">
                    {selectedTask.name} - {t("Node Statistics")}
                  </Text>
                </Flex>
                <Button
                  variant="soft"
                  size="2"
                  onClick={toggleAllNodes}
                >
                  {nodes.every(n => hiddenNodes[n.uuid]) ? (
                    <><Eye size={16} /> {t("Show All")}</>
                  ) : (
                    <><EyeOff size={16} /> {t("Hide All")}</>
                  )}
                </Button>
              </Flex>
              
              <div className={
                isMobile 
                  ? 'grid grid-cols-2 gap-2' 
                  : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3'
              }>
                {nodes.filter(node => {
                  // 过滤掉没有数据的节点
                  const stats = nodeStatistics[node.uuid];
                  return stats && stats.validSamples > 0;
                }).map((node, idx) => {
                  const stats = nodeStatistics[node.uuid];
                  const isHidden = hiddenNodes[node.uuid];
                  const colorScheme = nodeColorSchemes[idx % nodeColorSchemes.length];
                  const isOnline = stats?.isOnline || false;
                  
                  return (
                    <motion.div
                      key={node.uuid}
                      className={`relative overflow-hidden rounded-xl cursor-pointer transition-all ${
                        isMobile ? 'p-3' : 'p-4'
                      }`}
                      style={{
                        background: isHidden
                          ? "var(--gray-a2)"
                          : `linear-gradient(135deg, ${colorScheme.primary}15 0%, ${colorScheme.secondary}10 100%)`,
                        border: `2px solid ${isHidden ? "var(--gray-a4)" : colorScheme.primary}30`,
                        opacity: isHidden ? 0.6 : 1,
                      }}
                      onClick={() => toggleNode(node.uuid)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {/* 背景装饰 */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `radial-gradient(circle at top right, ${colorScheme.primary}40, transparent 70%)`,
                        }}
                      />
                      
                      <div className="relative">
                        {/* 节点头部 */}
                        <Flex align="center" gap={isMobile ? "1" : "2"} className={isMobile ? "mb-2" : "mb-3"}>
                          <div
                            className={`${isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'} rounded-full animate-pulse`}
                            style={{
                              background: isOnline ? colorScheme.primary : "#6B7280",
                              opacity: isHidden ? 0.3 : 1,
                              boxShadow: isHidden ? 'none' : `0 0 12px ${isOnline ? colorScheme.shadow : "rgba(107, 114, 128, 0.3)"}`,
                            }}
                          />
                          {!isMobile && <Flag flag={node.region} />}
                          <Text size={isMobile ? "1" : "2"} weight="bold" className="truncate flex-1">
                            {node.name}
                          </Text>
                          {!isHidden && (
                            isOnline ? (
                              <CheckCircle size={isMobile ? 12 : 16} className="text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle size={isMobile ? 12 : 16} className="text-red-500 flex-shrink-0" />
                            )
                          )}
                        </Flex>
                        
                        {/* 统计信息 - 现在stats一定存在，因为已经过滤了 */}
                        <div className={isMobile ? "space-y-1.5" : "space-y-2"}>
                          {/* 当前延迟 */}
                          <div className="flex items-center justify-between">
                            <Text size="1" color="gray">{isMobile ? "Now" : t("Current")}:</Text>
                            <Text size={isMobile ? "1" : "2"} weight="bold" style={{ color: colorScheme.primary }}>
                              {stats.current ? `${stats.current.toFixed(1)}ms` : "-"}
                            </Text>
                          </div>
                          
                          {/* 延迟条形图 */}
                          <div className={`w-full ${isMobile ? 'h-1' : 'h-1.5'} bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
                            <div 
                              className="h-full transition-all duration-500"
                              style={{
                                width: stats.current ? `${Math.min((stats.current / 200) * 100, 100)}%` : '0%',
                                background: `linear-gradient(90deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
                              }}
                            />
                          </div>
                          
                          {isMobile ? (
                            // 移动端：Loss和Avg各占一行
                            <div className="space-y-1 text-xs">
                              <div className="flex items-center justify-between">
                                <Text color="gray" size="1">{t("Loss")}:</Text>
                                <Text size="1" weight="medium" className={stats.lossRate > 10 ? "text-red-500" : ""}>
                                  {stats.lossRate}%
                                </Text>
                              </div>
                              <div className="flex items-center justify-between">
                                <Text color="gray" size="1">{t("Avg")}:</Text>
                                <Text size="1" weight="medium">{stats.avg.toFixed(1)}ms</Text>
                              </div>
                            </div>
                          ) : (
                            // 桌面端：保持原有的2x2网格布局
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <Text color="gray" size="1">{t("Loss")}:</Text>
                                <Text size="1" weight="medium" className={stats.lossRate > 10 ? "text-red-500" : ""}>
                                  {stats.lossRate}%
                                </Text>
                              </div>
                              <div>
                                <Text color="gray" size="1">{t("Avg")}:</Text>
                                <Text size="1" weight="medium">{stats.avg.toFixed(1)}ms</Text>
                              </div>
                              <div>
                                <Text color="gray" size="1">{t("Min")}:</Text>
                                <Text size="1">{stats.min.toFixed(0)}ms</Text>
                              </div>
                              <div>
                                <Text color="gray" size="1">{t("Max")}:</Text>
                                <Text size="1">{stats.max.toFixed(0)}ms</Text>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* 隐藏指示器 */}
                        {isHidden && (
                          <div className="absolute top-2 right-2">
                            <EyeOff size={16} className="text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Flex>
          </Card>
        </motion.div>
      )}

      {/* 主图表 */}
      {loading && (
        <Card style={{ borderRadius: "16px", padding: "4rem" }}>
          <Flex justify="center" align="center">
            <Loading />
          </Flex>
        </Card>
      )}
      
      {error && (
        <Card style={{ borderRadius: "16px", padding: "2rem" }}>
          <Flex justify="center" align="center">
            <Text color="red">{error}</Text>
          </Flex>
        </Card>
      )}
      
      {!loading && !error && chartData.length > 0 && nodes && selectedTask && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card 
            ref={chartCardRef}
            style={{ 
              borderRadius: "16px", 
              padding: "2rem",
              background: "linear-gradient(135deg, var(--color-panel-solid) 0%, var(--gray-a1) 100%)",
              border: "1px solid var(--gray-a3)",
              minHeight: "500px",
              margin: "8px"
            }}
          >
            <Flex direction="column" gap="3">
              <Flex align="center" justify="between">
                <Flex align="center" gap="3">
                  <Zap className="text-accent-9" size={20} />
                  <Text size="3" weight="bold">
                    {selectedTask.name} - {t("Latency Chart")}
                  </Text>
                </Flex>
                {/* 导出按钮 - 仅在桌面端非Safari浏览器显示 */}
                {!isMobile && !isSafari && (
                  <Button
                    variant="soft"
                    size="2"
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="ignore-export"
                  >
                    {isExporting ? (
                      <Loading />
                    ) : (
                      <>
                        <Camera size={16} />
                        {t("Export")}
                      </>
                    )}
                  </Button>
                )}
              </Flex>
              
              {/* 图例 - 显示机器和曲线对应关系 */}
              {!isMobile && (
                <div className="flex flex-wrap gap-2 mb-3 justify-center">
                  {nodes.filter(node => {
                    const stats = nodeStatistics[node.uuid];
                    return stats && stats.validSamples > 0 && !hiddenNodes[node.uuid];
                  }).slice(0, 10).map((node) => {
                    const nodeIdx = nodes.indexOf(node);
                    const colorScheme = nodeColorSchemes[nodeIdx % nodeColorSchemes.length];
                    const stats = nodeStatistics[node.uuid];
                    const hasData = stats && stats.current !== null;
                    
                    return (
                      <div
                        key={node.uuid}
                        className="flex items-center gap-2 px-3 py-1 rounded-md"
                        style={{
                          background: `${colorScheme.primary}10`,
                          border: `1px solid ${colorScheme.primary}30`,
                        }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            background: hasData ? colorScheme.primary : "var(--gray-a5)",
                            boxShadow: hasData ? `0 0 6px ${colorScheme.shadow}` : 'none',
                          }}
                        />
                        <span className="text-sm font-medium">{node.name}</span>
                      </div>
                    );
                  })}
                  {nodes.filter(node => {
                    const stats = nodeStatistics[node.uuid];
                    return stats && stats.validSamples > 0 && !hiddenNodes[node.uuid];
                  }).length > 10 && (
                    <span className="text-sm text-gray-500 px-2 py-1">
                      +{nodes.filter(node => {
                        const stats = nodeStatistics[node.uuid];
                        return stats && stats.validSamples > 0 && !hiddenNodes[node.uuid];
                      }).length - 10} more
                    </span>
                  )}
                </div>
              )}
              
              <ResponsiveContainer width="100%" height={450}>
                {chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <defs>
                      {nodeColorSchemes.map((scheme, idx) => (
                        <linearGradient key={idx} id={`gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={scheme.primary} stopOpacity={0.8} />
                          <stop offset="100%" stopColor={scheme.secondary} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a3)" strokeOpacity={0.3} />
                    <XAxis dataKey="time" tickFormatter={timeFormatter} stroke="var(--gray-a6)" />
                    <YAxis stroke="var(--gray-a6)" unit="ms" />
                    <Tooltip content={CustomTooltip} />
                    
                    {nodes.filter(node => {
                      const stats = nodeStatistics[node.uuid];
                      return stats && stats.validSamples > 0;
                    }).map((node, idx) => {
                      const isHidden = hiddenNodes[node.uuid];
                      const colorScheme = nodeColorSchemes[idx % nodeColorSchemes.length];
                      
                      return (
                        <Line
                          key={node.uuid}
                          type={cutPeak ? "monotone" : "linear"}
                          dataKey={node.uuid}
                          stroke={colorScheme.primary}
                          strokeWidth={2}
                          dot={false}
                          hide={isHidden}
                          strokeOpacity={0.8}
                        />
                      );
                    })}
                  </LineChart>
                ) : chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <defs>
                      {nodeColorSchemes.map((scheme, idx) => (
                        <linearGradient key={idx} id={`area-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={scheme.primary} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={scheme.secondary} stopOpacity={0.05} />
                        </linearGradient>
                      ))}
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a3)" strokeOpacity={0.3} />
                    <XAxis dataKey="time" tickFormatter={timeFormatter} stroke="var(--gray-a6)" />
                    <YAxis stroke="var(--gray-a6)" unit="ms" />
                    <Tooltip content={CustomTooltip} />
                    
                    {nodes.filter(node => {
                      const stats = nodeStatistics[node.uuid];
                      return stats && stats.validSamples > 0;
                    }).map((node, idx) => {
                      const isHidden = hiddenNodes[node.uuid];
                      const colorScheme = nodeColorSchemes[idx % nodeColorSchemes.length];
                      
                      return (
                        <Area
                          key={node.uuid}
                          type={cutPeak ? "monotone" : "linear"}
                          dataKey={node.uuid}
                          stroke={colorScheme.primary}
                          fill={`url(#area-gradient-${idx % nodeColorSchemes.length})`}
                          strokeWidth={1.5}
                          hide={isHidden}
                          stackId="1"
                        />
                      );
                    })}
                  </AreaChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                    <defs>
                      {nodeColorSchemes.map((scheme, idx) => (
                        <linearGradient key={idx} id={`composed-gradient-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={scheme.primary} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={scheme.secondary} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a3)" strokeOpacity={0.3} />
                    <XAxis dataKey="time" tickFormatter={timeFormatter} stroke="var(--gray-a6)" />
                    <YAxis stroke="var(--gray-a6)" unit="ms" />
                    <Tooltip content={CustomTooltip} />
                    
                    {nodes.filter(node => {
                      const stats = nodeStatistics[node.uuid];
                      return stats && stats.validSamples > 0;
                    }).map((node, idx) => {
                      const isHidden = hiddenNodes[node.uuid];
                      const colorScheme = nodeColorSchemes[idx % nodeColorSchemes.length];
                      const filteredNodes = nodes.filter(n => {
                        const s = nodeStatistics[n.uuid];
                        return s && s.validSamples > 0;
                      });
                      
                      // 前半部分用Area，后半部分用Line
                      if (idx < filteredNodes.length / 2) {
                        return (
                          <Area
                            key={node.uuid}
                            type={cutPeak ? "monotone" : "linear"}
                            dataKey={node.uuid}
                            stroke={colorScheme.primary}
                            fill={`url(#composed-gradient-${idx % nodeColorSchemes.length})`}
                            strokeWidth={1.5}
                            hide={isHidden}
                          />
                        );
                      } else {
                        return (
                          <Line
                            key={node.uuid}
                            type={cutPeak ? "monotone" : "linear"}
                            dataKey={node.uuid}
                            stroke={colorScheme.primary}
                            strokeWidth={2}
                            dot={false}
                            hide={isHidden}
                          />
                        );
                      }
                    })}
                  </ComposedChart>
                )}
              </ResponsiveContainer>
              
              {/* 移动端：节点开关快捷键 - 一行两个 */}
              {isMobile && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {nodes.filter(node => {
                    const stats = nodeStatistics[node.uuid];
                    return stats && stats.validSamples > 0;
                  }).slice(0, 20).map((node, idx) => {
                    const isHidden = hiddenNodes[node.uuid];
                    const colorScheme = nodeColorSchemes[idx % nodeColorSchemes.length];
                    const stats = nodeStatistics[node.uuid];
                    const hasData = stats && stats.current !== null;
                    
                    return (
                      <button
                        key={node.uuid}
                        onClick={() => toggleNode(node.uuid)}
                        className="px-3 py-2 rounded-md flex items-center gap-2 transition-all"
                        style={{
                          background: isHidden ? "var(--gray-a3)" : `${colorScheme.primary}20`,
                          border: `1px solid ${isHidden ? "var(--gray-a5)" : colorScheme.primary}40`,
                          opacity: isHidden ? 0.5 : (hasData ? 1 : 0.7),
                        }}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: hasData ? colorScheme.primary : "var(--gray-a5)",
                            opacity: isHidden ? 0.3 : 1,
                          }}
                        />
                        <span className="text-xs font-medium truncate flex-1 text-left">
                          {node.name}
                        </span>
                        {isHidden && <EyeOff size={12} className="flex-shrink-0" />}
                      </button>
                    );
                  })}
                  {nodes.filter(node => {
                    const stats = nodeStatistics[node.uuid];
                    return stats && stats.validSamples > 0;
                  }).length > 20 && (
                    <div className="col-span-2 text-center">
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{nodes.filter(node => {
                          const stats = nodeStatistics[node.uuid];
                          return stats && stats.validSamples > 0;
                        }).length - 20} more
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Flex>
          </Card>
        </motion.div>
      )}
    </Flex>
  );
};

export default PingTaskDisplay;