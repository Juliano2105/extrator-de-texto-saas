import React, { useState, useEffect } from 'react';
import { Trash2, Copy, Download, Clock, Search, XCircle, Check, Youtube, FileVideo } from 'lucide-react';
import { getSavedTranscripts, deleteTranscript } from '../lib/storage';
import type { SavedTranscript } from '../lib/storage';
import { downloadTxt } from '../lib/utils';

export const HistoryPanel: React.FC = () => {
    const [history, setHistory] = useState<SavedTranscript[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ show: boolean, msg: string }>({ show: false, msg: '' });

    const triggerToast = (msg: string) => {
        setToast({ show: true, msg });
        setTimeout(() => setToast({ show: false, msg: '' }), 3000);
    };

    const loadHistory = () => {
        const stored = getSavedTranscripts();
        setHistory(stored.sort((a, b) => b.date - a.date));
    };

    useEffect(() => {
        loadHistory();
        const handleStorageChange = () => loadHistory();
        window.addEventListener('transcript_saved', handleStorageChange);
        return () => window.removeEventListener('transcript_saved', handleStorageChange);
    }, []);

    const handleDelete = (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta transcrição?')) return;
        deleteTranscript(id);
        loadHistory();
        triggerToast('Excluído do histórico');
    };

    const handleClearAll = () => {
        if (history.length === 0) return;
        if (!confirm('DESEJA LIMPAR TODO O HISTÓRICO? Esta ação não pode ser desfeita.')) return;
        history.forEach(item => deleteTranscript(item.id));
        loadHistory();
        triggerToast('Histórico limpo');
    };

    const filteredHistory = history.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (history.length === 0) {
        return (
            <div className="text-center py-24 glass-panel border-dashed border-slate-200 shadow-sm bg-slate-50/50">
                <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                    <Clock size={32} className="text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Seu histórico está vazio</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">Transcreva vídeos e salve-os para que apareçam nesta lista.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl mx-auto pb-12">
            {/* Header / Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Pesquisar no histórico..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field pl-10 h-11 bg-white border-slate-200"
                    />
                </div>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest px-4 py-2"
                >
                    <XCircle size={14} /> Limpar Tudo
                </button>
            </div>

            {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                    Nenhum resultado encontrado para "{searchTerm}"
                </div>
            ) : (
                <div className="glass-panel overflow-hidden border-slate-200 divide-y divide-slate-100">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="p-5 flex flex-col md:flex-row gap-6 hover:bg-slate-50/80 transition-all group items-start">
                            <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm text-slate-400 group-hover:text-blue-500 group-hover:border-blue-100 transition-all">
                                {item.source === 'youtube' ? <Youtube size={20} /> : <FileVideo size={20} />}
                            </div>

                            <div className="flex-1 space-y-2 min-w-0">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(item.date).toLocaleDateString('pt-BR')} • {new Date(item.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate pr-10">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-slate-500 line-clamp-1 leading-relaxed">
                                    {item.text}
                                </p>
                            </div>

                            <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
                                <button
                                    onClick={() => { navigator.clipboard.writeText(item.text); triggerToast('Copiado'); }}
                                    className="p-2 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                                    title="Copiar"
                                >
                                    <Copy size={18} />
                                </button>
                                <button
                                    onClick={() => downloadTxt(`extracao_${item.id}.txt`, item.text)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-800 transition-all"
                                    title="Baixar"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                                    title="Excluir"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
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
