const { VideoCapture } = require('camera-capture');
const fs = require('fs');
const { Config } = require('@jibb-open/jssdk/config.js');
const { IPSA, MeetingConnection } = require('@jibb-open/jssdk/ws');
const { Auth, Meeting } = require('@jibb-open/jssdk/api');
const { types } = require('@jibb-open/jssdk/types/proto');
const yargs = require('yargs');
const jpeg = require('jpeg-js');

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

// Function to convert ImageData to base64
const imageDataToBase64 = (imageData) => {
    const rawImageData = {
        data: imageData.data,
        width: imageData.width,
        height: imageData.height
    };
    const jpegImageData = jpeg.encode(rawImageData, 90); // 90 is the quality level
    return jpegImageData.data.toString('base64');
};

// Function to capture frames using camera-capture
const captureFrames = async () => {
    const interval = 1000; // Capture frame every 1000 milliseconds (1 second)
    const c = new VideoCapture();

    let capturing = false;

    c.addFrameListener(frame => {
        if (!capturing) return;

        const base64Data = imageDataToBase64(frame);

        try {
            // Sending Images to IPSA for AI processing
            IPSA.writeData(base64Data)
                .then(() => {
                    // Schedule the next frame capture
                    setTimeout(() => captureFrame(), interval);
                })
                .catch((error) => {
                    console.error('Error writing data to IPSA:', error.message);
                    capturing = false;
                });
        } catch (error) {
            console.error('Error processing frame:', error.message);
            capturing = false;
        }
    });

    const captureFrame = () => {
        if (capturing) return;
        capturing = true;
        c.start().catch(error => {
            console.error('Error starting capture:', error.message);
            capturing = false;
        });
    };

    captureFrame();
};

// Function to start the meeting and IPSA processing
async function start(meetingId, meetingToken, userToken) {
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

    // Start capturing frames
    captureFrames();
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
    await start(meetingId, meetingToken, userToken);
}

// Start the script
main();
