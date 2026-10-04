export const getToken = () => (typeof window === "undefined" ? undefined : localStorage.getItem("token") ?? undefined);
export const setToken = (t?: string) => (t ? localStorage.setItem("token", t) : localStorage.removeItem("token"));
export type CartLine = { id: number; name: string; price: number; qty: number };
export const getCart = (): CartLine[] => { try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; } };
export const saveCart = (c: CartLine[]) => { localStorage.setItem("cart", JSON.stringify(c)); window.dispatchEvent(new Event("cart")); };
export const addToCart = (p: { id: number; name: string; current_price: number }, qty = 1) => {
  const c = getCart(); const l = c.find((x) => x.id === p.id);
  if (l) l.qty += qty; else c.push({ id: p.id, name: p.name, price: p.current_price, qty });
  saveCart(c);
};
