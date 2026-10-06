import { LogOutIcon } from "./Icons";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { confirmAction, toastSuccess } from "../utils/alert";

const icon = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
};

const HomeIcon = () => (
    <svg {...icon}>
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
    </svg>
);

const PlusIcon = () => (
    <svg {...icon} strokeWidth={2.4}>
        <path d="M12 5v14M5 12h14" />
    </svg>
);

const ReportsIcon = () => (
    <svg {...icon}>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M3 9h18M3 14h18M8 4v16" />
    </svg>
);

const AdminIcon = () => (
    <svg {...icon}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
);

const UsersIcon = () => (
    <svg {...icon}>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </svg>
);

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
                <Item to="/" end icon={<HomeIcon />}>Dashboard</Item>
                <Item to="/new-test" icon={<PlusIcon />}>New Test</Item>
                <Item to="/reports" icon={<ReportsIcon />}>Test Reports</Item>

                {role === "admin" && (
                    <Item to="/admin" icon={<AdminIcon />}>Admin</Item>
                )}

                {role === "admin" && (
                    <Item to="/users" icon={<UsersIcon />}>Users</Item>
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