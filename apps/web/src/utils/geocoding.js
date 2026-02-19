/**
 * Geocodes an address string to { lat, lng } using the Google Maps Geocoder.
 *
 * @vis.gl/react-google-maps uses the modular Maps JS API, so we must
 * explicitly load the "geocoding" library before creating a Geocoder.
 *
 * @param {string} address – raw address text (e.g. "12/A, Maniktala Main Rd")
 * @param {string} [city]  – optional city hint appended for better accuracy
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAddress(address, city = 'Kolkata, West Bengal, India') {
    // Build a more specific query by appending city context
    const fullAddress = city ? `${address}, ${city}` : address;

    try {
        // Ensure the Maps JS API core is loaded
        if (!window.google?.maps) {
            console.warn('[geocoding] google.maps not available yet');
            return null;
        }

        // Load the geocoding library (idempotent – safe to call multiple times)
        const { Geocoder } = await window.google.maps.importLibrary('geocoding');
        const geocoder = new Geocoder();

        const response = await geocoder.geocode({ address: fullAddress });

        if (response.results?.length > 0) {
            const loc = response.results[0].geometry.location;
            return { lat: loc.lat(), lng: loc.lng() };
        }

        console.warn('[geocoding] No results for:', fullAddress);
    } catch (err) {
        console.error('[geocoding] Error:', err?.message || err);
    }

    return null;
}
