const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileNameDisplay = document.getElementById('file-name');
const analyzeBtn = document.getElementById('analyze-btn');
const loadingDiv = document.getElementById('loading');
const resultContainer = document.getElementById('result-container');
const outputDiv = document.getElementById('output');

let selectedFile = null;

// Handle Drag & Drop Visuals
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        handleFile(e.dataTransfer.files[0]);
    }
});

// Handle File Selection via Browse
fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length) {
        handleFile(fileInput.files[0]);
    }
});

function handleFile(file) {
    // Simple validation
    const validTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF or Text file.');
        return;
    }

    selectedFile = file;
    fileNameDisplay.textContent = `Selected: ${file.name}`;
    analyzeBtn.disabled = false;
}

// Send to Backend
analyzeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    // UI Updates
    analyzeBtn.disabled = true;
    loadingDiv.classList.remove('hidden');
    resultContainer.classList.add('hidden');

    const formData = new FormData();
    formData.append('resume', selectedFile);

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Convert Markdown-style bolding to HTML
            // (Simple regex for demo purposes, in production use a library like marked.js)
            let formattedText = data.analysis
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>');

            outputDiv.innerHTML = formattedText;
            resultContainer.classList.remove('hidden');
        } else {
            outputDiv.textContent = `Error: ${data.error}`;
            resultContainer.classList.remove('hidden');
        }
    } catch (error) {
        console.error(error);
        outputDiv.textContent = "An unexpected error occurred.";
        resultContainer.classList.remove('hidden');
    } finally {
        loadingDiv.classList.add('hidden');
        analyzeBtn.disabled = false;
    }
});