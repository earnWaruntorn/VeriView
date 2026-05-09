/**
 * Centralized API service for communicating with the VeriView backend.
 *
 * All backend calls go through this module so that endpoint URLs, headers,
 * and token handling are managed in a single place.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Wraps fetch with standard error handling.
 * Throws on non-OK responses with the backend error message when available.
 */
async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body.error) msg = body.error;
    } catch {
      // ignore JSON parse errors – use the generic message
    }
    throw new Error(msg);
  }

  return res.json();
}

// ─── Product Endpoints ───────────────────────────────────────────────────────

/**
 * Register a product URL and obtain its product_id.
 * POST /product  { url }
 * @returns {{ product_id: number }}
 */
export async function postProduct(url) {
  return apiFetch(`${API_BASE_URL}/product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

/**
 * Retrieve product details (name, price, store, image).
 * Triggers a scrape on the backend when the product hasn't been scraped yet.
 * GET /product?product_id=...
 */
export async function getProduct(productId) {
  return apiFetch(`${API_BASE_URL}/product?product_id=${productId}`);
}

/**
 * Retrieve reviews for a product (with predictions).
 * Triggers scraping + prediction on the backend when needed.
 * GET /review?product_id=...
 * @returns {{ success: boolean, data: Array }}
 */
export async function getReviews(productId) {
  return apiFetch(`${API_BASE_URL}/review?product_id=${productId}`);
}

// ─── Auth Endpoints ──────────────────────────────────────────────────────────

/**
 * Authenticate admin user and receive a JWT token.
 * GET /auth/login?username=...&password=...
 * @returns {{ access_token: string }}
 */
export async function login(username, password) {
  return apiFetch(
    `${API_BASE_URL}/auth/login?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
  );
}

// ─── Admin Endpoints (require Bearer token) ──────────────────────────────────

/**
 * Fetch the admin product/log list.
 * GET /admin
 * @returns {{ products: Array }}
 */
export async function getAdminLogs(token) {
  return apiFetch(`${API_BASE_URL}/admin`, {
    headers: authHeaders(token),
  });
}

/**
 * Trigger a re-scrape and re-analysis for a product.
 * PATCH /admin/re-analyze?product_id=...
 * @returns {{ success: boolean, data: Array }}
 */
export async function reAnalyze(productId, token) {
  return apiFetch(`${API_BASE_URL}/admin/re-analyze?product_id=${productId}`, {
    method: "PATCH",
    headers: authHeaders(token),
  });
}
