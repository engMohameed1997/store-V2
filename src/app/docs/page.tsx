"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";
import "./swagger-light.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", background: "#fff", color: "#555" }}>
      Loading API docs...
    </div>
  ),
});

export default function DocsPage() {
  return (
    <div className="swagger-ui-wrapper">
      <SwaggerUI
        url="/api/v1/swagger.json"
        docExpansion="list"
        defaultModelsExpandDepth={-1}
        persistAuthorization={true}
        filter={true}
        tryItOutEnabled={true}
      />
    </div>
  );
}
