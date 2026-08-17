import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCountryFromCoords } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GeoStatus = 'idle' | 'asking' | 'resolved' | 'denied' | 'unsupported' | 'error';

export interface GeoContextValue {
    status: GeoStatus;
    countryCode: string | null;
    countryName: string | null;
    loading: boolean;
    /** Manually trigger the browser location permission prompt */
    requestLocation: () => void;
}

// ─── Session cache ────────────────────────────────────────────────────────────

const CACHE_KEY = 'silonka_geo_v1';

function readCache(): { countryCode: string; countryName: string } | null {
    try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

function writeCache(data: { countryCode: string; countryName: string }) {
    try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const GeoContext = createContext<GeoContextValue>({
    status: 'idle',
    countryCode: null,
    countryName: null,
    loading: false,
    requestLocation: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function GeoProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus]       = useState<GeoStatus>('idle');
    const [countryCode, setCC]      = useState<string | null>(null);
    const [countryName, setCN]      = useState<string | null>(null);
    const requestedRef              = useRef(false); // prevent double-call in StrictMode

    // Reverse-geocode helper
    const resolveCoords = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await getCountryFromCoords(lat, lng);
            setCC(res.countryCode);
            setCN(res.countryName);
            setStatus('resolved');
            writeCache({ countryCode: res.countryCode, countryName: res.countryName });
        } catch {
            setStatus('error');
        }
    }, []);

    // Main location request — calls browser API
    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('unsupported');
            return;
        }
        if (status === 'asking' || status === 'resolved') return;

        setStatus('asking');

        navigator.geolocation.getCurrentPosition(
            (pos) => resolveCoords(pos.coords.latitude, pos.coords.longitude),
            (err) => {
                setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
        );
    }, [status, resolveCoords]);

    // On first mount: restore from cache or auto-request permission
    useEffect(() => {
        if (requestedRef.current) return;
        requestedRef.current = true;

        // 1️⃣ Check session cache first — no prompt needed
        const cached = readCache();
        if (cached) {
            setCC(cached.countryCode);
            setCN(cached.countryName);
            setStatus('resolved');
            return;
        }

        // 2️⃣ Auto-trigger the browser permission dialog
        if (!navigator.geolocation) {
            setStatus('unsupported');
            return;
        }

        setStatus('asking');
        navigator.geolocation.getCurrentPosition(
            (pos) => resolveCoords(pos.coords.latitude, pos.coords.longitude),
            (err) => {
                setStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
            },
            { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 }
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <GeoContext.Provider value={{
            status,
            countryCode,
            countryName,
            loading: status === 'asking',
            requestLocation,
        }}>
            {children}
        </GeoContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGeo(): GeoContextValue {
    return useContext(GeoContext);
}
