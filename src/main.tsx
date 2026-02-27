
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import "./index.css";
import { ActiveTenantProvider } from "./lib/activeTenant";
import FloatingAtlas from "./components/FloatingAtlas";
import "./styles/globals.css";

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ActiveTenantProvider>
      <RouterProvider router={router} />
      <FloatingAtlas />
    </ActiveTenantProvider>
  </React.StrictMode>
);
