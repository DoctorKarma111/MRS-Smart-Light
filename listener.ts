import { MedrunnerApiClient } from "@medrunner/api-client";
import * as fs from 'fs';

// function to read token from file
function getToken(filePath: string): string {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const tokenMatch = content.match(/token=(.*)/);
        
        if (tokenMatch) {
            const token = tokenMatch[1].trim();
            
            if (token === 'ENTER_TOKEN_HERE') {
                throw new Error('Please enter a Medrunner API token in the token text file')
            }

            return token

        } else {
            throw new Error('Token not found in token file');
        }
    } catch (error) {
        console.error(`Error reading token from file: ${error.message}`);
        process.exit(1);
    }
}

// define token filepath and call function to read token
const filePath = './token.txt';
const apiToken = getToken(filePath)

// authenticate with API
let ws;
try {
    const apiConfig = {
        refreshToken: apiToken
    };

    const api = MedrunnerApiClient.buildClient(apiConfig);

    ws = await api.websocket.initialize();
    await ws.start();
} catch (error) {
    console.error('Invalid Medrunner API token. Has yours expired?');
    process.exit(1);
}

// confirm connection
console.log(ws.state);

// medrunner update listener, for if we want to have any response to joining & leaving and/or selecting a class
ws.on("PersonUpdate", (runner: Person) => {
    switch (runner.activeClass) {
//        case 0: // No class. As far as I know, cannot be achieved after selecting a class.
//            console.log(`${runner.rsiHandle} has joined a team or left a role`);
//            break;
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

// new alert listener, operates independently of whether or not medrunner is currently in a team
ws.on("EmergencyCreate", (emergency: Emergency) => {
    console.log(`Emergency "${emergency.missionName}" alert has been created, submitted by ${emergency.clientRsiHandle}`)
});