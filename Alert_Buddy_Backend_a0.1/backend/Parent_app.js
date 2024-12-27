"use strict";

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const EventEmitter = require("events");
const dotenv = require("dotenv");
const express = require("express");
const emitter = require("./emitter");

// Initialize environment variables
dotenv.config();

// Path to configuration file
const configPath = path.join(__dirname, "config.json");
const logFilePath = path.join(__dirname, "app.log");

// Default configuration
const defaultConfig = {
    apiToken: "YOUR_API_TOKEN",
    wledIP: "192.168.1.100",
    defaultEmergencyPreset: 1,
    wifiSSID: "",
    wifiPassword: "",
};

// App-level event emitter for GUI updates
const appEventEmitter = new EventEmitter();

// Log to both console and file
function log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, context };
    const logMessage = JSON.stringify(logEntry);
    console.log(logMessage);
    fs.appendFileSync(logFilePath, logMessage + "\n", "utf8");
}

// Validation Utilities
function validateEventSchema(event, requiredFields) {
    const missingFields = requiredFields.filter(field => !(field in event));
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
}

function validateIPAddress(ip) {
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(ip)) {
        throw new Error(`Invalid IP address: ${ip}`);
    }
}

function validatePresetNumber(preset) {
    if (typeof preset !== "number" || preset < 1) {
        throw new Error(`Invalid preset number: ${preset}`);
    }
}

// Validate user-provided configuration
function validateConfig(config) {
    const errors = [];

    try {
        validateIPAddress(config.wledIP);
    } catch (err) {
        errors.push(err.message);
    }

    if (!config.apiToken || typeof config.apiToken !== "string" || config.apiToken.length < 70) {
        errors.push("Invalid API token. It must be a string with at least 70 characters.");
    }

    try {
        validatePresetNumber(config.defaultEmergencyPreset);
    } catch (err) {
        errors.push(err.message);
    }

    if (config.wifiSSID && typeof config.wifiSSID !== "string") {
        errors.push("Invalid WiFi SSID");
    }

    if (config.wifiPassword && typeof config.wifiPassword !== "string") {
        errors.push("Invalid WiFi password");
    }

    if (errors.length > 0) {
        throw new Error(errors.join(" \n"));
    }
}

// Load or create configuration file
let config = defaultConfig;
if (fs.existsSync(configPath)) {
    try {
        const rawConfig = fs.readFileSync(configPath);
        config = { ...defaultConfig, ...JSON.parse(rawConfig) };

        // If .env file contains a valid token, use it to override config.json
        if (process.env.API_TOKEN && process.env.API_TOKEN.length >= 70) {
            config.apiToken = process.env.API_TOKEN;
        }

        validateConfig(config);
        log("info", "Configuration loaded successfully.", { config }, "[STARTUP]");
    } catch (err) {
        log("error", "Failed to load or validate configuration file. Using defaults.", { error: err.message }, "[STARTUP]");
        config = defaultConfig;
    }
} else {
    // Fallback to .env file if available
    if (process.env.API_TOKEN && process.env.API_TOKEN.length >= 70) {
        defaultConfig.apiToken = process.env.API_TOKEN;
    }
    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    log("info", "Default configuration created.", { config: defaultConfig }, "[STARTUP]");
}

// Save configuration helper
function saveConfig(newConfig) {
    const updatedConfig = { ...config, ...newConfig };
    try {
        validateConfig(updatedConfig);
        config = updatedConfig;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        appEventEmitter.emit("configUpdated", config);
        log("info", "Configuration updated.", { config });
    } catch (err) {
        log("error", "Failed to save configuration. Validation error.", { error: err.message });
    }
}

// Event Handlers
function handleEmergencyCreate(event) {
    try {
        validateEventSchema(event, ["id", "missionName", "threatLevel", "system", "respondingTeam"]);
        log("info", "EmergencyCreate event validated.", { event });
        setWLEDPreset(config.defaultEmergencyPreset);
    } catch (err) {
        log("error", "Invalid EmergencyCreate event.", { error: err.message });
    }
}

