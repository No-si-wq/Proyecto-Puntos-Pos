import { Cascader } from "antd";
import { useMemo } from "react";
import { useCategories } from "../../hooks/useCategories";
import type { Category } from "../../types/category";

interface CategoryCascaderProps {
  value?: number[];
  onChange?: (value: number[]) => void;
}

export function CategoryCascader({
  value,
  onChange,
}: CategoryCascaderProps) {
  const { categoryTree } = useCategories();

  const options = useMemo(() => {
    function map(nodes: Category[]): any[] {
      return nodes.map(c => ({
        value: c.id,
        label: c.name,
        children: c.children?.length
          ? map(c.children)
          : undefined,
      }));
    }

    return map(categoryTree);
  }, [categoryTree]);

  if (!options.length) {
    return <Cascader disabled placeholder="Cargando categorías..." />;
  }

  return (
    <Cascader
      key={options.length}
      options={options}
      value={value}
      onChange={(v) => onChange?.(v as number[])}
      placeholder="Selecciona categoría"
    />
  );
}