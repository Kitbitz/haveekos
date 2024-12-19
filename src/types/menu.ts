export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl?: string | null;
  quantity: number;
  totalSold: number;
  createdAt?: any;
  updatedAt?: any;
}