import { pipeline, env } from '@xenova/transformers';

// Setup env to not try loading local models if unavailable, or config cache
env.allowLocalModels = false;
env.useBrowserCache = true;

class SpeechRecognitionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-small'; // Default
    static instance: any = null;

    static async getInstance(progressCallback: Function) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task as any, this.model, {
                progress_callback: progressCallback
            });
        }
        return this.instance;
    }
}

self.onmessage = async (event) => {
    const { type, audio, language } = event.data;

    if (type === 'transcribe') {
        try {
            const p = await SpeechRecognitionPipeline.getInstance((data: any) => {
                if (data.status === 'progress') {
                    self.postMessage({
                        type: 'loaded',
                        progress: data.progress
                    }); // Model loading progress
                }
            });

            // Convert Audio (Blob/Buffer) to logic usable by pipeline if needed
            // Pipeline supports URL or float32 array.
            // But we can simplify: pipeline accepts a url to the blob.

            let audioInput;
            if (audio instanceof Blob) {
                audioInput = URL.createObjectURL(audio);
            } else {
                audioInput = audio;
            }

            const output = await p(audioInput, {
                top_k: 0,
                do_sample: false,
                language: language !== 'auto' ? language : null,
                chunk_length_s: 30,
                stride_length_s: 5,
                return_timestamps: true,
                callback_function: (_beams: any) => {
                    // Real-time partial results not easily exposed in standard wrapper callback 
                    // without streaming, but 'return_timestamps' helps.
                    // For simply progress we can estimate.
                }
            });

            self.postMessage({
                type: 'success',
                data: output // { text: "...", chunks: [...] }
            });

        } catch (error: any) {
            self.postMessage({
                type: 'error',
                message: error.message
            });
        }
    }
};
