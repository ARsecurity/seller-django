import "./globals.css";
import Nav from "./Nav";
export const metadata = { title: "Seller — Shop Local in Zamfara", description: "A fast local marketplace for Zamfara. Pay on delivery or by bank transfer." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><Nav />{children}</body></html>;
}
