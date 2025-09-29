import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  Flex,
  Text,
  IconButton,
  TextField,
  SegmentedControl,
  Button,
} from "@radix-ui/themes";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useIsMobile } from "@/hooks/use-mobile";
import type { NodeBasicInfo } from "@/contexts/NodeListContext";
import type { LiveData } from "../types/LiveData";
import { NodeGrid } from "./Node";
import NodeTable from "./NodeTable";
import { isRegionMatch } from "@/utils/regionHelper";
import "./NodeDisplay.css";
import { ModernCard } from "./NodeModernCard";
import NodeCompactCard from "./NodeCompactCard";
import TaskDisplay from "./TaskDisplay";
import NodeEarthView from "./NodeEarthView";
import ViewModeSelector from "./ViewModeSelector";
import ModernGridVirtual from "./ModernGridVirtual";
import { usePublicInfo } from "@/contexts/PublicInfoContext";

export type ViewMode = "modern" | "compact" | "classic" | "detailed" | "task" | "earth";

const VIEW_MODES: ViewMode[] = [
  "modern",
  "compact",
  "classic",
  "detailed",
  "task",
  "earth",
];

const clampNumber = (value: number, min: number, max: number) => {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const parsePositiveNumber = (value: unknown) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return num;
};

const parseBooleanSetting = (value: unknown, fallback: boolean) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

interface NodeDisplayProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  forceShowTrafficText?: boolean;
}

