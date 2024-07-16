const { IPSA, MeetingConnection } = require('@jibb-open/jssdk/ws');
const { Config } = require('@jibb-open/jssdk/config.js');
const { Auth, Meeting } = require('@jibb-open/jssdk/api');
const { types } = require('@jibb-open/jssdk/types/proto');
const yargs = require('yargs');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

let apikey = '';
let title = 'JIBB';
let meetingId = '';
let userToken = '';
let meetingToken = '';
let videoPath = '';
let frameData = []
let frameNum = 1;


async function configure(apikey) {
    await Auth.configure({ apiKey: apikey });
}

async function getToken() {
    return await Auth.getUserToken();
}

async function createMeeting(title) {
    return await Meeting.createMeeting({ title: title, isTemporary: true })
}

async function getMeetingToken(meetingId) {
    return await Meeting.getMeetingToken({ meetingId: meetingId, permission: 31 })
}
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function readVideo(videoPath) {
    console.log('Reading video file', videoPath);
    const command = ffmpeg()
        .input(videoPath)
        .inputFormat('mp4')
        .outputFormat('image2pipe')
        .videoCodec('mjpeg')
        .on('end', () => {
            console.log('Video processing finished. Wait to proccess the images...');
            sendFrames(frameData);
        })
        .on('error', (err) => {
            console.error('Error:', err);
        })
        .pipe();
    command.on('data', (frame) => {
        frameData.push(frame)
    });
}

async function sendFrames(frameData) {
    const seekFrames = 1
    for (frameNum; frameNum < frameData.length; frameNum += seekFrames) {
        await sleep(500);
        await processFrame(frameData[frameNum]);
    }
}

async function processFrame(frameBuffer) {
    await sleep(500);
    try {
        await IPSA.writeData(frameBuffer)
    } catch (error) {
        console.error('Error writing data to IPSA:', error.message);
    }
}

function onErrorMeeting(err) {
    console.error('On meeting error', err);
    MeetingConnection.stop();
}

function onErrorIpsa(err) {
    console.error('On IPSA error', err);
    IPSA.stop();
}

function cleanUp() {
    onErrorIpsa;
    onErrorMeeting;
}

process.on('SIGINT', () => {
    console.log('Received SIGINT. Cleaning up...');
    cleanUp();
    process.exit(0);
});

async function startIpsa(meetingId, meetingToken, userToken, videopath) {
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
    })
    IPSA.addEventListener({
        onError: onErrorIpsa
    })

    try {
        await IPSA.start({ meetingToken: meetingToken, request: request })
    } catch (error) {
        console.error('An error occurred:', error);
    }
    await readVideo(videoPath);
}

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
    apikey = argv.api;
    videoPath = argv.videoPath;

    Config.apiBaseURL = 'https://api.jibb.ai';

    await configure(apikey);
    userToken = await getToken();
    meetingId = await createMeeting(title);
    meetingToken = await getMeetingToken(meetingId);
    console.log('*****URL*****')
    console.log(`https://app.jibb.ai/workspace/${meetingId}?user_token=${userToken}`)
    console.log('**********')
    await startIpsa(meetingId, meetingToken, userToken, Config, videoPath);
}

main();