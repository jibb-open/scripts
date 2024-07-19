# Video Streaming

A Node.js application for capturing frames from a video at regular intervals and processing them.

## Description

This project captures frames from a video file every 500 milliseconds, converts them to base64, and sends them to IPSA for AI processing. The application also sets up and manages a JIBB meeting session.

## Prerequisites

- Node.js (v14 or higher recommended)
- `ffmpeg` installed on your system and accessible in your PATH

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/jibb-open/scripts.git
    ```

2. Navigate to the project directory:

    ```bash
    cd video-ipsa
    ```

3. Install the dependencies:

    ```bash
    npm install
    ```

## Usage

### Using npm start

Run the application with the required arguments:

```bash
npm start -- -v <path_to_video_file> -k <your_api_key>
```
Example:
```bash
npm start -- -v video.mp4 -k your_api_key_here
```

## Output
Once the service starts, it will process the video and output the frames. You can access the processed output by visiting the URL provided in the console log:
```bash
*****URL*****
https://app.jibb.ai/workspace/<meeting_id>?user_token=<user_token>
*************
```

## Features
- Capture frames from a video at 500ms intervals
- Convert frames to base64
- Send frames to IPSA for AI processing
- Manage JIBB meeting sessions

## Error Handling
The application handles errors related to video processing and IPSA communication.
Graceful shutdown is implemented to clean up resources on receiving SIGINT (Ctrl+C).

## License
JIBB

