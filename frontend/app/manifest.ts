import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Seller", short_name: "Seller", start_url: "/", display: "standalone", background_color: "#ffffff", theme_color: "#fb5a1f" };
}
