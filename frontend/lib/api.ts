export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";
export type Product = { id: number; name: string; description: string; price: string; current_price: number; discount_pct: number;
  deal_ends: string | null; stock: number; image_url: string; gallery: string[]; shop: string | null; source_shop_info?: { id: number; name: string; image_url: string; address: string; phone: string; email: string; description: string } | null; rating_avg: number; rating_count: number; sold: number; category: number };
export const naira = (n: number | string) => "₦" + Number(n).toLocaleString();
export async function api<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${API}/api/${path}`, { ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Token ${token}` } : {}) } });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return res.json();
}
