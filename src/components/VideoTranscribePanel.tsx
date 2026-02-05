import React, { useState, useRef, useEffect } from 'react';
import { Check, Copy, Download, BookmarkPlus, RotateCcw, XCircle, Cloud } from 'lucide-react';
import type { TranscribeStatus } from '../types';
import { downloadTxt } from '../lib/utils';
import { saveTranscript } from '../lib/storage';

export const VideoTranscribePanel: React.FC = () => {
    const [file, setFile] = useState<File | Blob | null>(null);
    const [fileName, setFileName] = useState<string>('');
    const [urlInput, setUrlInput] = useState('');
    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [result, setResult] = useState('');
    const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

    const triggerToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    const ffmpegWorkerRef = useRef<Worker | null>(null);
    const whisperWorkerRef = useRef<Worker | null>(null);

    useEffect(() => {
        ffmpegWorkerRef.current = new Worker(new URL('../workers/ffmpeg.worker.ts', import.meta.url), { type: 'module' });
        whisperWorkerRef.current = new Worker(new URL('../workers/whisper.worker.ts', import.meta.url), { type: 'module' });

        ffmpegWorkerRef.current.onmessage = (e) => {
            if (e.data.type === 'success') {
                setStatus('transcribing');
                whisperWorkerRef.current?.postMessage({
                    type: 'transcribe',
                    audio: e.data.data,
                    language: 'pt',
                    quality: 'fast'
                });
            } else if (e.data.type === 'error') {
                setStatus('error');
            }
        };

        whisperWorkerRef.current.onmessage = (e) => {
            if (e.data.type === 'success') {
                setStatus('success');
                setResult(e.data.data.text);
            } else if (e.data.type === 'error') {
                setStatus('error');
            }
        };

        return () => {
            ffmpegWorkerRef.current?.terminate();
            whisperWorkerRef.current?.terminate();
        };
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setFileName(selectedFile.name);
        }
    };

    const handleUrlFetch = async () => {
        if (!urlInput) return;
        setStatus('loading');
        try {
            const response = await fetch(urlInput);
            if (!response.ok) throw new Error('CORS');
            const blob = await response.blob();
            setFile(blob);
            setFileName(urlInput.split('/').pop() || 'video.mp4');
            setStatus('idle');
        } catch {
            setStatus('error');
        }
    };

    const startTranscription = () => {
        if (!file) return;
        setStatus('extracting_audio');
        ffmpegWorkerRef.current?.postMessage({ type: 'extract', file: file });
    };

    const handleReset = () => {
        setFile(null);
        setFileName('');
        setUrlInput('');
        setResult('');
        setStatus('idle');
    };

    const handleSave = () => {
        if (!result || !fileName) return;
        saveTranscript({
            id: Date.now().toString(),
            date: Date.now(),
            source: 'video',
            title: fileName,
            text: result
        });
        window.dispatchEvent(new Event('transcript_saved'));
        triggerToast('Salvo no histórico!');
    };

    return (
        <div className="w-full">
            {/* Screen 2: Upload UI */}
            {status === 'idle' || status === 'error' ? (
                <div className="space-y-8 animate-fade-in w-full text-center">
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold text-slate-800">Transcrever por Upload de Vídeo</h3>

                        <div className="relative group">
                            <input type="file" id="video-upload" className="hidden" accept="video/*" onChange={handleFileChange} />
                            <label
                                htmlFor="video-upload"
                                className={`
                                    flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg transition-all cursor-pointer
                                    ${file ? 'border-[#1a73e8] bg-blue-50/50' : 'border-slate-200 hover:border-[#1a73e8] hover:bg-slate-50'}
                                `}
                            >
                                <Cloud size={48} className={`${file ? 'text-[#1a73e8]' : 'text-slate-300'} mb-4`} />
                                <div className="space-y-1">
                                    <p className="text-lg font-bold text-slate-800">
                                        {file ? fileName : 'Arraste seu vídeo aqui ou clique para enviar'}
                                    </p>
                                    <p className="text-sm text-slate-400">Clique para selecionar do computador</p>
                                </div>
                            </label>
                        </div>

                        <div className="w-full space-y-3">
                            <input
                                type="text"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="Ou cole a URL do vídeo..."
                                className="input-field border-slate-200"
                            />
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={file ? startTranscription : handleUrlFetch}
                                disabled={!file && !urlInput}
                                className="btn-primary px-20 py-4 shadow-lg w-full md:w-auto"
                            >
                                {file ? 'Enviar vídeo' : 'Baixar e Enviar'}
                            </button>
                            <p className="text-xs text-slate-400">Suporta arquivos MP4, MOV, AVI e mais.</p>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Screen 3: Processing Style 1:1 */}
            {(status === 'extracting_audio' || status === 'transcribing' || status === 'loading') && (
                <div className="space-y-12 py-10 animate-fade-in w-full max-w-md mx-auto">
                    <div className="space-y-2">
                        <div className={`step-item ${status !== 'loading' ? 'active' : ''}`}>
                            <div className="step-circle">
                                {status === 'extracting_audio' ? <RotateCcw size={14} className="animate-spin" /> : <Check size={14} />}
                            </div>
                            <span>Analisando vídeo...</span>
                        </div>
                        <div className={`step-item ${status === 'extracting_audio' || status === 'transcribing' ? 'active' : ''}`}>
                            <div className="step-circle">
                                {status === 'extracting_audio' ? <RotateCcw size={14} className="animate-spin" /> : status === 'transcribing' ? <Check size={14} /> : null}
                            </div>
                            <span>Extraindo áudio...</span>
                        </div>
                        <div className={`step-item ${status === 'transcribing' ? 'active' : ''}`}>
                            <div className="step-circle">
                                {status === 'transcribing' ? <RotateCcw size={14} className="animate-spin" /> : null}
                            </div>
                            <span>Gerando transcrição...</span>
                        </div>
                    </div>

                    <div className="w-full space-y-4 text-center">
                        <div className="progress-root shadow-inner">
                            <div
                                className="progress-indicator"
                                style={{ width: status === 'extracting_audio' ? '40%' : status === 'transcribing' ? '75%' : '10%' }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Por favor, aguarde...</p>
                    </div>
                </div>
            )}

            {/* Screen 4: Result Style 1:1 */}
            {status === 'success' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-bold text-slate-800">Transcrição Concluída!</h3>
                        <button onClick={handleReset} className="text-slate-400 hover:text-slate-700">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="result-layout">
                        <div className="result-content scrollbar-thin overflow-y-auto max-h-[500px]">
                            <p className="whitespace-pre-wrap text-slate-700">
                                {result}
                            </p>
                        </div>
                        <div className="result-sidebar">
                            <button onClick={() => { navigator.clipboard.writeText(result); triggerToast('Copiado!'); }} className="btn-secondary text-sm flex items-center justify-center gap-2 w-full">
                                <Copy size={16} /> Copiar Texto
                            </button>
                            <button onClick={() => downloadTxt('transcricao.txt', result)} className="btn-secondary text-sm flex items-center justify-center gap-2 w-full">
                                <Download size={16} /> Baixar TXT
                            </button>
                            <button onClick={handleSave} className="btn-secondary text-sm flex items-center justify-center gap-2 w-full">
                                <BookmarkPlus size={16} /> Salvar Histórico
                            </button>
                            <button onClick={handleReset} className="btn-primary text-sm flex items-center justify-center gap-2 w-full mt-4">
                                <RotateCcw size={16} /> Nova Transcrição
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast.show && (
                <div className="toast-feedback">
                    <Check size={18} />
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
};
