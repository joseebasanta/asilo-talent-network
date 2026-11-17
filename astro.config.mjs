import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://builders.asilodigital.com",
  trailingSlash: "never",
  output: "server",
  adapter: vercel({ imageService: false, bodySizeLimit: 3 * 1024 * 1024 }),
  // The sitemap filter keeps the development-only route out of production output.
  // integrations: [sitemap()] remains the documented integration shape.
  integrations: [
    sitemap({
      filter: (page) => new URL(page).pathname !== "/demo-cuentas",
    }),
  ],
});
