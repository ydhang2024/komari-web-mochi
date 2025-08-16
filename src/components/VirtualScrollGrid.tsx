import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';

interface VirtualScrollGridProps {
  items: any[];
  itemHeight: number;
  itemsPerRow: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  gap?: number;
  overscan?: number;
  className?: string;
}

export const VirtualScrollGrid: React.FC<VirtualScrollGridProps> = ({
  items,
  itemHeight,
  itemsPerRow,
  renderItem,
  gap = 16,
  overscan = 3,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // 计算行数
  const totalRows = Math.ceil(items.length / itemsPerRow);
  const rowHeight = itemHeight + gap;
  const totalHeight = totalRows * rowHeight - gap;

  // 计算可见范围
  const visibleRows = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endRow = Math.min(
      totalRows,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );
    return { startRow, endRow };
  }, [scrollTop, containerHeight, rowHeight, totalRows, overscan]);

  // 获取可见项
  const visibleItems = useMemo(() => {
    const { startRow, endRow } = visibleRows;
    const startIndex = startRow * itemsPerRow;
    const endIndex = Math.min(endRow * itemsPerRow, items.length);
    
    return items.slice(startIndex, endIndex).map((item, idx) => ({
      item,
      index: startIndex + idx,
      row: Math.floor((startIndex + idx) / itemsPerRow),
      col: (startIndex + idx) % itemsPerRow
    }));
  }, [items, visibleRows, itemsPerRow]);

  // 处理滚动
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // 处理容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 使用 RAF 优化滚动性能
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [handleScroll]);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        contain: 'strict'
      }}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          width: '100%'
        }}
      >
        {visibleItems.map(({ item, index, row, col }) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: row * rowHeight,
              left: `calc(${col * 100 / itemsPerRow}% + ${col * gap}px)`,
              width: `calc(${100 / itemsPerRow}% - ${gap * (itemsPerRow - 1) / itemsPerRow}px)`,
              height: itemHeight,
              contain: 'layout style paint'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
};

// 使用 Intersection Observer 的优化版本
export const VirtualScrollGridV2: React.FC<VirtualScrollGridProps> = ({
  items,
  itemHeight,
  itemsPerRow,
  renderItem,
  gap = 16,
  overscan = 3,
  className = ''
}) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });
  const containerRef = useRef<HTMLDivElement>(null);
  const sentinelTopRef = useRef<HTMLDivElement>(null);
  const sentinelBottomRef = useRef<HTMLDivElement>(null);

  const totalRows = Math.ceil(items.length / itemsPerRow);
  const rowHeight = itemHeight + gap;
  const totalHeight = totalRows * rowHeight - gap;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const container = containerRef.current;
            if (!container) return;

            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            
            const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
            const endRow = Math.min(
              totalRows,
              Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
            );
            
            setVisibleRange({
              start: startRow * itemsPerRow,
              end: Math.min(endRow * itemsPerRow, items.length)
            });
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: `${overscan * rowHeight}px 0px`
      }
    );

    if (sentinelTopRef.current) observer.observe(sentinelTopRef.current);
    if (sentinelBottomRef.current) observer.observe(sentinelBottomRef.current);

    return () => observer.disconnect();
  }, [items.length, itemsPerRow, rowHeight, overscan, totalRows]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: '100%',
        overflowY: 'auto',
        contain: 'strict'
      }}
    >
      <div ref={sentinelTopRef} style={{ height: 1 }} />
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map((item, idx) => {
          const actualIndex = visibleRange.start + idx;
          const row = Math.floor(actualIndex / itemsPerRow);
          const col = actualIndex % itemsPerRow;
          
          return (
            <div
              key={actualIndex}
              style={{
                position: 'absolute',
                top: row * rowHeight,
                left: `calc(${col * 100 / itemsPerRow}% + ${col * gap}px)`,
                width: `calc(${100 / itemsPerRow}% - ${gap * (itemsPerRow - 1) / itemsPerRow}px)`,
                height: itemHeight,
                contain: 'layout style paint'
              }}
            >
              {renderItem(item, actualIndex)}
            </div>
          );
        })}
      </div>
      <div ref={sentinelBottomRef} style={{ height: 1 }} />
    </div>
  );
};