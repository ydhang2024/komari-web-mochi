import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Flex,
  Text,
  IconButton,
  TextField,
  SegmentedControl,
} from "@radix-ui/themes";
import { Search, X } from "lucide-react";
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
import { CompactCard } from "./NodeCompactCard";
import PingTaskDisplay from "./PingTaskDisplay";
import NodeEarthView from "./NodeEarthView";

export type ViewMode = "modern" | "compact" | "classic" | "detailed" | "pingtask" | "earth";

interface NodeDisplayProps {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
}

const NodeDisplay: React.FC<NodeDisplayProps> = ({ nodes, liveData }) => {
  const [t] = useTranslation();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>(
    "nodeViewMode",
    "modern"
  );
  
  // 移动端不支持 compact 模式，自动切换到 modern
  useEffect(() => {
    if (isMobile && viewMode === "compact") {
      setViewMode("modern");
    }
  }, [isMobile, viewMode, setViewMode]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useLocalStorage<string>(
    "nodeSelectedGroup",
    "all"
  );
  const searchRef = useRef<HTMLInputElement>(null);

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
        <Flex align="center" gap="2" className="overflow-x-auto scrollbar-thin">
          <label className="whitespace-nowrap text-md text-muted-foreground flex-shrink-0">
            {t("view.mode", { defaultValue: "显示模式" })}
          </label>
          <SegmentedControl.Root
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            size="1"
            className="flex-shrink-0"
          >
            <SegmentedControl.Item value="modern">
              Modern
            </SegmentedControl.Item>
            {!isMobile && (
              <SegmentedControl.Item value="compact">
                Compact
              </SegmentedControl.Item>
            )}
            <SegmentedControl.Item value="classic">
              Classic
            </SegmentedControl.Item>
            <SegmentedControl.Item value="detailed">
              Detailed
            </SegmentedControl.Item>
            <SegmentedControl.Item value="pingtask">
              PingTask
            </SegmentedControl.Item>
            <SegmentedControl.Item value="earth">
              Earth
            </SegmentedControl.Item>
          </SegmentedControl.Root>
        </Flex>
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
          {viewMode === "modern" && (
            <ModernGrid nodes={filteredNodes} liveData={liveData} />
          )}
          {viewMode === "compact" && (
            <CompactList nodes={filteredNodes} liveData={liveData} />
          )}
          {viewMode === "classic" && (
            <NodeGrid nodes={filteredNodes} liveData={liveData} />
          )}
          {viewMode === "detailed" && (
            <NodeTable nodes={filteredNodes} liveData={liveData} />
          )}
          {viewMode === "pingtask" && (
            <PingTaskDisplay nodes={nodes} liveData={liveData} />
          )}
          {viewMode === "earth" && (
            <NodeEarthView nodes={filteredNodes} liveData={liveData} />
          )}
        </>
      )}
    </div>
  );
};

export default NodeDisplay;

// Modern Grid View
type ModernGridProps = {
  nodes: NodeBasicInfo[];
  liveData: LiveData;
};

const ModernGrid: React.FC<ModernGridProps> = ({ nodes, liveData }) => {
  const onlineNodes = liveData?.online || [];
  
  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline = onlineNodes.includes(a.uuid);
    const bOnline = onlineNodes.includes(b.uuid);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;
    return a.weight - b.weight;
  });

  return (
    <div
      className="gap-4 p-4"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 430px), 1fr))",
      }}
    >
      {sortedNodes.map((node) => {
        const isOnline = onlineNodes.includes(node.uuid);
        const nodeData = liveData?.data?.[node.uuid];
        return (
          <ModernCard
            key={node.uuid}
            basic={node}
            live={nodeData}
            online={isOnline}
          />
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
  
  const sortedNodes = [...nodes].sort((a, b) => {
    const aOnline = onlineNodes.includes(a.uuid);
    const bOnline = onlineNodes.includes(b.uuid);
    if (aOnline !== bOnline) return aOnline ? -1 : 1;
    return a.weight - b.weight;
  });

  return (
    <Flex direction="column" gap="2" className="p-4">
      {sortedNodes.map((node) => {
        const isOnline = onlineNodes.includes(node.uuid);
        const nodeData = liveData?.data?.[node.uuid];
        return (
          <CompactCard
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
