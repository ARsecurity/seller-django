"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CartLine, getCart, saveCart, getToken } from "@/lib/store";
type LGA = { id: number; name: string; delivery_fee: string };
type Acct = { bank: string; number: string; name: string };

export default function Cart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [lgas, setLgas] = useState<LGA[]>([]);
  const [f, setF] = useState({ lga: "", address: "", phone: "", method: "cod", coupon: "" });
  const [ref, setRef] = useState("");
  const [accts, setAccts] = useState<Acct[]>([]);
  const [proof, setProof] = useState({ bank: "opay", sender_name: "", transaction_ref: "" });
  const [msg, setMsg] = useState("");
  useEffect(() => { setCart(getCart()); api<LGA[]>("lgas/").then(setLgas).catch(() => {}); }, []);
  const update = (c: CartLine[]) => { setCart(c); saveCart(c); };
  const fee = Number(lgas.find((l) => String(l.id) === f.lga)?.delivery_fee ?? 0);
  const sub = cart.reduce((s, l) => s + l.price * l.qty, 0);
  async function place() {
    const t = getToken(); if (!t) { location.href = "/login"; return; }
    try {
      const o = await api<{ ref: string }>("orders/", { method: "POST",
        body: JSON.stringify({ ...f, lga: Number(f.lga), items_in: cart.map((l) => ({ product: l.id, qty: l.qty })) }) }, t);
      update([]); setRef(o.ref); setMsg("");
      if (f.method === "transfer") setAccts((await api<{ accounts: Acct[] }>("payment-info/")).accounts);
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not place order"); }
  }
  async function sendProof() {
    try { await api(`orders/${ref}/proof/`, { method: "POST", body: JSON.stringify(proof) }, getToken());
      setMsg("Proof sent. We will confirm your payment shortly."); } catch { setMsg("Could not send proof"); }
  }
  if (ref) return (
    <main><h2>Order {ref} placed ✅</h2>
      {f.method === "cod" ? <p>Pay the rider in cash when your order arrives.</p> : (<>
        <p>Transfer the total to one of these accounts, then enter your transfer details:</p>
        {accts.length === 0 && <p>Payment details are being set up. Please contact the shop.</p>}
        {accts.map((a) => <div key={a.bank} className="card"><b>{a.bank}</b>: {a.number} ({a.name})</div>)}
        <select value={proof.bank} onChange={(e) => setProof({ ...proof, bank: e.target.value })}>
          <option value="opay">OPay</option><option value="moniepoint">Moniepoint</option>
          <option value="palmpay">PalmPay</option><option value="other">Other bank</option></select>
        <input placeholder="Sender account name" onChange={(e) => setProof({ ...proof, sender_name: e.target.value })} />
        <input placeholder="Transaction reference" onChange={(e) => setProof({ ...proof, transaction_ref: e.target.value })} />
        <button onClick={sendProof}>I have paid</button></>)}
      <p>{msg}</p><a href="/orders">Track my orders</a></main>);
  return (
    <main><h2>Your cart</h2>
      {cart.length === 0 && <p>Cart is empty.</p>}
      {cart.map((l) => (<div key={l.id} className="card">{l.name} — ₦{l.price.toLocaleString()} × {l.qty}{" "}
        <button onClick={() => update(cart.filter((x) => x.id !== l.id))}>Remove</button></div>))}
      {cart.length > 0 && (<>
        <select value={f.lga} onChange={(e) => setF({ ...f, lga: e.target.value })}>
          <option value="">Select your Local Government</option>
          {lgas.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
        <input placeholder="Delivery address / landmark" onChange={(e) => setF({ ...f, address: e.target.value })} />
        <input placeholder="Phone number" onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
          <option value="cod">Pay on delivery</option><option value="transfer">Bank transfer (OPay / Moniepoint / PalmPay)</option></select>
        <input placeholder="Coupon code (optional)" onChange={(e) => setF({ ...f, coupon: e.target.value })} />
        <p>Subtotal ₦{sub.toLocaleString()} + delivery ₦{fee.toLocaleString()} = <b>₦{(sub + fee).toLocaleString()}</b> (coupon discount applied at checkout)</p>
        <button disabled={!f.lga || !f.address || !f.phone} onClick={place}>Place order</button><p style={{ color: "crimson" }}>{msg}</p></>)}
    </main>);
}
