const axios = require("axios");

/**
 * Handle EmergencyCreate event.
 * @param {Object} emergency - The payload from the EmergencyCreate event.
 * @param {Object} config - The current configuration object.
 */
async function handleEmergencyCreate(emergency, config) {
    console.log("EmergencyCreate event received:", emergency);

    const presetId = config.defaultEmergencyPreset || 1; // Default to preset 1 if undefined
    const wledIP = config.wledIP || "WLED_IP_HERE"; // Default WLED IP if undefined

    try {
        await axios.get(`http://${wledIP}/&P1=${presetId}`);
        console.log(`WLED preset ${presetId} triggered successfully for IP ${wledIP}.`);
    } catch (error) {
        console.error("Failed to trigger WLED preset:", error.message);
    }
}

module.exports = {
    handleEmergencyCreate,
};
