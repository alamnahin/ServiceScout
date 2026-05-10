import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";
import { ReactNode } from "react";

export default function ProtectedRoute({
  children,
  requireRole,
}: {
  children: ReactNode;
  requireRole?: AppRole;
}) {
  const { user, roles, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (requireRole && !roles.includes(requireRole)) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-muted-foreground">You need the <span className="font-semibold">{requireRole}</span> role to view this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}
