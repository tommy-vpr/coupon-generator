import type { BrandConfig } from "./brands";

interface CachedToken {
  token: string;
  expiresAt: number; // epoch ms
}

// Module-level cache survives within the same Node process.
// Keyed by brand id so each brand has its own short-lived token.
const tokenCache = new Map<string, CachedToken>();

// Refresh tokens this many ms before they actually expire,
// to avoid sending a request right as the token rolls over.
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get an access token for the given brand.
 *
 * - If `config.accessToken` is set (legacy `shpat_...` from Shopify admin
 *   custom apps), return it directly. These tokens don't expire.
 * - Otherwise the brand uses a Dev Dashboard app and we exchange the
 *   `apiKey` (Client ID) + `apiSecret` (Client Secret) for a short-lived
 *   token via the client_credentials grant. The result is cached in
 *   memory and refreshed before expiry.
 *
 * @throws if neither auth method is configured or if the token exchange fails.
 */
export async function getAccessToken(config: BrandConfig): Promise<string> {
  if (config.accessToken) {
    return config.accessToken;
  }

  if (!config.apiKey || !config.apiSecret) {
    throw new Error(
      `Brand "${config.name}" has no auth configured. Set either ` +
        `BRAND_*_SHOPIFY_ACCESS_TOKEN (legacy) or both ` +
        `BRAND_*_SHOPIFY_API_KEY and BRAND_*_SHOPIFY_API_SECRET (Dev Dashboard).`,
    );
  }

  if (!config.domain) {
    throw new Error(
      `Brand "${config.name}" needs BRAND_*_SHOPIFY_DOMAIN set ` +
        `(e.g. mystore.myshopify.com) to fetch a client_credentials token.`,
    );
  }

  const cached = tokenCache.get(config.id);
  if (cached && cached.expiresAt > Date.now() + EXPIRY_BUFFER_MS) {
    return cached.token;
  }

  const token = await fetchClientCredentialsToken(config);
  return token;
}

async function fetchClientCredentialsToken(
  config: BrandConfig,
): Promise<string> {
  const tokenUrl = `https://${config.domain}/admin/oauth/access_token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.apiKey,
      client_secret: config.apiSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Failed to fetch access token for brand "${config.name}" ` +
        `(${response.status}): ${errorText || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };

  if (!data.access_token) {
    throw new Error(
      `Token response for brand "${config.name}" missing access_token: ` +
        (data.error_description || data.error || JSON.stringify(data)),
    );
  }

  // Default to 24h if Shopify omits expires_in for any reason.
  const expiresInSec = data.expires_in ?? 24 * 60 * 60;
  const expiresAt = Date.now() + expiresInSec * 1000;

  tokenCache.set(config.id, { token: data.access_token, expiresAt });
  return data.access_token;
}

/**
 * Drop the cached token for a brand. Useful if a request fails with 401
 * and we want the next call to mint a fresh token.
 */
export function invalidateToken(brandId: string): void {
  tokenCache.delete(brandId);
}
