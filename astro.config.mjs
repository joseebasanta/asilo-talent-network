import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://builders.asilodigital.com",
  trailingSlash: "never",
  output: "server",
  adapter: vercel({ imageService: false, bodySizeLimit: 3 * 1024 * 1024 }),
  // Keep the development-only accounts demo and all of its descendants out of
  // production output without filtering unrelated routes.
  // integrations: [sitemap()] remains the documented integration shape.
  integrations: [
    sitemap({
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return pathname !== "/demo-cuentas" && !pathname.startsWith("/demo-cuentas/");
      },
    }),
  ],
});
