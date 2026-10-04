"use client";
import Link from "next/link";
import { useState } from "react";
import Img from "./Img";
import { Product, api, naira } from "@/lib/api";
import { addToCart, getToken } from "@/lib/store";

export default function ProductCard({ p }: { p: Product }) {
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  async function like(e: React.MouseEvent) {
    e.preventDefault(); const t = getToken(); if (!t) { location.href = "/login"; return; }
    const r = await api<{ wishlisted: boolean }>(`products/${p.id}/wishlist/`, { method: "POST" }, t); setLiked(r.wishlisted);
  }
  return (
    <Link href={`/product/${p.id}`} className="pc">
      <div className="pimg"><Img src={p.image_url || p.gallery[0]} alt={p.name} />
        {p.discount_pct > 0 && <span className="badge">-{p.discount_pct}%</span>}
        <button className="heart" onClick={like} aria-label="Wishlist">{liked ? "❤️" : "🤍"}</button></div>
      <div className="pbody">
        <div className="pname">{p.name}</div>
        <div><b className="pprice">{naira(p.current_price)}</b>{p.discount_pct > 0 && <s className="old">{naira(p.price)}</s>}</div>
        <div className="meta">{p.rating_count > 0 ? `⭐ ${p.rating_avg} (${p.rating_count})` : "New"} · {p.sold} sold</div>
        <button className="add" disabled={p.stock < 1}
          onClick={(e) => { e.preventDefault(); addToCart(p); setAdded(true); setTimeout(() => setAdded(false), 1200); }}>
          {p.stock < 1 ? "Sold out" : added ? "Added ✓" : "+ Add to cart"}</button>
      </div>
    </Link>);
}
