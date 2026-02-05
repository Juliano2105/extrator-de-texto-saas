import React, { useState } from 'react';
import { AlertCircle, BookmarkPlus, Check, Copy, Download, RotateCcw, XCircle } from 'lucide-react';
import { extractVideoId, fetchYoutubeCaptions } from '../lib/youtube';
import { cleanText, downloadTxt } from '../lib/utils';
import type { TranscribeStatus } from '../types';
import { saveTranscript } from '../lib/storage';

export const YoutubeCaptionsPanel: React.FC = () => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<TranscribeStatus>('idle');
    const [result, setResult] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

    const triggerToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    const handleSearch = async () => {
        const videoId = extractVideoId(url);
        if (!videoId) {
            setStatus('error');
            setErrorMsg('Este link do YouTube parece inválido.');
            return;
        }

        setStatus('transcribing');
        setErrorMsg('');
        setResult('');

        try {
            const text = await fetchYoutubeCaptions(videoId);
            const cleaned = cleanText(text);
            setResult(cleaned);
            setStatus('success');
        } catch (err: any) {
            setStatus('error');
            setErrorMsg('Este vídeo não possui legendas disponíveis.');
        }
    };

    const handleReset = () => {
        setUrl('');
        setResult('');
        setStatus('idle');
        setErrorMsg('');
    };

    const handleSave = () => {
        if (!result) return;
        saveTranscript({
            id: Date.now().toString(),
            date: Date.now(),
            source: 'youtube',
            title: `YouTube: ${url}`,
            text: result
        });
        window.dispatchEvent(new Event('transcript_saved'));
        triggerToast('Salvo no histórico!');
    };

    return (
        <div className="w-full">
            {/* Screen 1: Input Style */}
            {status !== 'success' && status !== 'loading' && (
                <div className="space-y-8 flex flex-col items-center animate-fade-in w-full">
                    <div className="w-full space-y-3">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Cole o link do vídeo do YouTube aqui..."
                            className="input-field text-lg py-4 border-slate-200"
                        />
                        <p className="text-sm text-slate-400 text-center">
                            Funciona apenas quando o vídeo possui legendas públicas.
                        </p>
                    </div>

                    <button
                        onClick={handleSearch}
                        disabled={!url || status === 'transcribing'}
                        className="btn-primary px-16 py-4 rounded-md shadow-md"
                    >
                        {status === 'transcribing' ? 'Extraindo...' : 'Extrair transcrição'}
                    </button>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-500 font-medium animate-fade-in">
                            <AlertCircle size={18} />
                            <span>{errorMsg}</span>
                        </div>
                    )}
                </div>
            )}

            {/* Screen 3: Processing Style (Simplified for YouTube as it's quick) */}
            {status === 'transcribing' && (
                <div className="space-y-10 py-10 flex flex-col items-center animate-fade-in w-full max-w-md mx-auto">
                    <div className="w-full space-y-4">
                        <div className="step-item active">
                            <div className="step-circle animate-pulse">
                                <RotateCcw size={14} className="animate-spin" />
                            </div>
                            <span>Buscando legendas no YouTube...</span>
                        </div>
                    </div>

                    <div className="w-full space-y-3 text-center">
                        <div className="progress-root">
                            <div className="progress-indicator animate-pulse w-1/2" />
                        </div>
                        <p className="text-sm text-slate-500 font-medium italic">Por favor, aguarde...</p>
                    </div>
                </div>
            )}

            {/* Screen 4: Result Style */}
            {status === 'success' && (
                <div className="animate-fade-in space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <h3 className="text-2xl font-bold text-slate-800">Transcrição Concluída!</h3>
                        <button onClick={handleReset} className="text-slate-400 hover:text-slate-700">
                            <XCircle size={24} />
                        </button>
                    </div>

                    <div className="result-layout">
                        <div className="result-content scrollbar-thin">
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
