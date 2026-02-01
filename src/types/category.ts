export interface Category {
  id: string;
  name: string;
  path: string[];
  parentId?: string;
  children: Category[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}