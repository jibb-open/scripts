# Video Streaming

This project provides a video streaming service that processes video files and streams frames using the JIBB API.

## Prerequisites

- Node.js
- npm

## Installation

1. Clone the repository:
    ```sh
        git clone https://github.com/jibb-open/scripts.git
    ```
2. Navigate to the project directory:
    ```sh
    cd video-ipsa
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```

## Usage

To start the video streaming service, run the following command:

```sh
npm start -- -v <path_to_video_file> -k <your_api_key>
```
Replace <path_to_video_file> with the path to the video file you want to process, and <your_api_key> with your API key.
Example : 
```sh
npm start -- -v video.mp4 -k your_api_key_here
```

## Output
Once the service starts, it will process the video and output the frames. You can access the processed output by visiting the URL provided in the console log:
```sh
*****URL*****
https://app.jibb.ai/workspace/<meeting_id>?user_token=<user_token>
**********
```

## Cleanup
The service will automatically clean up resources and exit gracefully when you press Ctrl+C.


## Author
JIBB


