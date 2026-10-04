"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart, getToken, setToken } from "@/lib/store";

export default function Nav(){
  const path=usePathname(); const [token,setT]=useState<string>(); const [count,setCount]=useState(0);
  useEffect(()=>{setT(getToken()); const update=()=>setCount(getCart().reduce((s,x)=>s+x.qty,0)); update(); window.addEventListener("cart",update); return()=>window.removeEventListener("cart",update)},[]);
  const logout=()=>{setToken();location.href="/"};
  const active=(p:string)=>path===p||path.startsWith(p+"/");
  return <>
    <header className="topbar"><div className="shell topbar-inner">
      <Link href="/" className="brand"><span className="brand-mark">🛍</span>Seller</Link>
      <form className="desktop-search" action="/" method="get"><input name="q" placeholder="Search products in Zamfara"/><button>⌕</button></form>
      <div className="top-actions">
        <Link href="/orders" className="top-action">♡ <span>Orders</span></Link>
        <Link href="/cart" className="top-action">🛒 <span>Cart</span>{count>0&&<b className="badge-count">{count}</b>}</Link>
        {token?<button className="top-action" onClick={logout}>Logout</button>:<Link href="/login" className="top-action">Login</Link>}
      </div>
    </div></header>
    <div className="mobile-search"><div className="shell"><form className="mobile-search-box" action="/" method="get"><input name="q" placeholder="Search products in Zamfara"/><button>⌕</button></form></div></div>
    <nav className="bottom-nav">
      <Link className={`bottom-link ${path==="/"?"active":""}`} href="/"><span className="bottom-icon">⌂</span>Home</Link>
      <Link className={`bottom-link ${active("/wishlist")?"active":""}`} href="/wishlist"><span className="bottom-icon">♡</span>Wishlist</Link>
      <Link className={`bottom-link ${active("/orders")?"active":""}`} href="/orders"><span className="bottom-icon">▤</span>Orders</Link>
      <Link className={`bottom-link ${active("/cart")?"active":""}`} href="/cart"><span className="bottom-icon">🛒</span>{count>0&&<b className="bottom-count">{count}</b>}Cart</Link>
    </nav>
  </>;
}
