"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Address, api, naira } from "@/lib/api";
import { CartLine, getCart, getToken, saveCart } from "@/lib/store";

type Lga = {
  id: number;
  name: string;
  delivery_fee: number;
};

type Pay = {
  bank: string;
  number: string;
  name: string;
};

type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

function asList<T>(value: T[] | Paginated<T>): T[] {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.results)) return value.results;
  return [];
}

export default function Checkout() {
  const router = useRouter();

  const [token, setTokenState] = useState<string>();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [lgas, setLgas] = useState<Lga[]>([]);
  const [pays, setPays] = useState<Pay[]>([]);
  const [selected, setSelected] = useState<number>();
  const [method, setMethod] = useState("cod");
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    state: "Zamfara",
    city: "Talata Mafara",
    lga: "",
  });

  useEffect(() => {
    const t = getToken();

    setTokenState(t);
    setCart(getCart());

    if (!t) {
      router.replace("/login?next=/checkout");
      return;
    }

    Promise.all([
      api<Address[] | Paginated<Address>>("addresses/", {}, t),
      api<Lga[] | Paginated<Lga>>("lgas/"),
      api<{ accounts: Pay[] }>("payment-info/"),
    ])
      .then(([addressResponse, lgaResponse, paymentResponse]) => {
        const addressList = asList(addressResponse);
        const lgaList = asList(lgaResponse);

        setAddresses(addressList);
        setLgas(lgaList);
        setPays(paymentResponse.accounts || []);

        const defaultAddress =
          addressList.find((x) => x.is_default)?.id ||
          addressList[0]?.id;

        setSelected(defaultAddress);

        const talataLga =
          lgaList.find((x) =>
            x.name.toLowerCase().includes("talata")
          )?.id ||
          lgaList[0]?.id ||
          "";

        setForm((f) => ({
          ...f,
          lga: String(talataLga),
        }));
      })
      .catch((e) => {
        setError(
          e instanceof Error
            ? e.message
            : "Could not load checkout information."
        );
      });
  }, [router]);

  const selectedAddress = addresses.find(
    (x) => x.id === selected
  );

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0
  );

  const fee = selectedAddress
    ? Number(
        lgas.find((x) => x.id === selectedAddress.lga)?.delivery_fee || 0
      )
    : 0;

  const total = Math.max(0, subtotal + fee);

  const saveAddress = async () => {
    if (!token) return;

    setError("");

    if (!form.first_name.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!form.last_name.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.address.trim()) {
      setError("Please enter your delivery address.");
      return;
    }

    if (!form.lga) {
      setError("Please select your LGA.");
      return;
    }

    try {
      setBusy(true);

      const address = await api<Address>(
        "addresses/",
        {
          method: "POST",
          body: JSON.stringify({
            ...form,
            lga: Number(form.lga),
            is_default: addresses.length === 0,
          }),
        },
        token
      );

      setAddresses((current) => [...current, address]);
      setSelected(address.id);
      setShowForm(false);

      setForm((current) => ({
        ...current,
        first_name: "",
        last_name: "",
        phone: "",
        address: "",
      }));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save address."
      );
    } finally {
      setBusy(false);
    }
  };

  const place = async () => {
    if (!token) {
      setError("Please log in before placing your order.");
      return;
    }

    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const order = await api<{ ref: string }>(
        "orders/",
        {
          method: "POST",
          body: JSON.stringify({
            lga: selectedAddress.lga,
            address: selectedAddress.address,
            phone: selectedAddress.phone,
            method,
            items_in: cart.map((item) => ({
              product: item.id,
              qty: item.qty,
            })),
          }),
        },
        token
      );

      saveCart([]);
      router.replace(`/orders?new=${order.ref}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Checkout failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!token) return null;

  return (
    <main className="page">
      <div className="shell">
        <div className="section-head">
          <h1 style={{ fontSize: 25, margin: 0 }}>
            Checkout
          </h1>

          <span className="muted small">
            🔒 Secure order
          </span>
        </div>

        {error && (
          <div
            className="error"
            style={{ marginBottom: 10 }}
          >
            {error}
          </div>
        )}

        <div className="checkout-layout">
          <div>
            <section className="panel">
              <div className="section-head">
                <h2>Delivery address</h2>

                <button
                  className="secondary-btn"
                  onClick={() => setShowForm(!showForm)}
                  disabled={busy}
                >
                  + Add new
                </button>
              </div>

              {showForm && (
                <div
                  className="form-grid"
                  style={{ marginBottom: 12 }}
                >
                  <div
                    className="form-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                    }}
                  >
                    <div className="field">
                      <label>First name</label>

                      <input
                        value={form.first_name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            first_name: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label>Last name</label>

                      <input
                        value={form.last_name}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            last_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Phone</label>

                    <input
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+234…"
                    />
                  </div>

                  <div className="field">
                    <label>Delivery address</label>

                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: e.target.value,
                        })
                      }
                      placeholder="Street, landmark and other details"
                    />
                  </div>

                  <div
                    className="form-grid"
                    style={{
                      gridTemplateColumns: "1fr 1fr",
                    }}
                  >
                    <div className="field">
                      <label>City</label>

                      <input
                        value={form.city}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="field">
                      <label>LGA</label>

                      <select
                        value={form.lga}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            lga: e.target.value,
                          })
                        }
                      >
                        <option value="">
                          Select LGA
                        </option>

                        {lgas.map((lga) => (
                          <option
                            key={lga.id}
                            value={lga.id}
                          >
                            {lga.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    className="primary-btn"
                    onClick={saveAddress}
                    disabled={busy}
                  >
                    {busy ? "Saving…" : "Save and use"}
                  </button>
                </div>
              )}

              {addresses.length === 0 && !showForm && (
                <div className="empty">
                  <p>No delivery address yet.</p>

                  <button
                    className="primary-btn"
                    onClick={() => setShowForm(true)}
                  >
                    Add an address
                  </button>
                </div>
              )}

              {addresses.map((address) => (
                <button
                  key={address.id}
                  className={`address-card ${
                    selected === address.id
                      ? "selected"
                      : ""
                  }`}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    marginBottom: 8,
                  }}
                  onClick={() =>
                    setSelected(address.id)
                  }
                >
                  <span className="radio" />

                  <span style={{ flex: 1 }}>
                    <b>
                      {address.first_name}{" "}
                      {address.last_name}
                    </b>{" "}
                    <span className="muted">
                      {address.phone}
                    </span>

                    <br />

                    <span className="small">
                      {address.address}
                    </span>

                    <br />

                    <span className="small">
                      {address.city}, {address.state}
                    </span>
                  </span>

                  {address.is_default && (
                    <span
                      className="small"
                      style={{
                        color: "var(--orange)",
                        fontWeight: 800,
                      }}
                    >
                      Default
                    </span>
                  )}
                </button>
              ))}
            </section>

            <section className="panel">
              <h2>Payment method</h2>

              <button
                className={`payment-option ${
                  method === "cod" ? "selected" : ""
                }`}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: 0,
                  textAlign: "left",
                }}
                onClick={() => setMethod("cod")}
              >
                <span className="payment-logo">₦</span>

                <span className="pay-copy">
                  <strong>Pay on delivery</strong>
                  <span>
                    Pay when your order arrives.
                  </span>
                </span>

                <span className="checkmark" />
              </button>

              <button
                className={`payment-option ${
                  method === "transfer"
                    ? "selected"
                    : ""
                }`}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: 0,
                  textAlign: "left",
                }}
                onClick={() =>
                  setMethod("transfer")
                }
              >
                <span className="payment-logo">
                  🏦
                </span>

                <span className="pay-copy">
                  <strong>Bank transfer</strong>
                  <span>
                    Transfer after placing the
                    order; admin confirms your proof.
                  </span>
                </span>

                <span className="checkmark" />
              </button>

              {method === "transfer" && (
                <div
                  className="success"
                  style={{ marginTop: 10 }}
                >
                  {pays.length ? (
                    <>
                      <b>Transfer details</b>

                      {pays.map((payment) => (
                        <div
                          key={payment.bank}
                          style={{ marginTop: 7 }}
                        >
                          {payment.bank}:{" "}
                          {payment.number} ·{" "}
                          {payment.name}
                        </div>
                      ))}
                    </>
                  ) : (
                    "Bank transfer details will be provided after your order is created."
                  )}
                </div>
              )}
            </section>

            <section className="panel">
              <h2>
                Items ({cart.length})
              </h2>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="summary-row"
                >
                  <span>
                    {item.name} × {item.qty}
                  </span>

                  <b>
                    {naira(
                      Number(item.price) *
                        item.qty
                    )}
                  </b>
                </div>
              ))}
            </section>
          </div>

          <aside className="panel summary">
            <h2 style={{ marginTop: 0 }}>
              Order total
            </h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <b>{naira(subtotal)}</b>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <b>{naira(fee)}</b>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <b>{naira(total)}</b>
            </div>

            <button
              className="primary-btn"
              disabled={
                !selectedAddress ||
                busy ||
                !cart.length
              }
              onClick={place}
            >
              {busy
                ? "Placing order…"
                : `Place order · ${naira(total)}`}
            </button>

            <p className="muted small">
              Your delivery address is used only
              to fulfill this order.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
