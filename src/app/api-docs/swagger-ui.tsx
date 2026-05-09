"use client";

import { useEffect } from "react";

interface SwaggerUIBundleFn {
  (options: Record<string, unknown>): void;
  presets: { apis: unknown };
}

export default function SwaggerUI() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
    script.onload = () => {
      const bundle = (window as unknown as Record<string, unknown>).SwaggerUIBundle as SwaggerUIBundleFn | undefined;
      if (bundle) {
        bundle({
          url: "/api/openapi",
          dom_id: "#swagger-ui",
          presets: [bundle.presets.apis],
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
