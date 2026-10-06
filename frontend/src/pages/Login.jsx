import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [notice] = useState(() => {
        try {
            const message = sessionStorage.getItem("session_message");
            sessionStorage.removeItem("session_message");
            return message || "";
        } catch {
            return "";
        }
    });
    const [submitting, setSubmitting] = useState(false);

    if (user) {
        return <Navigate to="/" replace />;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");
        setSubmitting(true);

        try {
            await login(username, password);
            navigate("/");
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to sign in."
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">

                <div className="login-header">
                    <h1>Click & Run</h1>
                    <p>Rice Seed Analysis System</p>
                </div>

                {notice && (
                    <div className="login-notice">
                        {notice}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <label>
                        Username or Email
                        <input
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            required
                        />
                    </label>

                    <label>
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            required
                        />
                    </label>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                    >
                        {submitting
                            ? "Signing in..."
                            : "Sign In"}
                    </button>

                </form>
            </div>
        </div>
    );
}