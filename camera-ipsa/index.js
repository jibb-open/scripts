const NodeWebcam = require('node-webcam');
const inquirer = require('inquirer');
const os = require('os');
const { Config } = require('@jibb-open/jssdk/config.js');
const { IPSA, MeetingConnection } = require('@jibb-open/jssdk/ws');
const { Auth, Meeting } = require('@jibb-open/jssdk/api');
const { types } = require('@jibb-open/jssdk/types/proto');
const yargs = require('yargs');

// Function to configure API key
async function configure(apikey) {
    await Auth.configure({ apiKey: apikey });
}

// Function to get user token
async function getToken() {
    return await Auth.getUserToken();
}

// Function to create a meeting
async function createMeeting(title) {
    return await Meeting.createMeeting({ title: title, isTemporary: true });
}

// Function to get meeting token
async function getMeetingToken(meetingId) {
    return await Meeting.getMeetingToken({ meetingId: meetingId, permission: 31 });
}

// Error handler for meeting connection errors
function onErrorMeeting(err) {
    console.error('On meeting error', err);
    MeetingConnection.stop();
}

// Error handler for IPSA errors
function onErrorIpsa(err) {
    console.error('On IPSA error', err);
    IPSA.stop();
}

// Function to stop MeetingConnection and IPSA
function cleanUp() {
    MeetingConnection.stop();
    IPSA.stop();
}

// Handle SIGINT (Ctrl+C) for graceful shutdown
process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    cleanUp();
    process.exit(0);
});

// Function to convert buffer to base64
const bufferToBase64 = (buffer) => {
    return buffer.toString('base64');
};

// Determine the driver based on the OS
const getDriver = () => {
    const platform = os.platform();
    if (platform === 'darwin') return 'mac';
    if (platform === 'win32') return 'dshow';
    if (platform === 'linux') return 'v4l2';
    return '';
};

// Simplified webcam configuration
const getWebcamOptions = (device) => ({
    device: device || false,
    callbackReturn: "buffer",
    driver: getDriver(), // Set the appropriate driver based on OS
    output: "jpeg" // Ensure a common output format
});

// Function to capture frames from webcam
const captureFrames = (webcam) => {
    const interval = 500; // Capture frame every 500 milliseconds

    const captureFrame = () => {
        webcam.capture("frame", (err, data) => {
            if (err) {
                console.error('Error capturing frame:', err);
                return;
            }

            const base64Data = bufferToBase64(data);

            try {
                // Sending Images to IPSA for AI processing
                IPSA.writeData(base64Data)
                    .then(() => {
                        // Schedule the next frame capture
                        setTimeout(captureFrame, interval);
                    })
                    .catch((error) => {
                        console.error('Error writing data to IPSA:', error.message);
                    });
            } catch (error) {
                console.error('Error processing frame:', error.message);
            }
        });
    };

    // Start capturing frames
    captureFrame();
};

// Function to start the meeting and IPSA processing
async function start(meetingId, meetingToken, userToken, device) {
    const surfaceType = types.SurfaceType.WHITEBOARD;

    let request = {
        config: {
            surfaceType: surfaceType,
            userId: userToken
        },
        runtimeConfig: {
            fixedCorners: false,
            enableColor: false
        }
    };

    // Start meeting
    await Meeting.startMeeting({ meetingId, meetingToken });

    // Add event listeners
    MeetingConnection.addEventListener({ onError: onErrorMeeting });
    IPSA.addEventListener({ onError: onErrorIpsa });

    try {
        // Start IPSA processing
        await IPSA.start({ meetingToken: meetingToken, request: request });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    // Initialize webcam once
    const webcam = NodeWebcam.create(getWebcamOptions(device));

    // Start capturing frames from webcam
    captureFrames(webcam);
}

// Main function to parse arguments and start the process
async function main() {
    const argv = yargs
        .option('api', {
            alias: 'k',
            description: 'Specify the API key',
            type: 'string',
        })
        .demandOption(['api'])
        .argv;

    const apikey = argv.api;

    // List available devices and prompt user to select one
    NodeWebcam.list(async (list) => {
        if (list.length === 0) {
            console.error('No webcams found.');
            process.exit(1);
        }

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'device',
                message: 'Select a webcam device:',
                choices: list
            }
        ]);

        const device = answers.device;

        // Configure API base URL
        Config.apiBaseURL = 'https://api.jibb.ai';

        // Configure API key and get tokens
        await configure(apikey);
        const userToken = await getToken();
        const meetingId = await createMeeting('JIBB');
        const meetingToken = await getMeetingToken(meetingId);

        console.log('*****URL*****');
        console.log(`https://app.jibb.ai/workspace/${meetingId}?user_token=${userToken}`);
        console.log('*************');

        // Start the meeting and processing
        await start(meetingId, meetingToken, userToken, device);
    });
}

// Start the script
main();
