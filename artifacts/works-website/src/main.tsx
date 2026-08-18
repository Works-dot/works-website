import { hydrateRoot, createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App";
import { routes } from "./routes.lazy";
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
