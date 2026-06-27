import axios from "axios";
import type {
  DbCategory,
  DbService,
  DbVendor,
  DbBooking,
  DbUser,
} from "@backend/db/schema";

// Get backend URL from env or fallback to local port 3001
const API_BASE_URL =
  `${import.meta.env.VITE_API_URL}/api` ||
  "https://weway-dev-api.peerhop.in/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Re-export the shared types under simpler names for the UI to use
export type Category = DbCategory;
export type Service = DbService;
export type Vendor = DbVendor;
export type User = DbUser;

export type Booking = DbBooking & {
  user?: User;
  category?: Category;
  service?: Service;
  vendor?: Vendor | null;
};
