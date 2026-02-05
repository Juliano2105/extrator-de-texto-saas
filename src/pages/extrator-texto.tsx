import React, { useState } from 'react';
import { Youtube, FileVideo, History, Languages } from 'lucide-react';
import { YoutubeCaptionsPanel } from '../components/YoutubeCaptionsPanel';
import { VideoTranscribePanel } from '../components/VideoTranscribePanel';
import { HistoryPanel } from '../components/HistoryPanel';

const ExtratorTexto: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'youtube' | 'video' | 'history'>('youtube');

    return (
        <div className="min-h-screen flex flex-col items-center">
            {/* Header SaaS 1:1 */}
            <header className="w-full bg-white border-b py-4 px-6 fixed top-0 z-50">
                <div className="max-w-screen mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded text-white flex items-center justify-center">
                            <Languages size={18} />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-slate-800">Transcritor de Vídeos</span>
                    </div>
                    <button
                        onClick={() => setActiveTab('history')}
                        className="btn-icon"
                        title="Histórico"
                    >
                        <History size={20} />
                    </button>
                </div>
            </header>

            <main className="w-full max-w-content px-6 pt-32 pb-20 flex flex-col items-center">
                {/* Hero Section */}
                <div className="text-center space-y-4 mb-12 animate-fade-in">
                    <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                        Transcreva vídeos em texto em poucos minutos
                    </h2>
                    <p className="text-slate-500 text-md md:text-lg">
                        Cole um link do YouTube ou envie um vídeo do seu computador.
                    </p>
                </div>

                {/* Dashboard Area (Tela 1 Style) */}
                <div className="w-full glass-panel p-8 flex flex-col gap-10">

                    {/* Mode Selector (The Abas in the image) */}
                    <div className="flex justify-center border-b pb-10">
                        <div className="mode-selector w-full max-w-lg">
                            <button
                                onClick={() => setActiveTab('youtube')}
                                className={`mode-btn ${activeTab === 'youtube' ? 'active' : ''}`}
                            >
                                <Youtube size={16} />
                                Transcrever por link do YouTube
                            </button>
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`mode-btn ${activeTab === 'video' ? 'active' : ''}`}
                            >
                                <FileVideo size={16} />
                                Transcrever por upload de vídeo
                            </button>
                        </div>
                    </div>

                    {/* Content Component Area */}
                    <div className="animate-fade-in flex-1">
                        {activeTab === 'youtube' && <YoutubeCaptionsPanel />}
                        {activeTab === 'video' && <VideoTranscribePanel />}
                        {activeTab === 'history' && <HistoryPanel />}
                    </div>

                </div>

                <footer className="mt-16 text-center text-slate-400 text-xs">
                    <p>Processamento local via WebAssembly. Privacidade garantida.</p>
                </footer>
            </main>
        </div>
    );
};

export default ExtratorTexto;
