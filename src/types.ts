export interface LogMessage {
    id: string;
    timestamp: number;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

export type TranscribeStatus =
    | 'idle'
    | 'loading'
    | 'loading_model'
    | 'extracting_audio'
    | 'transcribing'
    | 'success'
    | 'error'
    | 'cancelled';

export interface TranscriptionRequest {
    audio: Blob | ArrayBuffer;
    language: string;
    quality: 'fast' | 'better';
}

export interface FFMpegWorkerRequest {
    type: 'extract';
    file: Blob; // Video file
}

export interface FFMpegWorkerResponse {
    type: 'success' | 'error' | 'progress';
    data?: Blob; // Wav file
    message?: string;
    progress?: number;
}

export interface WhisperWorkerRequest {
    type: 'load' | 'transcribe';
    model?: string;
    audio?: Blob | ArrayBuffer;
    language?: string;
}

export interface WhisperWorkerResponse {
    type: 'loaded' | 'transcribing' | 'success' | 'error';
    data?: string; // Transcribed text or partial text
    progress?: number; // Percent
}
