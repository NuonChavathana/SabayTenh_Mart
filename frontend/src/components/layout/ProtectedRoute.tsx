import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to role-appropriate home
    const fallback = user.role === "cashier" ? "/admin/pos" : user.role === "staff" ? "/admin/orders" : "/";
    return <Redirect to={fallback} />;
  }

  return <>{children}</>;
}
