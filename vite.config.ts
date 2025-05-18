import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePluginFonts } from "vite-plugin-fonts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePluginFonts({
      google: {
        families: [
          {
            name: "Funnel Display",
            styles: "wght@400",
          },
        ],
      },
    }),
  ],
});
