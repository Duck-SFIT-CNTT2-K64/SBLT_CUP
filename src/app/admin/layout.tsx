import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-4rem)]">
        <AdminSidebar />
        <main className="flex-1 bg-black overflow-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
