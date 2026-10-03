import { UsersIcon, SettingsIcon, ClipboardIcon, ArrowRightIcon } from "../components/Icons";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Admin() {
    const { user } = useAuth();

    return (
        <div className="administration-page">

            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <div className="page-header">

                <div>
                    <h1>
                        Administration
                    </h1>

                    <p>
                        Manage users and administrative
                        settings for the rice seed analysis
                        system.
                    </p>
                </div>

            </div>


            {/* =====================================================
                ADMIN INFORMATION
            ===================================================== */}

            <div className="content-card">

                <div className="reports-header">

                    <div>
                        <h2>
                            Administrator
                        </h2>

                        <p>
                            You are signed in with an
                            administrator account.
                        </p>
                    </div>

                </div>

                <div className="admin-user-info">

                    <div className="admin-info-item">
                        <span className="admin-info-label">
                            Name
                        </span>

                        <strong>
                            {user?.name || "—"}
                        </strong>
                    </div>

                    <div className="admin-info-item">
                        <span className="admin-info-label">
                            Email
                        </span>

                        <strong>
                            {user?.email || "—"}
                        </strong>
                    </div>

                    <div className="admin-info-item">
                        <span className="admin-info-label">
                            Role
                        </span>

                        <strong>
                            {user?.role || "—"}
                        </strong>
                    </div>

                </div>

            </div>


            {/* =====================================================
                ADMINISTRATION OPTIONS
            ===================================================== */}

            <div className="content-card">

                <div className="reports-header">

                    <div>
                        <h2>
                            Administration
                        </h2>

                        <p>
                            Select an administrative
                            function.
                        </p>
                    </div>

                </div>


                <div className="admin-options">

                    {/* USER MANAGEMENT */}

                    <Link
                        to="/admin/users"
                        className="admin-option-card"
                    >

                        <div className="admin-option-icon"><UsersIcon /></div>

                        <div className="admin-option-content">

                            <h3>
                                User Management
                            </h3>

                            <p>
                                Create, edit, activate,
                                deactivate, and manage
                                user roles.
                            </p>

                        </div>

                        <div className="admin-option-arrow"><ArrowRightIcon /></div>

                    </Link>


                    {/* SYSTEM SETTINGS */}

                    <div
                        className="admin-option-card admin-option-disabled"
                    >

                        <div className="admin-option-icon"><SettingsIcon /></div>

                        <div className="admin-option-content">

                            <h3>
                                System Settings
                            </h3>

                            <p>
                                System configuration and
                                application settings.
                            </p>

                            <span className="coming-soon-badge">
                                Coming Soon
                            </span>

                        </div>

                    </div>


                    {/* ACTIVITY / AUDIT LOG */}

                    <div
                        className="admin-option-card admin-option-disabled"
                    >

                        <div className="admin-option-icon"><ClipboardIcon /></div>

                        <div className="admin-option-content">

                            <h3>
                                Activity Log
                            </h3>

                            <p>
                                Review administrative and
                                system activity.
                            </p>

                            <span className="coming-soon-badge">
                                Coming Soon
                            </span>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}