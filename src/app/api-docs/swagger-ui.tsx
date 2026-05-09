"use client";

import { useEffect } from "react";

export default function SwaggerUI() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      if ((window as any).SwaggerUIBundle) {
        (window as any).SwaggerUIBundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          presets: [(window as any).SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
      />
      <div id="swagger-ui" />
    </>
  );
}
