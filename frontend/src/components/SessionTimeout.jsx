import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/*
| Tune these three numbers.
| Keep the server limit (SESSION_MINUTES in AuthController.php)
| higher than IDLE_MINUTES.
*/
const IDLE_MINUTES = 15;
const WARNING_SECONDS = 60;
const HEARTBEAT_MINUTES = 4;

const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const WARNING_MS = WARNING_SECONDS * 1000;
const HEARTBEAT_MS = HEARTBEAT_MINUTES * 60 * 1000;

const ACTIVITY_KEY = "last_activity";

function readLastActivity() {
    try {
        const value = Number(localStorage.getItem(ACTIVITY_KEY));
        return value > 0 ? value : Date.now();
    } catch {
        return Date.now();
    }
}

function writeLastActivity() {
    try {
        localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    } catch {
        /* ignore */
    }
}

export default function SessionTimeout() {
    const { logout, expireSession } = useAuth();

    const [secondsLeft, setSecondsLeft] = useState(null);

    const warningRef = useRef(false);
    const lastBeatRef = useRef(Date.now());
    const lastWriteRef = useRef(0);

    const heartbeat = useCallback(async () => {
        lastBeatRef.current = Date.now();

        try {
            await api.get("/auth/user");
        } catch {
            /* a 401 is handled by the axios interceptor */
        }
    }, []);

    const staySignedIn = useCallback(() => {
        writeLastActivity();
        warningRef.current = false;
        setSecondsLeft(null);
        heartbeat();
    }, [heartbeat]);

    /*
    | Track user activity (throttled to once per second).
    | While the warning is open, only the button counts.
    */
    useEffect(() => {
        writeLastActivity();

        function onActivity() {
            if (warningRef.current) {
                return;
            }

            const now = Date.now();

            if (now - lastWriteRef.current < 1000) {
                return;
            }

            lastWriteRef.current = now;
            writeLastActivity();
        }

        const events = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
            "click",
        ];

        events.forEach((name) =>
            window.addEventListener(name, onActivity, { passive: true })
        );

        return () =>
            events.forEach((name) =>
                window.removeEventListener(name, onActivity)
            );
    }, []);

    /*
    | Check the clock every second.
    | Uses timestamps, so it stays correct after sleep / background tabs.
    */
    useEffect(() => {
        const timer = setInterval(() => {
            const now = Date.now();
            const idle = now - readLastActivity();

            if (idle >= IDLE_MS) {
                clearInterval(timer);
                warningRef.current = false;

                api.post("/auth/logout")
                    .catch(() => {})
                    .finally(() =>
                        expireSession(
                            "You were signed out because of inactivity."
                        )
                    );

                return;
            }

            if (idle >= IDLE_MS - WARNING_MS) {
                warningRef.current = true;
                setSecondsLeft(Math.ceil((IDLE_MS - idle) / 1000));
                return;
            }

            if (warningRef.current) {
                // Activity happened in another tab.
                warningRef.current = false;
                setSecondsLeft(null);
            }

            // Keep the server token alive while the user is active.
            if (
                now - lastBeatRef.current >= HEARTBEAT_MS &&
                idle < HEARTBEAT_MS
            ) {
                heartbeat();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expireSession, heartbeat]);

    if (secondsLeft === null) {
        return null;
    }

    const minutes = Math.floor(secondsLeft / 60);
    const seconds = String(secondsLeft % 60).padStart(2, "0");

    return (
        <div className="session-overlay">
            <div
                className="session-modal"
                role="alertdialog"
                aria-modal="true"
            >
                <h2>Are you still there?</h2>

                <p>
                    You will be signed out due to inactivity in
                </p>

                <div className="session-countdown">
                    {minutes}:{seconds}
                </div>

                <div className="session-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => logout()}
                    >
                        Sign out
                    </button>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={staySignedIn}
                        autoFocus
                    >
                        Stay signed in
                    </button>
                </div>
            </div>
        </div>
    );
}