// Initialize Express.js for GUI API
const app = express();
app.use(express.json());

// API Endpoints
app.get("/api/dashboard", (req, res) => {
    res.json({
        userStatus: "Active",
        listenerStatus: "Running",
        emergencyPreset: config.defaultEmergencyPreset,
    });
});

app.get("/api/mystats", (req, res) => {
    res.json({
        missionsCompleted: 10, // Placeholder for real data
        emergenciesHandled: 3, // Placeholder for real data
        standbyTime: "5 hours", // Placeholder for real data
    });
});

app.get("/api/settings", (req, res) => {
    res.json({
        apiToken: config.apiToken,
        wifiSSID: config.wifiSSID,
        wifiPassword: config.wifiPassword,
    });
});

app.put("/api/settings", (req, res) => {
    const { apiToken, wifiSSID, wifiPassword, wledIP, defaultEmergencyPreset } = req.body;
    try {
        saveConfig({ apiToken, wifiSSID, wifiPassword, wledIP, defaultEmergencyPreset });
        res.json({ message: "Settings updated successfully." });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start Express.js server
const PORT = 3000;
app.listen(PORT, () => {
    log("info", `GUI API server running on http://localhost:${PORT}`);
});

// Retry logic for WLED connection
async function retryWLEDConnection(attempts = 3) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const response = await axios.get(`http://${config.wledIP}/json/state`);
            if (response.status === 200) {
                log("info", "Successfully reconnected to WLED device.", { ip: config.wledIP });
                return;
            }
        } catch (err) {
            log("warn", `WLED connection attempt ${attempt} failed.`, { error: err.message });
        }
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
    }
    log("error", "Failed to reconnect to WLED device after multiple attempts.");
}

// Function to restart Listener process
function restartListener() {
    log("info", "Restarting Listener process...");
    return startListener();
}

// Function to start the Listener applet
function startListener() {
    const listenerPath = path.join(__dirname, "listener.js");
    let listenerProcess;

    try {
        listenerProcess = spawn("node", [listenerPath], { stdio: "inherit" });
    } catch (err) {
        log("error", "Failed to start Listener process.", { error: err.message });
        return null;
    }

    listenerProcess.on("close", (code) => {
        log("error", "Listener exited unexpectedly.", { code });
        restartListener();
    });

    listenerProcess.on("error", (err) => {
        log("error", "Listener process encountered an error.", { error: err.message });
    });

    return listenerProcess;
}

// Directly integrate the Emitter functionality
function startEmitter() {
    try {
        emitter.initializeEmitter();
        log("info", "Emitter initialized successfully.");
    } catch (err) {
        log("error", "Failed to initialize Emitter.", { error: err.message });
    }
}

// Monitor configuration file for changes
fs.watch(configPath, (eventType) => {
    if (eventType === "change") {
        try {
            const rawConfig = fs.readFileSync(configPath);
            const updatedConfig = JSON.parse(rawConfig);
            validateConfig(updatedConfig);
            config = updatedConfig;
            log("info", "Configuration file updated and reloaded successfully.", { config });
            appEventEmitter.emit("configUpdated", config);
        } catch (err) {
            log("error", "Failed to reload configuration file.", { error: err.message });
        }
    }
});

// Initialize the Parent App
function initializeParentApp() {
    log("info", "Starting Parent App...");

    // Start Listener
    const listener = startListener();

    if (!listener) {
        log("error", "Failed to initialize Listener. Exiting Parent App.");
        process.exit(1);
    }

    // Start Emitter
    startEmitter();

    // Example: Listen for events emitted by Listener
    const listenerEvents = require("./listener").eventEmitter;

    listenerEvents.on("EmergencyCreate", handleEmergencyCreate);

    // Cleanup on exit
    process.on("SIGINT", () => {
        if (listener) listener.kill();
        log("info", "Parent App shutting down...");
        process.exit();
    });
}

// Start the Parent App
initializeParentApp();

module.exports = { initializeParentApp, saveConfig, appEventEmitter };
