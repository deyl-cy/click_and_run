import { BrowserRouter, Navigate, Route, Routes, } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import NewTest from "./pages/NewTest";
import Admin from "./pages/Admin";
import Results from "./pages/Results";
import ReportDetails from "./pages/ReportDetails";
import UserManagement from "./pages/UserManagement";
import ActivityLog from "./pages/ActivityLog";
import SystemSettings from "./pages/SystemSettings";

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>

                <Routes>

                    {/* =================================================
                        LOGIN
                    ================================================= */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* =================================================
                        AUTHENTICATED APPLICATION
                    ================================================= */}

                    <Route element={<ProtectedRoute />}>

                        <Route element={<Layout />}>

                            {/* ================================
                                NORMAL USER PAGES
                            ================================= */}

                            <Route
                                path="/"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/dashboard"
                                element={<Dashboard />}
                            />

                            <Route
                                path="/new-test"
                                element={<NewTest />}
                            />

                            <Route
                                path="/reports"
                                element={<Reports />}
                            />

                            <Route
                                path="/reports/:id"
                                element={<ReportDetails />}
                            />

                            <Route
                                path="/results"
                                element={<Results />}
                            />


                            {/* ================================
                                ADMIN ONLY PAGES
                            ================================= */}

                            <Route element={<AdminRoute />}>

                                <Route
                                    path="/admin"
                                    element={<Admin />}
                                />

                                <Route
                                    path="/admin/users"
                                    element={<UserManagement />}
                                />

                                <Route
                                    path="/admin/activity"
                                    element={<ActivityLog />}
                                />

                                <Route
                                    path="/admin/settings"
                                    element={<SystemSettings />}
                                />

                            </Route>

                        </Route>

                    </Route>


                    {/* =================================================
                        UNKNOWN ROUTES
                    ================================================= */}

                    <Route
                        path="*"
                        element={
                            <Navigate
                                to="/"
                                replace
                            />
                        }
                    />

                </Routes>

            </AuthProvider>
        </BrowserRouter>
    );
}

//wowers