import { getViteConfig } from "astro/config";
import { defineConfig } from "vitest/config";

export default defineConfig(
  getViteConfig({
    test: {
      include: ["tests/**/*.test.ts"],
      environment: "node",
    },
  }),
);
