import { useEffect, useState } from "react";

import api from "../services/api";

export const DEFAULT_SETTINGS = {
    default_confidence: 30,
    idle_timeout_minutes: 15,
    lab_name: "PhilRice Genebank",
};

let cache = null;
let inflight = null;
const listeners = new Set();

export function setSettingsCache(values) {
    cache = { ...DEFAULT_SETTINGS, ...values };
    listeners.forEach((listener) => listener(cache));
}

function load() {
    if (!inflight) {
        inflight = api
            .get("/settings", { silent: true })
            .then((response) => setSettingsCache(response.data.data))
            .catch(() => {})
            .finally(() => {
                inflight = null;
            });
    }

    return inflight;
}

/*
| Shared, read-only app settings (set by the administrator).
|   const { default_confidence, idle_timeout_minutes, lab_name } = useSettings();
*/
export default function useSettings() {
    const [settings, setSettings] = useState(cache || DEFAULT_SETTINGS);

    useEffect(() => {
        listeners.add(setSettings);

        if (cache) {
            setSettings(cache);
        } else {
            load();
        }

        return () => {
            listeners.delete(setSettings);
        };
    }, []);

    return settings;
}
