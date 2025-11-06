// Inject CSS for popup styling
const style = document.createElement("style");
style.textContent = `
  .word-popup {
    position: absolute;
    background: white;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 16px;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    font-size: 14px;
    line-height: 1.5;
  }

  .word-popup .word-title {
    font-size: 20px;
    font-weight: bold;
    color: #007bff;
    margin: 0 0 8px 0;
  }

  .word-popup .part-of-speech {
    font-size: 12px;
    color: #666;
    font-style: italic;
    margin: 0 0 10px 0;
  }

  .word-popup .definition {
    color: #000;
    margin: 0 0 12px 0;
  }

  .word-popup .example-uses {
    margin-top: 12px;
  }

  .word-popup .example-item {
    display: flex;
    align-items: stretch;
    margin-bottom: 8px;
  }

  .word-popup .example-bar {
    width: 3px;
    background-color: #007bff;
    margin-right: 10px;
    flex-shrink: 0;
    border-radius: 0;
  }

  .word-popup .example-text {
    font-size: 12px;
    color: #666;
    font-style: italic;
    flex: 1;
    line-height: 1.5;
  }

  .word-popup .error-message {
    color: #dc3545;
    font-size: 14px;
    padding: 8px;
  }
`;
document.head.appendChild(style);

// Double click handler
document.addEventListener("dblclick", () => {
    const selection = window.getSelection();
    const word = selection.toString().trim();

    if (!word) return;

    // Show loading state
    showLoadingPopup(selection);

    // Send message to background script
    chrome.runtime.sendMessage(
        { action: "lookupWord", word },
        (response) => {
            removeExistingPopup();

            if (chrome.runtime.lastError) {
                showErrorPopup(selection, "Failed to communicate with extension");
                return;
            }

            if (!response) {
                showErrorPopup(selection, "No response from server");
                return;
            }

            if (response.success) {
                showPopup(response.data, selection);
            } else {
                showErrorPopup(selection, response.error || "Failed to fetch definition");
            }
        }
    );
});

// Click outside popup to close
document.addEventListener("click", (e) => {
    const popup = document.querySelector(".word-popup");
    if (popup && !popup.contains(e.target)) {
        removeExistingPopup();
    }
});

// Message listener (kept for backward compatibility)
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "showDefinition") {
        const selection = window.getSelection();
        showPopup(
            {
                word: message.word,
                partOfSpeech: message.partOfSpeech || "unknown",
                text: message.definition,
                exampleUses: message.exampleUses || []
            },
            selection
        );
    }
});

function showLoadingPopup(selection) {
    removeExistingPopup();

    try {
        const range = selection.getRangeAt(0).getBoundingClientRect();
        const popup = document.createElement("div");
        popup.className = "word-popup";
        popup.innerHTML = '<div style="padding: 8px;">Loading...</div>';
        positionPopup(popup, range);
    } catch (error) {
        console.error("Error showing loading popup:", error);
    }
}

function showErrorPopup(selection, errorMessage) {
    removeExistingPopup();

    try {
        let range;
        if (selection && selection.rangeCount > 0) {
            range = selection.getRangeAt(0).getBoundingClientRect();
        } else {
            // Fallback: position at center of viewport
            range = {
                bottom: window.innerHeight / 2,
                left: window.innerWidth / 2,
                top: window.innerHeight / 2 - 50
            };
        }

        const popup = document.createElement("div");
        popup.className = "word-popup";
        popup.innerHTML = `
      <div class="error-message">${escapeHtml(errorMessage)}</div>
    `;
        positionPopup(popup, range);
    } catch (error) {
        console.error("Error showing error popup:", error);
    }
}

function showPopup(data, selection) {
    removeExistingPopup();

    try {
        const range = selection.getRangeAt(0).getBoundingClientRect();

        const popup = document.createElement("div");
        popup.className = "word-popup";

        // Build popup content
        let html = `<div class="word-title">${escapeHtml(data.word)}</div>`;
        html += `<div class="part-of-speech">${capitalizeFirst(data.partOfSpeech)}</div>`;
        html += `<div class="definition">${escapeHtml(data.text)}</div>`;

        // Add example uses if available
        if (data.exampleUses && data.exampleUses.length > 0) {
            html += '<div class="example-uses">';
            data.exampleUses.forEach((example) => {
                // Add quotation marks if not already present
                let exampleText = example.trim();
                // Check if text already starts with any type of quote (straight, curly, or smart quotes)
                const hasQuote = /^[""\u201C\u201D\u2018\u2019]/.test(exampleText);
                if (!hasQuote) {
                    exampleText = `"${exampleText}"`;
                }
                html += `
          <div class="example-item">
            <div class="example-bar"></div>
            <div class="example-text">${escapeHtml(exampleText)}</div>
          </div>
        `;
            });
            html += '</div>';
        }

        popup.innerHTML = html;
        positionPopup(popup, range);
    } catch (error) {
        console.error("Error showing popup:", error);
        showErrorPopup(selection, "Failed to display definition");
    }
}

function positionPopup(popup, range) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // Position below the selection by default
    let top = range.bottom + scrollY + 5;
    let left = range.left + scrollX;

    // Add to DOM first to get accurate dimensions
    popup.style.visibility = "hidden";
    popup.style.position = "absolute";
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    document.body.appendChild(popup);

    const popupRect = popup.getBoundingClientRect();

    // Adjust if popup would go off screen
    if (left + popupRect.width > viewportWidth + scrollX) {
        left = viewportWidth + scrollX - popupRect.width - 10;
    }

    if (top + popupRect.height > viewportHeight + scrollY) {
        // Position above if below doesn't fit
        top = range.top + scrollY - popupRect.height - 5;
        if (top < scrollY) {
            top = scrollY + 10;
        }
    }

    if (left < scrollX) {
        left = scrollX + 10;
    }

    // Update position and make visible
    popup.style.top = `${top}px`;
    popup.style.left = `${left}px`;
    popup.style.visibility = "visible";
}

function removeExistingPopup() {
    const existing = document.querySelector(".word-popup");
    if (existing) existing.remove();
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
