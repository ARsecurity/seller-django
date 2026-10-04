"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, naira, Product } from "@/lib/api";
import { addToCart, getToken } from "@/lib/store";
import Img from "../../Img";
import Countdown from "../../Countdown";
type Review = { user: string; rating: number; comment: string };

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [p, setP] = useState<Product>();
  const [rev, setRev] = useState<Review[]>([]);
  const [img, setImg] = useState("");
  const [qty, setQty] = useState(1);
  const [r, setR] = useState({ rating: 5, comment: "" });
  const [msg, setMsg] = useState("");
  useEffect(() => {
    api<Product>(`products/${id}/`).then((x) => { setP(x); setImg(x.image_url || x.gallery[0] || ""); });
    api<Review[]>(`products/${id}/reviews/`).then(setRev);
  }, [id]);
  if (!p) return <main>Loading…</main>;
  const imgs = Array.from(new Set([p.image_url, ...p.gallery].filter(Boolean)));
  async function post() {
    const t = getToken(); if (!t) { location.href = "/login"; return; }
    try { setRev(await api<Review[]>(`products/${id}/reviews/`, { method: "POST", body: JSON.stringify(r) }, t)); setMsg("Thanks for your review!"); }
    catch { setMsg("Could not post review"); }
  }
  return (
    <main className="pdp">
      <div><div className="card"><Img src={img} alt={p.name} /></div>
        <div className="gal">{imgs.map((u) => <img key={u} src={u} alt="" referrerPolicy="no-referrer" onClick={() => setImg(u)} />)}</div></div>
      <div>
        <h2>{p.name}</h2>
        <div><b className="pprice" style={{ fontSize: 28 }}>{naira(p.current_price)}</b>
          {p.discount_pct > 0 && <><s className="old">{naira(p.price)}</s> <span className="badge" style={{ position: "static" }}>-{p.discount_pct}%</span></>}
          {p.deal_ends && p.discount_pct > 0 && <Countdown end={p.deal_ends} />}</div>
        <p className="meta">{p.rating_count > 0 ? `⭐ ${p.rating_avg} (${p.rating_count} reviews)` : "No reviews yet"} · {p.sold} sold · {p.stock} in stock</p>
        {p.source_shop_info && <div className="card"><h3>Source shop</h3>{p.source_shop_info.image_url && <img src={p.source_shop_info.image_url} alt={p.source_shop_info.name} referrerPolicy="no-referrer" style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 10 }} />}<p><b>{p.source_shop_info.name}</b></p>{p.source_shop_info.address && <p>📍 {p.source_shop_info.address}</p>}{p.source_shop_info.phone && <p>📞 {p.source_shop_info.phone}</p>}{p.source_shop_info.email && <p>✉️ {p.source_shop_info.email}</p>}{p.source_shop_info.description && <p>{p.source_shop_info.description}</p>}</div>}
        <p>{p.description}</p>
        <input type="number" min={1} max={p.stock} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} style={{ width: 90 }} />{" "}
        <button disabled={p.stock < 1} onClick={() => { addToCart(p, qty); setMsg("Added to cart ✓"); }}>🛒 Add to cart</button>
        <p>{msg}</p>
        <h3>Reviews</h3>
        {rev.map((x, i) => <div key={i} className="card">{"⭐".repeat(x.rating)} <b>{x.user}</b><div>{x.comment}</div></div>)}
        <select value={r.rating} onChange={(e) => setR({ ...r, rating: Number(e.target.value) })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
        <input placeholder="Write a review" onChange={(e) => setR({ ...r, comment: e.target.value })} />
        <button onClick={post}>Post review</button>
      </div>
    </main>);
}
