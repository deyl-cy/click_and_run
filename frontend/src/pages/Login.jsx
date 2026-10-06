import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import { useAuth } from "../context/AuthContext";
import { CameraIcon, CpuIcon, ClipboardCheckIcon, EyeIcon, EyeSlashIcon, } from "../components/Icons";

const STEPS = [
    {
        icon: <CameraIcon size={20} />,
        title: "Upload",
        text: "Add a photo of your seed batch.",
    },
    {
        icon: <CpuIcon size={20} />,
        title: "Analyze",
        text: "AI detects and classifies every seed.",
    },
    {
        icon: <ClipboardCheckIcon size={20} />,
        title: "Report",
        text: "Save results and export to PDF or Excel.",
    },
];

export default function Login() {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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

        setSubmitting(true);

        try {
            await login(username, password);
            navigate("/");
        } catch {
            // The error popup is shown by the API layer.
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="lg-page">

            {/* LEFT: brand panel */}
            <aside className="lg-brand">

                <div className="lg-logo-row">
                    <Logo size={48} variant="light" />
                    <span>Click &amp; Run</span>
                </div>

                <div className="lg-hero">
                    <h1>
                        Know which seeds will grow, before you sow.
                    </h1>

                    <p>
                        AI-driven rice seed viability classification.
                        Analyze, record and report from one place.
                    </p>

                    <ul className="lg-steps">
                        {STEPS.map((step, index) => (
                            <li key={step.title}>
                                <div className="lg-step-icon">
                                    {step.icon}
                                </div>

                                <div>
                                    <strong>
                                        {index + 1}. {step.title}
                                    </strong>
                                    <span>{step.text}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="lg-footer">PhilRice Genebank</div>

            </aside>

            {/* RIGHT: form */}
            <main className="lg-form-side">
                <div className="lg-form-box">

                    <h2>Sign in</h2>
                    <p className="lg-sub">
                        Use the account your administrator gave you.
                    </p>

                    {notice && (
                        <div className="login-notice">{notice}</div>
                    )}

                    <form onSubmit={handleSubmit}>

                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(event) =>
                                setUsername(event.target.value)
                            }
                            autoComplete="username"
                            autoFocus
                            required
                        />

                        <label htmlFor="password">Password</label>
                        <div className="lg-password">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="current-password"
                                required
                            />

                            <button
                                type="button"
                                className="lg-eye"
                                onClick={() =>
                                    setShowPassword((value) => !value)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? (
                                    <EyeSlashIcon size={18} />
                                ) : (
                                    <EyeIcon size={18} />
                                )}
                            </button>
                        </div>

                        <button
                            type="submit"
                            className="lg-submit"
                            disabled={submitting}
                        >
                            {submitting ? "Signing in..." : "Sign in"}
                        </button>

                    </form>
                </div>
            </main>

        </div>
    );
}
