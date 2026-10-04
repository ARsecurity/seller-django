"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, Product } from "@/lib/api";
import ProductCard from "./ProductCard";
import Countdown from "./Countdown";
type Cat = { id: number; name: string };
const BANNERS = [
  { t: "Welcome to Seller", s: "Pay on delivery · Fast local delivery", c: "linear-gradient(135deg,#ff6a00,#ee0979)" },
  { t: "Flash Deals Every Day", s: "Grab them before the timer ends", c: "linear-gradient(135deg,#00b09b,#0a7d3b)" },
  { t: "Shop Local", s: "Quality products with local delivery", c: "linear-gradient(135deg,#4776e6,#8e54e9)" }];
const SORTS: [string, string][] = [["-sold", "🔥 Popular"], ["-created", "🆕 New"], ["price", "💰 Price ↑"], ["-rating_avg", "⭐ Top rated"]];

export default function Home() {
  const [items, setItems] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [q, setQ] = useState(""); const [cat, setCat] = useState(""); const [sort, setSort] = useState("-sold");
  const [page, setPage] = useState(1); const [more, setMore] = useState(true); const [busy, setBusy] = useState(false);
  const [b, setB] = useState(0); const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api<{ deals: Product[] }>("home/").then((d) => setDeals(d.deals)).catch(() => {});
    api<Cat[]>("categories/").then(setCats).catch(() => {});
    const i = setInterval(() => setB((x) => (x + 1) % BANNERS.length), 4000); return () => clearInterval(i);
  }, []);
  const load = useCallback(async (pg: number) => {
    setBusy(true);
    try {
      const d = await api<{ results: Product[]; next: string | null }>(
        `products/?page=${pg}&ordering=${sort}&search=${encodeURIComponent(q)}${cat ? `&category=${cat}` : ""}`);
      setItems((i) => (pg === 1 ? d.results : [...i, ...d.results])); setMore(!!d.next); setPage(pg);
    } catch { setMore(false); }
    setBusy(false);
  }, [q, cat, sort]);
  useEffect(() => { const t = setTimeout(() => load(1), 250); return () => clearTimeout(t); }, [load]);
  useEffect(() => {
    const el = sentinel.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting && more && !busy) load(page + 1); });
    o.observe(el); return () => o.disconnect();
  }, [more, busy, page, load]);
  const end = deals.find((d) => d.deal_ends)?.deal_ends;
  return (
    <main>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍 Search products in Zamfara" />
      <div className="hero" style={{ background: BANNERS[b].c }}><h2>{BANNERS[b].t}</h2><p>{BANNERS[b].s}</p></div>
      <div className="chips">
        <button className={`chip ${cat === "" ? "on" : ""}`} onClick={() => setCat("")}>All</button>
        {cats.map((c) => <button key={c.id} className={`chip ${cat === String(c.id) ? "on" : ""}`} onClick={() => setCat(String(c.id))}>{c.name}</button>)}
      </div>
      {deals.length > 0 && (<section className="deals"><b>⚡ Flash Deals</b>{end && <Countdown end={end} />}
        <div className="row">{deals.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>)}
      <div className="tabs">{SORTS.map(([k, l]) => <button key={k} className={`tab ${sort === k ? "on" : ""}`} onClick={() => setSort(k)}>{l}</button>)}</div>
      <div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      {!busy && items.length === 0 && <p>No products found.</p>}
      <div ref={sentinel} style={{ height: 40, textAlign: "center" }}>{busy && "Loading…"}</div>
    </main>);
}
