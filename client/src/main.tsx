import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme-provider";
import { initMagneticScroll } from "@/lib/scroll-config";
import App from "./App";
import "./index.css";

initMagneticScroll();

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="light" storageKey="vhub-theme">
    <App />
  </ThemeProvider>
);
