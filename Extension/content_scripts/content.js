// Simple SVG-based line chart renderer (no external dependencies)
function createSVGChart(data, width, height) {
    const margin = { top: 20, right: 20, bottom: 50, left: 20 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const years = data.labels.map(Number);
    const values = data.values;

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    // Handle edge cases (division by zero)
    const yearRange = maxYear - minYear || 1; // Avoid division by zero
    const valueRange = maxValue - minValue || 1; // Avoid division by zero

    // Calculate x and y scales
    const xScale = (year) => margin.left + ((year - minYear) / yearRange) * chartWidth;
    const yScale = (value) => margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    // Generate SVG path for the line
    let pathData = '';
    years.forEach((year, index) => {
        const x = xScale(year);
        const y = yScale(values[index]);
        if (index === 0) {
            pathData += `M ${x} ${y} `;
        } else {
            pathData += `L ${x} ${y} `;
        }
    });

    // Generate area path (for fill)
    let areaPathData = pathData;
    areaPathData += `L ${xScale(maxYear)} ${margin.top + chartHeight} `;
    areaPathData += `L ${xScale(minYear)} ${margin.top + chartHeight} Z`;

    // Generate x-axis labels (50-year intervals + first and last)
    const xAxisLabels = [];
    years.forEach((year, index) => {
        if (index === 0 || index === years.length - 1 || year % 50 === 0) {
            xAxisLabels.push({
                year: year,
                x: xScale(year),
                label: year.toString()
            });
        }
    });

    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.display = 'block';

    // Add background
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', width);
    bg.setAttribute('height', height);
    bg.setAttribute('fill', '#ffffff');
    svg.appendChild(bg);

    // Add grid lines
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = margin.top + (chartHeight / gridLines) * i;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', margin.left);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - margin.right);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e0e0e0');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
    }

    // Add area fill
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaPathData);
    area.setAttribute('fill', 'rgba(0, 123, 255, 0.1)');
    area.setAttribute('stroke', 'none');
    svg.appendChild(area);

    // Add line
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.setAttribute('d', pathData);
    line.setAttribute('fill', 'none');
    line.setAttribute('stroke', '#007bff');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(line);

    // Add x-axis line
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left);
    xAxis.setAttribute('y1', margin.top + chartHeight);
    xAxis.setAttribute('x2', width - margin.right);
    xAxis.setAttribute('y2', margin.top + chartHeight);
    xAxis.setAttribute('stroke', '#333');
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    // Add x-axis labels
    xAxisLabels.forEach(label => {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', label.x);
        text.setAttribute('y', height - 10);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#666');
        text.setAttribute('transform', `rotate(-45 ${label.x} ${height - 10})`);
        text.textContent = label.label;
        svg.appendChild(text);
    });

    // Add axis titles
    const xAxisTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisTitle.setAttribute('x', width / 2);
    xAxisTitle.setAttribute('y', height - 5);
    xAxisTitle.setAttribute('text-anchor', 'middle');
    xAxisTitle.setAttribute('font-size', '14');
    xAxisTitle.setAttribute('font-weight', 'bold');
    xAxisTitle.setAttribute('fill', '#333');
    xAxisTitle.textContent = 'Year';
    svg.appendChild(xAxisTitle);

    const yAxisTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisTitle.setAttribute('x', 15);
    yAxisTitle.setAttribute('y', height / 2);
    yAxisTitle.setAttribute('text-anchor', 'middle');
    yAxisTitle.setAttribute('font-size', '14');
    yAxisTitle.setAttribute('font-weight', 'bold');
    yAxisTitle.setAttribute('fill', '#333');
    yAxisTitle.setAttribute('transform', `rotate(-90 15 ${height / 2})`);
    yAxisTitle.textContent = 'Usage';
    svg.appendChild(yAxisTitle);

    // Add interactive tooltips on hover
    const tooltip = document.createElement('div');
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        z-index: 10001;
    `;

    // Add invisible hover areas for each data point
    years.forEach((year, index) => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        const x = xScale(year);
        const y = yScale(values[index]);
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '5');
        circle.setAttribute('fill', '#007bff');
        circle.setAttribute('opacity', '0');
        circle.style.cursor = 'pointer';

        circle.addEventListener('mouseenter', (e) => {
            tooltip.textContent = `${year}: ${values[index].toLocaleString()}`;
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY - 10) + 'px';
            tooltip.style.opacity = '1';
            circle.setAttribute('opacity', '1');
            circle.setAttribute('r', '6');
        });

        circle.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            circle.setAttribute('opacity', '0');
            circle.setAttribute('r', '5');
        });

        circle.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY - 10) + 'px';
        });

        svg.appendChild(circle);
    });

    return { svg, tooltip };
}

// Inject CSS for popup styling
const style = document.createElement("style");
style.textContent = `
  .word-popup {
    position: absolute;
    background: white;
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 16px;
    max-width: 500px;
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

  .word-popup .popup-footer {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  .word-popup .next-button {
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .word-popup .next-button:hover {
    background-color: #0056b3;
  }

  .word-popup .next-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .word-popup .chart-container {
    width: 100%;
    height: 300px;
    margin-top: 12px;
    position: relative;
    overflow: visible;
  }

  .word-popup .chart-container svg {
    width: 100%;
    height: 100%;
  }

  .word-popup .back-button {
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-right: 8px;
  }

  .word-popup .back-button:hover {
    background-color: #5a6268;
  }

  .word-popup .frequency-title {
    font-size: 18px;
    font-weight: bold;
    color: #007bff;
    margin: 0 0 12px 0;
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
                currentWord = word;
                currentSelection = selection;
                // Log the response data for debugging
                console.log("LexBee: Definition response:", response.data);
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

// Store current word and selection for navigation
let currentWord = null;
let currentSelection = null;

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
        popup.setAttribute("data-view", "definition");

        // Build popup content
        let html = `<div class="word-title">${escapeHtml(data.word)}</div>`;
        html += `<div class="part-of-speech">${capitalizeFirst(data.partOfSpeech || "unknown")}</div>`;

        // Handle both 'definition' and 'text' fields for backward compatibility
        const definitionText = data.definition || data.text || "";
        if (definitionText) {
            html += `<div class="definition">${escapeHtml(definitionText)}</div>`;
        }

        // Add example uses if available
        // Handle both 'example' (singular string) and 'exampleUses' (array) for backward compatibility
        const examples = [];
        if (data.example) {
            // If example is a string, convert to array
            examples.push(data.example);
        } else if (data.exampleUses && Array.isArray(data.exampleUses)) {
            // If exampleUses is an array, use it
            examples.push(...data.exampleUses);
        }

        if (examples.length > 0) {
            html += '<div class="example-uses">';
            examples.forEach((example) => {
                // Add quotation marks if not already present
                let exampleText = String(example).trim();
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

        // Add footer with next button
        html += `
            <div class="popup-footer">
                <button class="next-button" data-word="${escapeHtml(data.word)}">Next</button>
            </div>
        `;

        popup.innerHTML = html;
        positionPopup(popup, range);

        // Add click handler for next button
        const nextButton = popup.querySelector(".next-button");
        if (nextButton) {
            nextButton.addEventListener("click", (e) => {
                e.stopPropagation();
                const word = e.target.getAttribute("data-word");
                if (word && currentSelection) {
                    showFrequencyView(word, currentSelection);
                }
            });
        }
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

// Store chart instance for cleanup
let currentChart = null;

function showFrequencyView(word, selection) {
    // Show loading state
    const popup = document.querySelector(".word-popup");
    if (popup) {
        popup.innerHTML = '<div style="padding: 8px;">Loading frequency data...</div>';
    }

    // Fetch frequency data
    chrome.runtime.sendMessage(
        { action: "lookupFrequency", word },
        (response) => {
            const sel = currentSelection || selection;

            if (chrome.runtime.lastError) {
                showErrorPopup(sel, "Failed to communicate with extension");
                return;
            }

            if (!response) {
                showErrorPopup(sel, "No response from server");
                return;
            }

            if (response.success) {
                try {
                    // Log response for debugging
                    console.log("LexBee: Frequency response:", response.data);

                    // Validate frequency data
                    if (!response.data || !response.data.frequencies) {
                        console.error("LexBee: Invalid frequency data:", response.data);
                        showErrorPopup(sel, "Invalid frequency data received. Check console for details.");
                        return;
                    }

                    let range;
                    if (sel && sel.rangeCount > 0) {
                        range = sel.getRangeAt(0).getBoundingClientRect();
                    } else {
                        // Fallback: use popup position if available
                        const existingPopup = document.querySelector(".word-popup");
                        if (existingPopup) {
                            range = existingPopup.getBoundingClientRect();
                        } else {
                            range = {
                                bottom: window.innerHeight / 2,
                                left: window.innerWidth / 2,
                                top: window.innerHeight / 2 - 50
                            };
                        }
                    }
                    renderFrequencyChart(word, response.data, range);
                } catch (error) {
                    console.error("Error rendering frequency chart:", error);
                    console.error("Error stack:", error.stack);
                    showErrorPopup(sel, `Failed to display frequency data: ${error.message}`);
                }
            } else {
                showErrorPopup(sel, response.error || "Failed to fetch frequency");
            }
        }
    );
}

function renderFrequencyChart(word, frequencyData, range) {
    try {
        console.log("LexBee: Rendering frequency chart for:", word);
        console.log("LexBee: Frequency data:", frequencyData);

        // Destroy existing chart if any
        if (currentChart) {
            currentChart = null;
        }

        removeExistingPopup();

        const popup = document.createElement("div");
        popup.className = "word-popup";
        popup.setAttribute("data-view", "frequency");
        // Increase width for chart view
        popup.style.maxWidth = "600px";

        // Validate and process frequency data
        if (!frequencyData || !frequencyData.frequencies) {
            throw new Error("Frequency data is missing or invalid");
        }

        const frequencies = frequencyData.frequencies;
        if (typeof frequencies !== 'object' || Object.keys(frequencies).length === 0) {
            throw new Error("Frequency data is empty");
        }

        const chartData = processFrequencyData(frequencies);
        console.log("LexBee: Processed chart data:", chartData);

        if (!chartData || !chartData.labels || !chartData.values) {
            throw new Error("Failed to process frequency data");
        }

        if (chartData.labels.length === 0 || chartData.values.length === 0) {
            throw new Error("Chart data is empty");
        }

        // Create chart container
        const html = `
            <div class="frequency-title">Usage Frequency: ${escapeHtml(word)}</div>
            <div class="chart-container" style="position: relative;"></div>
            <div class="popup-footer">
                <button class="back-button">Back</button>
            </div>
        `;

        popup.innerHTML = html;
        positionPopup(popup, range);

        // Get chart container
        const chartContainer = popup.querySelector(".chart-container");
        if (!chartContainer) {
            throw new Error("Chart container not found");
        }

        // Create SVG chart
        const chartWidth = 560;
        const chartHeight = 300;

        console.log("LexBee: Creating SVG chart...");
        const { svg, tooltip } = createSVGChart(chartData, chartWidth, chartHeight);
        console.log("LexBee: SVG chart created successfully");

        chartContainer.appendChild(svg);
        document.body.appendChild(tooltip); // Add tooltip to body for proper positioning

        // Store reference for cleanup
        currentChart = { tooltip, svg };

        // Add back button handler
        const backButton = popup.querySelector(".back-button");
        if (backButton) {
            backButton.addEventListener("click", async (e) => {
                e.stopPropagation();
                if (currentWord && currentSelection) {
                    // Reload definition view
                    showLoadingPopup(currentSelection);
                    chrome.runtime.sendMessage(
                        { action: "lookupWord", word: currentWord },
                        (response) => {
                            removeExistingPopup();
                            if (response && response.success) {
                                showPopup(response.data, currentSelection);
                            } else {
                                showErrorPopup(currentSelection, "Failed to load definition");
                            }
                        }
                    );
                }
            });
        }
    } catch (error) {
        console.error("Error in renderFrequencyChart:", error);
        throw error; // Re-throw to be caught by caller
    }
}

function processFrequencyData(frequencies) {
    // Convert frequencies object to sorted array
    const years = Object.keys(frequencies).map(Number).sort((a, b) => a - b);
    const values = years.map((year) => frequencies[year]);

    // Return all years and values - x-axis label filtering will be done in chart config
    return {
        labels: years.map(year => year.toString()), // All years for data points
        values: values, // All frequency values
    };
}

function removeExistingPopup() {
    // Clean up chart tooltip if exists
    if (currentChart) {
        if (currentChart.tooltip) {
            const tooltip = currentChart.tooltip;
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }
        if (currentChart.svg && currentChart.svg.parentNode) {
            currentChart.svg.parentNode.removeChild(currentChart.svg);
        }
        currentChart = null;
    }
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
