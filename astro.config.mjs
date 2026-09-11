import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://builders.asilodigital.com",
  trailingSlash: "never",
  output: "server",
  adapter: vercel({ imageService: false, bodySizeLimit: 3 * 1024 * 1024 }),
  integrations: [sitemap()],
});
