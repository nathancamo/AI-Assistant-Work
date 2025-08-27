// Tabs
function openTab(event, tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab-button');
    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Dark mode toggle
const themeBtn = document.getElementById('toggleThemeBtn');
themeBtn.onclick = function() {
    document.body.classList.toggle('dark-mode');
    themeBtn.querySelector('.material-symbols-outlined').textContent =
        document.body.classList.contains('dark-mode') ? 'dark_mode' : 'light_mode';
};

// Drag & drop image upload
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const fileNameDiv = document.getElementById('fileName');
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        imageInput.files = files;
        fileNameDiv.textContent = files[0].name;
        handleImage(files[0]);
    }
});
imageInput.addEventListener('change', function() {
    if (imageInput.files.length > 0) {
        fileNameDiv.textContent = imageInput.files[0].name;
        handleImage(imageInput.files[0]);
    } else {
        fileNameDiv.textContent = "No file selected";
    }
});
function handleImage(file) {
    showProgress("Reading image...");
    Tesseract.recognize(file, 'eng').then(({ data: { text } }) => {
        document.getElementById('textInput').value = text;
        showProgress("");
    }).catch(err => {
        showMessage("OCR failed. Try another image.");
        showProgress("");
    });
}

// Conversation History
const historyKey = 'aiAssistantHistory';
function addHistoryEntry(type, input, output) {
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({ type, input, output, timestamp: new Date().toISOString() });
    localStorage.setItem(historyKey, JSON.stringify(history));
    renderHistory();
}
function renderHistory() {
    let history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    const historyContent = document.getElementById('historyContent');
    if (!history.length) {
        historyContent.textContent = "No history yet.";
    } else {
        historyContent.innerHTML = history.map((h, idx) =>
            `<div class="history-row">
                <strong>${idx + 1}. [${h.type}]</strong>
                <div><b>Input:</b> ${h.input}</div>
                <div><b>Output:</b> <pre>${h.output}</pre></div>
                <div style="font-size:0.85em;color:#888">${new Date(h.timestamp).toLocaleString()}</div>
            </div>`
        ).join('');
    }
}
window.addEventListener('DOMContentLoaded', renderHistory);

// Download response as text
document.getElementById('downloadButton').onclick = function() {
    const response = document.getElementById('responseOutput').value;
    const blob = new Blob([response], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'ai-response.txt';
    link.href = URL.createObjectURL(blob);
    link.click();
};

// Gemini API helper
function callGeminiAI({ prompt, tone = 'auto', type = 'generator', outputEl, showProgressFn, useKnowledgeBase }) {
    if (showProgressFn) showProgressFn("Generating response...");
    return fetch('http://localhost:3001/api/gemini', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, tone, type, useKnowledgeBase })
    }).then(res => res.json())
      .then(data => {
        let output = data?.candidates?.[0]?.content?.parts?.[0]?.text || (data.error || "No response from Gemini.");
        if (outputEl) outputEl.value ? outputEl.value = output : outputEl.textContent = output;
        if (showProgressFn) showProgressFn("");
        addHistoryEntry(type, prompt, output);
        return output;
      }).catch(e => {
        if (showProgressFn) showProgressFn("");
        showMessage("Gemini API error: " + (e.message || e));
        if (outputEl) outputEl.value ? outputEl.value = "Gemini API error: " + (e.message || e) : outputEl.textContent = "Gemini API error: " + (e.message || e);
      });
}

// Generator Tab
const processButton = document.getElementById('processButton');
const detailedButton = document.getElementById('detailedButton');
const responseOutput = document.getElementById('responseOutput');
const postGenerationSection = document.getElementById('postGenerationSection');
const toneControl = document.getElementById('toneControl');
const useKBCheckbox = document.getElementById('useKBCheckbox');
processButton.onclick = function() {
    processButton.disabled = true;
    detailedButton.disabled = true;
    callGeminiAI({
        prompt: document.getElementById('textInput').value,
        tone: toneControl.value,
        type: 'generator',
        outputEl: responseOutput,
        showProgressFn: showProgress,
        useKnowledgeBase: useKBCheckbox.checked
    }).then(showPostGenerationSection)
    .finally(() => {
        processButton.disabled = false;
        detailedButton.disabled = false;
    });
};
detailedButton.onclick = function() {
    processButton.disabled = true;
    detailedButton.disabled = true;
    callGeminiAI({
        prompt: document.getElementById('textInput').value,
        tone: toneControl.value,
        type: 'generator',
        outputEl: responseOutput,
        showProgressFn: showProgress,
        useKnowledgeBase: useKBCheckbox.checked
    }).then(showPostGenerationSection)
    .finally(() => {
        processButton.disabled = false;
        detailedButton.disabled = false;
    });
};

function showPostGenerationSection() {
    postGenerationSection.style.display = 'block';
}
document.getElementById('copyButton').onclick = function() {
    responseOutput.select();
    document.execCommand('copy');
    showMessage("Copied to clipboard!");
};

