import React, { useEffect, useState } from "react";
import { Card, Flex, Text, IconButton, Popover } from "@radix-ui/themes";
import { Activity, Globe, Network, Server, Settings, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatBytes } from "@/components/Node";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";

export interface StatusCardsVisibility {
  currentTime: boolean;
  currentOnline: boolean;
  regionOverview: boolean;
  trafficOverview: boolean;
  networkSpeed: boolean;
}

interface StatusBarProps {
  currentTime: string;
  onlineCount: number;
  totalCount: number;
  regionCount: number;
  uploadTotal: number;
  downloadTotal: number;
  uploadSpeed: number;
  downloadSpeed: number;
  statusCardsVisibility: StatusCardsVisibility;
  onVisibilityChange: (visibility: StatusCardsVisibility) => void;
}

// Speed history for the chart
interface SpeedData {
  time: number;
  upload: number;
  download: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
  currentTime,
  onlineCount,
  totalCount,
  regionCount,
  uploadTotal,
  downloadTotal,
  uploadSpeed,
  downloadSpeed,
  statusCardsVisibility,
  onVisibilityChange,
}) => {
  const [t] = useTranslation();
  const [speedHistory, setSpeedHistory] = useState<SpeedData[]>([]);
  const maxDataPoints = 30; // Show last 30 seconds

  // Update speed history
  useEffect(() => {
    const newData: SpeedData = {
      time: Date.now(),
      upload: uploadSpeed,
      download: downloadSpeed,
    };

    setSpeedHistory((prev) => {
      const updated = [...prev, newData];
      if (updated.length > maxDataPoints) {
        return updated.slice(-maxDataPoints);
      }
      return updated;
    });
  }, [uploadSpeed, downloadSpeed]);

  // Format bytes for display with smart decimals
  const formatSpeed = (bytes: number): string => {
    if (bytes === 0) return "0 B/s";
    const units = ["B/s", "KB/s", "MB/s", "GB/s"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    
    // Smart decimal places
    let decimals = 0;
    if (i === 2 && size < 10) decimals = 1; // MB/s: show decimal for < 10
    if (i === 3) decimals = 2; // GB/s: always show 2 decimals
    
    return `${size.toFixed(decimals)} ${units[i]}`;
  };

  // Calculate online percentage
  const onlinePercentage = totalCount > 0 ? (onlineCount / totalCount) * 100 : 0;

  return (
    <Card className="status-bar-container mx-4 mb-2 relative overflow-hidden py-1.5 px-2">
      <Flex direction="column" gap="0">
        {/* Settings button */}
        <div className="absolute top-2 right-2 z-10">
          <Popover.Root>
            <Popover.Trigger>
              <IconButton variant="ghost" size="1" className="hover:bg-gray-3">
                <Settings size={14} />
              </IconButton>
            </Popover.Trigger>
            <Popover.Content width="300px">
              <StatusSettings
                visibility={statusCardsVisibility}
                onVisibilityChange={onVisibilityChange}
              />
            </Popover.Content>
          </Popover.Root>
        </div>

        {/* Status cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {/* Current Time */}
          {statusCardsVisibility.currentTime && (
            <StatusCard
              icon={<Activity className="text-gray-11" size={16} />}
              title={t("current_time")}
              value={currentTime}
              className="status-time"
            />
          )}

          {/* Online Status with breathing effect */}
          {statusCardsVisibility.currentOnline && (
            <StatusCard
              icon={<Server className="text-gray-11" size={16} />}
              title={t("current_online")}
              value={
                <Flex align="center" gap="2">
                  <span>{onlineCount}/{totalCount}</span>
                  <div className="flex-1 bg-gray-3 rounded-full h-1.5 min-w-[40px]">
                    <div
                      className="bg-green-9 h-1.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${onlinePercentage}%` }}
                    />
                  </div>
                </Flex>
              }
              className="status-online"
            />
          )}

          {/* Regions */}
          {statusCardsVisibility.regionOverview && (
            <StatusCard
              icon={<Globe className="text-gray-11" size={16} />}
              title={t("region_overview")}
              value={regionCount}
              className="status-region"
            />
          )}

          {/* Traffic Overview */}
          {statusCardsVisibility.trafficOverview && (
            <StatusCard
              icon={<Network className="text-gray-11" size={16} />}
              title={t("traffic_overview")}
              value={
                <Flex direction="column" gap="0">
                  <Text size="2" className="font-medium leading-tight">
                    ↑ {formatBytes(uploadTotal)}
                  </Text>
                  <Text size="2" className="font-medium leading-tight">
                    ↓ {formatBytes(downloadTotal)}
                  </Text>
                </Flex>
              }
              className="status-traffic"
            />
          )}

          {/* Network Speed Chart */}
          {statusCardsVisibility.networkSpeed && (
            <div className="col-span-1 sm:col-span-2 md:col-span-3 lg:col-span-1">
              <StatusCard
                icon={<TrendingUp className="text-gray-11" size={16} />}
                title={t("network_speed")}
                value={
                  <div className="w-full h-12">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={speedHistory} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-gray-1 p-1.5 rounded shadow-lg border border-gray-4">
                                  <Text size="1" style={{ color: '#95E1D3' }}>
                                    ↑ {formatSpeed(payload[0].value as number)}
                                  </Text>
                                  <br />
                                  <Text size="1" style={{ color: '#F38181' }}>
                                    ↓ {formatSpeed(payload[1].value as number)}
                                  </Text>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="upload"
                          stroke="#95E1D3"
                          strokeWidth={1.5}
                          dot={false}
                          animationDuration={0}
                        />
                        <Line
                          type="monotone"
                          dataKey="download"
                          stroke="#F38181"
                          strokeWidth={1.5}
                          dot={false}
                          animationDuration={0}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                }
                subtitle={
                  <Flex gap="2">
                    <Text size="1" className="font-medium">
                      ↑{formatSpeed(uploadSpeed)}
                    </Text>
                    <Text size="1" className="font-medium">
                      ↓{formatSpeed(downloadSpeed)}
                    </Text>
                  </Flex>
                }
                className="status-speed"
              />
            </div>
          )}
        </div>
      </Flex>
    </Card>
  );
};

// Individual status card component
interface StatusCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}

