/**
 * Minimal fetch wrapper for the DARE API.
 * Attaches the Bearer token (supplied by callers via getAuthToken()),
 * normalizes FastAPI error payloads ({detail: string} | {detail: [...]}).
 */

export const API_BASE = 'https://antifatypes.com/dare/api/v1';

/** Card image base: image_url values are relative paths on the DARE host. */
export const ASSET_BASE = 'https://antifatypes.com';

/** Resolve a possibly-relative asset path to an absolute URL. */
export function assetUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return ASSET_BASE + (path.startsWith('/') ? path : `/${path}`);
}

export interface ApiErrorShape {
  status: number;
  message: string;
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function formatDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (d && typeof d === 'object' && 'msg' in d) {
          const loc = Array.isArray((d as { loc?: unknown[] }).loc)
            ? ((d as { loc: unknown[] }).loc.filter(Boolean).join('.') || 'field')
            : 'field';
          return `${loc}: ${(d as { msg?: string }).msg}`;
        }
        return String(d);
      })
      .join(' · ');
  }
  if (detail && typeof detail === 'object') {
    // FastAPI custom dicts, e.g. Clout shortfall: {detail, required, available, shortfall}
    const d = detail as Record<string, unknown>;
    if (typeof d.detail === 'string') {
      if (typeof d.shortfall === 'number') {
        return `Not enough Energy: need ⚡ ${d.required} but you're short ⚡ ${d.shortfall}. Claim your daily or buy a pack first.`;
      }
      return d.detail;
    }
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return `Request failed (${''})`;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail = (data as { detail?: unknown })?.detail ?? data;
    const message =
      res.status === 401 ? 'Session expired — sign in again.' : formatDetail(detail);
    throw new ApiError(res.status, message, detail);
  }

  return data as T;
}

/** Human-readable message from any thrown value. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return 'Something went wrong. Try again.';
}
