import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import SessionTimeout from "./SessionTimeout";

export default function Layout() {
    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <Outlet />
            </main>

            <SessionTimeout />
        </div>
    );
}