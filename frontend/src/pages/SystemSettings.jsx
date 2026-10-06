import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { BackIcon, SaveIcon } from "../components/Icons";
import api from "../services/api";
import { confirmAction } from "../utils/alert";
import { DEFAULT_SETTINGS, setSettingsCache } from "../hooks/useSettings";

export default function SystemSettings() {
    const [form, setForm] = useState(DEFAULT_SETTINGS);
    const [defaults, setDefaults] = useState(DEFAULT_SETTINGS);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const response = await api.get("/admin/settings");

                if (cancelled) {
                    return;
                }

                setForm(response.data.data);
                setDefaults(response.data.defaults);
            } catch {
                /* error popup shown by the API layer */
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        return () => {
            cancelled = true;
        };
    }, []);

    function update(name, value) {
        setForm((current) => ({ ...current, [name]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);

        try {
            const response = await api.put("/admin/settings", {
                default_confidence: Number(form.default_confidence),
                idle_timeout_minutes: Number(form.idle_timeout_minutes),
                lab_name: form.lab_name.trim(),
            });

            setForm(response.data.data);
            setSettingsCache(response.data.data);
        } catch {
            /* error popup shown by the API layer */
        } finally {
            setSaving(false);
        }
    }

    async function handleReset() {
        const ok = await confirmAction({
            title: "Reset to defaults?",
            text: "All settings on this page will go back to their original values.",
            confirmText: "Reset",
            danger: true,
        });

        if (!ok) {
            return;
        }

        setSaving(true);

        try {
            const response = await api.post("/admin/settings/reset");

            setForm(response.data.data);
            setSettingsCache(response.data.data);
        } catch {
            /* error popup shown by the API layer */
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="system-settings-page">

            <div className="page-header">
                <div>
                    <h1>System Settings</h1>
                    <p>Configure how the application behaves for everyone.</p>
                </div>

                <Link to="/admin" className="secondary-button">
                    <BackIcon size={15} /> Back
                </Link>
            </div>

            {loading ? (
                <div className="content-card">Loading...</div>
            ) : (
                <form onSubmit={handleSubmit}>

                    <div className="content-card ss-section">
                        <h2>Seed analysis</h2>
                        <p className="ss-help">
                            Starting value of the confidence slider on the New Test
                            page. Analysts can still change it for each test.
                        </p>

                        <label className="ss-label" htmlFor="default_confidence">
                            Default confidence threshold{" "}
                            <strong>{form.default_confidence}%</strong>
                        </label>

                        <input
                            id="default_confidence"
                            type="range"
                            className="conf-slider"
                            min="5"
                            max="95"
                            step="1"
                            value={form.default_confidence}
                            onChange={(event) =>
                                update("default_confidence", Number(event.target.value))
                            }
                        />

                        <small className="ss-hint">
                            Original default: {defaults.default_confidence}%
                        </small>
                    </div>

                    <div className="content-card ss-section">
                        <h2>Security</h2>
                        <p className="ss-help">
                            Users are signed out after this many minutes without
                            activity. They get a 60-second warning first.
                        </p>

                        <label className="ss-label" htmlFor="idle_timeout_minutes">
                            Idle timeout (minutes)
                        </label>

                        <input
                            id="idle_timeout_minutes"
                            type="number"
                            className="ss-input"
                            min="2"
                            max="120"
                            value={form.idle_timeout_minutes}
                            onChange={(event) =>
                                update("idle_timeout_minutes", event.target.value)
                            }
                            required
                        />

                        <small className="ss-hint">
                            Allowed: 2 to 120. Applies the next time each user
                            opens or refreshes the app.
                        </small>
                    </div>

                    <div className="content-card ss-section">
                        <h2>Organization</h2>
                        <p className="ss-help">
                            Name shown at the bottom of the sidebar.
                        </p>

                        <label className="ss-label" htmlFor="lab_name">
                            Lab / organization name
                        </label>

                        <input
                            id="lab_name"
                            type="text"
                            className="ss-input"
                            maxLength={100}
                            value={form.lab_name}
                            onChange={(event) => update("lab_name", event.target.value)}
                            required
                        />
                    </div>

                    <div className="ss-actions">
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={handleReset}
                            disabled={saving}
                        >
                            Reset to defaults
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={saving}
                        >
                            <SaveIcon size={16} /> {saving ? "Saving..." : "Save settings"}
                        </button>
                    </div>

                </form>
            )}
        </div>
    );
}