// Assistant Tools Tab (Gemini for ALL tools!)
document.getElementById('snapshotButton').onclick = function() {
    document.getElementById('snapshotResult').textContent = '';
    callGeminiAI({
        prompt: document.getElementById('studentIdInput').value,
        type: 'snapshot',
        outputEl: document.getElementById('snapshotResult'),
        showProgressFn: showProgress,
        useKnowledgeBase: true
    });
};
document.getElementById('prereqButton').onclick = function() {
    document.getElementById('prereqResult').textContent = '';
    callGeminiAI({
        prompt: document.getElementById('prereqInput').value,
        type: 'prereq',
        outputEl: document.getElementById('prereqResult'),
        showProgressFn: showProgress,
        useKnowledgeBase: true
    });
};
document.getElementById('caseButton').onclick = function() {
    document.getElementById('caseResult').textContent = '';
    callGeminiAI({
        prompt: document.getElementById('caseInput').value,
        type: 'case',
        outputEl: document.getElementById('caseResult'),
        showProgressFn: showProgress,
        useKnowledgeBase: true
    });
};
document.getElementById('scenarioButton').onclick = function() {
    document.getElementById('scenarioResult').textContent = '';
    callGeminiAI({
        prompt: document.getElementById('scenarioInput').value,
        type: 'scenario',
        outputEl: document.getElementById('scenarioResult'),
        showProgressFn: showProgress,
        useKnowledgeBase: true
    });
};
document.getElementById('careerButton').onclick = function() {
    document.getElementById('careerResult').textContent = '';
    callGeminiAI({
        prompt: document.getElementById('careerInput').value,
        type: 'career',
        outputEl: document.getElementById('careerResult'),
        showProgressFn: showProgress,
        useKnowledgeBase: true
    });
};

// Feedback
document.getElementById('submitFeedbackButton').onclick = function() {
    const feedback = document.getElementById('feedbackText').value;
    const source = responseOutput.value || "";
    fetch('http://localhost:3001/api/feedback', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: feedback, source })
    }).then(() => {
        showMessage("Feedback submitted: " + feedback);
        document.getElementById('feedbackText').value = "";
    });
};

// Knowledge Base (sync to server, autosave)
const knowledgeBase = document.getElementById('knowledgeBase');
const kbSaveStatus = document.getElementById('kbSaveStatus');
function loadKnowledgeBase() {
    fetch('http://localhost:3001/api/knowledge-base')
        .then(res => res.json())
        .then(data => {
            knowledgeBase.value = data.content || '';
        });
}
function saveKnowledgeBase() {
    kbSaveStatus.textContent = "Saving...";
    fetch('http://localhost:3001/api/knowledge-base', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: knowledgeBase.value })
    }).then(() => {
        kbSaveStatus.textContent = "Saved at " + new Date().toLocaleTimeString();
        setTimeout(() => kbSaveStatus.textContent = "", 2000);
    });
}
knowledgeBase.addEventListener('input', function() {
    saveKnowledgeBase();
});
window.addEventListener('DOMContentLoaded', loadKnowledgeBase);

// Analytics Tab (Gemini-powered reports, feedback insights)
document.getElementById('predictiveButton').onclick = function() {
    document.getElementById('analyticsContent').textContent = '';
    callGeminiAI({
        prompt: `Given current course and query trends, provide predictive insights for next week.`,
        type: 'analytics',
        outputEl: document.getElementById('analyticsContent'),
        showProgressFn: showProgress
    });
};
document.getElementById('reportButton').onclick = function() {
    document.getElementById('analyticsContent').textContent = '';
    callGeminiAI({
        prompt: `Generate a weekly report summary for recent queries and feedback.`,
        type: 'analytics',
        outputEl: document.getElementById('analyticsContent'),
        showProgressFn: showProgress
    });
};
document.getElementById('feedbackInsightsButton').onclick = function() {
    document.getElementById('analyticsContent').textContent = '';
    fetch('http://localhost:3001/api/feedback')
        .then(res => res.json())
        .then(data => {
            const feedbacks = data.feedback.map(f => `- ${f.text} (${new Date(f.timestamp).toLocaleDateString()})`).join('\n');
            callGeminiAI({
                prompt: `Summarize feedback insights from these user submissions:\n${feedbacks}`,
                type: 'analytics',
                outputEl: document.getElementById('analyticsContent'),
                showProgressFn: showProgress
            });
        });
};

// Message box for notifications
function showMessage(msg) {
    const box = document.getElementById('messageBox');
    box.textContent = msg;
    box.classList.add('show');
    setTimeout(() => box.classList.remove('show'), 2000);
}

// Progress spinner
function showProgress(msg) {
    const progressDiv = document.getElementById('progress');
    if (msg) {
        progressDiv.innerHTML = `<span class="spinner"></span> ${msg}`;
    } else {
        progressDiv.innerHTML = "";
    }
}

// Modal (example usage)
window.showModal = function(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('appModal').style.display = 'flex';
};