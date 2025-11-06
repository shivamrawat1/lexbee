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

        const apiUrl = `https://lexbee-production.up.railway.app/front/${cleanWord}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        // Validate response is an array
        if (!Array.isArray(data)) {
            throw new Error("Invalid API response format");
        }

        // Parse the response to extract the first valid definition
        const definition = parseDefinition(data, cleanWord);

        return definition;
    } catch (error) {
        console.error("Error in lookupWord:", error);
        throw error;
    }
}

function cleanDefinitionText(text) {
    if (!text) return text;

    // Extract content from <xref>...</xref> tags and replace the tag with just the content
    text = text.replace(/<xref>(.*?)<\/xref>/gi, '$1');

    // Remove any other XML-like tags that might appear
    text = text.replace(/<[^>]+>/g, '');

    // Clean up extra whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

function parseDefinition(definitions, word) {
    // Filter out entries with null text and find the first valid definition
    // Also clean the text to remove XML tags
    const validDefinitions = definitions
        .filter(def => def.text && def.text.trim())
        .map(def => ({
            ...def,
            text: cleanDefinitionText(def.text)
        }))
        .filter(def => def.text && def.text.trim()); // Filter again after cleaning

    if (validDefinitions.length === 0) {
        // If no definition has text, return the first one anyway (might have other info)
        if (definitions.length > 0) {
            return {
                word: definitions[0].word || word,
                partOfSpeech: definitions[0].partOfSpeech || "unknown",
                text: "No definition available",
                exampleUses: []
            };
        }
        throw new Error("No definitions found");
    }

    // Use the first valid definition (you can modify this to show multiple)
    const def = validDefinitions[0];

    return {
        word: def.word || word,
        partOfSpeech: def.partOfSpeech || "unknown",
        text: def.text,
        exampleUses: def.exampleUses && Array.isArray(def.exampleUses)
            ? def.exampleUses.map(ex => ex.text).filter(text => text && text.trim())
            : []
    };
}

