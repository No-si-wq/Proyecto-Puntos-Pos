import { Tree, Input } from "antd";
import { useMemo, useState } from "react";
import type { Category } from "../category";
import { useDeviceType } from "../../../core/hooks/useDeviceType";

interface Props {
  categoryTree: Category[];
  selectedCategory: Category | null;
  onSelectCategory?: (category: Category | null) => void;
}

export default function CategoryTreeView({
  categoryTree,
  onSelectCategory,
}: Props) {
  const [search, setSearch]                   = useState("");
  const [expandedKeys, setExpandedKeys]       = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);
  const { isMobile }                          = useDeviceType();

  const flattenTree = (nodes: Category[]): Category[] => {
    const result: Category[] = [];
    const traverse = (list: Category[]) => {
      for (const node of list) {
        result.push(node);
        if (node.children) traverse(node.children);
      }
    };
    traverse(nodes);
    return result;
  };

  const flatList = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  const getParentKey = (key: number, tree: Category[]): number | null => {
    for (const node of tree) {
      if (node.children?.some((child) => child.id === key)) return node.id;
      if (node.children) {
        const parent = getParentKey(key, node.children);
        if (parent) return parent;
      }
    }
    return null;
  };

  const onSearch = (value: string) => {
    setSearch(value);
    if (!value) { setExpandedKeys([]); return; }

    const matchedKeys = flatList
      .filter((node) => node.name.toLowerCase().includes(value.toLowerCase()))
      .map((node) => node.id);

    const parentKeys = new Set<number>();
    matchedKeys.forEach((key) => {
      let parent = getParentKey(key, categoryTree);
      while (parent) {
        parentKeys.add(parent);
        parent = getParentKey(parent, categoryTree);
      }
    });

    setExpandedKeys(Array.from(parentKeys));
    setAutoExpandParent(true);
  };

  const highlight = (name: string) => {
    if (!search) return name;
    const index = name.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return name;
    return (
      <>
        {name.substring(0, index)}
        <span style={{ color: "#1677ff" }}>
          {name.substring(index, index + search.length)}
        </span>
        {name.substring(index + search.length)}
      </>
    );
  };

  const treeData = useMemo(() => {
    const mapNode = (cat: Category): any => ({
      key: cat.id,
      title: highlight(cat.name),
      children: cat.children?.map(mapNode),
    });
    return categoryTree.map(mapNode);
  }, [categoryTree, search]);

  const handleSelect = (keys: React.Key[]) => {
    if (!keys.length) { onSelectCategory?.(null); return; }
    const findCategory = (nodes: Category[]): Category | undefined => {
      for (const node of nodes) {
        if (node.id === keys[0]) return node;
        if (node.children) {
          const found = findCategory(node.children);
          if (found) return found;
        }
      }
    };
    onSelectCategory?.(findCategory(categoryTree) ?? null);
  };

  const treeHeight = isMobile ? undefined : 520;

  return (
    <>
      <Input
        placeholder="Buscar categoría..."
        allowClear
        onChange={(e) => onSearch(e.target.value)}
        style={{ marginBottom: 12 }}
      />
      <Tree
        treeData={treeData}
        onSelect={handleSelect}
        expandedKeys={expandedKeys}
        autoExpandParent={autoExpandParent}
        onExpand={(keys) => {
          setExpandedKeys(keys);
          setAutoExpandParent(false);
        }}
        blockNode
        showLine={{ showLeafIcon: false }}
        height={treeHeight}
        virtual={!isMobile}
        style={
          isMobile
            ? { minHeight: 200 }
            : undefined
        }
        className="compact-tree"
      />
    </>
  );
}