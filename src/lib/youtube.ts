export const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

export const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

// Note: Robust Client-side Caption fetching from YouTube involves hitting
// hidden APIs (timedtext) which often block CORS or require signature.
// We try a known method, but must fail gracefully if patched.
export const fetchYoutubeCaptions = async (videoId: string, lang = 'pt') => {
    try {
        // Step 1: We need the caption tracks list
        // This is the tricky part client-side without a proxy.
        // We often scrape the video page to find the 'captionTracks' object.
        const response = await fetch(`https://cors-anywhere.herokuapp.com/https://www.youtube.com/watch?v=${videoId}`);
        const html = await response.text();

        // This regex looks for the captionTracks inside the player response
        const regex = /"captionTracks":(\[.*?\])/;
        const match = regex.exec(html);

        if (!match) {
            throw new Error('Legendas não encontradas (Públicas)');
        }

        const tracks = JSON.parse(match[1]);

        // Find the best track match
        // Priority: exact lang -> start with lang -> en
        const track = tracks.find((t: any) => t.languageCode === lang) ||
            tracks.find((t: any) => t.languageCode.startsWith(lang)) ||
            tracks.find((t: any) => t.languageCode === 'en') ||
            tracks[0];

        if (!track) throw new Error('Nenhuma faixa de legenda compatível encontrada.');

        // Fetch the XML/JSON transcript
        const transcriptUrl = track.baseUrl;
        // Again, this URL often has CORS. If we are on localhost, we might get lucky or need a proxy.
        const transcriptResponse = await fetch(transcriptUrl);
        const transcriptText = await transcriptResponse.text();

        // Parse XML to text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptText, "text/xml");
        const textNodes = xmlDoc.getElementsByTagName("text");

        let fullText = "";
        for (let i = 0; i < textNodes.length; i++) {
            fullText += textNodes[i].textContent + " ";
        }

        return fullText.trim();

    } catch (error: any) {
        console.error("Caption Fetch Error:", error);
        throw new Error(error.message || 'Falha ao buscar legendas. CORS ou bloqueio do YouTube.');
    }
}
