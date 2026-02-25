import { getActiveBrand, type BrandConfig } from "./brands";

interface ShopifyRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE";
  endpoint: string;
  body?: Record<string, unknown>;
  brand?: BrandConfig;
}

async function shopifyRequest<T>({
  method,
  endpoint,
  body,
  brand,
}: ShopifyRequestOptions): Promise<T> {
  // Resolve brand — use passed-in or fetch active
  const config = brand ?? (await getActiveBrand());

  const url = `${config.adminApiUrl}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": config.accessToken,
  };

  const options: RequestInit = {
    method,
    headers,
    ...(body && { body: JSON.stringify(body) }),
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData?.errors ||
      errorData?.error ||
      `Shopify API error: ${response.status} ${response.statusText}`;
    throw new Error(
      typeof errorMessage === "string"
        ? errorMessage
        : JSON.stringify(errorMessage)
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ─── Price Rules ──────────────────────────────────────────

export async function createPriceRule(priceRule: {
  title: string;
  target_type: string;
  target_selection: string;
  allocation_method: string;
  value_type: string;
  value: string;
  customer_selection: string;
  starts_at: string;
  ends_at?: string;
  usage_limit?: number;
  once_per_customer?: boolean;
}) {
  return shopifyRequest<{ price_rule: Record<string, unknown> }>({
    method: "POST",
    endpoint: "/price_rules.json",
    body: { price_rule: priceRule },
  });
}

export async function getPriceRules() {
  return shopifyRequest<{ price_rules: Record<string, unknown>[] }>({
    method: "GET",
    endpoint: "/price_rules.json?limit=50",
  });
}

export async function deletePriceRule(priceRuleId: number) {
  return shopifyRequest<Record<string, never>>({
    method: "DELETE",
    endpoint: `/price_rules/${priceRuleId}.json`,
  });
}

// ─── Discount Codes ───────────────────────────────────────

export async function createDiscountCode(
  priceRuleId: number,
  code: string
) {
  return shopifyRequest<{ discount_code: Record<string, unknown> }>({
    method: "POST",
    endpoint: `/price_rules/${priceRuleId}/discount_codes.json`,
    body: {
      discount_code: { code },
    },
  });
}

export async function createBatchDiscountCodes(
  priceRuleId: number,
  codes: string[]
) {
  return shopifyRequest<{ discount_codes: Record<string, unknown>[] }>({
    method: "POST",
    endpoint: `/price_rules/${priceRuleId}/batch.json`,
    body: {
      discount_codes: codes.map((code) => ({ code })),
    },
  });
}

export async function getDiscountCodes(priceRuleId: number) {
  return shopifyRequest<{ discount_codes: Record<string, unknown>[] }>({
    method: "GET",
    endpoint: `/price_rules/${priceRuleId}/discount_codes.json`,
  });
}

export async function getBatchJob(priceRuleId: number, batchId: number) {
  return shopifyRequest<{ discount_codes: Record<string, unknown>[] }>({
    method: "GET",
    endpoint: `/price_rules/${priceRuleId}/batch/${batchId}.json`,
  });
}

// ─── GraphQL ──────────────────────────────────────────────

export async function shopifyGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const config = await getActiveBrand();

  if (!config.graphqlUrl) {
    throw new Error("GraphQL URL is not configured for this brand");
  }

  const response = await fetch(config.graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.accessToken,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.errors) {
    throw new Error(
      data.errors.map((e: { message: string }) => e.message).join(", ")
    );
  }

  return data;
}
