import Nav from "./Nav";
export const metadata = { title: "Seller", description: "Shop local across Zamfara State. Pay on delivery or by transfer." };
const css = `*{box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;margin:0;background:#f5f5f7;color:#111}
main{max-width:1200px;margin:0 auto;padding:12px}a{color:inherit;text-decoration:none}
.nav{position:sticky;top:0;z-index:20;display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;padding:10px 16px;background:linear-gradient(90deg,#fb5a1f,#ff8a00);color:#fff;box-shadow:0 2px 10px #0002}
.logo{font-weight:800;font-size:22px}.logo span{color:#fff3b0}.links{display:flex;gap:14px;align-items:center}.cartb{position:relative;font-size:20px}
.cartb i{position:absolute;top:-8px;right:-12px;background:#111;color:#fff;font-size:11px;border-radius:10px;padding:1px 6px;font-style:normal}
.toast{width:100%;background:#fff;color:#111;padding:8px 12px;border-radius:8px;animation:in .3s}@keyframes in{from{transform:translateY(-8px);opacity:0}}
input,select,textarea{font:inherit;padding:11px;margin:4px 0;width:100%;border:1px solid #ddd;border-radius:10px;background:#fff}
button{font:inherit;cursor:pointer;background:#fb5a1f;color:#fff;border:0;border-radius:999px;padding:9px 16px;transition:.15s}button:hover{filter:brightness(1.08);transform:translateY(-1px)}button:disabled{background:#bbb;cursor:not-allowed}
.nav button{background:#0003}.card{border-radius:14px;padding:14px;background:#fff;margin:8px 0;box-shadow:0 1px 4px #0001}
.hero{border-radius:18px;color:#fff;padding:36px 24px;min-height:150px;transition:background .6s;display:flex;flex-direction:column;justify-content:center}.hero h2{margin:0;font-size:28px}
.chips{display:flex;gap:8px;overflow-x:auto;padding:10px 0}.chip{white-space:nowrap;background:#fff;color:#111;border:1px solid #ddd;padding:7px 14px}.chip.on{background:#111;color:#fff}
.deals{background:linear-gradient(90deg,#ff3d3d,#ff7a00);border-radius:16px;padding:12px;color:#fff;margin:8px 0}.row{display:flex;gap:10px;overflow-x:auto;padding:6px 0}.row .pc{min-width:150px;width:150px}
.cd{background:#111;color:#fff;border-radius:6px;padding:2px 8px;font-variant-numeric:tabular-nums;margin-left:8px}
.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(165px,1fr))}
.pc{background:#fff;border-radius:14px;overflow:hidden;color:#111;display:block;box-shadow:0 1px 4px #0001;transition:.2s}.pc:hover{transform:translateY(-3px);box-shadow:0 8px 20px #0002}
.pimg{position:relative}.im,.ph{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}.ph{display:flex;align-items:center;justify-content:center;font-size:40px;background:#eee}
.badge{position:absolute;top:8px;left:8px;background:#ff2d55;color:#fff;border-radius:6px;padding:2px 7px;font-size:12px;font-weight:700}
.heart{position:absolute;top:6px;right:6px;background:#fff;padding:4px 7px;border-radius:50%}.pbody{padding:8px}.pname{font-size:13px;height:34px;overflow:hidden}
.pprice{color:#fb5a1f;font-size:17px}.old{color:#999;font-size:12px;margin-left:6px}.meta{font-size:11px;color:#777;margin:3px 0}.add{width:100%;font-size:13px}
.tabs{display:flex;gap:6px;margin:6px 0}.tab{background:#fff;color:#555;border:1px solid #ddd;border-radius:8px;padding:6px 12px}.tab.on{background:#fb5a1f;color:#fff}
.gal{display:flex;gap:6px;margin-top:6px;overflow-x:auto}.gal img,.gal .ph{width:64px;height:64px;border-radius:8px;cursor:pointer;object-fit:cover}
@media(min-width:800px){.pdp{display:grid;grid-template-columns:1fr 1fr;gap:24px}}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1" /><style>{css}</style></head>
    <body><Nav />{children}</body></html>);
}
