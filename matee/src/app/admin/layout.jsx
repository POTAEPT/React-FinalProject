import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/admin/require-admin";

// Every page below also calls requireAdmin() itself: a layout does not re-run
// on client navigation between its pages, so it cannot be the only check.
export default async function AdminLayout({ children }) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col">
      <AdminNav />
      {children}
    </div>
  );
}
