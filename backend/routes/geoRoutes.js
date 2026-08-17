import express from 'express';

const router = express.Router();

/**
 * GET /api/geo/reverse?lat=...&lng=...
 *
 * Accepts lat/lng from browser Geolocation API.
 * Uses free https://nominatim.openstreetmap.org reverse geocode — no API key needed.
 * Returns { countryCode, countryName }
 */
router.get('/reverse', async (req, res) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ message: 'lat and lng are required' });
    }

    const latitude  = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: 'Invalid lat/lng values' });
    }

    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;

        const response = await fetch(url, {
            headers: {
                // Nominatim requires a User-Agent to identify the app
                'User-Agent': 'Silonka/1.0 (hellosilonka@gmail.com)',
                'Accept-Language': 'en',
            },
        });

        if (!response.ok) {
            throw new Error(`Nominatim responded with ${response.status}`);
        }

        const data = await response.json();

        const countryCode = data?.address?.country_code?.toUpperCase() || null;
        const countryName = data?.address?.country || null;

        if (!countryCode) {
            return res.status(404).json({ message: 'Could not determine country from coordinates' });
        }

        res.json({ countryCode, countryName });
    } catch (err) {
        console.error('[geo/reverse] Error:', err.message);
        res.status(500).json({ message: 'Geo lookup failed', error: err.message });
    }
});

export default router;
