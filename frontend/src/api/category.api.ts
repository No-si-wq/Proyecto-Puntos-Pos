import http from "./http";
import type {
  Category,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types/category";

export async function tree(): Promise<Category[]> {
  return http.get("/categories/tree").then(r => r.data);
}

export async function subtree(id: number): Promise<Category> {
  return http.get(`/categories/${id}/subtree`).then(r => r.data);
}

export async function children(parentId?: number): Promise<Category[]> {
  const id = parentId ?? "root";
  return http
    .get(`/categories/${id}/children`)
    .then(r => r.data);
}

export async function importCategories(
  paths: string[][]
): Promise<void> {
  await http.post("/categories/import", { paths });
}

export async function getById(id: number): Promise<Category> {
  const { data } = await http.get(`/categories/${id}`);
  return data;
}

export async function create(data: CreateCategoryInput): Promise<Category> {
  return http.post("/categories", data).then(r => r.data);
}

export async function createHierarchy(data: {
  rootCategoryId: number;
  levels: string[];
}): Promise<Category> {
  return http.post("/categories/hierarchy", data).then(r => r.data);
}

export async function update(id: number, data: UpdateCategoryInput): Promise<Category> {
  return http.put(`/categories/${id}`, data).then(r => r.data);
}

export async function remove(id: number): Promise<void> {
  return http.delete(`/categories/${id}`).then(() => {});
}