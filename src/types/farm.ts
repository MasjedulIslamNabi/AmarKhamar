export type Breed = 
  | "Brahman" 
  | "Sahiwal" 
  | "Holstein Friesian" 
  | "Mirka" 
  | "Red Sindhi" 
  | "Local" 
  | "Crossbreed" 
  | string;

export type Gender = "Bull" | "Cow" | "Calf" | string;

export type Source = "Purchased" | "Born on Farm" | string;

export type CattleStatus = "Active" | "Sold";

export type HealthType = "Vaccine" | "Treatment" | "Routine Checkup";

export type FeedType = "Grass" | "Straw" | "Concentrates" | "Supplements" | string;

export interface WeightRecord {
  id: string;
  date: string;
  weight: number; // in kg
  notes?: string;
}

export interface HealthRecord {
  id: string;
  cowId: string;
  type: HealthType;
  date: string;
  title: string;
  medicineName?: string;
  dosage?: string;
  nextBoosterDate?: string;
  notes?: string;
  administeredBy?: string;
}

export interface Cattle {
  id: string;
  tagNumber: string;
  breed: Breed;
  gender: Gender;
  weight: number;
  source: Source;
  purchaseDate: string;
  purchasePrice?: number;
  status: CattleStatus;
  notes?: string;
  weightRecords: WeightRecord[];
  healthRecords: HealthRecord[];
}

export interface FeedEntry {
  id: string;
  date: string;
  feedType: FeedType;
  quantity: number; // in kg
  cost: number;     // in ৳
  notes?: string;
}

export interface Payment {
  id: string;
  month: string; // e.g. "2026-10"
  amount: number;
  paymentDate: string;
  status: "Paid" | "Pending";
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  baseSalary: number;
  joinDate: string;
  status: "Active" | "Inactive";
  phone?: string;
  payments: Payment[];
}

export interface Sale {
  id: string;
  cowId: string;
  tagNumber: string;
  breed: string;
  purchasePrice?: number;
  salePrice: number;
  buyerName: string;
  buyerContact?: string;
  date: string;
  profitOrLoss: number;
  notes?: string;
}

export interface FarmData {
  userId?: string;
  farmName: string;
  cattle: Cattle[];
  feed: FeedEntry[];
  employees: Employee[];
  sales: Sale[];
  updatedAt?: string;
}

export type Language = "en" | "bn";
