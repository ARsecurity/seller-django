"use client";
import { useState } from "react";
export default function Img({ src, alt }: { src?: string; alt: string }) {
  const [bad, setBad] = useState(!src);
  if (bad) return <div className="ph">🛍️</div>;
  return <img src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" onError={() => setBad(true)} className="im" />;
}
