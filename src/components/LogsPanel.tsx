import React, { useEffect, useRef } from 'react';
import type { LogMessage } from '../types';

interface LogsPanelProps {
    logs: LogMessage[];
}

export const LogsPanel: React.FC<LogsPanelProps> = ({ logs }) => {
    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    if (logs.length === 0) return null;

    return (
        <div className="glass-panel p-4 mt-6 w-full animate-fade-in border-t-2 border-white/5">
            <h3 className="text-xs font-semibold mb-3 text-gray-400 uppercase tracking-widest pl-1">Logs do Sistema</h3>
            <div className="logs-container h-36 overflow-y-auto bg-black/40 rounded-lg p-3 shadow-inner scrollbar-thin scrollbar-thumb-gray-700">
                {logs.map((log) => (
                    <div key={log.id} className={`logs-item ${log.type} text-xs md:text-sm py-1 font-mono`}>
                        <span className="opacity-40 mr-3 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.message}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
};
