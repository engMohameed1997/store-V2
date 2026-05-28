export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, minHeight: "100vh", background: "#fff", colorScheme: "light" }}>
      {children}
    </div>
  );
}
