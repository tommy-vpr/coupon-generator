import { cookies } from "next/headers";

export interface BrandConfig {
  id: string;
  name: string;
  domain: string;
  adminApiUrl: string;
  accessToken: string;
  apiKey: string;
  apiSecret: string;
  graphqlUrl: string;
  allowedOrigin: string;
  logo: string;
  color: string;
}

const COOKIE_NAME = "active_brand";

/**
 * Load all brand configs from env vars.
 * Reads BRAND_1_NAME, BRAND_1_SHOPIFY_DOMAIN, etc.
 */
export function getAllBrands(): BrandConfig[] {
  const count = parseInt(process.env.BRAND_COUNT || "0", 10);
  const brands: BrandConfig[] = [];

  for (let i = 1; i <= Math.min(count, 10); i++) {
    const name = process.env[`BRAND_${i}_NAME`];
    const domain = process.env[`BRAND_${i}_SHOPIFY_DOMAIN`];
    const adminApiUrl = process.env[`BRAND_${i}_SHOPIFY_ADMIN_API_URL`];
    const accessToken = process.env[`BRAND_${i}_SHOPIFY_ACCESS_TOKEN`];

    // Skip brands missing critical values
    if (!name || !adminApiUrl || !accessToken) continue;

    brands.push({
      id: `brand_${i}`,
      name,
      domain: domain || "",
      adminApiUrl,
      accessToken,
      apiKey: process.env[`BRAND_${i}_SHOPIFY_API_KEY`] || "",
      apiSecret: process.env[`BRAND_${i}_SHOPIFY_API_SECRET`] || "",
      graphqlUrl: process.env[`BRAND_${i}_SHOPIFY_ADMIN_API_URL_GRAPHQL`] || "",
      allowedOrigin: process.env[`BRAND_${i}_ALLOWED_ORIGIN`] || "",
      logo: process.env[`BRAND_${i}_LOGO`] || "",
      color: process.env[`BRAND_${i}_COLOR`] || "",
    });
  }

  return brands;
}

/**
 * Get the active brand config based on the cookie.
 * Falls back to the first brand if cookie is missing or invalid.
 */
export async function getActiveBrand(): Promise<BrandConfig> {
  const brands = getAllBrands();

  if (brands.length === 0) {
    throw new Error(
      "No brands configured. Set BRAND_COUNT and BRAND_N_* env vars."
    );
  }

  const cookieStore = await cookies();
  const activeBrandId = cookieStore.get(COOKIE_NAME)?.value;

  if (activeBrandId) {
    const found = brands.find((b) => b.id === activeBrandId);
    if (found) return found;
  }

  return brands[0];
}

/**
 * Serializable brand info (no secrets) for the client.
 */
export interface BrandInfo {
  id: string;
  name: string;
  domain: string;
  allowedOrigin: string;
  logo: string;
  color: string;
}

export function getBrandList(): BrandInfo[] {
  return getAllBrands().map(({ id, name, domain, allowedOrigin, logo, color }) => ({
    id,
    name,
    domain,
    allowedOrigin,
    logo,
    color,
  }));
}

export { COOKIE_NAME };
