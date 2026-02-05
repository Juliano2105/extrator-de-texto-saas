export const cleanText = (text: string): string => {
    if (!text) return "";
    return text
        .replace(/\s+/g, ' ') // Collapse whitespace
        .replace(/&#39;/g, "'") // Decode simplified html entities
        .replace(/&quot;/g, '"')
        .trim();
};

export const downloadTxt = (filename: string, text: string) => {
    const element = document.createElement('a');
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
    document.body.removeChild(element);
};
