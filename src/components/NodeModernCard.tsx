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
          {/* 头部信息 */}
          <Flex justify="between" align="start">
            <Flex gap="3" align="center">
              <div className="relative">
                <Flag flag={basic.region} />
                {online && (
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                )}
              </div>
              <Flex direction="column">
                <Text size="3" weight="bold" className="text-accent-12">
                  {basic.name}
                </Text>
                <Flex gap="2" align="center" mt="1">
                  <img
                    src={getOSImage(basic.os)}
                    alt={basic.os}
                    className="w-4 h-4 opacity-70"
                  />
                  <Text size="1" color="gray">
                    {getOSName(basic.os)} • {basic.arch}
                  </Text>
                  {basic.virtualization && (
                    <>
                      <Text size="1" color="gray">•</Text>
                      <Text size="1" color="gray">{basic.virtualization}</Text>
                    </>
                  )}
                </Flex>
              </Flex>
            </Flex>
            <Flex direction="column" align="end" gap="1">
              <Badge 
                color={online ? "green" : "gray"} 
                variant="soft"
                className={online ? "animate-pulse" : ""}
              >
                {online ? t("nodeCard.online") : t("nodeCard.offline")}
              </Badge>
              {liveData.message && (
                <Tooltip content={liveData.message}>
                  <Badge color="red" variant="soft" size="1">
                    <AlertTriangle size={12} />
                  </Badge>
                </Tooltip>
              )}
            </Flex>
          </Flex>

          {/* 资源使用情况网格 - 移动端 2x2 紧凑布局，桌面端 2x2 */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* CPU 使用率 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors">
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
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors">
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
              <Text size="1" color="gray" className="mt-1 text-[10px] sm:text-sm whitespace-nowrap overflow-hidden">
                <span className="inline sm:hidden">{formatBytes(liveData.ram.used, true)}/{formatBytes(basic.mem_total, true)}</span>
                <span className="hidden sm:inline">{formatBytes(liveData.ram.used)} / {formatBytes(basic.mem_total)}</span>
              </Text>
            </div>

            {/* 磁盘使用率 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors">
              <Flex justify="between" align="center" mb="2">
                <Flex gap="1" align="center">
                  <HardDrive size={14} className="text-accent-10" />
                  <Text size="1" weight="medium">Disk</Text>
                </Flex>
                <Text size="2" weight="bold" style={{ color: getProgressColor(diskUsagePercent) }}>
                  {diskUsagePercent.toFixed(1)}%
                </Text>
              </Flex>
              <div className="w-full bg-accent-4 rounded-full h-2 overflow-hidden">
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
              <Text size="1" color="gray" className="mt-1 text-[10px] sm:text-sm whitespace-nowrap overflow-hidden">
                <span className="inline sm:hidden">{formatBytes(liveData.disk.used, true)}/{formatBytes(basic.disk_total, true)}</span>
                <span className="hidden sm:inline">{formatBytes(liveData.disk.used)} / {formatBytes(basic.disk_total)}</span>
              </Text>
            </div>

            {/* 网络速度 */}
            <div className="bg-accent-2/50 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 border border-accent-4 hover:bg-accent-3/50 transition-colors">
              <Flex gap="1" align="center" mb="2">
                <Network size={14} className="text-accent-10" />
                <Text size="1" weight="medium">Network</Text>
              </Flex>
              <Flex direction="column" gap="1 sm:gap-2">
                <Flex justify="between" align="center" className="bg-green-500/10 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Flex gap="1" align="center">
                    <TrendingUp size={10} className="text-green-500 sm:w-3 sm:h-3" />
                    <Text size="1" weight="medium" className="text-xs sm:text-sm hidden sm:inline">Up</Text>
                  </Flex>
                  <Text size="1" weight="bold" className="text-green-600 text-xs sm:text-sm">
                    {formatBytes(liveData.network.up)}/s
                  </Text>
                </Flex>
                <Flex justify="between" align="center" className="bg-blue-500/10 rounded px-1.5 sm:px-2 py-0.5 sm:py-1">
                  <Flex gap="1" align="center">
                    <TrendingDown size={10} className="text-blue-500 sm:w-3 sm:h-3" />
                    <Text size="1" weight="medium" className="text-xs sm:text-sm hidden sm:inline">Down</Text>
                  </Flex>
                  <Text size="1" weight="bold" className="text-blue-600 text-xs sm:text-sm">
                    {formatBytes(liveData.network.down)}/s
                  </Text>
                </Flex>
              </Flex>
            </div>
          </div>

          {/* 底部信息 - 移动端隐藏 */}
          <Flex justify="between" align="center" className="pt-3 border-t border-accent-4 hidden sm:flex">
            <Flex gap="3" align="center">
              <Flex gap="1" align="center">
                <Clock size={12} className="text-accent-10" />
                <Text size="1" color="gray">
                  {online ? formatUptime(liveData.uptime, t) : t("nodeCard.offline")}
                </Text>
              </Flex>
              {online && (
                <Flex gap="1" align="center">
                  <Zap size={12} className="text-yellow-500" />
                  <Text size="1" color="gray">
                    Load: {liveData.load?.load1?.toFixed(2) || "0.00"}
                  </Text>
                </Flex>
              )}
            </Flex>
            {online && (
              <Flex gap="1" align="center">
                <Activity size={12} className="text-green-500 animate-pulse" />
                <Text size="1" weight="medium" className="text-green-600">
                  Active
                </Text>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Card>
    </Link>
  );
};