const StatusCard: React.FC<StatusCardProps> = ({ icon, title, value, subtitle, className }) => {
  // 网络速率卡片需要特殊布局
  const isSpeedCard = className?.includes('status-speed');
  const minHeight = isSpeedCard ? 'min-h-[5rem]' : 'min-h-[3.5rem]';
  
  // 网络速率卡片使用不同的布局
  if (isSpeedCard) {
    return (
      <div className={`status-card rounded-md ${minHeight} ${className || ''}`}>
        <Flex direction="column" gap="1" className="h-full justify-center">
          <Flex align="center" gap="2">
            <div className="status-icon flex-shrink-0">{icon}</div>
            <Text size="1" color="gray" className="text-xs sm:text-sm">
              {title}
            </Text>
          </Flex>
          <div className="status-value w-full">{value}</div>
          {subtitle && <div className="status-subtitle text-xs text-center">{subtitle}</div>}
        </Flex>
      </div>
    );
  }
  
  return (
    <div className={`status-card rounded-md ${minHeight} flex items-center ${className || ''}`}>
      <Flex align="center" gap="2" className="h-full">
        <div className="status-icon flex-shrink-0">{icon}</div>
        <Flex direction="column" className="flex-1 min-w-0">
          <Text size="1" color="gray" className="text-xs sm:text-sm">
            {title}
          </Text>
          <div className="status-value font-semibold text-sm sm:text-base">{value}</div>
          {subtitle && <div className="status-subtitle text-xs">{subtitle}</div>}
        </Flex>
      </Flex>
    </div>
  );
};

// Settings component
interface StatusSettingsProps {
  visibility: StatusCardsVisibility;
  onVisibilityChange: (visibility: StatusCardsVisibility) => void;
}

const StatusSettings: React.FC<StatusSettingsProps> = ({ visibility, onVisibilityChange }) => {
  const [t] = useTranslation();

  const toggleVisibility = (key: keyof StatusCardsVisibility) => {
    onVisibilityChange({
      ...visibility,
      [key]: !visibility[key],
    });
  };

  const settings: { key: keyof StatusCardsVisibility; label: string }[] = [
    { key: "currentTime", label: t("current_time") },
    { key: "currentOnline", label: t("current_online") },
    { key: "regionOverview", label: t("region_overview") },
    { key: "trafficOverview", label: t("traffic_overview") },
    { key: "networkSpeed", label: t("network_speed") },
  ];

  return (
    <Flex direction="column" gap="3">
      <Text size="2" weight="bold">
        {t("status_settings")}
      </Text>
      <Flex direction="column" gap="2">
        {settings.map((setting) => (
          <label key={setting.key} className="flex items-center justify-between cursor-pointer">
            <Text size="2">{setting.label}</Text>
            <input
              type="checkbox"
              checked={visibility[setting.key] ?? true}
              onChange={() => toggleVisibility(setting.key)}
              className="w-4 h-4 rounded border-gray-6 text-accent-9 focus:ring-accent-9"
            />
          </label>
        ))}
      </Flex>
    </Flex>
  );
};

export default StatusBar;