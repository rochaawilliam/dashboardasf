import { Navigate } from "react-router-dom";

// Admin page now redirects to the profile page with admin tab
export default function Admin() {
  return <Navigate to="/profile?tab=admin" replace />;
}
