# 🚨 Medtek Alert Buddy Smart Light Bar

**Alpha Version**  
_Integrating emerAlpha Version (Backend_v0.1)This project is currently under development and is in the alpha stage. If you're not familiar with its purpose, this repository might not be for you.
gency alerts with dynamic lighting using Medrunner API and WLED_

---

# 📝 About

The Medtek Alert Buddy Smart Light Bar is designed for Medrunner members. 
It integrates with the Medrunner API to receive alerts and triggers pre-configured lighting presets. 
This backend manages the communication, configuration, and event handling to ensure seamless operation.

---

## 🚀 Features

- **Event-driven Architecture**: Processes real-time updates from the Medrunner API to ensure seamless and responsive operations.
- **WLED Integration**: Communicates with WLED-configured ESP32 devices to trigger vibrant and dynamic lighting effects tailored to emergency scenarios.
- **REST API**: Designed with endpoints ready for GUI integration or external system access.
- **Modular Design**: Offers a decoupled architecture with independent components for improved maintainability and scalability.
- **Dynamic Configuration**: Enables live updates to settings without requiring application restarts.

---

## 📚 Documentation

This repository is divided into multiple well-documented components, ensuring clarity and ease of understanding:

- **[Listener Applet](docs/Listener.md)**: Establishes a connection with the Medrunner API to fetch real-time events and broadcasts them for downstream processing.
- **[Emitter Applet](docs/Emitter.md)**: Acts on received events by triggering specific WLED actions.
- **[Parent App](docs/ParentApp.md)**: Serves as the control hub, managing the Listener and Emitter applets while exposing a REST API for configuration.
- **[Event Handlers Module](docs/EventHandlers.md)**: Implements logic to process and respond to events like `EmergencyCreate`.

---

## 📋 Prerequisites

### Hardware Requirements
- **ESP32 Microcontroller**: Preloaded with WLED software. Refer to the [WLED Documentation](https://kno.wled.ge/) for setup instructions.

### Software Requirements
- **Node.js**: Version 18 or higher is required.
- **Medrunner API Token**: Obtain this via the [Medrunner API Documentation](https://medrunner.dev/).

---

## 🛠️ Setup and Usage

### Installation Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/DoctorKarma111/MRS-Smart-Light.git
   cd MRS-Smart-Light
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your environment**:
   - Create a `.env` file and add your API token:
     ```env
     API_TOKEN=your_api_token_here
     ```
   - Update `config.json` in the shared folder for WLED settings:
     ```json
     {
         "wledIP": "192.168.1.100",
         "defaultEmergencyPreset": 1
     }
     ```

### Running the Application
Launch the Parent App to initialize the system:
```bash
node Parent_app.js
```

---

## 🌟 Components Overview

### Listener Applet

The Listener Applet establishes a persistent WebSocket connection with the Medrunner API, enabling real-time event monitoring. It emits structured events for other applets to process, such as:

- **EmergencyCreate**: Indicates a new emergency has been created.
- **PersonUpdate**: Provides updates on personnel status.

Key Features:
- Robust retry logic ensures consistent connectivity.
- EventEmitter integration allows seamless communication with other applets.

For detailed documentation, visit the [Listener Applet Documentation](docs/Listener.md).

### Emitter Applet

The Emitter Applet is responsible for taking action on events received from the Listener Applet. It communicates with WLED devices to trigger dynamic lighting effects such as preset changes or custom color displays.

Key Features:
- Processes events like `EmergencyCreate` to trigger lighting actions.
- Uses HTTP requests to interact with WLED devices.
- Dynamically configurable for presets and actions.

For detailed documentation, visit the [Emitter Applet Documentation](docs/Emitter.md).

### Parent App

The Parent App acts as the central control hub, managing the Listener and Emitter applets while exposing REST API endpoints for monitoring and configuration. This app serves as the backbone of the system, ensuring all components work cohesively.

Key Features:
- Provides `/api` endpoints for status and settings.
- Dynamically reloads configuration from `config.json`.
- Handles critical processes like applet restart upon failure.

For detailed documentation, visit the [Parent App Documentation](docs/ParentApp.md).

### Event Handlers Module

The Event Handlers Module provides the logic to process and respond to specific events received from the Listener. It integrates directly with the Emitter to trigger actions on WLED devices. 

Key Example: **Handling EmergencyCreate Events**

When an `EmergencyCreate` event is emitted, this module processes the payload, retrieves the relevant configuration, and sends an HTTP request to the WLED device to activate the designated preset.

**Implementation:**
```javascript
const axios = require("axios");

async function handleEmergencyCreate(emergency, config) {
    console.log("EmergencyCreate event received:", emergency);

    const presetId = config.defaultEmergencyPreset || 1;
    const wledIP = config.wledIP || "WLED_IP_HERE";

    try {
        await axios.get(`http://${wledIP}/&P1=${presetId}`);
        console.log(`WLED preset ${presetId} triggered successfully for IP ${wledIP}.`);
    } catch (error) {
        console.error("Failed to trigger WLED preset:", error.message);
    }
}
```

For detailed documentation, visit the [Event Handlers Module Documentation](docs/EventHandlers.md).

---

## 🛡️ License

This project is licensed under the ISC License. See the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

We welcome contributions! Please review the contribution guidelines for more details on how to get involved.

---

## 📷 Screenshots

Screenshots and visuals showcasing the system in action will be added in future updates.

---

## 🌐 Links and Resources

- [WLED Documentation](https://kno.wled.ge/)
- [Medrunner API Documentation](https://medrunner.dev/)
- [GitHub Repository](https://github.com/DoctorKarma111/MRS-Smart-Light)

---

