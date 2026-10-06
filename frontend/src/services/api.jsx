import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        Accept: "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

/*
| If the server says the token is invalid/expired (401) on any call
| other than login, tell the app to log the user out.
*/
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url || "";

        if (
            status === 401 &&
            !url.includes("/auth/login") &&
            localStorage.getItem("auth_token")
        ) {
            window.dispatchEvent(new Event("auth:expired"));
        }

        return Promise.reject(error);
    }
);

export default api;