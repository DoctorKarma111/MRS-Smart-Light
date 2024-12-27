### Listener Applet Documentation

---

## Overview
The Listener applet establishes a WebSocket connection to the Medrunner API and handles real-time updates for specific events. It uses an EventEmitter to broadcast these updates for integration with other applets. This applet includes robust error handling, retry mechanisms, and support for emitting predictable payload structures.

---

## Features

- **WebSocket Connection**: Establishes a persistent WebSocket connection to listen for real-time events.
- **Retry Mechanism**: Automatically retries WebSocket connection on failure up to a configurable limit.
- **Event Handling**: Processes and emits key Medrunner API events for inter-applet communication.
- **Configurable API Token**: Uses a `.env` file to securely store and validate the API token.

---

## File Structure

### `.env File`
- Stores the API token for authentication.
- Automatically created if missing.
- **Example content:**
  ```
  API_TOKEN=YOUR_TOKEN_HERE
  ```

### EventEmitter Integration
- Used for inter-applet communication.
- Listens for Medrunner WebSocket events and emits structured payloads.

---

## Event Descriptions

| **Event Name**      | **Payload Structure**                                                                                      |
|----------------------|----------------------------------------------------------------------------------------------------------|
| **PersonUpdate**    | `{ id, rsiHandle, active, activeEmergency, roles, updated }`                                              |
| **EmergencyCreate** | `{ id, missionName, clientRsiHandle, system, threatLevel, respondingTeam, created }`                     |
| **EmergencyUpdate** | `{ id, status, remarks, updated }`                                                                       |
| **ChatMessageCreate** | `{ id, contents, emergencyId, senderId, created, messageSentTimestamp, updated }`                       |
| **OrgSettingsUpdate** | `{ id, created, updated, public }`                                                                      |

---

## Setup and Usage

### Prerequisites
- **Node.js** installed.
- **Medrunner API token** available.

### Installation
1. Clone the repository.
2. Navigate to the applet directory.
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Listener
1. Add your API token to the `.env` file.
2. Start the applet:
   ```bash
   node listener.js
   ```

### Expected Console Output
- **On successful connection**:
  ```
  WebSocket connected: ...
  WebSocket connection established after X seconds.
  ```
- **On retry**:
  ```
  Retrying WebSocket connection in Y seconds...
  ```
- **On event emission**:
  Logs structured details for each event.

---

## Code Structure

### **initializeWebSocket**
- Initializes the WebSocket connection.
- Retries up to 5 times with a delay of 5 seconds.
- Logs connection state and elapsed time on success.

### **registerEventHandlers**
- Registers WebSocket event listeners for:
  - **PersonUpdate**
  - **EmergencyCreate**
  - **EmergencyUpdate**
  - **ChatMessageCreate**
  - **OrgSettingsUpdate**

### Event Handlers

| **Handler**               | **Description**                                                                 |
|---------------------------|---------------------------------------------------------------------------------|
| **handlePersonUpdate**    | Processes `PersonUpdate` events. Logs user activity and emits a structured payload. |
| **handleEmergencyCreate** | Processes `EmergencyCreate` events. Logs details and emits a structured payload. |
| **handleEmergencyUpdate** | Processes `EmergencyUpdate` events. Logs status updates and emits a structured payload. |
| **handleChatMessageCreate** | Processes `ChatMessageCreate` events. Logs new messages and emits a structured payload. |
| **handleOrgSettingsUpdate** | Processes `OrgSettingsUpdate` events. Logs organization settings and emits a structured payload. |

---

## Error Handling

### WebSocket Connection Errors
- Retries connection up to 5 times.
- Logs detailed error messages and stack traces.

### Event Errors
- Logs warnings if events contain missing or invalid data.

---

## Adding New Events
1. Add a listener in `registerEventHandlers`.
2. Create a corresponding handler function.
3. Emit the event using `eventEmitter.emit` with a structured payload.

---

## Debugging Tips

- Ensure the `.env` file contains a valid API token.
- Use `console.log` to debug emitted events and payloads.
- Check retry logs if the WebSocket fails to connect.

---

## Extending the Applet

### New Features
- Add handlers for additional Medrunner API events.
- Integrate with other applets using `eventEmitter`.

### Error Handling
- Enhance logging with timestamps or external logging libraries.

### Monitoring
- Use tools like PM2 for running and monitoring the listener applet.

---

## Known Limitations
- Relies on a stable network connection.
- Retry logic is limited to 5 attempts.

---

## Contact and Support
For issues or feature requests, contact the developer or refer to the Medrunner API documentation.

