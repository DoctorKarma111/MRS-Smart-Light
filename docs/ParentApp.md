### Parent App Documentation

---

## Overview
The Parent App acts as the central controller for managing the Listener and Emitter applets. It integrates with the Medrunner API, WLED devices, and other system components to provide a seamless experience for monitoring events and triggering emergency light responses. While the Parent App does not include a GUI, it provides an API for integration with future front-end applications or other systems.

---

## Features

- **REST API**: Exposes endpoints for dashboard and configuration management.
- **Event Integration**: Listens to events from the Listener and triggers actions on the Emitter.
- **Dynamic Configuration**: Reads from a shared `config.json` file and dynamically reloads changes.
- **Logging**: Logs all system actions and events to both the console and a log file.
- **Error Handling**: Robust mechanisms for handling configuration, network issues, and applet failures.
- **Restart Mechanisms**: Automatically restarts the Listener applet if it crashes.
- **Extensibility**: Designed to support additional applets or functionalities in the future.

---

## Application Structure

### Key Files

- **Parent_app.js**: Main entry point of the application.
- **config.json**: Shared configuration file for managing API tokens, WLED IP, and emergency presets.
- **app.log**: Log file for storing system actions and error reports.

---

## How It Works

### Initialization
The Parent App initializes by:
1. **Loading Configuration**: Reads `config.json` and validates settings.
2. **Starting Applets**:
   - **Listener**: Monitors the Medrunner API and emits events.
   - **Emitter**: Listens for these events and triggers WLED actions.
3. **Setting Up REST API**: Provides endpoints for managing settings and viewing status.

### Event Handling
**Example: EmergencyCreate**
- The Listener emits an `EmergencyCreate` event.
- The Parent App listens for the event and triggers the default WLED preset.

**Code Example:**
```javascript
listenerEvents.on("EmergencyCreate", handleEmergencyCreate);

function handleEmergencyCreate(event) {
    console.log("Emergency received:", event);
    setWLEDPreset(config.defaultEmergencyPreset);
}
```

### Configuration Management
The Parent App monitors `config.json` for changes and reloads the configuration dynamically. It also supports updates via the REST API.

**Example Configuration:**
```json
{
    "apiToken": "YOUR_API_TOKEN",
    "wledIP": "192.168.1.100",
    "defaultEmergencyPreset": 1,
    "wifiSSID": "",
    "wifiPassword": ""
}
```

### WLED Integration
The app communicates with WLED devices via HTTP requests.

**Example:**
```javascript
async function setWLEDPreset(preset) {
    const url = `http://${config.wledIP}/win&PL=${preset}`;
    try {
        await axios.get(url);
        console.log(`WLED preset ${preset} triggered successfully.`);
    } catch (err) {
        console.error("Error triggering WLED preset:", err.message);
    }
}
```

---

## API Endpoints

### `/api/dashboard`
- **Method**: GET
- **Description**: Retrieves the current status of the system.
- **Response Example**:
  ```json
  {
      "userStatus": "Active",
      "listenerStatus": "Running",
      "emergencyPreset": 1
  }
  ```

### `/api/settings`
- **Method**: GET
- **Description**: Retrieves current configuration settings.
- **Response Example**:
  ```json
  {
      "apiToken": "YOUR_API_TOKEN",
      "wifiSSID": "",
      "wifiPassword": "",
      "wledIP": "192.168.1.100",
      "defaultEmergencyPreset": 1
  }
  ```

- **Method**: PUT
- **Description**: Updates configuration settings.
- **Request Body Example**:
  ```json
  {
      "apiToken": "NEW_TOKEN",
      "wledIP": "192.168.1.101",
      "defaultEmergencyPreset": 2
  }
  ```

---

## Error Handling

### Configuration Errors
- Logs validation errors and falls back to default values.
- Example Log:
  ```json
  {
      "level": "error",
      "message": "Invalid API token",
      "context": {
          "token": "INVALID_TOKEN"
      }
  }
  ```

### Network Issues
- Retries WLED connections up to 3 times before logging a failure.

### Applet Failures
- Automatically restarts the Listener applet if it crashes.

---

## Logging
Logs are saved to `app.log` in JSON format for easy monitoring and debugging.

**Example Log Entry:**
```json
{
    "timestamp": "2024-12-22T15:00:00Z",
    "level": "info",
    "message": "Configuration loaded successfully",
    "context": {
        "config": {
            "apiToken": "YOUR_API_TOKEN",
            "wledIP": "192.168.1.100",
            "defaultEmergencyPreset": 1
        }
    }
}
```

---

## Extending the Parent App

### Adding New Applets
1. Create a new module for the applet.
2. Register the applet in `initializeParentApp`.

### Adding New Events
1. Define a new event handler in the Parent App.
2. Register the event with the Listener's EventEmitter.

---

## Setup and Usage

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
Start the Parent App:
```bash
node Parent_app.js
```

### Testing
- Use the `/api` endpoints to verify the app is running correctly.
- Emit events from the Listener to confirm proper integration with WLED.

---

## Known Limitations

- **Network Dependency**: Requires a stable connection to both the Medrunner API and the WLED device.
- **Manual Configuration**: Initial setup requires editing `config.json` or environment variables.

---

