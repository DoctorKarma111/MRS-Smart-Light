import { MedrunnerApiClient } from "@medrunner/api-client";
import * as fs from 'fs';

// function to read token from file
function getToken(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const tokenMatch = content.match(/token=(.*)/);
        
        if (tokenMatch) {
            return tokenMatch[1].trim();
        } else {
            throw new Error('Please enter a token in the "token" text file');
        }
    } catch (error) {
        console.error(`Error reading token from file: ${error.message}`);
        process.exit(1);
    }
}

const filePath = './token.txt';
const apiToken = getToken(filePath)


// authenticate with API
const apiConfig = {
    refreshToken: apiToken
};

const api = MedrunnerApiClient.buildClient(apiConfig);

// Connect
const ws = await api.websocket.initialize();
await ws.start();

// confirm connection
console.log(ws.state);

// event listeners

ws.on("PersonUpdate", (runner: Person) => {
    switch (runner.activeClass) {
        case 0: // No class. As far as I know, cannot be achieved after selecting a class.
            console.log(`${runner.rsiHandle} has joined a team or left a role`);
            break;
        case 1: // Medic
            console.log(`${runner.rsiHandle} has selected MED`);
            break;
        case 2: // Security
            console.log(`${runner.rsiHandle} has selected SEC`);
            break;
        case 3: // Pilot
            console.log(`${runner.rsiHandle} has selected PIL`);
            break;
        case 4: // Lead
            console.log(`${runner.rsiHandle} has selected LEAD`);
            break;
        case 5: // Dispatch
            console.log(`${runner.rsiHandle} has selected DIS`);
            break;
        case 6: // Dispatch_Lead
            console.log(`${runner.rsiHandle} has selected DIS LEAD`);
            break;
        case 7: // Dispatch_Trainee
            console.log(`${runner.rsiHandle} has selected DIS TRAIN`);
            break;
        case 8: // Dispatch_Observer
            console.log(`${runner.rsiHandle} has selected DIS OBS`);
            break;
        case 9: // QRF
            console.log(`${runner.rsiHandle} has selected QRF`);
            break;
        case 10: // Logistics
            console.log(`${runner.rsiHandle} has selected LOG`);
            break;
    }
});

ws.on("EmergencyCreate", (emergency: Emergency) => {
    console.log(`Emergency "${emergency.id}" alert has been created, submitted by ${emergency.clientRsiHandle}`)
});