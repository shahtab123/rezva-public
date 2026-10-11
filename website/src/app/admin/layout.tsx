import "./admin.css";

export const metadata = {
  title: "Admin - Rezva",
  description: "Protocol administration control plane.",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
