let currentPopup = null;
let isLoading = false;

// Sanitize HTML to prevent XSS
function sanitizeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Fetch word definition from API
async function fetchDefinition(word) {
    try {
        const response = await fetch(`https://meanings.onrender.com/api/${encodeURIComponent(word)}`);

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !Array.isArray(data) || data.length === 0) {
            throw new Error('No definition found');
        }

        const wordData = data[0];

        if (!wordData.MEANINGS || !Array.isArray(wordData.MEANINGS) || wordData.MEANINGS.length === 0) {
            throw new Error('No meanings available for this word');
        }

        return wordData.MEANINGS[0]; // Return first definition
    } catch (error) {
        console.error('Error fetching definition:', error);
        throw error;
    }
}

// Hide popup
function hidePopup() {
    if (currentPopup) {
        currentPopup.remove();
        currentPopup = null;

        // Remove backdrop overlay if present
        var backdrop = document.getElementById('lexbee-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }
    isLoading = false;
}

// Handle word selection
async function handleWordSelection() {
    // Don't trigger if popup is already open or loading
    if (currentPopup || isLoading) {
        return;
    }

    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // Only process single words (no spaces, reasonable length)
    if (!selectedText || selectedText.includes(' ') || selectedText.length > 50) {
        return;
    }

    // Clean the word (remove punctuation)
    const word = selectedText.replace(/[^\w]/g, '').toLowerCase();

    if (word.length < 2) {
        return;
    }

    // Remove existing popup
    hidePopup();

    // Create and show popup immediately with loading state
    showWordPopup(word, selection);
}

// Show word popup with definition
async function showWordPopup(word, selection) {
    // Create popup for selected word
    const popup = document.createElement('div');
    popup.id = 'lexbee-popup';
    popup.style.cssText = `
        position: absolute;
        background: white;
        border: 2px solid #4a90e2;
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        max-width: 300px;
        z-index: 999999;
        pointer-events: auto;
        color: #333;
        word-wrap: break-word;
    `;

    // Show loading state
    popup.innerHTML = '<div style="position: relative;"><button id="lexbee-close-btn" style="position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button><div>Loading definition for "' + sanitizeHTML(word) + '"...</div></div>';

    // Add invisible backdrop to detect outside clicks
    var backdrop = document.createElement('div');
    backdrop.id = 'lexbee-backdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:999998;background:transparent;pointer-events:auto;cursor:default;';

    // Add to DOM (backdrop first, then popup)
    document.body.appendChild(backdrop);
    document.body.appendChild(popup);
    currentPopup = popup;
    isLoading = true;

    // Position popup with dynamic adjustments to prevent clipping
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 10; // Buffer from screen edges

    // Default position: above the selection
    let left = rect.left + window.scrollX;
    let top = rect.top + window.scrollY - popupRect.height - 10; // 10px gap above selection

    // Adjust left to prevent clipping on left/right edges
    if (left + popupRect.width + margin > viewportWidth + window.scrollX) {
        left = viewportWidth + window.scrollX - popupRect.width - margin;
    }
    if (left < window.scrollX + margin) {
        left = window.scrollX + margin;
    }

    // Adjust top to prevent clipping on top/bottom edges
    if (top < window.scrollY + margin) {
        // If above selection clips, place below selection
        top = rect.bottom + window.scrollY + 10; // 10px gap below selection
    }
    if (top + popupRect.height + margin > viewportHeight + window.scrollY) {
        // If below clips, prioritize staying within viewport
        top = viewportHeight + window.scrollY - popupRect.height - margin;
    }

    popup.style.left = `${left}px`;
    popup.style.top = `${top}px`;

    // Click outside via backdrop
    backdrop.addEventListener('mousedown', function (e) {
        console.log('Backdrop mousedown detected');
        hidePopup();
    });
    backdrop.addEventListener('click', function (e) {
        console.log('Backdrop click detected');
        hidePopup();
    });

    // Add close button event listener
    const closeBtn = popup.querySelector('#lexbee-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            hidePopup();
        });
    }

    // Fetch definition from API with timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API request timeout')), 10000); // 10 second timeout
    });

    try {
        // Fetch definition
        console.log('Fetching definition for:', word);
        const definition = await Promise.race([
            fetchDefinition(word),
            timeoutPromise
        ]);
        console.log('Definition received:', definition);

        // Update popup with definition
        if (popup && document.body.contains(popup)) {
            var exampleHtml = '';
            if (definition.exampleSentence && definition.exampleSentence.length > 0) {
                exampleHtml = '<div style="font-style: italic; color: #666; font-size: 12px; border-left: 3px solid #4a90e2; padding-left: 8px;">"' + sanitizeHTML(definition.exampleSentence[0]) + '"</div>';
            }

            popup.innerHTML = '<div style="position: relative;"><button id="lexbee-close-btn" style="position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button><div style="margin-bottom: 8px;"><strong style="color: #4a90e2; font-size: 16px;">' + sanitizeHTML(word) + '</strong></div><div style="margin-bottom: 4px;"><em style="color: #666; font-size: 12px;">' + sanitizeHTML(definition.partsOfSpeech) + '</em></div><div style="margin-bottom: 8px;">' + sanitizeHTML(definition.definition) + '</div>' + exampleHtml + '</div>';

            // Recompute position after content update, as popup size may change
            const updatedPopupRect = popup.getBoundingClientRect();
            let updatedLeft = left;
            let updatedTop = top;

            // Adjust left for updated size
            if (updatedLeft + updatedPopupRect.width + margin > viewportWidth + window.scrollX) {
                updatedLeft = viewportWidth + window.scrollX - updatedPopupRect.width - margin;
            }
            if (updatedLeft < window.scrollX + margin) {
                updatedLeft = window.scrollX + margin;
            }

            // Adjust top for updated size
            if (updatedTop < window.scrollY + margin) {
                updatedTop = rect.bottom + window.scrollY + 10;
            }
            if (updatedTop + updatedPopupRect.height + margin > viewportHeight + window.scrollY) {
                updatedTop = viewportHeight + window.scrollY - updatedPopupRect.height - margin;
            }

            popup.style.left = `${updatedLeft}px`;
            popup.style.top = `${updatedTop}px`;

            // Add close button event listener to updated popup
            const closeBtn = popup.querySelector('#lexbee-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    hidePopup();
                });
            }

            // Definition displayed successfully
            isLoading = false;
        } else {
            // Popup was removed before definition could be shown
            isLoading = false;
        }
    } catch (error) {
        console.error('Error fetching definition:', error);
        console.log('Error message:', error.message);

        if (popup && document.body.contains(popup)) {
            if (error.message.includes('No meanings available')) {
                popup.innerHTML = '<div style="position: relative;"><button id="lexbee-close-btn" style="position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button><div style="margin-bottom: 8px;"><strong style="color: #4a90e2; font-size: 16px;">' + sanitizeHTML(word) + '</strong></div><div style="color: #666; font-style: italic;">No definition available for this word.</div></div>';
            } else {
                popup.innerHTML = '<div style="position: relative;"><button id="lexbee-close-btn" style="position: absolute; top: -8px; right: -8px; background: #e74c3c; color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 12px; cursor: pointer;">×</button><div style="color: #e74c3c;"><strong>Error:</strong> ' + sanitizeHTML(error.message) + '</div></div>';
            }

            // Recompute position after error content update
            const updatedPopupRect = popup.getBoundingClientRect();
            let updatedLeft = left;
            let updatedTop = top;

            // Adjust left for updated size
            if (updatedLeft + updatedPopupRect.width + margin > viewportWidth + window.scrollX) {
                updatedLeft = viewportWidth + window.scrollX - updatedPopupRect.width - margin;
            }
            if (updatedLeft < window.scrollX + margin) {
                updatedLeft = window.scrollX + margin;
            }

            // Adjust top for updated size
            if (updatedTop < window.scrollY + margin) {
                updatedTop = rect.bottom + window.scrollY + 10;
            }
            if (updatedTop + updatedPopupRect.height + margin > viewportHeight + window.scrollY) {
                updatedTop = viewportHeight + window.scrollY - updatedPopupRect.height - margin;
            }

            popup.style.left = `${updatedLeft}px`;
            popup.style.top = `${updatedTop}px`;

            // Add close button event listener to error popup
            const closeBtn = popup.querySelector('#lexbee-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    hidePopup();
                });
            }
        }

        isLoading = false;
    }
}

// Event listeners
document.addEventListener('mouseup', handleWordSelection);
document.addEventListener('keyup', handleWordSelection);

// Escape key handler
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && currentPopup) {
        hidePopup();
    }
});