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

    if (message.action === "lookupFrequency") {
        lookupFrequency(message.word)
            .then((data) => {
                sendResponse({ success: true, data });
            })
            .catch((error) => {
                console.error("Error looking up frequency:", error);
                sendResponse({
                    success: false,
                    error: error.message || "Failed to fetch frequency"
                });
            });
        return true; // Keep the message channel open for async response
    }
});

async function lookupWord(word) {
    try {
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

        return data;
    } catch (error) {
        console.error("Error in lookupWord:", error);
        throw error;
    }
}

async function lookupFrequency(word) {
    try {
        const cleanWord = word.trim().toLowerCase();

        if (!cleanWord) {
            throw new Error("Word cannot be empty");
        }

        const apiUrl = `https://lexbee-production.up.railway.app/frequency/${cleanWord}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error("Error in lookupFrequency:", error);
        throw error;
    }
}

