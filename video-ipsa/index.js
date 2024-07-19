const ffmpeg = require('fluent-ffmpeg');
const { PassThrough } = require('stream');
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

// Function to take snapshots from a video
const takeSnapshots = (videoPath) => {
    // Get video duration
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
            console.error('Error getting video metadata:', err);
            return;
        }

        const duration = metadata.format.duration;
        const interval = 0.5; // 500 milliseconds
        let time = 0;

        // Function to capture a frame
        const captureFrame = () => {
            if (time >= duration) {
                console.log('All frames captured and logged.');
                cleanUp();
                return;
            }

            const stream = new PassThrough();

            // Capture a single frame from the video
            ffmpeg(videoPath)
                .seekInput(time)
                .outputOptions('-frames:v 1')
                .format('image2')
                .pipe(stream, { end: true });

            const chunks = [];
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            stream.on('end', async () => {
                const buffer = Buffer.concat(chunks);
                const base64Data = bufferToBase64(buffer);

                try {
                    // Sending Images to IPSA for AI processing
                    await IPSA.writeData(base64Data);
                } catch (error) {
                    console.error('Error writing data to IPSA:', error.message);
                }

                // Schedule the next frame capture
                time += interval;
                setTimeout(captureFrame, interval * 1000);
            });

            stream.on('error', (err) => {
                console.error('Error capturing frame:', err);
            });
        };

        // Start capturing frames
        captureFrame();
    });
};

// Function to start the meeting and IPSA processing
async function start(meetingId, meetingToken, userToken, videoPath) {
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

    await Meeting.startMeeting({ meetingId, meetingToken });

    MeetingConnection.addEventListener({
        onError: onErrorMeeting,
    });

    IPSA.addEventListener({
        onError: onErrorIpsa
    });

    try {
        await IPSA.start({ meetingToken: meetingToken, request: request });
    } catch (error) {
        console.error('An error occurred:', error);
    }

    takeSnapshots(videoPath);
}

// Main function to parse arguments and start the process
async function main() {
    const argv = yargs
        .option('videoPath', {
            alias: 'v',
            description: 'Specify the video filename',
            type: 'string',
        })
        .option('api', {
            alias: 'k',
            description: 'Specify the apikey',
            type: 'string',
        })
        .demandOption(['videoPath', 'api'])
        .argv;

    const apikey = argv.api;
    const videoPath = argv.videoPath;

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
    await start(meetingId, meetingToken, userToken, videoPath);
}

// Start the script
main();
