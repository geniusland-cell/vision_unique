/**
 * VISION UNIQUE - TypeScript Type Definitions
 * Globol interface for User, Depot, Product, Category, etc.
 * (Shared between maman-power-app and depot-dashboard)
 */

export type UserRole = "vendor" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  is_active: boolean;
  subscription_status?: "active" | "inactive" | "free";
  subscription_expiry?: string;
  priority_level?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  description: string;
  is_active: boolean;
  created_at: string;
}

export interface Depot {
  id: string;
  user_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  phone: string;
  email?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  quartier?: string;
  subscription_status?: "active" | "inactive";
  subscription_expiry?: string;
  subscription_plan?: "monthly" | "quarterly";
  tier?: "basic" | "advanced" | "elite" | "none";
  tier_expiry?: string;
  tier_rank?: number;
  payment_pending?: boolean;
  payment_notified_at?: string;
  payment_amount?: number;
  requested_tier?: "none" | "basic" | "advanced" | "elite";
  requested_cycle?: "monthly" | "quarterly";
  promo_image_url?: string;
  promo_video_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  depot_id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  base_price?: number;
  unit: string;
  stock?: number;
  stock_quantity?: number;
  image_url?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepotWithProducts extends Depot {
  products: Product[];
  distance?: number;
}

export interface FirebaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FirebaseListResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  error?: string;
  message?: string;
}

export interface PaginationResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  hasMore?: boolean;
  error?: string;
}

export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<FirebaseResponse<User>>;
  register: (
    name: string,
    phone: string,
    password: string,
  ) => Promise<FirebaseResponse<User>>;
  logout: () => Promise<FirebaseResponse<null>>;
  isVendor: () => boolean;
  isManager: () => boolean;
  isAdmin: () => boolean;
}

export interface CacheData {
  categories: Category[];
  depots: Depot[];
  lastSync: string;
  expiresAt: string;
}

export interface SubscriptionStatus {
  isActive: boolean;
  daysRemaining: number;
  expiryDate?: string;
  status: "active" | "warning" | "inactive";
}

export interface Quartier {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
}

export interface DepotCardProps {
  depot: DepotWithProducts;
  selectedCategory: string | null;
  searchTerm: string;
}

export interface UnifiedLoginProps {
  onLoginSuccess?: () => void;
}

export interface AdminPanelProps {
  user: User;
}

export interface CategoriesManagementProps {
  categories: Category[];
  onSave: (categories: Category[]) => Promise<void>;
}

export interface DepotProductsProps {
  depot: Depot;
  onClose: () => void;
}

export interface StatsGridProps {
  stats: {
    totalRevenue: number;
    totalProducts: number;
    totalCustomers: number;
    avgRating: number;
  };
}
