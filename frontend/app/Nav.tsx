"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart, getToken, setToken } from "@/lib/store";

export default function Nav(){
  const path=usePathname();
  const [token,setT]=useState<string>();
  const [count,setCount]=useState(0);

  useEffect(()=>{
    setT(getToken());
    const update=()=>setCount(getCart().reduce((s,x)=>s+x.qty,0));
    update();
    window.addEventListener("cart",update);
    return()=>window.removeEventListener("cart",update);
  },[]);

  const logout=()=>{setToken();location.href="/"};
  const active=(p:string)=>path===p||path.startsWith(p+"/");

  return <>
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand" aria-label="Seller home">
          <span className="brand-mark">S</span>
          <span>Seller</span>
        </Link>

        <form className="desktop-search" action="/" method="get">
          <input name="q" placeholder="Search for products" aria-label="Search products" />
          <button aria-label="Search">⌕</button>
        </form>

        <div className="top-actions">
          <Link href="/orders" className="top-action"><span className="top-action-icon">♡</span><span>Orders</span></Link>
          <Link href="/cart" className="top-action cart-action"><span className="top-action-icon">🛒</span><span>Cart</span>{count>0&&<b className="badge-count">{count}</b>}</Link>
          {token?<button className="top-action" onClick={logout}>Logout</button>:<Link href="/login" className="top-action">Login</Link>}
        </div>
      </div>
    </header>

    <div className="mobile-search">
      <div className="shell">
        <form className="mobile-search-box" action="/" method="get">
          <input name="q" placeholder="Search for products" aria-label="Search products" />
          <button type="submit" aria-label="Search">⌕</button>
        </form>
      </div>
    </div>

    <nav className="bottom-nav" aria-label="Mobile navigation">
      <Link className={`bottom-link ${path==="/"?"active":""}`} href="/">
        <span className="bottom-icon">⌂</span><span>Home</span>
      </Link>
      <Link className={`bottom-link ${active("/wishlist")?"active":""}`} href="/wishlist">
        <span className="bottom-icon">♡</span><span>Categories</span>
      </Link>
      <Link className={`bottom-link ${active("/account")?"active":""}`} href="/account">
        <span className="bottom-icon">♙</span><span>You</span>
      </Link>
      <Link className={`bottom-link ${active("/cart")?"active":""}`} href="/cart">
        <span className="bottom-icon">🛒</span>{count>0&&<b className="bottom-count">{count}</b>}<span>Cart</span>
      </Link>
    </nav>
  </>;
}
