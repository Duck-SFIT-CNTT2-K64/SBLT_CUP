export const metadata = {
  title: "SBLT CUP API Documentation",
  description: "API documentation for SBLT CUP tournament management system",
};

export default function ApiDocsPage() {
  return (
    <div style={{ margin: 0, padding: 0 }}>
      <div id="swagger-ui" />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css"
      />
      <script
        src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"
        // @ts-expect-error Swagger UI global
        onLoad={() => {
          if (typeof window !== "undefined" && (window as any).SwaggerUIBundle) {
            (window as any).SwaggerUIBundle({
              url: "/api/openapi",
              dom_id: "#swagger-ui",
              presets: [(window as any).SwaggerUIBundle.presets.apis],
              layout: "BaseLayout",
            });
          }
        }}
      />
    </div>
  );
}
