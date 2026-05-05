import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminGuard from "@/components/admin/AdminGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-[calc(100vh-64px)]">
        <AdminSidebar />
        <main className="flex-1 overflow-x-auto">{children}</main>
      </div>
    </AdminGuard>
  );
}
