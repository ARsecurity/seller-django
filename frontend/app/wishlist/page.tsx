"use client";
import { useEffect, useState } from "react";
import { api, Product } from "@/lib/api";
import { getToken } from "@/lib/store";
import ProductCard from "../ProductCard";
export default function Wishlist() {
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => { const t = getToken(); if (!t) { location.href = "/login"; return; } api<Product[]>("wishlist/", {}, t).then(setItems).catch(() => {}); }, []);
  return <main><h2>My wishlist</h2><div className="grid">{items.map((p) => <ProductCard key={p.id} p={p} />)}</div></main>;
}
