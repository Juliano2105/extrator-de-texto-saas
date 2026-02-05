export interface SavedTranscript {
    id: string;
    date: number;
    source: 'youtube' | 'video';
    title: string;
    text: string;
}

const STORAGE_KEY = 'lovable_saved_transcripts';

export const saveTranscript = (transcript: SavedTranscript) => {
    const current = getSavedTranscripts();
    const updated = [transcript, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getSavedTranscripts = (): SavedTranscript[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const deleteTranscript = (id: string) => {
    const current = getSavedTranscripts();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};
