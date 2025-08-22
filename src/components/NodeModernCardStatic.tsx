import React, { useMemo } from "react";
import { Flex, Text, Badge, Tooltip } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";
import { Server, AlertTriangle } from "lucide-react";
import Flag from "./Flag";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import { getOSImage, getOSName } from "@/utils";
import "./NodeModernCard.css";

interface ModernCardStaticProps {
  basic: NodeBasicInfo;
  online?: boolean;
  errorMessage?: string;
  children?: React.ReactNode;
}

const ModernCardStaticComponent: React.FC<ModernCardStaticProps> = ({ 
  basic,
  online = false,
  errorMessage,
  children 
}) => {
  const { t } = useTranslation();

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
    <>
      {/* 装饰性背景 - 保持静态 */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
        <Server size={128} />
      </div>

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
            {errorMessage && (
              <Tooltip content={errorMessage}>
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
                  <div className="flex-1 min-w-0 flex items-center">
                    <Text size="1" color="gray" className="whitespace-nowrap">
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
              {errorMessage && (
                <Tooltip content={errorMessage}>
                  <Badge color="red" variant="soft" size="1">
                    <AlertTriangle size={12} />
                  </Badge>
                </Tooltip>
              )}
            </Flex>
          </Flex>
        </div>

        {/* 动态内容插槽 */}
        {children}
      </Flex>
    </>
  );
};

// 静态内容很少变化，但现在包含在线状态和错误信息
export const ModernCardStatic = React.memo(ModernCardStaticComponent, (prev, next) => {
  // 只有这些属性变化时才重新渲染
  return (
    prev.basic.uuid === next.basic.uuid &&
    prev.basic.name === next.basic.name &&
    prev.basic.price === next.basic.price &&
    prev.basic.billing_cycle === next.basic.billing_cycle &&
    prev.basic.expired_at === next.basic.expired_at &&
    prev.basic.tags === next.basic.tags &&
    prev.basic.region === next.basic.region &&
    prev.basic.os === next.basic.os &&
    prev.basic.arch === next.basic.arch &&
    prev.basic.virtualization === next.basic.virtualization &&
    prev.online === next.online &&
    prev.errorMessage === next.errorMessage
  );
});