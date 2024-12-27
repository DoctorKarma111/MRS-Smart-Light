### Emitter Applet Documentation

---

## Overview
The Emitter Applet is a Node.js application designed to listen for events emitted by the Listener Applet and trigger actions on a WLED system. It acts as a bridge between the event-driven Listener and the WLED system, making it easy to respond to events like emergencies by changing LED presets or colors.

---

## Features

- **Event Listening**: Subscribes to events like `EmergencyCreate` emitted by the Listener.
- **WLED Communication**: Uses the WLED HTTP API to trigger LED presets based on event data.
- **Dynamic Configuration**: Reads configuration from a shared JSON file and reloads updates dynamically.
- **Error Handling**: Comprehensive error handling for configuration, network issues, and event payloads.
- **Logging**: JSON-formatted logs with unique instance identifiers for easy debugging and monitoring.
- **Extensibility**: Modularized structure to support additional events or WLED actions.

---

## Application Structure

### Key Files

- `index.js`: Main entry point of the app. Initializes event listeners and handles WLED actions.
- `eventHandlers.js`: Contains event-specific handlers (e.g., `handleEmergencyCreate`).
- `config.json`: Shared configuration file for managing WLED IP and default presets.
- `wledClient.js` (optional for future iterations): Handles WLED-specific API calls.

---

## How It Works

### Event Handling
The Emitter listens for events emitted by the Listener's EventEmitter. Each event has a corresponding handler in the `eventHandlers` module.

**Example:**
```javascript
const { eventEmitter } = require("./listener");
const eventHandlers = require("./eventHandlers");

// Register event listeners
eventEmitter.on("EmergencyCreate", (emergency) => {
    eventHandlers.handleEmergencyCreate(emergency, config);
});
```

**Example: EmergencyCreate**
When an `EmergencyCreate` event is received, the app triggers a WLED preset based on the event payload.
```javascript
async function handleEmergencyCreate(emergency, config) {
    console.log("Emergency received:", emergency);
    await triggerWLEDPreset(config.defaultEmergencyPreset);
}
```

### WLED Integration
The app communicates with WLED using the HTTP API. For example, to trigger a preset:
```javascript
const axios = require("axios");

async function triggerWLEDPreset(presetId) {
    const url = `http://${config.wledIP}/win&PL=${presetId}`;
    try {
        await axios.get(url);
        console.log(`Preset ${presetId} triggered successfully.`);
    } catch (err) {
        console.error("Failed to trigger WLED preset:", err.message);
    }
}
```

### Configuration Management
The app reads its configuration from a shared JSON file (`config.json`) and dynamically reloads it when changes are detected.

**Configuration Includes:**
- **WLED IP**: The IP address of the WLED device.
- **Default Preset**: The preset to use for specific events (e.g., emergencies).

**Example Configuration:**
```json
{
    "wledIP": "192.168.1.100",
    "defaultEmergencyPreset": 1
}
```

### Logging
Logs are JSON-formatted and include:
- **Timestamp**: ISO format timestamp.
- **Level**: Log level (info, warn, error).
- **Instance ID**: Unique identifier for each app instance.
- **Message**: Description of the event or error.
- **Context**: Additional details about the log entry.

**Example Log:**
```json
{
    "timestamp": "2024-12-22T15:00:00Z",
    "level": "info",
    "instanceId": "instance-1672509600000",
    "message": "Configuration loaded successfully",
    "context": {
        "config": {
            "wledIP": "192.168.1.100",
            "defaultEmergencyPreset": 1
        }
    }
}
```

### Self-Check Mechanism
The app logs a periodic heartbeat to confirm it is running and listening for events:
```json
{
    "timestamp": "2024-12-22T15:01:00Z",
    "level": "info",
    "instanceId": "instance-1672509600000",
    "message": "Self-check: Emitter is active and listening for configuration updates and events.",
    "context": {
        "configPath": "../shared/config.json",
        "currentConfig": {
            "wledIP": "192.168.1.100",
            "defaultEmergencyPreset": 1
        }
    }
}
```

---

## Setup and Usage

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
Edit `config.json` or set environment variables:
- **`SHARED_CONFIG_PATH`**: Path to the shared configuration file.
- **`WLED_IP`**: IP address of the WLED device (overrides `config.json`).

### Running the App
Start the app:
```bash
node index.js
```

### Testing
1. Emit events from the Listener Applet:
   ```javascript
   eventEmitter.emit("EmergencyCreate", { threatLevel: 3 });
   ```
2. Verify WLED actions and logs.
3. Update `config.json` and confirm the app reloads dynamically.

---

## Extending the Applet

### Adding New Events
1. Add a new handler in `eventHandlers.js`.
2. Register the event in `index.js`:
   ```javascript
   eventEmitter.on("NewEvent", (payload) => {
       eventHandlers.handleNewEvent(payload, config);
   });
   ```

### Adding New WLED Actions
1. Add a new function in `wledClient.js` (optional).
2. Use the function in the corresponding event handler.

---

## Error Handling

### Configuration Errors
- Logs invalid configurations and uses fallback values.

### Network Errors
- Logs details of HTTP failures when communicating with WLED.

### Invalid Event Payloads
- Logs details of malformed payloads for debugging.

---

