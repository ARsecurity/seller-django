"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function Reset() {
  const [pw, setPw] = useState(""); const [m, setM] = useState("");
  async function save() {
    const q = new URLSearchParams(location.search);
    try { setM((await api<{ detail: string }>("auth/password-reset/confirm/", { method: "POST",
      body: JSON.stringify({ uid: q.get("uid"), token: q.get("token"), password: pw }) })).detail); }
    catch { setM("Invalid or expired link, or password too short (min 8)."); }
  }
  return <main style={{ maxWidth: 400 }}><h2>New password</h2>
    <input type="password" placeholder="New password" onChange={(e) => setPw(e.target.value)} /><button onClick={save}>Save</button><p>{m}</p>
    <a href="/login">Go to login</a></main>;
}
