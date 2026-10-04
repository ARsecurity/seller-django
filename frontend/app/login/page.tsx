"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/store";

export default function Login() {
  const [reg, setReg] = useState(false);
  const [f, setF] = useState({ username: "", password: "", email: "" });
  const [err, setErr] = useState("");
  async function go() {
    try {
      const r = await api<{ token: string }>(reg ? "auth/register/" : "auth/login/", { method: "POST", body: JSON.stringify(f) });
      setToken(r.token); location.href = "/";
    } catch { setErr("Failed. Check your details (password min 8 characters, username must be unique)."); }
  }
  return (
    <main style={{ maxWidth: 400 }}>
      <h2>{reg ? "Create account" : "Login"}</h2>
      <input placeholder="Username" onChange={(e) => setF({ ...f, username: e.target.value })} />
      {reg && <input type="email" placeholder="Email (for password reset)" onChange={(e) => setF({ ...f, email: e.target.value })} />}
      <input type="password" placeholder="Password" onChange={(e) => setF({ ...f, password: e.target.value })} />
      <button onClick={go}>{reg ? "Sign up" : "Login"}</button>
      <p style={{ color: "crimson" }}>{err}</p>
      <p><a href="#" onClick={(e) => { e.preventDefault(); setReg(!reg); }}>{reg ? "Have an account? Login" : "New here? Create account"}</a>
        {!reg && <> · <a href="/forgot">Forgot password?</a></>}</p>
    </main>
  );
}
