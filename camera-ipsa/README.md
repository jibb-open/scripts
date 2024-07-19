# Camera IPSA

A Node.js application for capturing frames from a webcam at regular intervals and processing them with JIBB's AI.

## Description

This project captures frames from a webcam every 500 milliseconds, converts them to base64, and sends them to IPSA for AI processing. The application also sets up and manages a JIBB meeting session using `node-webcam`.

## Prerequisites

- Node.js (v14 or higher recommended)

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/jibb-open/scripts.git
    ```

2. Navigate to the project directory:

    ```bash
    cd camera-ipsa
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

## Usage

### Using npm start

Run the application with the required arguments:

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

## Features
- Capture frames from a webcam at 500ms intervals
- Convert frames to base64
- Send frames to IPSA for AI processing
- Manage JIBB meeting sessions


## Technologies Used
- node-webcam: For capturing frames from the webcam
- inquirer: For prompting user input
- yargs: For command-line argument parsing
- @jibb-open/jssdk: For interacting with JIBB services


## Error Handling
The application handles errors related to video processing and IPSA communication. Graceful shutdown is implemented to clean up resources on receiving SIGINT (Ctrl+C).

## License
JIBB
