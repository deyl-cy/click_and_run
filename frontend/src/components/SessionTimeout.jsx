import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import useSettings from "../hooks/useSettings";

/*
| The idle timeout comes from Admin > System Settings.
| The server keeps the login valid 5 minutes longer than this.
*/
const WARNING_SECONDS = 60;
const WARNING_MS = WARNING_SECONDS * 1000;

const ACTIVITY_KEY = "last_activity";
const COUNTDOWN_ID = "session-countdown";

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = String(totalSeconds % 60).padStart(2, "0");

    return `${minutes}:${seconds}`;
}

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
    const { idle_timeout_minutes: idleMinutes } = useSettings();

    const idleMsRef = useRef(idleMinutes * 60 * 1000);
    const heartbeatMsRef = useRef(4 * 60 * 1000);

    useEffect(() => {
        idleMsRef.current = idleMinutes * 60 * 1000;
        heartbeatMsRef.current =
            Math.min(4, Math.max(1, idleMinutes / 3)) * 60 * 1000;
    }, [idleMinutes]);

    const [secondsLeft, setSecondsLeft] = useState(null);

    const warningRef = useRef(false);
    const lastBeatRef = useRef(Date.now());
    const lastWriteRef = useRef(0);
    const popupOpenRef = useRef(false);

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
            const idleMs = idleMsRef.current;

            if (idle >= idleMs) {
                clearInterval(timer);
                warningRef.current = false;

                if (popupOpenRef.current) {
                    popupOpenRef.current = false;
                    Swal.close();
                }

                api.post("/auth/logout")
                    .catch(() => {})
                    .finally(() =>
                        expireSession(
                            "You were signed out because of inactivity."
                        )
                    );

                return;
            }

            if (idle >= idleMs - WARNING_MS) {
                warningRef.current = true;
                setSecondsLeft(Math.ceil((idleMs - idle) / 1000));
                return;
            }

            if (warningRef.current) {
                // Activity happened in another tab.
                warningRef.current = false;
                setSecondsLeft(null);
            }

            // Keep the server token alive while the user is active.
            if (
                now - lastBeatRef.current >= heartbeatMsRef.current &&
                idle < heartbeatMsRef.current
            ) {
                heartbeat();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expireSession, heartbeat]);

    /*
    | Show the warning with SweetAlert and keep its countdown updated.
    */
    useEffect(() => {
        if (secondsLeft === null) {
            // Activity in another tab, or "Stay signed in" was clicked.
            if (popupOpenRef.current) {
                popupOpenRef.current = false;
                Swal.close();
            }

            return;
        }

        if (!popupOpenRef.current) {
            popupOpenRef.current = true;

            Swal.fire({
                icon: "warning",
                title: "Are you still there?",
                html:
                    "You will be signed out due to inactivity in<br>" +
                    `<strong id="${COUNTDOWN_ID}" style="font-size:2rem">` +
                    `${formatTime(secondsLeft)}</strong>`,
                showDenyButton: true,
                confirmButtonText: "Stay signed in",
                denyButtonText: "Sign out",
                confirmButtonColor: "#111827",
                denyButtonColor: "#6b7280",
                allowOutsideClick: false,
                allowEscapeKey: false,
            }).then((result) => {
                // Closed by the code above, nothing to do.
                if (!popupOpenRef.current) {
                    return;
                }

                popupOpenRef.current = false;

                if (result.isConfirmed) {
                    staySignedIn();
                } else if (result.isDenied) {
                    logout();
                }
            });

            return;
        }

        const element = document.getElementById(COUNTDOWN_ID);

        if (element) {
            element.textContent = formatTime(secondsLeft);
        }
    }, [secondsLeft, staySignedIn, logout]);

    // Close the popup if this component goes away.
    useEffect(
        () => () => {
            if (popupOpenRef.current) {
                popupOpenRef.current = false;
                Swal.close();
            }
        },
        []
    );

    return null;
}
