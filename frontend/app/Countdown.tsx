"use client";
import {useEffect,useState} from "react";
export default function Countdown({end}:{end:string}){const[s,setS]=useState(0);useEffect(()=>{const tick=()=>setS(Math.max(0,Math.floor((new Date(end).getTime()-Date.now())/1000)));tick();const i=setInterval(tick,1000);return()=>clearInterval(i)},[end]);const p=(n:number)=>String(n).padStart(2,"0");return <span className="timer">{p(Math.floor(s/3600))}:{p(Math.floor(s%3600/60))}:{p(s%60)}</span>}