const NodeDisplay: React.FC<NodeDisplayProps> = ({ nodes, liveData, forceShowTrafficText }) => {
  const [t] = useTranslation();
  const isMobile = useIsMobile();
  const { publicInfo } = usePublicInfo();
  const paginationEnabled = parseBooleanSetting(
    publicInfo?.theme_settings?.enablePagination,
    true
  );
  const maxPageSize = 200;
  const pageSize = useMemo(() => {
    const parsed = parsePositiveNumber(
      publicInfo?.theme_settings?.paginationPageSize
    );
    const fallback = 24;
    const candidate = parsed ?? fallback;
    return clampNumber(candidate, 1, maxPageSize);
  }, [publicInfo]);
  // 获取配置的默认视图模式，并转换为小写
  const configDefaultMode = publicInfo?.theme_settings?.defaultViewMode?.toLowerCase() as ViewMode | undefined;
  const defaultMode: ViewMode = configDefaultMode && 
    ["modern", "compact", "classic", "detailed", "task", "earth"].includes(configDefaultMode) 
    ? configDefaultMode : "modern";
  
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "nodeViewMode",
    defaultMode
  );
  const safeViewMode = VIEW_MODES.includes(viewMode) ? viewMode : "modern";
  const enableVirtualScroll = publicInfo?.theme_settings?.enableVirtualScroll ?? true;

  // 组件初始化优化
  useEffect(() => {
    if (!VIEW_MODES.includes(viewMode)) {
      setViewMode("modern");
    }
  }, [viewMode, setViewMode]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useLocalStorage<string>(
    "nodeSelectedGroup",
    "all"
  );
  const searchRef = useRef<HTMLInputElement>(null);

  const [pageIndexMap, setPageIndexMap] = useState<Record<ViewMode, number>>(() =>
    VIEW_MODES.reduce((acc, mode) => {
      acc[mode] = 1;
      return acc;
    }, {} as Record<ViewMode, number>)
  );

  useEffect(() => {
    setPageIndexMap((prev) => {
      if (prev[safeViewMode] !== undefined) return prev;
      return { ...prev, [safeViewMode]: 1 };
    });
  }, [safeViewMode]);

  const rawCurrentPage = pageIndexMap[safeViewMode] ?? 1;

  // 检测是否为电脑端（>=860px）
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 860 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 860);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // 初始化

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 获取所有的分组
  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    nodes.forEach((node) => {
      if (node.group && node.group.trim()) {
        groupSet.add(node.group);
      }
    });
    return Array.from(groupSet).sort();
  }, [nodes]);

  // 判断是否显示分组选择器
  const showGroupSelector = groups.length >= 1;

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 "/" 键聚焦搜索框
      if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // 按 Escape 键清空搜索
      if (e.key === "Escape" && searchTerm) {
        setSearchTerm("");
        searchRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [searchTerm]);

  // 过滤节点
  const filteredNodes = useMemo(() => {
    let result = nodes;

    // 先按分组过滤
    if (selectedGroup !== "all") {
      result = result.filter((node) => node.group === selectedGroup);
    }

    // 再按搜索条件过滤
    if (!searchTerm.trim()) return result;

    const term = searchTerm.toLowerCase().trim();
    return result.filter((node) => {
      // 基本信息搜索
      const basicMatch =
        node.name.toLowerCase().includes(term) ||
        node.os.toLowerCase().includes(term) ||
        node.arch.toLowerCase().includes(term);

      // 地区搜索（支持emoji和地区名称）
      const regionMatch = isRegionMatch(node.region, term);

      // 价格搜索（如果输入数字）
      const priceMatch =
        !isNaN(Number(term)) && node.price.toString().includes(term);

      // 状态搜索
      const isOnline = liveData?.online?.includes(node.uuid) || false;
      const statusMatch =
        ((term === "online" || term === "在线") && isOnline) ||
        ((term === "offline" || term === "离线") && !isOnline);

      return basicMatch || regionMatch || priceMatch || statusMatch;
    });
  }, [nodes, searchTerm, liveData, selectedGroup]);

  const totalFiltered = filteredNodes.length;
  const paginationApplies =
    paginationEnabled && safeViewMode !== "task" && safeViewMode !== "earth";

  const totalPages = paginationApplies
    ? totalFiltered > 0
      ? Math.max(1, Math.ceil(totalFiltered / pageSize))
      : 1
    : 1;
  const currentPage = paginationApplies
    ? clampNumber(rawCurrentPage, 1, totalPages)
    : 1;
  const [pageInput, setPageInput] = useState<string>(() => String(currentPage));

  const updatePage = useCallback(
    (nextPage: number) => {
      if (!paginationApplies) return;
      const target = clampNumber(nextPage, 1, totalPages);
      setPageIndexMap((prev) => {
        if ((prev[safeViewMode] ?? 1) === target) return prev;
        return { ...prev, [safeViewMode]: target };
      });
    },
    [paginationApplies, safeViewMode, totalPages]
  );

  useEffect(() => {
    if (!paginationApplies) return;
    if (rawCurrentPage !== currentPage) {
      setPageIndexMap((prev) => {
        if ((prev[safeViewMode] ?? 1) === currentPage) return prev;
        return { ...prev, [safeViewMode]: currentPage };
      });
    }
  }, [currentPage, paginationApplies, rawCurrentPage, safeViewMode]);

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  useEffect(() => {
    if (!paginationApplies) return;
    setPageIndexMap((prev) => {
      if ((prev[safeViewMode] ?? 1) === 1) return prev;
      return { ...prev, [safeViewMode]: 1 };
    });
  }, [searchTerm, selectedGroup, paginationApplies, safeViewMode]);

  const hasNodes = totalFiltered > 0;
  const pageRangeStart = paginationApplies && hasNodes
    ? (currentPage - 1) * pageSize + 1
    : hasNodes
      ? 1
      : 0;
  const pageRangeEnd = paginationApplies && hasNodes
    ? Math.min(totalFiltered, pageRangeStart + pageSize - 1)
    : hasNodes
      ? totalFiltered
      : 0;

  const paginatedNodes = useMemo(() => {
    if (!paginationApplies) return filteredNodes;
    if (!hasNodes) return [];
    const start = (currentPage - 1) * pageSize;
    return filteredNodes.slice(start, start + pageSize);
  }, [filteredNodes, paginationApplies, hasNodes, currentPage, pageSize]);

  const handlePageInputChange = useCallback((value: string) => {
    if (/^\d*$/.test(value)) {
      setPageInput(value);
    }
  }, []);

  const commitPageInput = useCallback(() => {
    if (!paginationApplies) {
      setPageInput(String(currentPage));
      return;
    }
    const parsed = Number(pageInput);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setPageInput(String(currentPage));
      return;
    }
    updatePage(parsed);
  }, [paginationApplies, pageInput, currentPage, updatePage]);

  return (
    <div className="w-full">
      {/* 控制栏 */}
      <Flex
        direction={{ initial: "column", sm: "row" }}
        justify="between"
        align={{ initial: "stretch", sm: "center" }}
        gap="4"
        className="control-bar mb-2 p-4 rounded-lg"
      >
        {/* 搜索框 */}
        <Flex
          align="center"
          gap="2"
          className="flex-1 max-w-md relative"
          wrap="wrap"
        >
          <TextField.Root
            ref={searchRef}
            placeholder={t("search.placeholder", {
              defaultValue: "搜索节点名称、地区、系统...",
            })}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-box flex-1 pr-8 min-w-32"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
          {searchTerm && (
            <IconButton
              variant="ghost"
              size="1"
              className="absolute right-2 h-6 w-6 search-clear-button"
              onClick={() => {
                setSearchTerm("");
                searchRef.current?.focus();
              }}
            >
              <X size={12} />
            </IconButton>
          )}
        </Flex>

        {/* 视图模式切换 */}
        <div className={isMobile ? "w-full" : ""}>
          <ViewModeSelector 
            currentMode={safeViewMode}
            onModeChange={setViewMode}
            isMobile={isMobile}
          />
        </div>
      </Flex>
      {/* 分组选择器 */}
      {showGroupSelector && (
        <Flex align="center" gap="2" className="mx-4 mb-2 -mt-2 overflow-x-auto scrollbar-thin">
          <label className="whitespace-nowrap text-md text-muted-foreground flex-shrink-0">
            {t("common.group", { defaultValue: "分组" })}
          </label>
          <SegmentedControl.Root
            value={selectedGroup}
            onValueChange={setSelectedGroup}
            size="1"
            className="flex-shrink-0"
          >
            <SegmentedControl.Item value="all">
              {t("common.all", { defaultValue: "所有" })}
            </SegmentedControl.Item>
            {groups.map((group) => (
              <SegmentedControl.Item key={group} value={group}>
                {group}
              </SegmentedControl.Item>
            ))}
          </SegmentedControl.Root>
        </Flex>
      )}
      {/* 搜索结果统计 */}
      <Flex justify="between" align="center" className="mx-4 mb-2">
        {searchTerm.trim() ? (
          <Text size="2" color="gray">
            {t("search.results", {
              count: filteredNodes.length,
              total:
                selectedGroup === "all"
                  ? nodes.length
                  : nodes.filter((n) => n.group === selectedGroup).length,
              defaultValue: `找到 ${filteredNodes.length} 个服务器，共 ${
                selectedGroup === "all"
                  ? nodes.length
                  : nodes.filter((n) => n.group === selectedGroup).length
              } 个`,
            })}
          </Text>
        ) : (
          <Text size="2" color="gray">
            {selectedGroup === "all"
              ? t("nodeCard.totalNodes", {
                  total: nodes.length,
                  online: liveData?.online?.length || 0,
                  defaultValue: `共 ${nodes.length} 个节点，${
                    liveData?.online?.length || 0
                  } 个在线`,
                })
              : t("nodeCard.groupNodes", {
                  group: selectedGroup,
                  total: filteredNodes.length,
                  online: filteredNodes.filter((n) =>
                    liveData?.online?.includes(n.uuid)
                  ).length,
                  defaultValue: `${selectedGroup} 分组：共 ${
                    filteredNodes.length
                  } 个节点，${
                    filteredNodes.filter((n) =>
                      liveData?.online?.includes(n.uuid)
                    ).length
                  } 个在线`,
                })}
          </Text>
        )}
      </Flex>
      {/* 节点显示区域 */}
      {filteredNodes.length === 0 ? (
        <Flex
          direction="column"
          align="center"
          justify="center"
          className="py-16 mx-4"
        >
          <Text size="4" color="gray" className="mb-2">
            {searchTerm.trim()
              ? t("search.no_results", { defaultValue: "未找到匹配的节点" })
              : t("nodes.empty", { defaultValue: "暂无节点数据" })}
          </Text>
          {searchTerm.trim() && (
            <Text size="2" color="gray">
              {t("search.try_different", {
                defaultValue: "尝试不同的搜索关键词",
              })}
            </Text>
          )}
        </Flex>
      ) : (
        <>
          {safeViewMode === "modern" && (
            // 移动端（<860px）不使用虚拟滚动，电脑端（>=860px）一律使用虚拟滚动
            (enableVirtualScroll && isDesktop) ? (
              <ModernGridVirtual nodes={paginatedNodes} liveData={liveData} forceShowTrafficText={forceShowTrafficText} />
            ) : (
              <ModernGrid nodes={paginatedNodes} liveData={liveData} forceShowTrafficText={forceShowTrafficText} />
            )
          )}
          {safeViewMode === "compact" && (
            <CompactList nodes={paginatedNodes} liveData={liveData} />
          )}
          {safeViewMode === "classic" && (
            <NodeGrid nodes={paginatedNodes} liveData={liveData} />
          )}
          {safeViewMode === "detailed" && (
            <NodeTable nodes={paginatedNodes} liveData={liveData} />
          )}
          {safeViewMode === "task" && (
            <TaskDisplay nodes={filteredNodes} liveData={liveData} />
          )}
          {safeViewMode === "earth" && (
            <NodeEarthView nodes={filteredNodes} liveData={liveData} />
          )}
        </>
      )}

      {paginationApplies && (
        <Flex
          justify="between"
          align="center"
          className="mx-4 mt-4 mb-2 gap-3 flex-wrap"
        >
          <Text size="2" color="gray">
            {hasNodes
              ? t("pagination.range", {
                  start: pageRangeStart,
                  end: pageRangeEnd,
                  total: totalFiltered,
                })
              : t("pagination.empty", {
                  defaultValue: "当前没有可显示的节点",
                })}
          </Text>
          <Flex align="center" wrap="wrap">
            <Text size="2" color="gray">
              {t("pagination.pageSize", {
                pageSize,
              })}
            </Text>
            <Flex align="center" className="pagination-controls">
              <Button
                variant="solid"
                size="2"
                radius="full"
                className="pagination-button"
                disabled={!paginationApplies || !hasNodes || currentPage <= 1}
                onClick={() => updatePage(currentPage - 1)}
              >
                <ChevronLeft size={16} />
                <span>{t("pagination.prev", { defaultValue: "上一页" })}</span>
              </Button>
              <TextField.Root
                value={pageInput}
                onChange={(event) => handlePageInputChange(event.target.value)}
                onBlur={commitPageInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitPageInput();
                  }
                }}
                disabled={!paginationApplies || !hasNodes}
                size="1"
                variant="soft"
                radius="full"
                style={{ width: "3.5rem" }}
                className="pagination-pill"
                autoComplete="off"
                aria-label={t("pagination.goto", { defaultValue: "跳转页码" })}
              />
              <Flex align="center" gap="1" className="pagination-total-wrapper">
                <span className="pagination-divider">/</span>
                <span className="pagination-pill pagination-pill--static">
                  {totalPages}
                </span>
              </Flex>
              <Button
                variant="solid"
                size="2"
                radius="full"
                className="pagination-button"
                disabled={!paginationApplies || !hasNodes || currentPage >= totalPages}
                onClick={() => updatePage(currentPage + 1)}
              >
                <span>{t("pagination.next", { defaultValue: "下一页" })}</span>
                <ChevronRight size={16} />
              </Button>
            </Flex>
          </Flex>
        </Flex>
      )}
    </div>
  );
};

