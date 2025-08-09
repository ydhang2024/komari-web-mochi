import React from "react";
import { Card, Flex, Text, Badge, Tooltip } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Activity, HardDrive, Cpu, MemoryStick, Network, Clock, TrendingUp, TrendingDown, Zap, Server, AlertTriangle } from "lucide-react";
import Flag from "./Flag";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { Record } from "@/types/LiveData";
import { formatUptime } from "./Node";
import { getOSImage, getOSName, formatBytes } from "@/utils";

interface ModernCardProps {
  basic: NodeBasicInfo;
  live: Record | undefined;
  online: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({ basic, live, online }) => {
  const { t } = useTranslation();

  const defaultLive = {
    cpu: { usage: 0 },
    ram: { used: 0 },
    disk: { used: 0 },
    network: { up: 0, down: 0, totalUp: 0, totalDown: 0 },
    uptime: 0,
    message: "",
  } as Record;

  const liveData = live || defaultLive;

  const memoryUsagePercent = basic.mem_total
    ? (liveData.ram.used / basic.mem_total) * 100
    : 0;
  const diskUsagePercent = basic.disk_total
    ? (liveData.disk.used / basic.disk_total) * 100
    : 0;

  const getStatusColor = () => {
    if (!online) return "from-gray-500/5 to-gray-600/5";
    if (liveData.cpu.usage > 90 || memoryUsagePercent > 90) {
      return "from-red-500/5 to-orange-500/5";
    }
    if (liveData.cpu.usage > 70 || memoryUsagePercent > 70) {
      return "from-orange-500/5 to-yellow-500/5";
    }
    return "from-green-500/5 to-emerald-500/5";
  };

  const getProgressColor = (value: number) => {
    if (value > 90) return "#ef4444";
    if (value > 70) return "#f59e0b";
    if (value > 50) return "#3b82f6";
    return "#10b981";
  };

  const getStatusGlow = () => {
    if (!online) return "";
    if (liveData.cpu.usage > 90 || memoryUsagePercent > 90) {
      return "shadow-lg shadow-red-500/20";
    }
    if (liveData.cpu.usage > 70 || memoryUsagePercent > 70) {
      return "shadow-lg shadow-orange-500/20";
    }
    return "shadow-lg shadow-green-500/20";
  };

  return (
    <Link to={`/instance/${basic.uuid}`} className="modern-card-link">
      <Card
        className={`
          relative overflow-hidden transition-all duration-300 
          hover:shadow-2xl hover:-translate-y-1
          bg-gradient-to-br ${getStatusColor()}
          border border-accent-5 hover:border-accent-8
          cursor-pointer ${getStatusGlow()}
          backdrop-blur-sm
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
            online ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 animate-pulse' : 'bg-gray-500'
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
                  <div className="transform origin-left transition-transform duration-200" style={{
                    transform: basic.name.length > 15 ? 'scale(0.85)' : 'scale(1)'
                  }}>
                    <Text size="3" weight="bold" className="text-accent-12 whitespace-nowrap">
                      {basic.name}
                    </Text>
                  </div>
                </div>
                
                {/* TAG 行 - 移动端独立显示 */}
                {basic.tags && basic.tags.trim() && (
                  <div className="flex gap-1 items-center mt-1 overflow-hidden">
                    {(() => {
                      const tags = basic.tags.split(',').filter(t => t.trim());
                      const totalLength = tags.join('').length;
                      
                      // 移动端缩放策略
                      let scale = 1;
                      let fontSize = 'text-[9px]';
                      let padding = 'px-1 py-0';
                      
                      if (totalLength > 20) {
                        scale = 0.7;
                        fontSize = 'text-[8px]';
                      } else if (totalLength > 15) {
                        scale = 0.8;
                        fontSize = 'text-[8px]';
                      } else if (totalLength > 10) {
                        scale = 0.9;
                        fontSize = 'text-[9px]';
                      }
                      
                      return (
                        <div 
                          className="flex gap-1 items-center transform origin-left"
                          style={{ transform: `scale(${scale})` }}
                        >
                          {tags.map((tag, index) => {
                            const trimmedTag = tag.trim();
                            if (!trimmedTag) return null;
                            
                            return (
                              <Badge 
                                key={index}
                                color="blue" 
                                variant="soft"
                                size="1"
                                className={`${fontSize} ${padding} whitespace-nowrap flex-shrink-0`}
                                style={{ lineHeight: '1.2' }}
                              >
                                {trimmedTag}
                              </Badge>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
                
                {/* 系统信息行 */}
                <Flex gap="1" align="center" mt="1" className="min-w-0">
                  {online && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
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
                    <div className="transform origin-left transition-transform duration-200" style={{
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
                {basic.tags && basic.tags.trim() && (
                  <div className="flex gap-1 justify-end items-center overflow-hidden">
                    {(() => {
                      const tags = basic.tags.split(',').filter(t => t.trim());
                      const totalLength = tags.join('').length;
                      
                      // 桌面端缩放策略 - 更激进的缩放防止穿模
                      let scale = 1;
                      let fontSize = 'text-[11px]';
                      let padding = 'px-1 py-0.5';
                      
                      if (totalLength > 25) {
                        scale = 0.6;
                        fontSize = 'text-[9px]';
                        padding = 'px-0.5 py-0';
                      } else if (totalLength > 20) {
                        scale = 0.7;
                        fontSize = 'text-[9px]';
                        padding = 'px-1 py-0';
                      } else if (totalLength > 15) {
                        scale = 0.8;
                        fontSize = 'text-[10px]';
                        padding = 'px-1 py-0';
                      } else if (totalLength > 10) {
                        scale = 0.9;
                        fontSize = 'text-[10px]';
                        padding = 'px-1 py-0';
                      }
                      
                      return (
                        <div 
                          className="flex gap-1 items-center transform origin-right"
                          style={{ transform: `scale(${scale})` }}
                        >
                          {tags.map((tag, index) => {
                            const trimmedTag = tag.trim();
                            if (!trimmedTag) return null;
                            
                            return (
                              <Badge 
                                key={index}
                                color="blue" 
                                variant="soft"
                                size="1"
                                className={`${fontSize} ${padding} whitespace-nowrap flex-shrink-0`}
                                style={{ lineHeight: '1.2' }}
                              >
                                {trimmedTag}
                              </Badge>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
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
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors min-w-0">
              <Flex justify="between" align="center" mb="2">
                <Flex gap="1" align="center">
                  <Cpu size={14} className="text-accent-10" />
                  <Text size="1" weight="medium">CPU</Text>
                </Flex>
                <Text size="2" weight="bold" style={{ color: getProgressColor(liveData.cpu.usage) }}>
                  {liveData.cpu.usage.toFixed(1)}%
                </Text>
              </Flex>
              <div className="w-full bg-accent-4 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-out rounded-full relative"
                  style={{
                    width: `${liveData.cpu.usage}%`,
                    background: `linear-gradient(90deg, ${getProgressColor(liveData.cpu.usage)} 0%, ${getProgressColor(liveData.cpu.usage)}dd 100%)`,
                    boxShadow: `0 0 10px ${getProgressColor(liveData.cpu.usage)}66`
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              {basic.cpu_cores && (
                <Text size="1" color="gray" className="mt-1 hidden sm:block">
                  {basic.cpu_cores} Cores
                </Text>
              )}
            </div>

            {/* 内存使用率 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors min-w-0">
              <Flex justify="between" align="center" mb="2">
                <Flex gap="1" align="center">
                  <MemoryStick size={14} className="text-accent-10" />
                  <Text size="1" weight="medium">RAM</Text>
                </Flex>
                <Text size="2" weight="bold" style={{ color: getProgressColor(memoryUsagePercent) }}>
                  {memoryUsagePercent.toFixed(1)}%
                </Text>
              </Flex>
              <div className="w-full bg-accent-4 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full transition-all duration-1000 ease-out rounded-full relative"
                  style={{
                    width: `${memoryUsagePercent}%`,
                    background: `linear-gradient(90deg, ${getProgressColor(memoryUsagePercent)} 0%, ${getProgressColor(memoryUsagePercent)}dd 100%)`,
                    boxShadow: `0 0 10px ${getProgressColor(memoryUsagePercent)}66`
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="mt-1 text-[10px] sm:text-sm whitespace-nowrap overflow-hidden">
                <div className="transform origin-left scale-[0.85] sm:scale-100 inline-block">
                  <Text size="1" color="gray">
                    <span className="inline sm:hidden">{formatBytes(liveData.ram.used, true)}/{formatBytes(basic.mem_total, true)}</span>
                    <span className="hidden sm:inline">{formatBytes(liveData.ram.used)} / {formatBytes(basic.mem_total)}</span>
                  </Text>
                </div>
              </div>
            </div>

            {/* 磁盘使用率和总流量 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors min-w-0 flex flex-col gap-2">
              {/* 磁盘使用率 */}
              <div className="flex-1">
                <Flex justify="between" align="center" mb="1">
                  <Flex gap="1" align="center">
                    <HardDrive size={12} className="text-accent-10" />
                    <Text size="1" weight="medium" className="text-xs">Disk</Text>
                  </Flex>
                  <Text size="1" weight="bold" style={{ color: getProgressColor(diskUsagePercent) }}>
                    {diskUsagePercent.toFixed(1)}%
                  </Text>
                </Flex>
                <div className="w-full bg-accent-4 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full transition-all duration-1000 ease-out rounded-full relative"
                    style={{
                      width: `${diskUsagePercent}%`,
                      background: `linear-gradient(90deg, ${getProgressColor(diskUsagePercent)} 0%, ${getProgressColor(diskUsagePercent)}dd 100%)`,
                      boxShadow: `0 0 10px ${getProgressColor(diskUsagePercent)}66`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
                <div className="mt-0.5 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <div className="transform origin-left scale-[0.75] sm:scale-100 inline-block">
                    <Text size="1" color="gray">
                      <span className="inline sm:hidden">{formatBytes(liveData.disk.used, true)}/{formatBytes(basic.disk_total, true)}</span>
                      <span className="hidden sm:inline">{formatBytes(liveData.disk.used)} / {formatBytes(basic.disk_total)}</span>
                    </Text>
                  </div>
                </div>
              </div>
              
              {/* 分隔线 */}
              <div className="w-full h-[1px] bg-accent-4" />
              
              {/* 总流量 */}
              <div className="flex-1">
                <Flex justify="between" align="center" mb="1">
                  <Flex gap="1" align="center">
                    <Activity size={12} className="text-accent-10" />
                    <Text size="1" weight="medium" className="text-xs">Traffic</Text>
                  </Flex>
                </Flex>
                <div className="mt-0.5 text-[10px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <div className="transform origin-left scale-[0.75] sm:scale-100 inline-block">
                    <Text size="1" color="gray">
                      <span className="inline sm:hidden">↑{formatBytes(liveData.network.totalUp, true)} ↓{formatBytes(liveData.network.totalDown, true)}</span>
                      <span className="hidden sm:inline">↑ {formatBytes(liveData.network.totalUp)} ↓ {formatBytes(liveData.network.totalDown)}</span>
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* 网络速度 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors min-w-0">
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
                        {formatBytes(liveData.network.up)}/s
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
                        {formatBytes(liveData.network.down)}/s
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
                  <Activity size={10} className="text-green-500 animate-pulse sm:w-3 sm:h-3" />
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