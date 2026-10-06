import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /*
    |--------------------------------------------------------------------------
    | Restore Authentication
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        async function loadUser() {
            const token =
                localStorage.getItem("auth_token");

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const response =
                    await api.get("/auth/user");

                setUser(response.data.user);

            } catch (error) {

                console.error(
                    "Unable to restore authentication:",
                    error
                );

                localStorage.removeItem(
                    "auth_token"
                );

                setUser(null);

            } finally {
                setLoading(false);
            }
        }

        loadUser();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | Session expired (idle timeout or rejected token)
    |--------------------------------------------------------------------------
    */

    const expireSession = useCallback((message) => {
        localStorage.removeItem("auth_token");

        try {
            sessionStorage.setItem(
                "session_message",
                message ||
                    "Your session has expired. Please sign in again."
            );
        } catch {
            /* ignore */
        }

        setUser(null);
    }, []);

    useEffect(() => {
        function handleExpired() {
            expireSession();
        }

        function handleStorage(event) {
            // Logged out (or expired) in another tab.
            if (event.key === "auth_token" && !event.newValue) {
                setUser(null);
            }
        }

        window.addEventListener("auth:expired", handleExpired);
        window.addEventListener("storage", handleStorage);

        return () => {
            window.removeEventListener("auth:expired", handleExpired);
            window.removeEventListener("storage", handleStorage);
        };
    }, [expireSession]);


    /*
    |--------------------------------------------------------------------------
    | Login
    |--------------------------------------------------------------------------
    */

    async function login(username, password) {

        const response = await api.post(
            "/auth/login",
            {
                username,
                password,
            }
        );

        localStorage.setItem(
            "auth_token",
            response.data.token
        );

        localStorage.setItem(
            "last_activity",
            String(Date.now())
        );

        try {
            sessionStorage.removeItem("session_message");
        } catch {
            /* ignore */
        }

        setUser(response.data.user);

        return response.data.user;
    }


    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    async function logout() {

        try {
            await api.post("/auth/logout");

        } catch (error) {
            console.error(
                "Logout request failed:",
                error
            );
        }

        localStorage.removeItem(
            "auth_token"
        );

        setUser(null);
    }


    /*
    |--------------------------------------------------------------------------
    | Context
    |--------------------------------------------------------------------------
    */

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
                expireSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}


/*
|--------------------------------------------------------------------------
| useAuth
|--------------------------------------------------------------------------
*/

export function useAuth() {
    return useContext(AuthContext);
}