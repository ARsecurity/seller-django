"use client";
import {useEffect,useState} from "react";
import {api,Product} from "@/lib/api";
import ProductCard from "../ProductCard";
import {getToken} from "@/lib/store";
export default function Wishlist(){const[items,setItems]=useState<Product[]>([]);const[error,setError]=useState("");useEffect(()=>{const t=getToken();if(!t){location.href="/login?next=/wishlist";return}api<Product[]>("wishlist/",{},t).then(setItems).catch(e=>setError(e.message))},[]);return <main className="page"><div className="shell"><div className="section-head"><h1 style={{fontSize:25,margin:0}}>Wishlist</h1></div>{error&&<div className="error">{error}</div>}{!error&&!items.length?<div className="empty"><div style={{fontSize:45}}>♡</div><h2>Nothing saved yet</h2><p>Tap the heart on a product to save it.</p><a href="/">Explore products →</a></div>:<div className="product-grid">{items.map(p=><ProductCard key={p.id} p={p}/>)}</div>}</div></main>}
