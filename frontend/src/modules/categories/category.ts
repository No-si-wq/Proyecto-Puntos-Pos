export interface Category {
  id: number;
  name: string;
  active: boolean;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string; 
}

export interface CreateCategoryInput {
  name: string;
  parentId?: number | null;
  active?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: number | null;
  active?: boolean;
}

export interface CategoryFormValues {
  name: string;
  active?: boolean;
}

export interface CategoryFormProps {
  isEdit: boolean;
  initialValues?: Partial<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  excludeId?: number;
}

export interface SubCategoryFormProps {
  parentCategory: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export interface CategoryTreeViewProps {
  rootCategoryId: number;
  onSelectCategory?: (category: Category) => void;
  onRefresh?: () => void;
}