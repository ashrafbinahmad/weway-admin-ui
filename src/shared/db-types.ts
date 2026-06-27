// Auto-generated standalone DB types
// Regenerate with: npm run sync:db-types
// Source: weway-backend/src/db/schema.ts

export type DbCategory = {
  id: string;
  name: string;
  slug: string;
  type: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  imageFileId: string | null;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DbService = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  imageFileId: string | null;
  minVolume: number;
  maxVolume: number | null;
  price: string;
  isPriceCustomizeable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DbVendor = {
  id: string;
  name: string;
  legalName: string;
  slug: string;
  imageFileId: string | null;
  coverImageUrl: string | null;
  avgRating: string;
  totalReviews: number;
  email: string;
  phone: string;
  location: { lng: number; lat: number };
  address: string;
  countryId: string;
  stateId: string;
  districtId: string;
  cityId: string | null;
  pincode: string;
  isAvailable: boolean;
  status: "KYC_NOT_VERIFIED" | "KYC_VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  kycVerifiedAt: Date | null;
  approvedAt: Date | null;
  approvedByUserId: string | null;
  rejectedReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type DbBooking = {
  id: string;
  userId: string;
  categoryId: string;
  serviceId: string;
  vendorId: string | null;
  status: "PENDING_ASSIGNMENT" | "ASSIGNED" | "ACCEPTED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  scheduledAt: Date;
  location: { lng: number; lat: number };
  address: string;
  phone: string | null;
  notes: string | null;
  totalAmount: string;
  assignmentExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbUserCart = {
  id: string;
  userId: string;
  serviceId: string;
  bookingId: string | null;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
};

export type DbUserWishlist = {
  id: string;
  userId: string;
  serviceId: string;
  createdAt: Date;
};
