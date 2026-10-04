"use client";
import { useState } from "react";
export default function Img({src,alt,className="product-image"}:{src?:string;alt:string;className?:string}){const[bad,setBad]=useState(!src);if(bad)return <div className="image-placeholder">🛍️</div>;return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" className={className} onError={()=>setBad(true)}/>}
