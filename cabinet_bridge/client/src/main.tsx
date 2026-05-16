import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n";

if (!window.location.hash) { window.location.hash = "#/"; }

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
