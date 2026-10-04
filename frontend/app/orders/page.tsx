"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";
type Order = { ref: string; status: string; total: string; method: string; items: { name: string; qty: number }[] };

export default function Orders() {
  const [token, setT] = useState<string>();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { const t = getToken(); if (!t) location.href = "/login"; setT(t); }, []);
  const notes = useNotifications(token);
  const [tick, setTick] = useState(0);
  async function cancel(ref: string) { try { await api(`orders/${ref}/cancel/`, { method: "POST" }, token); setTick((n) => n + 1); } catch {} }
  useEffect(() => {
    if (token) api<{ results: Order[] }>("orders/", {}, token).then((d) => setOrders(d.results)).catch(() => {});
  }, [token, notes.length, tick]);
  return (
    <main><h2>My orders</h2>
      {orders.map((o) => (<div key={o.ref} className="card"><b>{o.ref}</b> · {o.status.replace(/_/g, " ")} · ₦{Number(o.total).toLocaleString()}
        <div>{o.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}</div>
        {["pending", "awaiting_payment"].includes(o.status) && <button onClick={() => cancel(o.ref)}>Cancel order</button>}</div>))}
    </main>);
}
