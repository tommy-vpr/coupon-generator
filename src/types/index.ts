export type DiscountType = "fixed_amount" | "percentage";

export interface PriceRulePayload {
  title: string;
  target_type: "line_item" | "shipping_line";
  target_selection: "all" | "entitled";
  allocation_method: "across" | "each";
  value_type: DiscountType;
  value: string; // negative for fixed_amount, negative percentage for percentage
  customer_selection: "all" | "prerequisite";
  starts_at: string;
  ends_at?: string;
  usage_limit?: number;
  once_per_customer?: boolean;
}

export interface PriceRule {
  id: number;
  title: string;
  value_type: DiscountType;
  value: string;
  starts_at: string;
  ends_at: string | null;
  usage_limit: number | null;
  once_per_customer: boolean;
  created_at: string;
}

export interface DiscountCode {
  id: number;
  price_rule_id: number;
  code: string;
  created_at: string;
  usage_count: number;
}

export interface GeneratorFormData {
  mode: "single" | "batch";
  discountType: DiscountType;
  value: number;
  prefix: string;
  codeLength: number;
  batchCount: number;
  title: string;
  startsAt: string;
  endsAt: string;
  usageLimit: number | null;
  oncePerCustomer: boolean;
}

export interface GeneratedCode {
  code: string;
  status: "pending" | "created" | "failed";
  error?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}
