import {
    createContext,
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

            /*
             * No token means the user is not logged in.
             */

            if (!token) {
                setUser(null);
                setLoading(false);
                return;
            }

            try {
                const response =
                    await api.get("/auth/user");

                /*
                 * Your API currently returns:
                 *
                 * {
                 *     user: {...}
                 * }
                 */

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

        /*
         * Save authentication token.
         */

        localStorage.setItem(
            "auth_token",
            response.data.token
        );

        /*
         * Store the complete authenticated user.
         *
         * This should include:
         *
         * id
         * name
         * email
         * role
         * is_active
         */

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
            /*
             * Even if the server rejects the logout
             * request, remove the local authentication.
             */

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