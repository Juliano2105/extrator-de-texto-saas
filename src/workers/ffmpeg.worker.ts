import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';
import type { FFMpegWorkerRequest, FFMpegWorkerResponse } from '../types';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async () => {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();

    // Log FFmpeg messages
    ffmpeg.on('log', ({ message }) => {
        // self.postMessage({ type: 'progress', message: `FFmpeg: ${message}` }); 
        // We can parse progress here if needed, but for now just logging
        console.log('FFmpeg:', message);
    });

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';

    // We load from CDN for simplicity in this no-backend constraints setup
    // Alternatively we could serve these files locally if downloaded
    await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
};

self.onmessage = async (e: MessageEvent<FFMpegWorkerRequest>) => {
    const { type, file } = e.data;

    if (type === 'extract') {
        try {
            const instance = await loadFFmpeg();
            if (!instance) throw new Error('Failed to load FFmpeg');

            const inputName = 'input.mp4';
            const outputName = 'output.wav';

            await instance.writeFile(inputName, await fetchFile(file));

            // Extract audio: 16kHz, Mono, PCM s16le (required for Whisper)
            // -vn: No video
            // -ar 16000: Sample rate
            // -ac 1: Channels
            // -c:a pcm_s16le: Codec
            await instance.exec([
                '-i', inputName,
                '-vn',
                '-ar', '16000',
                '-ac', '1',
                '-c:a', 'pcm_s16le',
                outputName
            ]);

            const data = await instance.readFile(outputName);
            // Cast data to any to satisfy Blob constructor
            const blob = new Blob([data as any], { type: 'audio/wav' });

            // Cleanup
            await instance.deleteFile(inputName);
            await instance.deleteFile(outputName);

            const response: FFMpegWorkerResponse = {
                type: 'success',
                data: blob
            };
            self.postMessage(response);

        } catch (error: any) {
            console.error(error);
            const response: FFMpegWorkerResponse = {
                type: 'error',
                message: error.message || 'Unknown FFmpeg error'
            };
            self.postMessage(response);
        }
    }
};
