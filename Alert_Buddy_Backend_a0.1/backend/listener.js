"use strict";

const { MedrunnerApiClient } = require("@medrunner/api-client");
const fs = require("fs");
const dotenv = require("dotenv");
const EventEmitter = require("events");

// EventEmitter is used for inter-applet communication.
// Each emitted event includes a well-defined payload structure:
// - Event: "PersonUpdate" | Payload: { id, rsiHandle, active, activeEmergency, roles, updated }
// - Event: "EmergencyCreate" | Payload: { id, missionName, clientRsiHandle, system, threatLevel, respondingTeam, created }
// - Event: "EmergencyUpdate" | Payload: { id, status, remarks, updated }
// - Event: "ChatMessageCreate" | Payload: { id, contents, emergencyId, senderId, created, messageSentTimestamp, updated }
// - Event: "OrgSettingsUpdate" | Payload: { id, created, updated, public }
const eventEmitter = new EventEmitter();
const envFilePath = "./.env";

// Ensure the .env file exists
if (!fs.existsSync(envFilePath)) {
    const defaultEnvContent = "API_TOKEN=YOUR_TOKEN_HERE";
    fs.writeFileSync(envFilePath, defaultEnvContent);
    console.log(".env created. Please update it with your API token.");
}

// Load environment variables
dotenv.config();
const apiToken = process.env.API_TOKEN;

// Validate API token
if (!apiToken || apiToken === "YOUR_TOKEN_HERE") {
    console.error("Please update the .env file with your Medrunner API token.");
    process.exit(1);
}

// Initialize Medrunner API client
const apiConfig = { 
    baseUrl: "https://api.medrunner.dev", // Medrunner API url
    refreshToken: apiToken
};
const api = MedrunnerApiClient.buildClient(apiConfig);

/**
 * Initialize the WebSocket connection and register event handlers.
 * Includes retry mechanism for failed connections.
 */
async function initializeWebSocket() {
    let attempts = 0;
    const maxRetries = 5;
    const retryDelay = 5000; // Delay in milliseconds between retries
    const startTime = Date.now(); // Track the start time of the initialization

    while (attempts < maxRetries) {
        try {
            const ws = await api.websocket.initialize();
            await ws.start();

            console.log("WebSocket connected:", ws.state);

            // Log total elapsed time for successful connection
            const elapsedTime = (Date.now() - startTime) / 1000;
            console.log(`WebSocket connection established after ${elapsedTime.toFixed(2)} seconds.`);

            // Register event handlers
            registerEventHandlers(ws);

            // Indicate that the listener is running
            console.log("Listening...");

            return; // Exit the function upon successful connection
        } catch (error) {
            attempts++;
            console.error(`WebSocket connection failed (Attempt ${attempts} of ${maxRetries}):`, error);

            if (attempts >= maxRetries) {
                console.error("Max retry attempts reached. Exiting.");
                process.exit(1);
            }

            console.log(`Retrying WebSocket connection in ${retryDelay / 1000} seconds...`);
            await new Promise((resolve) => setTimeout(resolve, retryDelay)); // Wait before retrying
        }
    }
}

/**
 * Register all WebSocket event handlers.
 * @param {Object} ws - The WebSocket connection.
 */
function registerEventHandlers(ws) {
    ws.on("PersonUpdate", handlePersonUpdate); // Emit PersonUpdate event
    ws.on("EmergencyCreate", handleEmergencyCreate); // Emit EmergencyCreate event
    ws.on("EmergencyUpdate", handleEmergencyUpdate); // Emit EmergencyUpdate event
    ws.on("ChatMessageCreate", handleChatMessageCreate); // Emit ChatMessageCreate event
    ws.on("OrgSettingsUpdate", handleOrgSettingsUpdate); // Emit OrgSettingsUpdate event

    console.log("Event handlers registered.");
}

/**
 * Handle the "PersonUpdate" event and emit it for other applets.
 * @param {Object} person - The Person object returned by the event.
 */
function handlePersonUpdate(person) {
    if (!person) {
        console.warn("Received an empty PersonUpdate event.");
        return;
    }

    console.log("Person updated:", {
        id: person.id,
        rsiHandle: person.rsiHandle,
        active: person.active,
        activeEmergency: person.activeEmergency || "None",
        roles: person.roles,
        updated: person.updated,
    });

    eventEmitter.emit("PersonUpdate", person); // Emit event for listeners
}

/**
 * Handle the "EmergencyCreate" event and emit it for other applets.
 * @param {Object} emergency - The Emergency object returned by the event.
 */
function handleEmergencyCreate(emergency) {
    if (!emergency) {
        console.warn("Received an empty EmergencyCreate event.");
        return;
    }

    console.log("New emergency created:", {
        id: emergency.id,
        missionName: emergency.missionName || "Unknown Mission",
        clientRsiHandle: emergency.clientRsiHandle,
        system: emergency.system,
        threatLevel: emergency.threatLevel,
        respondingTeam: emergency.respondingTeam,
        created: emergency.created,
    });

    eventEmitter.emit("EmergencyCreate", emergency); // Emit event for listeners
}

/**
 * Handle the "EmergencyUpdate" event and emit it for other applets.
 * @param {Object} emergency - The updated Emergency object returned by the event.
 */
function handleEmergencyUpdate(emergency) {
    if (!emergency) {
        console.warn("Received an empty EmergencyUpdate event.");
        return;
    }

    console.log("Emergency updated:", {
        id: emergency.id,
        status: emergency.status,
        remarks: emergency.remarks || "No remarks",
        updated: emergency.updated,
    });

    eventEmitter.emit("EmergencyUpdate", emergency); // Emit event for listeners
}

/**
 * Handle the "ChatMessageCreate" event and emit it for other applets.
 * @param {Object} message - The ChatMessage object returned by the event.
 */
function handleChatMessageCreate(message) {
    if (!message) {
        console.warn("Received an empty ChatMessageCreate event.");
        return;
    }

    console.log("New chat message received:", {
        id: message.id,
        contents: message.contents,
        emergencyId: message.emergencyId,
        senderId: message.senderId,
        created: message.created,
        messageSentTimestamp: message.messageSentTimestamp,
        updated: message.updated,
    });

    eventEmitter.emit("ChatMessageCreate", message); // Emit event for listeners
}

/**
 * Handle the "OrgSettingsUpdate" event and emit it for other applets.
 * @param {Object} settings - The updated OrgSettings object returned by the event.
 */
function handleOrgSettingsUpdate(settings) {
    if (!settings) {
        console.warn("Received an empty OrgSettingsUpdate event.");
        return;
    }

    console.log("Organization settings updated:", {
        id: settings.id,
        created: settings.created,
        updated: settings.updated,
        public: settings.public,
    });

    eventEmitter.emit("OrgSettingsUpdate", settings); // Emit event for listeners
}

/**
 * Main function to start the WebSocket listener.
 */
async function main() {
    try {
        await initializeWebSocket();
    } catch (error) {
        console.error(`[${new Date().toISOString()}] An error occurred in the main function:`, {
            message: error.message,
            stack: error.stack,
        });
    }
}

// Export the main function and event emitter for external use
module.exports = { main, eventEmitter };

// Start the listener app
main().catch((error) => {
    console.error(`[${new Date().toISOString()}] An error has occurred while running the app:`, {
        message: error.message,
        stack: error.stack,
    });
});
