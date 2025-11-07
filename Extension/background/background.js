// Background service worker for LexBee extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "lookupWord") {
        lookupWord(message.word)
            .then((data) => {
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("Error looking up word:", error);
                sendResponse({
                    success: false,
                    error: error.message || "Failed to fetch definition"
                });
            });
        return true; // Keep the message channel open for async response
    }
});

async function lookupWord(word) {
    try {
        // Clean the word (remove extra spaces, convert to lowercase)
        const cleanWord = word.trim().toLowerCase();

        if (!cleanWord) {
            throw new Error("Word cannot be empty");
        }

        const apiUrl = `https://lexbee-production.up.railway.app/definition/${cleanWord}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Validate response is an object
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid API response format");
        }

        // Parse the response to match the expected format
        const definition = parseDefinition(data, cleanWord);

        return definition;
    } catch (error) {
        console.error("Error in lookupWord:", error);
        throw error;
    }
}

function parseDefinition(data, word) {

    const definitionText = data.definition ? data.definition : null;

    if (!definitionText || !definitionText.trim()) {
        throw new Error("No definition available");
    }

    const exampleUses = data.example && data.example.trim()
        ? [data.example.trim()]
        : [];

    return {
        word: data.word || word,
        partOfSpeech: data.partOfSpeech || "unknown",
        text: definitionText,
        exampleUses: exampleUses
    };
}

