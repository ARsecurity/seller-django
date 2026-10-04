"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {api,Product} from "@/lib/api";
import ProductCard from "./ProductCard";
import Countdown from "./Countdown";

type Cat={id:number;name:string;slug:string};
const SORTS:[string,string][]=[["-sold","🔥 Popular"],["-created","🆕 New"],["price","💰 Price low"],["-rating_avg","⭐ Top rated"]];
const CAT_ICONS=["✨","👗","📱","🏠","💎","⚽","🎧","👜"];

export default function Home(){
 const[items,setItems]=useState<Product[]>([]),[deals,setDeals]=useState<Product[]>([]),[cats,setCats]=useState<Cat[]>([]);
 const[q,setQ]=useState(""),[cat,setCat]=useState(""),[sort,setSort]=useState("-sold"),[page,setPage]=useState(1),[more,setMore]=useState(true),[busy,setBusy]=useState(false);const sentinel=useRef<HTMLDivElement>(null);
 useEffect(()=>{const initialQ=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("q")||"" : "";setQ(initialQ);api<{deals:Product[];trending:Product[]}>("home/").then(d=>{setDeals(d.deals);if(!initialQ)setItems(d.trending)}).catch(()=>{});api<Cat[]>("categories/").then(setCats).catch(()=>{})},[]);
 const load=useCallback(async(pg:number)=>{setBusy(true);try{const d=await api<{results:Product[];next:string|null}>(`products/?page=${pg}&ordering=${sort}&search=${encodeURIComponent(q)}${cat?`&category=${cat}`:""}`);setItems(x=>pg===1?d.results:[...x,...d.results]);setMore(!!d.next);setPage(pg)}catch{setMore(false)}finally{setBusy(false)}},[q,cat,sort]);
 useEffect(()=>{const t=setTimeout(()=>load(1),220);return()=>clearTimeout(t)},[load]);
 useEffect(()=>{const el=sentinel.current;if(!el)return;const o=new IntersectionObserver(e=>{if(e[0].isIntersecting&&more&&!busy)load(page+1)},{rootMargin:"500px"});o.observe(el);return()=>o.disconnect()},[more,busy,page,load]);
 const dealEnd=useMemo(()=>deals.map(x=>x.deal_ends).find(Boolean),[deals]);
 return <main className="page"><div className="shell">
  <div className="promo-strip"><span>✓ Free local delivery</span><span>✓ Secure checkout</span><span>✓ Pay on delivery</span><span>✓ Zamfara focused</span></div>
  <section className="hero"><div className="hero-copy"><div className="hero-kicker">Seller Marketplace</div><h1>Shop smart.<br/>Buy local.</h1><p>Discover useful products and get them delivered around Talata Mafara.</p><a className="hero-btn" href="#products">Shop now →</a></div><div className="hero-art"/></section>
  <section className="section"><div className="section-head"><h2>Shop by category</h2><span className="muted small">View all →</span></div><div className="category-row">{cats.map((c,i)=><button key={c.id} className={`category-tile ${cat===String(c.id)?"active":""}`} onClick={()=>setCat(String(c.id))}><span className="category-icon">{CAT_ICONS[i%CAT_ICONS.length]}</span>{c.name}</button>)}</div></section>
  {deals.length>0&&<section className="section"><div className="deal-wrap"><div className="deal-title"><strong>⚡ Flash deals</strong>{dealEnd&&<Countdown end={dealEnd}/>}</div><div className="deal-row">{deals.map(p=><ProductCard key={p.id} p={p}/>)}</div></div></section>}
  <section className="section" id="products"><div className="section-head"><h2>{q?`Results for “${q}”`:cat?cats.find(c=>String(c.id)===cat)?.name||"Products":"Popular products"}</h2><span className="muted small">{items.length} shown</span></div>
   <div className="sort-row">{SORTS.map(([k,l])=><button key={k} className={`sort-pill ${sort===k?"active":""}`} onClick={()=>setSort(k)}>{l}</button>)}</div>
   <div className="product-grid" style={{marginTop:10}}>{items.map(p=><ProductCard key={p.id} p={p}/>)}</div>
   {!busy&&items.length===0&&<div className="empty" style={{marginTop:10}}><div style={{fontSize:38}}>🛍️</div><h3>No products found</h3><p>Try another search or category.</p></div>}
   <div ref={sentinel} className="loading">{busy?"Loading more products…":more?"Scroll for more":"You’ve reached the end"}</div>
  </section>
 </div></main>
}
