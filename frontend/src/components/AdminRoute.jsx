import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
    const { user, loading } = useAuth();
    const location = useLocation();

    /*
     * Wait until AuthContext has finished
     * determining the logged-in user.
     */
    if (loading) {
        return (
            <div className="content-card">
                <div className="loading-state">
                    Loading...
                </div>
            </div>
        );
    }

    /*
     * Not logged in.
     */
    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location,
                }}
            />
        );
    }

    /*
     * Logged in but not an administrator.
     */
    if (user.role !== "admin") {
        return (
            <Navigate
                to="/"
                replace
            />
        );
    }

    /*
     * Administrator.
     */
    return <Outlet />;
}