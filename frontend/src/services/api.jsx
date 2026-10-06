import axios from "axios";

import { alertError, toastSuccess } from "../utils/alert";

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
| Global SweetAlert feedback.
|
| - Successful POST/PUT/PATCH/DELETE with a `message` -> success toast.
| - Failed request -> error popup.
|
| Opt out for a single call with { silent: true }:
|   api.get("/auth/user", { silent: true })
*/
const SILENT_URLS = ["/auth/user", "/auth/logout"];

function isSilent(config) {
    if (!config) {
        return false;
    }

    return (
        config.silent === true ||
        SILENT_URLS.some((url) => (config.url || "").includes(url))
    );
}

api.interceptors.response.use(
    (response) => {
        const method = (response.config.method || "get").toLowerCase();
        const message = response.data?.message;

        if (
            method !== "get" &&
            typeof message === "string" &&
            !isSilent(response.config) &&
            !(response.config.url || "").includes("/auth/login")
        ) {
            toastSuccess(message);
        }

        return response;
    },
    (error) => {
        const config = error.config;
        const status = error.response?.status;
        const url = config?.url || "";

        // Session expired: the login page shows its own notice.
        if (
            status === 401 &&
            !url.includes("/auth/login") &&
            localStorage.getItem("auth_token")
        ) {
            window.dispatchEvent(new Event("auth:expired"));
            return Promise.reject(error);
        }

        // Cancelled by the user (e.g. Cancel while analyzing).
        if (error.code === "ERR_CANCELED" || isSilent(config)) {
            return Promise.reject(error);
        }

        let message = "Something went wrong. Please try again.";

        if (!error.response) {
            message =
                "Cannot reach the server. Check your connection.";
        } else if (typeof error.response.data?.message === "string") {
            message = error.response.data.message;
        } else if (error.response.data?.errors) {
            message = Object.values(error.response.data.errors)
                .flat()
                .join("\n");
        }

        if (error.response?.data?.code === "account_deactivated") {
            alertError(message, "Account deactivated");
        } else {
            alertError(message);
        }

        return Promise.reject(error);
    }
);

export default api;