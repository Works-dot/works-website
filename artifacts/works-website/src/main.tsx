import { hydrateRoot, createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { routes } from "./routes.lazy";
// Mulish betűtípus saját szerverről (nincs Google Fonts kapcsolat).
import "@fontsource/mulish/400.css";
import "@fontsource/mulish/400-italic.css";
import "@fontsource/mulish/500.css";
import "@fontsource/mulish/600.css";
import "@fontsource/mulish/700.css";
import "./index.css";

const rootEl = document.getElementById("root")!;
const app = (
  <HelmetProvider>
    <App routes={routes} />
  </HelmetProvider>
);

if (rootEl.children.length > 0) {
  hydrateRoot(rootEl, app);
} else {
  createRoot(rootEl).render(app);
}
