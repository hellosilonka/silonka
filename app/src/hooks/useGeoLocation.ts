import { useState, useEffect, useCallback } from 'react';
import { getCountryFromCoords } from '@/lib/api';

export interface GeoState {
    /** Whether we're currently requesting location or geocoding */
    loading: boolean;
    /** ISO 3166-1 alpha-2 country code e.g. "US", "GB" */
    countryCode: string | null;
    /** Full country name e.g. "United States" */
    countryName: string | null;
    /** 'idle' | 'asking' | 'resolved' | 'denied' | 'error' */
    status: 'idle' | 'asking' | 'resolved' | 'denied' | 'error';
    /** Human-readable error if status is 'error' */
    error: string | null;
    /** Call this to trigger the browser permission prompt */
    requestLocation: () => void;
}

const SESSION_KEY = 'silonka_geo';

/** Returns cached geo from sessionStorage, or null if not cached. */
function getCached(): { countryCode: string; countryName: string } | null {
    try {
        const raw = sessionStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function setCached(data: { countryCode: string; countryName: string }) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    } catch { /* ignore */ }
}

/**
 * useGeoLocation
 *
 * Asks the user for browser location permission, then reverse-geocodes
 * the coordinates via our backend to get their country code.
 *
 * Results are cached in sessionStorage so the permission prompt only
 * appears once per session.
 */
export function useGeoLocation(): GeoState {
    const [status, setStatus] = useState<GeoState['status']>('idle');
    const [countryCode, setCountryCode] = useState<string | null>(null);
    const [countryName, setCountryName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('error');
            setError('Geolocation is not supported by your browser.');
            return;
        }

        // If already resolved or asking, don't re-request
        if (status === 'resolved' || status === 'asking') return;

        setStatus('asking');
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const result = await getCountryFromCoords(latitude, longitude);
                    setCountryCode(result.countryCode);
                    setCountryName(result.countryName);
                    setStatus('resolved');
                    setCached({ countryCode: result.countryCode, countryName: result.countryName });
                } catch (err: any) {
                    setStatus('error');
                    setError('Could not determine your country. Please select manually.');
                    console.warn('[useGeoLocation] Reverse geocode failed:', err.message);
                }
            },
            (positionError) => {
                if (positionError.code === positionError.PERMISSION_DENIED) {
                    setStatus('denied');
                    setError('Location permission denied.');
                } else {
                    setStatus('error');
                    setError('Could not get your location. Please select your country manually.');
                }
                console.warn('[useGeoLocation] Geolocation error:', positionError.message);
            },
            {
                // Prefer fast response over accuracy — we only need country-level data
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000, // use cached position up to 5 minutes
            }
        );
    }, [status]);

    // On mount: check session cache first, then auto-request
    useEffect(() => {
        const cached = getCached();
        if (cached) {
            setCountryCode(cached.countryCode);
            setCountryName(cached.countryName);
            setStatus('resolved');
            return;
        }

        // Auto-request on mount — browser will show its permission prompt
        requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        loading: status === 'asking',
        countryCode,
        countryName,
        status,
        error,
        requestLocation,
    };
}
