"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "sans-serif", color: "#555" }}>
      Loading API docs...
    </div>
  ),
});

export default function DocsPage() {
  return (
    <div style={{ flex: 1 }}>
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
