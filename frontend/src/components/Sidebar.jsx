import { AdminIcon, HomeIcon, LogOutIcon, PlusIcon, ReportsIcon, UsersIcon, } from "./Icons";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { confirmAction, toastSuccess } from "../utils/alert";

function Item({ to, end, icon, children }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                "sidebar-link" + (isActive ? " active" : "")
            }
        >
            {icon}
            <span>{children}</span>
        </NavLink>
    );
}

export default function Sidebar() {
    const { user, logout } = useAuth();

    const role = user?.role || "analyst";
    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

    async function handleLogout() {
        const ok = await confirmAction({
            title: "Log out?",
            text: "You will need to sign in again to continue.",
            confirmText: "Yes, log out",
            cancelText: "Stay signed in",
            icon: "question",
        });

        if (!ok) {
            return;
        }

        await logout();
        toastSuccess("You have been logged out.");
    }

    return (
        <aside className="sidebar">

            {/* Brand */}
            <div className="sidebar-brand">
                <div className="sidebar-logo">c</div>

                <div>
                    <h2>Click &amp; Run</h2>
                    <span>Rice Seed Analysis</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                <Item to="/" end icon={<HomeIcon size={18} />}>Dashboard</Item>
                <Item to="/new-test" icon={<PlusIcon size={18} />}>New Test</Item>
                <Item to="/reports" icon={<ReportsIcon size={18} />}>Test Reports</Item>

                {role === "admin" && (
                    <Item to="/admin" icon={<AdminIcon size={18} />}>Admin</Item>
                )}

                {role === "admin" && (
                    <Item to="/users" icon={<UsersIcon size={18} />}>Users</Item>
                )}
            </nav>

            {/* User / Logout */}
            <div className="sidebar-bottom">
                <div className="sidebar-user">
                    <strong>{user?.name || "User"}</strong>
                    <span className="role-pill">{roleLabel}</span>
                </div>

                <button
                    type="button"
                    className="logout-btn"
                    onClick={handleLogout}
                >
                    <LogOutIcon size={16} /> Log out
                </button>

                <div className="sidebar-status">
                    <div className="status-line">
                        <span className="status-dot" />
                        On-premise server
                    </div>
                    <small>PhilRice Genebank</small>
                </div>
            </div>

        </aside>
    );
}