export default NodeDisplay;

// Modern Grid View
type ModernGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
  forceShowTrafficText?: boolean;
};

const ModernGrid: React.FC<ModernGridProps> = ({ nodes, liveData, forceShowTrafficText }) => {
  const onlineNodes = liveData?.online || [];
  const { publicInfo } = usePublicInfo();
  const offlineNodePosition = publicInfo?.theme_settings?.offlineNodePosition ?? "后面";
  
  // 使用 useMemo 缓存排序结果，避免每次渲染都重新排序
  const sortedNodes = useMemo(() => {
    // 创建在线节点的 Set 以优化查找性能
    const onlineSet = new Set(onlineNodes);
    
    return [...nodes].sort((a, b) => {
      const aOnline = onlineSet.has(a.uuid);
      const bOnline = onlineSet.has(b.uuid);
      
      // 根据配置决定离线节点位置
      if (offlineNodePosition === "前面") {
        // 离线节点在前
        if (aOnline !== bOnline) return aOnline ? 1 : -1;
      } else if (offlineNodePosition === "原位置") {
        // 不区分在线状态，只按权重排序
        // 继续执行下面的权重排序
      } else {
        // 默认：离线节点在后（后面）
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
      }
      
      return a.weight - b.weight;
    });
  }, [nodes, onlineNodes, offlineNodePosition]);

  // 使用响应式网格布局
  // 移动端2列，平板3列，桌面端自适应多列
  
  return (
    <div
      className="modern-grid-container"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(430px, 1fr))",
        gap: "1rem",
        padding: "1rem",
        gridAutoRows: "min-content",
        alignItems: "start",
        contain: "layout style",
        willChange: "contents",
        overflowX: "hidden"
      }}
    >
        {sortedNodes.map((node) => {
          const isOnline = onlineNodes.includes(node.uuid);
          const nodeData = liveData?.data?.[node.uuid];
          return (
            <div 
              key={node.uuid}
              style={{
                contain: "layout style paint",
                willChange: "auto"
              }}
            >
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
  );
};

// Compact List View
type CompactListProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
};

const CompactList: React.FC<CompactListProps> = ({ nodes, liveData }) => {
  const onlineNodes = liveData?.online || [];
  const { publicInfo } = usePublicInfo();
  const offlineNodePosition = publicInfo?.theme_settings?.offlineNodePosition ?? "后面";
  
  const sortedNodes = useMemo(() => {
    const onlineSet = new Set(onlineNodes);
    
    return [...nodes].sort((a, b) => {
      const aOnline = onlineSet.has(a.uuid);
      const bOnline = onlineSet.has(b.uuid);
      
      // 根据配置决定离线节点位置
      if (offlineNodePosition === "前面") {
        // 离线节点在前
        if (aOnline !== bOnline) return aOnline ? 1 : -1;
      } else if (offlineNodePosition === "原位置") {
        // 不区分在线状态，只按权重排序
        // 继续执行下面的权重排序
      } else {
        // 默认：离线节点在后（后面）
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
      }
      
      return a.weight - b.weight;
    });
  }, [nodes, onlineNodes, offlineNodePosition]);

  return (
    <Flex direction="column" gap="2" className="p-4">
      {sortedNodes.map((node) => {
        const isOnline = onlineNodes.includes(node.uuid);
        const nodeData = liveData?.data?.[node.uuid];
        return (
          <NodeCompactCard
            key={node.uuid}
            basic={node}
            live={nodeData}
            online={isOnline}
          />
        );
      })}
    </Flex>
  );
};
