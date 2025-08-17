import React, { useMemo } from "react";
import { Card, Flex, Text, Badge, Tooltip } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, HardDrive, Cpu, MemoryStick, Network, Clock, TrendingUp, TrendingDown, Zap, Server, AlertTriangle } from "lucide-react";
import Flag from "./Flag";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { Record } from "@/types/LiveData";
import { formatUptime } from "./Node";
import { getOSImage, getOSName, formatBytes, getTrafficPercentage, getTrafficUsage } from "@/utils";
import "./NodeModernCard.css";

interface ModernCardProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
  forceShowTrafficText?: boolean;
}

const ModernCardComponent: React.FC<ModernCardProps> = ({ basic, live, online, forceShowTrafficText = false }) => {
  const { t } = useTranslation();

  // 缓存默认值，避免每次渲染创建新对象
  const defaultLive = useMemo(() => ({
    cpu: { usage: 0 },
    ram: { used: 0 },
    disk: { used: 0 },
    network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
    uptime: 0,
    message: "",
  } as Record), []);

  const liveData = live || defaultLive;

  // 缓存使用率百分比计算
  const usagePercents = useMemo(() => ({
    memory: basic.mem_total ? (liveData.ram.used / basic.mem_total) * 100 : 0,
    disk: basic.disk_total ? (liveData.disk.used / basic.disk_total) * 100 : 0
  }), [basic.mem_total, basic.disk_total, liveData.ram.used, liveData.disk.used]);

  // 缓存价格标签计算
  const priceTag = useMemo(() => {
    if (basic.price === 0) return '';
    if (basic.price === -1) return t("common.free");
    
    const cycle = basic.billing_cycle;
    let cycleText = '';
    if (cycle >= 27 && cycle <= 32) cycleText = t("common.monthly");
    else if (cycle >= 87 && cycle <= 95) cycleText = t("common.quarterly");
    else if (cycle >= 175 && cycle <= 185) cycleText = t("common.semi_annual");
    else if (cycle >= 360 && cycle <= 370) cycleText = t("common.annual");
    else if (cycle >= 720 && cycle <= 750) cycleText = t("common.biennial");
    else if (cycle >= 1080 && cycle <= 1150) cycleText = t("common.triennial");
    else if (cycle === -1) cycleText = t("common.once");
    else cycleText = `${cycle} ${t("nodeCard.time_day")}`;
    
    return `${basic.currency || '￥'}${basic.price}/${cycleText}`;
  }, [basic.price, basic.billing_cycle, basic.currency, t]);

  // 缓存到期时间计算
  const expiryInfo = useMemo(() => {
    if (!basic.expired_at || basic.price === 0) return null;
    
    const expiredDate = new Date(basic.expired_at);
    const now = new Date();
    const diffTime = expiredDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let color: "red" | "orange" | "green";
    if (diffDays <= 0 || diffDays <= 7) color = "red";
    else if (diffDays <= 15) color = "orange";
    else color = "green";
    
    let text: string;
    if (diffDays <= 0) text = t("common.expired");
    else if (diffDays > 36500) text = t("common.long_term");
    else text = t("common.expired_in", { days: diffDays });
    
    return { color, text };
  }, [basic.expired_at, basic.price, t]);

  // 缓存自定义标签解析
  const customTags = useMemo(() => {
    if (!basic.tags) return [];
    
    return basic.tags.split(';').filter(t => t.trim()).map(tag => {
      const trimmedTag = tag.trim();
      const colorMatch = trimmedTag.match(/^(.+?)<([^>]+)>$/);
      return {
        text: colorMatch ? colorMatch[1] : trimmedTag,
        color: (colorMatch ? colorMatch[2] : 'blue') as any
      };
    });
  }, [basic.tags]);

  // 缓存流量百分比计算
  const trafficPercentage = useMemo(() => {
    if (!basic.traffic_limit || basic.traffic_limit <= 0 || !basic.traffic_limit_type) {
      return 0;
    }
    return getTrafficPercentage(
      liveData.network.totalUp,
      liveData.network.totalDown,
      basic.traffic_limit,
      basic.traffic_limit_type
    );
  }, [liveData.network.totalUp, liveData.network.totalDown, basic.traffic_limit, basic.traffic_limit_type]);

  // 缓存格式化的字节值
  const formattedBytes = useMemo(() => ({
    ramUsed: formatBytes(liveData.ram.used),
    ramTotal: formatBytes(basic.mem_total),
    ramUsedCompact: formatBytes(liveData.ram.used, true),
    ramTotalCompact: formatBytes(basic.mem_total, true),
    diskUsed: formatBytes(liveData.disk.used),
    diskTotal: formatBytes(basic.disk_total),
    diskUsedCompact: formatBytes(liveData.disk.used, true),
    diskTotalCompact: formatBytes(basic.disk_total, true),
    networkUp: formatBytes(liveData.network.up),
    networkDown: formatBytes(liveData.network.down),
    totalUp: formatBytes(liveData.network.totalUp),
    totalDown: formatBytes(liveData.network.totalDown),
    totalUpCompact: formatBytes(liveData.network.totalUp, true),
    totalDownCompact: formatBytes(liveData.network.totalDown, true),
    trafficUsage: basic.traffic_limit_type ? 
      formatBytes(getTrafficUsage(
        liveData.network.totalUp,
        liveData.network.totalDown,
        basic.traffic_limit_type
      )) : '',
    trafficUsageCompact: basic.traffic_limit_type ? 
      formatBytes(getTrafficUsage(
        liveData.network.totalUp,
        liveData.network.totalDown,
        basic.traffic_limit_type
      ), true) : '',
    trafficLimit: formatBytes(basic.traffic_limit || 0),
    trafficLimitCompact: formatBytes(basic.traffic_limit || 0, true)
  }), [liveData, basic]);

  // 辅助函数 - 必须在 useMemo 之前定义
  const getProgressColor = (value: number) => {
    if (value > 90) return "#ef4444";
    if (value > 70) return "#f59e0b";
    if (value > 50) return "#3b82f6";
    return "#10b981";
  };

  const getStatusColor = () => {
    if (!online) return "from-gray-500/5 to-gray-600/5";
    if (liveData.cpu.usage > 90 || usagePercents.memory > 90) {
      return "from-red-500/5 to-orange-500/5";
    }
    if (liveData.cpu.usage > 70 || usagePercents.memory > 70) {
      return "from-orange-500/5 to-yellow-500/5";
    }
    return "from-green-500/5 to-emerald-500/5";
  };

  // 缓存进度条颜色
  const progressColors = useMemo(() => ({
    cpu: getProgressColor(liveData.cpu.usage),
    memory: getProgressColor(usagePercents.memory),
    disk: getProgressColor(usagePercents.disk),
    traffic: getProgressColor(trafficPercentage)
  }), [liveData.cpu.usage, usagePercents.memory, usagePercents.disk, trafficPercentage]);

  const getStatusGlow = () => {
    if (!online) return "";
    if (liveData.cpu.usage > 90 || usagePercents.memory > 90) {
      return "shadow-lg shadow-red-500/20";
    }
    if (liveData.cpu.usage > 70 || usagePercents.memory > 70) {
      return "shadow-lg shadow-orange-500/20";
    }
    return "shadow-lg shadow-green-500/20";
  };

  // 缓存标签缩放策略
  const tagScaleStrategyMobile = useMemo(() => {
    const totalLength = customTags.map(t => t.text).join('').length + 
                      priceTag.length + 
                      (expiryInfo ? expiryInfo.text.length : 0);
    
    if (totalLength > 30) return { scale: 0.65, fontSize: 'text-[8px]', padding: 'px-1 py-0' };
    if (totalLength > 25) return { scale: 0.7, fontSize: 'text-[8px]', padding: 'px-1 py-0' };
    if (totalLength > 20) return { scale: 0.75, fontSize: 'text-[8px]', padding: 'px-1 py-0' };
    if (totalLength > 15) return { scale: 0.85, fontSize: 'text-[9px]', padding: 'px-1 py-0' };
    if (totalLength > 10) return { scale: 0.9, fontSize: 'text-[9px]', padding: 'px-1 py-0' };
    return { scale: 1, fontSize: 'text-[9px]', padding: 'px-1 py-0' };
  }, [customTags, priceTag, expiryInfo]);

  const tagScaleStrategyDesktop = useMemo(() => {
    const totalLength = customTags.map(t => t.text).join('').length + 
                      priceTag.length + 
                      (expiryInfo ? expiryInfo.text.length : 0);
    
    if (totalLength > 40) return { scale: 0.7, fontSize: 'text-[10px]', padding: 'px-1 py-0.5' };
    if (totalLength > 35) return { scale: 0.75, fontSize: 'text-[11px]', padding: 'px-1 py-0.5' };
    if (totalLength > 30) return { scale: 0.8, fontSize: 'text-[11px]', padding: 'px-1 py-0.5' };
    if (totalLength > 25) return { scale: 0.85, fontSize: 'text-[11px]', padding: 'px-1 py-0.5' };
    if (totalLength > 20) return { scale: 0.9, fontSize: 'text-[12px]', padding: 'px-1.5 py-0.5' };
    if (totalLength > 15) return { scale: 0.95, fontSize: 'text-[12px]', padding: 'px-1.5 py-0.5' };
    return { scale: 1, fontSize: 'text-[12px]', padding: 'px-1.5 py-0.5' };
  }, [customTags, priceTag, expiryInfo]);

  return (
    <Link to={`/instance/${basic.uuid}`} className="modern-card-link h-full block">
      <Card
        className={`
          modern-card modern-card-hover modern-card-shadow
          relative overflow-visible
          bg-gradient-to-br ${getStatusColor()}
          border border-accent-5 hover:border-accent-8
          cursor-pointer ${getStatusGlow()}
          h-full min-h-fit
        `}
        style={{
          transform: 'scale(1)',
          transformOrigin: 'center'
        }}
      >
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
          <Server size={128} />
        </div>

        {/* 状态指示条 */}
        <div 
          className={`absolute top-0 left-0 right-0 h-1 ${
            online ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500' : 'bg-gray-500'
          }`}
          style={{
            boxShadow: online ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none'
          }}
        />

        {/* 主体内容 */}
        <Flex direction="column" gap="3" className="p-3 sm:p-4 relative z-10">
          {/* 头部信息 - 桌面端保持原样，移动端垂直布局 */}
          <div className="block sm:hidden">
            {/* 移动端布局 */}
            <Flex gap="2" align="start" className="min-w-0">
              <div className="relative flex-shrink-0 flex items-center">
                <Flag flag={basic.region} />
              </div>
              <Flex direction="column" className="min-w-0 flex-1">
                {/* 服务器名称 */}
                <div className="min-w-0 overflow-hidden">
                  <div className="tag-scale-modern" style={{
                    transform: basic.name.length > 15 ? 'scale(0.85)' : 'scale(1)'
                  }}>
                    <Text size="3" weight="bold" className="text-accent-12 whitespace-nowrap">
                      {basic.name}
                    </Text>
                  </div>
                </div>
                
                {/* TAG 行 - 移动端独立显示 */}
                <div className="flex gap-1 items-center mt-1 overflow-hidden">
                  <div 
                    className="flex gap-1 items-center transform origin-left"
                    style={{ transform: `scale(${tagScaleStrategyMobile.scale})` }}
                  >
                    {/* 价格标签 */}
                    {priceTag && (
                      <Badge 
                        color="iris" 
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyMobile.fontSize} ${tagScaleStrategyMobile.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {priceTag}
                      </Badge>
                    )}
                    
                    {/* 到期时间标签 */}
                    {expiryInfo && (
                      <Badge
                        color={expiryInfo.color}
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyMobile.fontSize} ${tagScaleStrategyMobile.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {expiryInfo.text}
                      </Badge>
                    )}
                    
                    {/* 自定义标签 */}
                    {customTags.map((tag, index) => (
                      <Badge 
                        key={index}
                        color={tag.color} 
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyMobile.fontSize} ${tagScaleStrategyMobile.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {tag.text}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* 系统信息行 */}
                <Flex gap="1" align="center" mt="1" className="min-w-0">
                  {online && (
                    <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                  )}
                  <img
                    src={getOSImage(basic.os)}
                    alt={basic.os}
                    className="w-3 h-3 opacity-70 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex items-center">
                    <div className="transform origin-left scale-[0.85]">
                      <Text size="1" color="gray" className="whitespace-nowrap">
                        {getOSName(basic.os)} • {basic.arch}
                        {basic.virtualization && ` • ${basic.virtualization}`}
                      </Text>
                    </div>
                  </div>
                </Flex>
              </Flex>
              
              {/* 错误消息 - 移动端右上角 */}
              {liveData.message && (
                <Tooltip content={liveData.message}>
                  <Badge color="red" variant="soft" size="1" className="flex-shrink-0">
                    <AlertTriangle size={10} />
                  </Badge>
                </Tooltip>
              )}
            </Flex>
          </div>
          
          {/* 桌面端布局 - 保持原样 */}
          <div className="hidden sm:block">
            <Flex justify="between" align="start" className="min-w-0 gap-3">
              <Flex gap="3" align="start" className="min-w-0 flex-1 max-w-[65%]">
                <div className="relative flex-shrink-0 flex items-center">
                  <Flag flag={basic.region} />
                </div>
                <Flex direction="column" className="min-w-0 flex-1">
                  <div className="min-w-0 overflow-hidden">
                    <div className="tag-scale-modern" style={{
                      transform: basic.name.length > 15 ? 'scale(0.85)' : 'scale(1)'
                    }}>
                      <Text size="3" weight="bold" className="text-accent-12 whitespace-nowrap">
                        {basic.name}
                      </Text>
                    </div>
                  </div>
                  <Flex gap="2" align="center" mt="1" className="min-w-0">
                    {online && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0 mr-1" />
                    )}
                    <img
                      src={getOSImage(basic.os)}
                      alt={basic.os}
                      className="w-4 h-4 opacity-70 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 flex items-center h-5">
                      <Text size="1" color="gray" className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {getOSName(basic.os)} • {basic.arch}
                        {basic.virtualization && ` • ${basic.virtualization}`}
                      </Text>
                    </div>
                  </Flex>
                </Flex>
              </Flex>
              
              {/* 桌面端 TAG 和错误消息 */}
              <Flex direction="column" align="end" gap="1" className="flex-shrink-0 max-w-[32%]">
                <div className="flex gap-1 justify-end items-center overflow-hidden">
                  <div 
                    className="flex gap-1 items-center transform origin-right"
                    style={{ transform: `scale(${tagScaleStrategyDesktop.scale})` }}
                  >
                    {/* 价格标签 */}
                    {priceTag && (
                      <Badge 
                        color="iris" 
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyDesktop.fontSize} ${tagScaleStrategyDesktop.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {priceTag}
                      </Badge>
                    )}
                    
                    {/* 到期时间标签 */}
                    {expiryInfo && (
                      <Badge
                        color={expiryInfo.color}
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyDesktop.fontSize} ${tagScaleStrategyDesktop.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {expiryInfo.text}
                      </Badge>
                    )}
                    
                    {/* 自定义标签 */}
                    {customTags.map((tag, index) => (
                      <Badge 
                        key={index}
                        color={tag.color} 
                        variant="soft"
                        size="1"
                        className={`${tagScaleStrategyDesktop.fontSize} ${tagScaleStrategyDesktop.padding} whitespace-nowrap flex-shrink-0`}
                        style={{ lineHeight: '1.2' }}
                      >
                        {tag.text}
                      </Badge>
                    ))}
                  </div>
                </div>
                {liveData.message && (
                  <Tooltip content={liveData.message}>
                    <Badge color="red" variant="soft" size="1">
                      <AlertTriangle size={12} />
                    </Badge>
                  </Tooltip>
                )}
              </Flex>
            </Flex>
          </div>

          {/* 资源使用情况网格 - 移动端 2x2 紧凑布局，桌面端 2x2 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0">
            {/* CPU 使用率 */}
            <div className="bg-accent-2/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 min-w-0">
              <Flex justify="between" align="center" mb="2">
                <Flex gap="1" align="center">
                  <Cpu size={14} className="text-accent-10" />
                  <Text size="1" weight="medium">CPU</Text>
                </Flex>
                <Text size="2" weight="bold" style={{ color: progressColors.cpu }}>
                  {liveData.cpu.usage.toFixed(1)}%
                </Text>
              </Flex>
              <div className="w-full bg-accent-4 rounded-full h-2 overflow-hidden">
                <div
                  className="usage-fill-modern h-full rounded-full relative"
                  style={{
                    width: `${liveData.cpu.usage}%`,
                    background: `linear-gradient(90deg, ${progressColors.cpu} 0%, ${progressColors.cpu}dd 100%)`,
                    boxShadow: `0 0 10px ${progressColors.cpu}66`
                  }}
                >
                  {/* 移除动画效果 */}
                </div>
              </div>
              {basic.cpu_cores && (
                <Text size="1" color="gray" className="mt-1 hidden sm:block">
                  {basic.cpu_cores} Cores
                </Text>
              )}
            </div>

            {/* 内存使用率 */}
            <div className="bg-accent-2/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 min-w-0">
              <Flex justify="between" align="center" mb="2">
                <Flex gap="1" align="center">
                  <MemoryStick size={14} className="text-accent-10" />
                  <Text size="1" weight="medium">RAM</Text>
                </Flex>
                <Text size="2" weight="bold" style={{ color: progressColors.memory }}>
                  {usagePercents.memory.toFixed(1)}%
                </Text>
              </Flex>
              <div className="w-full bg-accent-4 rounded-full h-2 overflow-hidden">
                <div
                  className="usage-fill-modern h-full rounded-full relative"
                  style={{
                    width: `${usagePercents.memory}%`,
                    background: `linear-gradient(90deg, ${progressColors.memory} 0%, ${progressColors.memory}dd 100%)`,
                    boxShadow: `0 0 10px ${progressColors.memory}66`
                  }}
                >
                  {/* 移除动画效果 */}
                </div>
              </div>
              <div className="mt-1 text-[10px] sm:text-sm whitespace-nowrap overflow-hidden">
                <div className="transform origin-left scale-[0.85] sm:scale-100 inline-block">
                  <Text size="1" color="gray">
                    <span className="inline sm:hidden">{formattedBytes.ramUsedCompact}/{formattedBytes.ramTotalCompact}</span>
                    <span className="hidden sm:inline">{formattedBytes.ramUsed} / {formattedBytes.ramTotal}</span>
                  </Text>
                </div>
              </div>
            </div>

            {/* 磁盘使用率和总流量 */}
            <div className="bg-accent-2/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 min-w-0 flex flex-col gap-2 min-h-[9rem] sm:min-h-[10rem]">
              {/* 磁盘使用率 */}
              <div className="flex-1">
                <Flex justify="between" align="center" mb="1">
                  <Flex gap="1" align="center">
                    <HardDrive size={12} className="text-accent-10" />
                    <Text size="1" weight="medium" className="text-xs">Disk</Text>
                  </Flex>
                  <Text size="1" weight="bold" style={{ color: progressColors.disk }}>
                    {usagePercents.disk.toFixed(1)}%
                  </Text>
                </Flex>
                <div className="w-full bg-accent-4 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="usage-fill-modern h-full rounded-full relative"
                    style={{
                      width: `${usagePercents.disk}%`,
                      background: `linear-gradient(90deg, ${progressColors.disk} 0%, ${progressColors.disk}dd 100%)`,
                      boxShadow: `0 0 10px ${progressColors.disk}66`
                    }}
                  >
                    {/* 移除动画效果 */}
                  </div>
                </div>
                <div className="mt-0.5 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <div className="transform origin-left scale-[0.75] sm:scale-100 inline-block">
                    <Text size="1" color="gray">
                      <span className="inline sm:hidden">{formattedBytes.diskUsedCompact}/{formattedBytes.diskTotalCompact}</span>
                      <span className="hidden sm:inline">{formattedBytes.diskUsed} / {formattedBytes.diskTotal}</span>
                    </Text>
                  </div>
                </div>
              </div>
              
              {/* 分隔线 */}
              <div className="w-full h-[1px] bg-accent-4" />
              
              {/* 总流量 */}
              <div className="flex-1 min-h-[4rem]">
                <Flex justify="between" align="center" mb="1">
                  <Flex gap="1" align="center">
                    <Activity size={12} className="text-accent-10" />
                    <Text size="1" weight="medium" className="text-xs">Traffic</Text>
                  </Flex>
                  {Number(basic.traffic_limit) > 0 && !forceShowTrafficText && basic.traffic_limit_type && (
                    <Text size="1" weight="bold" style={{ 
                      color: progressColors.traffic
                    }}>
                      {trafficPercentage.toFixed(1)}%
                    </Text>
                  )}
                </Flex>
                {Number(basic.traffic_limit) > 0 && !forceShowTrafficText && basic.traffic_limit_type ? (
                  <>
                    <div className="w-full bg-accent-4 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="usage-fill-modern h-full rounded-full relative"
                        style={{
                          width: `${Math.min(trafficPercentage, 100)}%`,
                          background: `linear-gradient(90deg, ${progressColors.traffic} 0%, ${progressColors.traffic}dd 100%)`,
                          boxShadow: `0 0 10px ${progressColors.traffic}66`
                        }}
                      >
                        {/* 移除动画效果 */}
                      </div>
                    </div>
                    <div className="mt-0.5 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                      <div className="transform origin-left scale-[0.75] sm:scale-100 inline-block">
                        <Text size="1" color="gray">
                          <span className="inline sm:hidden">
                            {formattedBytes.trafficUsageCompact}/{formattedBytes.trafficLimitCompact}
                          </span>
                          <span className="hidden sm:inline">
                            {formattedBytes.trafficUsage} / {formattedBytes.trafficLimit}
                          </span>
                        </Text>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-0.5 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <div className="transform origin-left scale-[0.75] sm:scale-100 inline-block">
                      <Text size="1" color="gray">
                        <span className="inline sm:hidden">↑{formattedBytes.totalUpCompact} ↓{formattedBytes.totalDownCompact}</span>
                        <span className="hidden sm:inline">↑ {formattedBytes.totalUp} ↓ {formattedBytes.totalDown}</span>
                      </Text>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 网络速度 */}
            <div className="bg-accent-2/50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 min-w-0">
              <Flex gap="1" align="center" mb="2">
                <Network size={14} className="text-accent-10" />
                <Text size="1" weight="medium">Speed</Text>
              </Flex>
              <Flex direction="column" gap="1" className="sm:gap-2">
                <Flex justify="between" align="center" className="bg-green-500/10 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-0">
                  <Flex gap="1" align="center">
                    <TrendingUp size={10} className="text-green-500 sm:w-3 sm:h-3" />
                    <Text size="1" weight="medium" className="text-xs sm:text-sm hidden sm:inline">Up</Text>
                  </Flex>
                  <div className="overflow-hidden">
                    <div className="transform origin-right scale-[0.85] sm:scale-100 inline-block">
                      <Text size="1" weight="bold" className="text-green-600 text-xs sm:text-sm whitespace-nowrap">
                        {formattedBytes.networkUp}/s
                      </Text>
                    </div>
                  </div>
                </Flex>
                <Flex justify="between" align="center" className="bg-blue-500/10 rounded px-1.5 sm:px-2 py-0.5 sm:py-1 min-w-0">
                  <Flex gap="1" align="center">
                    <TrendingDown size={10} className="text-blue-500 sm:w-3 sm:h-3" />
                    <Text size="1" weight="medium" className="text-xs sm:text-sm hidden sm:inline">Down</Text>
                  </Flex>
                  <div className="overflow-hidden">
                    <div className="transform origin-right scale-[0.85] sm:scale-100 inline-block">
                      <Text size="1" weight="bold" className="text-blue-600 text-xs sm:text-sm whitespace-nowrap">
                        {formattedBytes.networkDown}/s
                      </Text>
                    </div>
                  </div>
                </Flex>
              </Flex>
            </div>
          </div>

          {/* 底部信息 - 移动端显示但缩小 */}
          <Flex justify="between" align="center" className="pt-2 sm:pt-3 border-t border-accent-4">
            <Flex gap="2 sm:gap-3" align="center" className="min-w-0 flex-1">
              <Flex gap="1" align="center" className="min-w-0">
                <Clock size={10} className="text-accent-10 sm:w-3 sm:h-3 flex-shrink-0" />
                <div className="transform origin-left scale-[0.8] sm:scale-100 inline-block">
                  <Text size="1" color="gray" className="whitespace-nowrap">
                    {online ? formatUptime(liveData.uptime, t) : t("nodeCard.offline")}
                  </Text>
                </div>
              </Flex>
            </Flex>
            {online && (
              <Flex gap="2 sm:gap-3" align="center" className="flex-shrink-0">
                <Flex gap="1" align="center" className="min-w-0 mr-0 sm:mr-3">
                  <Zap size={10} className="text-yellow-500 sm:w-3 sm:h-3 flex-shrink-0" />
                  <div className="transform origin-left scale-[0.8] sm:scale-100 inline-block">
                    <Text size="1" color="gray" className="whitespace-nowrap">
                      Load: {liveData.load?.load1?.toFixed(2) || "0.00"}
                    </Text>
                  </div>
                </Flex>
                <Flex gap="1" align="center" className="flex-shrink-0">
                  <Activity size={10} className="text-green-500 sm:w-3 sm:h-3" />
                  <div className="transform origin-right scale-[0.8] sm:scale-100 inline-block">
                    <Text size="1" weight="medium" className="text-green-600 whitespace-nowrap">
                      Active
                    </Text>
                  </div>
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
};

// 使用 React.memo 优化，只在关键属性变化时重新渲染
export const ModernCard = React.memo(ModernCardComponent, (prevProps, nextProps) => {
  // 基础信息比较
  if (prevProps.basic.uuid !== nextProps.basic.uuid ||
      prevProps.basic.name !== nextProps.basic.name ||
      prevProps.basic.price !== nextProps.basic.price ||
      prevProps.basic.expired_at !== nextProps.basic.expired_at ||
      prevProps.basic.tags !== nextProps.basic.tags) {
    return false;
  }
  
  // 在线状态比较
  if (prevProps.online !== nextProps.online) {
    return false;
  }
  
  // 实时数据比较 - 只比较关键数据避免过度渲染
  const prevLive = prevProps.live;
  const nextLive = nextProps.live;
  
  // 如果一个有数据一个没有，需要重新渲染
  if (!prevLive && nextLive) return false;
  if (prevLive && !nextLive) return false;
  
  // 如果都有数据，比较关键字段
  if (prevLive && nextLive) {
    if (prevLive.cpu?.usage !== nextLive.cpu?.usage ||
        prevLive.ram?.used !== nextLive.ram?.used ||
        prevLive.disk?.used !== nextLive.disk?.used ||
        prevLive.network?.up !== nextLive.network?.up ||
        prevLive.network?.down !== nextLive.network?.down ||
        prevLive.network?.totalUp !== nextLive.network?.totalUp ||
        prevLive.network?.totalDown !== nextLive.network?.totalDown ||
        prevLive.uptime !== nextLive.uptime ||
        prevLive.message !== nextLive.message ||
        prevLive.load?.load1 !== nextLive.load?.load1) {
      return false;
    }
  }
  
  return true; // props 相同，不需要重新渲染
});