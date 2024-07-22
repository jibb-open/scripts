# Camera Capture Script

This script allows you to capture frames from your webcam and send them to IPSA for AI processing. The frames are captured at intervals of 1 second.

## Description

This project captures frames from a webcam every 500 milliseconds, converts them to base64, and sends them to IPSA for AI processing. The application also sets up and manages a JIBB meeting session using `node-webcam`.

## Prerequisites

Before running the script, ensure you have the following installed:

- Node.js (version 12.x or higher)
- npm (Node Package Manager)
- Webcam drivers (for Windows)
- `camera-capture` library
- `inquirer` library
- `jpeg-js` library
- API key for JIBB

## Installation

1. Clone the repository or download the script.
2. Navigate to the project directory.
3. Install the required dependencies:

    ```bash
    npm install
    ```

4. Ensure your camera is pointed at the whiteboard before running the script.

## Usage

### Using npm start

1. Open a terminal and navigate to the project directory.
2. Run the script with your API key:

```bash
npm start -- -k <your_api_key>
```

Example:
```bash
npm start -- -k your_api_key_here
```

Choosing a Camera
After starting the application, you will be prompted to select a webcam device from a list of available devices. Use the arrow keys to navigate and press Enter to select the desired camera.

## Output
Once the service starts, it will process the video and output the frames. You can access the processed output by visiting the URL provided in the console log:
```bash
*****URL*****
https://app.jibb.ai/workspace/<meeting_id>?user_token=<user_token>
*************
```

## Important Notes

- Make sure your webcam is properly connected and accessible.
- Ensure that your camera is pointed at the whiteboard before starting the script to capture the correct frames.
- If you encounter any issues with frame capturing, check the console for error messages and ensure all dependencies are installed correctly.

## Script Overview

### Dependencies
The script uses the following libraries:
- `camera-capture`: To capture frames from the webcam.
- `inquirer`: To prompt the user to select a camera (if required).
- `jpeg-js`: To encode ImageData to JPEG format.
- `@jibb-open/jssdk`: To interact with the JIBB API.

### Functions
- `configure(apikey)`: Configures the API key.
- `getToken()`: Retrieves the user token.
- `createMeeting(title)`: Creates a meeting with the given title.
- `getMeetingToken(meetingId)`: Retrieves the meeting token.
- `onErrorMeeting(err)`: Handles meeting connection errors.
- `onErrorIpsa(err)`: Handles IPSA errors.
- `cleanUp()`: Stops MeetingConnection and IPSA.
- `imageDataToBase64(imageData)`: Converts ImageData to base64-encoded JPEG.
- `captureFrames()`: Captures frames from the selected camera.
- `start(meetingId, meetingToken, userToken)`: Starts the meeting and IPSA processing.
- `main()`: Main function to parse arguments and start the process.


## Error Handling
The application handles errors related to video processing and IPSA communication. Graceful shutdown is implemented to clean up resources on receiving SIGINT (Ctrl+C).

## License
JIBB
