"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCart, getToken, setToken } from "@/lib/store";
import { useNotifications } from "@/lib/useNotifications";

export default function Nav() {
  const [token, setT] = useState<string>();
  const [count, setCount] = useState(0);
  useEffect(() => {
    setT(getToken());
    const u = () => setCount(getCart().reduce((s, l) => s + l.qty, 0));
    u(); window.addEventListener("cart", u); return () => window.removeEventListener("cart", u);
  }, []);
  const notes = useNotifications(token);
  return (
    <nav className="nav">
      <Link href="/" className="logo">🛍️ Seller</Link>
      <span className="links">
        <Link href="/wishlist">♡</Link><Link href="/orders">Orders</Link>
        <Link href="/cart" className="cartb">🛒{count > 0 && <i>{count}</i>}</Link>
        {token ? <button onClick={() => { setToken(); location.href = "/"; }}>Logout</button> : <Link href="/login">Login</Link>}
      </span>
      {notes[0] && <div className="toast">🔔 <b>{notes[0].title}</b> {notes[0].body}</div>}
    </nav>);
}
