"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { setToken } from "@/lib/store";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [next, setNext] = useState(params.get("next") || "/");
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [e, setE] = useState("");

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setE("");

    try {
      const r = await api<{ token: string }>("auth/login/", {
        method: "POST",
        body: JSON.stringify({
          username: u,
          password: p,
        }),
      });

      setToken(r.token);
      router.replace(next);
    } catch (x) {
      setE(x instanceof Error ? x.message : "Login failed");
    }
  };

  return (
    <main className="page">
      <div className="shell" style={{ maxWidth: 500 }}>
        <div className="panel">
          <div style={{ textAlign: "center", fontSize: 40 }}>🛍️</div>

          <h1 style={{ textAlign: "center" }}>Welcome back</h1>

          <p className="muted" style={{ textAlign: "center" }}>
            Sign in to manage your cart and orders.
          </p>

          {e && <div className="error">{e}</div>}

          <form className="form-grid" onSubmit={submit}>
            <div className="field">
              <label>Username</label>
              <input
                autoComplete="username"
                value={u}
                onChange={(x) => setU(x.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={p}
                onChange={(x) => setP(x.target.value)}
                required
              />
            </div>

            <button className="primary-btn">Sign in</button>
          </form>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <a className="small" href="/forgot">
              Forgot password?
            </a>
          </div>

          <p className="small" style={{ textAlign: "center" }}>
            New here?{" "}
            <Link
              href="/register"
              style={{
                color: "var(--orange)",
                fontWeight: 800,
              }}
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<main className="page">Loading...</main>}>
      <LoginForm />
    </Suspense>
  );
}
