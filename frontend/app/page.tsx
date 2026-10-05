"use client";
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {api,Product} from "@/lib/api";
import ProductCard from "./ProductCard";
import Countdown from "./Countdown";

type Cat={id:number;name:string;slug:string};
type Tab={key:string;label:string;icon:string};
const TABS:Tab[]=[
  {key:"all",label:"All",icon:""},
  {key:"deals",label:"Deals",icon:"⚡"},
  {key:"rated",label:"5-Star Rated",icon:"★"},
  {key:"best",label:"Best-Selling",icon:"♛"},
];
const CAT_ICONS=["✦","♟","▣","⌂","◇","⚽","◉","▰"];

export default function Home(){
  const[items,setItems]=useState<Product[]>([]),[deals,setDeals]=useState<Product[]>([]),[cats,setCats]=useState<Cat[]>([]);
  const[q,setQ]=useState(""),[cat,setCat]=useState(""),[tab,setTab]=useState("all"),[page,setPage]=useState(1),[more,setMore]=useState(true),[busy,setBusy]=useState(false);
  const sentinel=useRef<HTMLDivElement>(null);

  useEffect(()=>{
    const initialQ=typeof window!=="undefined"?new URLSearchParams(window.location.search).get("q")||"":"";
    setQ(initialQ);
    api<{deals:Product[];trending:Product[]}>("home/").then(d=>{setDeals(d.deals||[]);if(!initialQ)setItems(d.trending||[])}).catch(()=>{});
    api<Cat[]>("categories/").then(setCats).catch(()=>{});
  },[]);

  const load=useCallback(async(pg:number)=>{
    setBusy(true);
    try{
      const ordering=tab==="rated"?"-rating_avg":tab==="best"?"-sold":"-sold";
      const dealsParam=tab==="deals"?"&deals=1":"";
      const d=await api<{results:Product[];next:string|null}>(`products/?page=${pg}&ordering=${ordering}&search=${encodeURIComponent(q)}${cat?`&category=${cat}`:""}${dealsParam}`);
      setItems(x=>pg===1?d.results:[...x,...d.results]);
      setMore(!!d.next);setPage(pg);
    }catch{setMore(false)}finally{setBusy(false)}
  },[q,cat,tab]);

  useEffect(()=>{const t=setTimeout(()=>load(1),180);return()=>clearTimeout(t)},[load]);
  useEffect(()=>{
    const el=sentinel.current;if(!el)return;
    const o=new IntersectionObserver(e=>{if(e[0].isIntersecting&&more&&!busy)load(page+1)},{rootMargin:"500px"});
    o.observe(el);return()=>o.disconnect();
  },[more,busy,page,load]);

  const dealEnd=useMemo(()=>deals.map(x=>x.deal_ends).find(Boolean),[deals]);
  const visibleCats=cats.slice(0,7);
  const heading=q?`Results for “${q}”`:cat?cats.find(c=>String(c.id)===cat)?.name||"Products":tab==="deals"?"Deals":"Recommended for you";

  return <main className="page"><div className="shell home-shell">
    <div className="category-tabs" aria-label="Categories">
      <button className={!cat?"active":""} onClick={()=>setCat("")}>All</button>
      {visibleCats.map((c,i)=><button key={c.id} className={cat===String(c.id)?"active":""} onClick={()=>setCat(String(c.id))}>
        <span>{CAT_ICONS[i%CAT_ICONS.length]}</span>{c.name}
      </button>)}
    </div>

    <section className="benefits-strip">
      <div><b>✓ Free local delivery</b><span>Limited-time offer</span></div>
      <i></i>
      <div><b>↩ Easy returns</b><span>Shop with confidence</span></div>
    </section>

    <section className="trust-banner">
      <div><span className="trust-shield">✓</span><strong>Why choose Seller?</strong></div>
      <a href="#why">Safe payments <span>›</span></a>
    </section>

    <section className="gift-section">
      <div className="section-head gift-head"><h2>Earn credits &amp; free gifts <span>›</span></h2></div>
      <div className="gift-row">
        <div className="gift-card gift-green"><strong>FREE</strong><span>your gifts</span></div>
        <div className="gift-card gift-lime"><strong>GIFTS</strong><span>Open now</span></div>
        <div className="gift-card gift-orange"><strong>SELLER</strong><span>Member rewards</span></div>
      </div>
    </section>

    {deals.length>0&&<section className="clearance-section">
      <div className="section-head clearance-head">
        <h2>↘ Clearance deals <span>›</span></h2>
        <span className="limited-label">Limited stock</span>
      </div>
      <div className="clearance-row">{deals.map(p=><ProductCard key={p.id} p={p}/>)}</div>
      {dealEnd&&<div className="clearance-timer"><span>Limited-time prices</span><Countdown end={dealEnd}/></div>}
    </section>}

    <section className="products-section" id="products">
      <div className="shop-tabs">
        {TABS.map(t=><button key={t.key} className={tab===t.key?"active":""} onClick={()=>setTab(t.key)}>{t.icon&&<span>{t.icon}</span>}{t.label}</button>)}
      </div>
      <div className="section-head product-heading"><h2>{heading}</h2><span className="muted small">{items.length} shown</span></div>
      <div className="product-grid">{items.map(p=><ProductCard key={p.id} p={p}/>)}</div>
      {!busy&&items.length===0&&<div className="empty" style={{marginTop:10}}><div style={{fontSize:38}}>🛍️</div><h3>No products found</h3><p>Try another search or category.</p></div>}
      <div ref={sentinel} className="loading">{busy?"Loading more products…":more?"Scroll for more":"You’ve reached the end"}</div>
    </section>

    <section className="why-section" id="why">
      <div className="why-title">Why shop with Seller?</div>
      <div className="why-grid">
        <div><b>✓</b><strong>Safe payments</strong><span>Pay securely by transfer or on delivery.</span></div>
        <div><b>⌁</b><strong>Local delivery</strong><span>Focused on Talata Mafara and nearby areas.</span></div>
        <div><b>↩</b><strong>Helpful support</strong><span>We handle sourcing and delivery for you.</span></div>
      </div>
    </section>
  </div></main>;
}
