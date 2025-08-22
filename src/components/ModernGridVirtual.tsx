import React, { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData } from "../types/LiveData";
import { ModernCard } from "./NodeModernCard";

interface ModernGridVirtualProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  forceShowTrafficText?: boolean;
}

const ModernGridVirtual: React.FC<ModernGridVirtualProps> = ({ 
  nodes, 
  liveData, 
  forceShowTrafficText 
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const onlineNodes = liveData?.online || [];
  
  // 计算列数
  const columns = useMemo(() => {
    if (containerWidth === 0) return 1;
    
    const minItemWidth = 430;
    const gap = 16;
    const padding = 32; // 左右各16px
    const availableWidth = containerWidth - padding;
    
    // 计算可以容纳的列数
    const cols = Math.max(1, Math.floor((availableWidth + gap) / (minItemWidth + gap)));
    
    return cols;
  }, [containerWidth]);
  
  // 排序节点：在线的在前，然后按weight排序
  const sortedNodes = useMemo(() => {
    const onlineSet = new Set(onlineNodes);
    
    return [...nodes].sort((a, b) => {
      const aOnline = onlineSet.has(a.uuid);
      const bOnline = onlineSet.has(b.uuid);
      if (aOnline !== bOnline) return aOnline ? -1 : 1;
      return a.weight - b.weight;
    });
  }, [nodes, onlineNodes]);
  
  // 将节点分组为行
  const rows = useMemo(() => {
    const result: NodeBasicInfo[][] = [];
    for (let i = 0; i < sortedNodes.length; i += columns) {
      result.push(sortedNodes.slice(i, i + columns));
    }
    return result;
  }, [sortedNodes, columns]);
  
  // 估算行高 - 提供足够的高度避免截断
  const estimateSize = useCallback((index: number) => {
    // Modern卡片的实际高度测量
    // 移动端: ~320px, 桌面端: ~360px
    // 添加额外空间确保不会截断
    const isMobile = window.innerWidth < 640;
    
    // 基础高度包含：
    // - 卡片内容: 280-320px
    // - 间距: 16px (gap-4)
    // - 安全边距: 20px
    const baseHeight = isMobile ? 360 : 400;
    
    // 如果有特别长的内容，增加高度
    const row = rows[index];
    if (row && row.length > 0) {
      const hasExtraContent = row.some(node => 
        (node.tags && node.tags.split(';').length > 4) ||
        node.name.length > 25
      );
      if (hasExtraContent) {
        return baseHeight + 40;
      }
    }
    
    return baseHeight;
  }, [rows]);
  
  // 创建虚拟化器
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3, // 预渲染前后3行，增加缓冲区
    gap: 16, // 行间距
    measureElement: typeof window !== 'undefined' && window.ResizeObserver
      ? (element) => {
          // 动态测量实际高度
          return element.getBoundingClientRect().height;
        }
      : undefined,
  });
  
  // 监听容器尺寸变化
  useEffect(() => {
    const updateDimensions = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.clientWidth);
        
        // 计算合适的容器高度 - 占满所有可用空间
        const viewportHeight = window.innerHeight;
        const rect = parentRef.current.getBoundingClientRect();
        const offsetTop = rect.top;
        
        // 页脚高度估算（约50px）
        const footerHeight = 50;
        // 计算可用高度
        const availableHeight = viewportHeight - offsetTop - footerHeight;
        
        // 设置高度，占满所有可用空间，不设置最大限制
        const calculatedHeight = Math.max(400, availableHeight);
        setContainerHeight(calculatedHeight);
      }
    };
    
    updateDimensions();
    
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
    
    window.addEventListener('resize', updateDimensions);
    
    // 延迟执行一次，确保DOM完全加载
    setTimeout(updateDimensions, 100);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [nodes.length]); // 监听节点数量变化
  
  // 处理窗口大小变化时重新测量
  useEffect(() => {
    const handleResize = () => {
      virtualizer.measure();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [virtualizer]);
  
  const items = virtualizer.getVirtualItems();
  
  return (
    <>
      {/* 虚拟滚动性能指示器 */}
      {nodes.length > 50 && (
        <div className="px-4 py-2 text-xs text-accent-11 bg-accent-2 rounded-md mx-4 mb-2">
          <span className="font-medium">虚拟滚动已启用</span> - 
          显示 {items.length * columns} / {nodes.length} 个节点
        </div>
      )}
      
      <div 
        ref={parentRef}
        className="virtual-scroll-container overflow-auto p-4 scrollbar-thin scrollbar-thumb-accent-6 scrollbar-track-accent-3 relative"
        style={{
          height: `${containerHeight}px`,
          contain: 'strict',
          willChange: 'scroll-position',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualRow) => {
            const row = rows[virtualRow.index];
            
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  minHeight: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  willChange: 'transform',
                }}
              >
                <div
                  className="gap-4 pb-4"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridAutoRows: 'max-content',
                    contain: 'layout style paint',
                  }}
                >
                  {row.map((node) => {
                    const isOnline = onlineNodes.includes(node.uuid);
                    const nodeData = liveData?.data?.[node.uuid];
                    
                    return (
                      <div key={node.uuid} style={{ contain: 'layout style paint' }}>
                        <ModernCard
                          basic={node}
                          live={nodeData}
                          online={isOnline}
                          forceShowTrafficText={forceShowTrafficText}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default ModernGridVirtual;