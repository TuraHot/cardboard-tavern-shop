import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * Guards admin-only routes. Non-admin visitors are redirected to the
 * read-only player view of the same tournament (or home if no id).
 */
export const AdminRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { isAdmin, loading } = useAuth();
  const { id } = useParams<{ id: string }>();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#06080d] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to={id ? `/tournament/${id}` : "/"} replace />;
  }

  return children;
};
