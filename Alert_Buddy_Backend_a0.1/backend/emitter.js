"use strict";

const fs = require("fs");
const axios = require("axios");
const path = require("path");
const { eventEmitter } = require("./listener"); // Assuming Listener and Emitter are in the same project
const eventHandlers = require("./eventHandlers"); // Modularized event handlers
const instanceId = process.env.INSTANCE_ID || `instance-${Date.now()}`; // Unique identifier for this instance

// Logging utility with log levels
function log(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        instanceId,
        message,
        context,
    };
    console.log(`[${level.toUpperCase()}] ${timestamp} [${instanceId}] ${message}`);
    if (Object.keys(context).length) {
        console.log(JSON.stringify(context, null, 2));
    }
}

// Path to shared configuration file, configurable via an environment variable
const sharedConfigPath = process.env.SHARED_CONFIG_PATH || path.join(__dirname, "../shared/config.json");

// Validate if the provided configuration path is valid and writable
function validateConfigPath(configPath) {
    try {
        const dirPath = path.dirname(configPath);
        fs.accessSync(dirPath, fs.constants.W_OK);
    } catch (err) {
        log("error", "The configuration path is not writable.", { configPath, error: err.message });
        process.exit(1); // Exit with failure code
    }
}

validateConfigPath(sharedConfigPath);

let config = {
    wledIP: "192.168.1.100", // Default IP for WLED
    defaultEmergencyPreset: 1, // Default preset for emergencies
};

// Schema validation function for configuration
function validateConfigSchema(config) {
    const schema = {
        wledIP: "string",
        defaultEmergencyPreset: "number",
    };
    for (const key in schema) {
        if (typeof config[key] !== schema[key]) {
            log("error", "Schema validation failed.", { key, expectedType: schema[key], providedType: typeof config[key], invalidValue: config[key] });
            throw new Error(`Invalid configuration: ${key} must be a ${schema[key]}.`);
        }
    }
}

// Load shared configuration
if (fs.existsSync(sharedConfigPath)) {
    try {
        const rawConfig = fs.readFileSync(sharedConfigPath);
        const parsedConfig = JSON.parse(rawConfig);
        validateConfigSchema(parsedConfig);
        config = parsedConfig;
        log("info", "Configuration loaded successfully", { config });
    } catch (err) {
        log("error", "Failed to load or validate shared configuration, using defaults.", { error: err.message, path: sharedConfigPath });
    }
} else {
    // Create the shared configuration file with default values
    try {
        fs.mkdirSync(path.dirname(sharedConfigPath), { recursive: true });
        fs.writeFileSync(sharedConfigPath, JSON.stringify(config, null, 2));
        log("info", "Default shared configuration file created", { path: sharedConfigPath });
    } catch (err) {
        log("error", "Failed to create shared configuration file", { error: err.message });
    }
}

// Debounced reload function
let reloadTimeout;
function debouncedReloadConfig() {
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => {
        try {
            const rawConfig = fs.readFileSync(sharedConfigPath);
            const parsedConfig = JSON.parse(rawConfig);
            validateConfigSchema(parsedConfig);
            config = parsedConfig;
            log("info", "Shared configuration updated", { config });
        } catch (err) {
            log("error", "Failed to reload or validate shared configuration", { error: err.message, invalidConfig: config });
        }
    }, 100); // 100ms debounce interval
}

// Watch for changes in the shared config file and reload dynamically
fs.watch(sharedConfigPath, (eventType) => {
    if (eventType === "change") {
        debouncedReloadConfig();
    } else if (eventType === "rename") {
        log("error", "Configuration file was moved or deleted. Please ensure it is available.", { path: sharedConfigPath });
    }
});

// Register event listeners
function registerEventListeners() {
    eventEmitter.on("EmergencyCreate", (emergency) => eventHandlers.handleEmergencyCreate(emergency, config));
    log("info", "Emitter is now listening for events.", { eventListeners: ["EmergencyCreate"] });
}

// Initialize the Emitter app
function initializeEmitter() {
    log("info", "Initializing Emitter...");
    try {
        registerEventListeners();
    } catch (err) {
        log("error", "Failed to initialize the Emitter app", { error: err.message });
        process.exit(1); // Exit with failure code
    }
}

module.exports = { initializeEmitter };

// Start the Emitter app if run directly
if (require.main === module) {
    try {
        initializeEmitter();
    } catch (err) {
        log("error", "Unexpected error during startup", { error: err.message, stack: err.stack, instanceId });
        process.exit(1); // Exit with failure code
    }
}
