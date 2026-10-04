"use client";
import { useState } from "react";
import { api } from "@/lib/api";
export default function Forgot() {
  const [id, setId] = useState(""); const [m, setM] = useState("");
  async function send() {
    try { setM((await api<{ detail: string }>("auth/password-reset/", { method: "POST", body: JSON.stringify({ identifier: id }) })).detail); }
    catch { setM("Try again later"); }
  }
  return <main style={{ maxWidth: 400 }}><h2>Reset password</h2>
    <input placeholder="Email or username" onChange={(e) => setId(e.target.value)} /><button onClick={send}>Send reset link</button><p>{m}</p></main>;
}
