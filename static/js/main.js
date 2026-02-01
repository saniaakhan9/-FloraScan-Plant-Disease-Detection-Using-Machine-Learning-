/* ============================================
   FLORASCAN - JavaScript Interactions
   ============================================ */

// DOM Elements
const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const fileInputBatch = document.getElementById('file-input-batch');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const batchContainer = document.getElementById('batch-container');
const batchPreviewGrid = document.getElementById('batch-preview-grid');
const batchResults = document.getElementById('batch-results');

let selectedFile = null;
let batchFiles = [];
let currentLang = 'en';
let isBatchMode = false;
let scanHistory = JSON.parse(localStorage.getItem('floraScanHistory') || '[]');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initUploadHandlers();
    initSmoothScroll();
    init3DCardEffects();
    initLanguageToggle();
    initHistoryPanel();
    initShareButton();
    initModeToggle();
    initBatchHandlers();
});

// Mode Toggle
function initModeToggle() {
    const singleMode = document.getElementById('single-mode');
    const batchMode = document.getElementById('batch-mode');

    singleMode?.addEventListener('click', () => {
        isBatchMode = false;
        singleMode.classList.add('active');
        batchMode.classList.remove('active');
        batchContainer.style.display = 'none';
        batchResults.classList.remove('show');
        uploadBox.style.display = 'block';
        updateUploadText();
    });

    batchMode?.addEventListener('click', () => {
        isBatchMode = true;
        batchMode.classList.add('active');
        singleMode.classList.remove('active');
        previewContainer.style.display = 'none';
        resultsSection.style.display = 'none';
        uploadBox.style.display = 'block';
        updateUploadText();
    });
}

function updateUploadText() {
    const uploadText = document.querySelector('.upload-text');
    const uploadHint = document.querySelector('.upload-hint');
    if (isBatchMode) {
        uploadText.textContent = currentLang === 'hi' ? 'एकाधिक छवियाँ यहाँ छोड़ें' : 'Drop multiple images here';
        uploadHint.textContent = currentLang === 'hi' ? 'या कई फ़ाइलें चुनने के लिए क्लिक करें' : 'or click to select multiple files';
    } else {
        uploadText.textContent = currentLang === 'hi' ? 'अपनी छवि यहाँ छोड़ें' : 'Drop your image here';
        uploadHint.textContent = currentLang === 'hi' ? 'या फ़ाइलें ब्राउज़ करने के लिए क्लिक करें' : 'or click to browse files';
    }
}

// Upload Handlers
function initUploadHandlers() {
    uploadBox.addEventListener('click', () => {
        if (isBatchMode) {
            fileInputBatch.click();
        } else {
            fileInput.click();
        }
    });

    uploadBox.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    });

    uploadBox.addEventListener('dragleave', () => {
        uploadBox.classList.remove('dragover');
    });

    uploadBox.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));

        if (isBatchMode && files.length > 0) {
            handleBatchFiles(files);
        } else if (files[0]) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    resetBtn.addEventListener('click', resetUpload);
    analyzeBtn.addEventListener('click', analyzeImage);
}

// Batch Handlers
function initBatchHandlers() {
    fileInputBatch?.addEventListener('change', (e) => {
        const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
            handleBatchFiles(files);
        }
    });

    document.getElementById('analyze-batch-btn')?.addEventListener('click', analyzeBatch);
    document.getElementById('reset-batch-btn')?.addEventListener('click', resetBatch);
}

function handleBatchFiles(files) {
    batchFiles = [...batchFiles, ...files].slice(0, 10); // Max 10 files
    uploadBox.style.display = 'none';
    batchContainer.style.display = 'block';
    renderBatchPreviews();
    document.getElementById('analyze-batch-btn').disabled = false;
}

function renderBatchPreviews() {
    batchPreviewGrid.innerHTML = '';
    document.getElementById('batch-progress-text').textContent = `${batchFiles.length} ${currentLang === 'hi' ? 'छवियाँ' : 'images'}`;

    batchFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'batch-preview-item';
            item.dataset.index = index;
            item.innerHTML = `
                <img src="${e.target.result}" alt="Image ${index + 1}">
                <button class="remove-btn" onclick="removeBatchItem(${index})">✕</button>
                <span class="status-icon"></span>
            `;
            batchPreviewGrid.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function removeBatchItem(index) {
    batchFiles.splice(index, 1);
    if (batchFiles.length === 0) {
        resetBatch();
    } else {
        renderBatchPreviews();
    }
}

async function analyzeBatch() {
    if (batchFiles.length === 0) return;

    const analyzeBtn = document.getElementById('analyze-batch-btn');
    analyzeBtn.disabled = true;
    batchResults.innerHTML = '';
    batchResults.classList.add('show');

    let completed = 0;
    const total = batchFiles.length;

    for (let i = 0; i < batchFiles.length; i++) {
        const file = batchFiles[i];
        const previewItem = batchPreviewGrid.querySelector(`[data-index="${i}"]`);

        if (previewItem) {
            previewItem.classList.add('analyzing');
            previewItem.querySelector('.status-icon').textContent = '⏳';
        }

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Update preview item
                if (previewItem) {
                    previewItem.classList.remove('analyzing');
                    previewItem.classList.add('analyzed');
                    previewItem.querySelector('.status-icon').textContent = '✅';
                }

                // Add result card
                const pred = data.prediction;
                const isHealthy = pred.disease.toLowerCase().includes('healthy');
                const confidence = pred.confidence;
                let confidenceClass = 'low';
                let severity = '🟡';

                if (confidence > 85) {
                    confidenceClass = 'high';
                    severity = isHealthy ? '✅' : '🔴';
                } else if (confidence > 60) {
                    confidenceClass = 'medium';
                    severity = '🟠';
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const card = document.createElement('div');
                    card.className = 'batch-result-card';
                    card.innerHTML = `
                        <img src="${e.target.result}" alt="Result">
                        <div class="batch-result-info">
                            <div class="batch-result-disease">${pred.disease}</div>
                            <div class="batch-result-plant">${pred.plant}</div>
                            <span class="batch-result-confidence ${confidenceClass}">${confidence.toFixed(1)}%</span>
                        </div>
                        <div class="batch-result-severity">${severity}</div>
                    `;
                    batchResults.appendChild(card);
                };
                reader.readAsDataURL(file);

                saveToHistory(data);
            }
        } catch (error) {
            if (previewItem) {
                previewItem.classList.remove('analyzing');
                previewItem.querySelector('.status-icon').textContent = '❌';
            }
        }

        completed++;
        document.getElementById('batch-progress-text').textContent =
            `${completed}/${total} ${currentLang === 'hi' ? 'पूर्ण' : 'completed'}`;
    }

    analyzeBtn.disabled = false;
    showToast(currentLang === 'hi' ? `${total} छवियों का विश्लेषण पूर्ण!` : `Analyzed ${total} images!`);
}

function resetBatch() {
    batchFiles = [];
    batchPreviewGrid.innerHTML = '';
    batchResults.innerHTML = '';
    batchResults.classList.remove('show');
    batchContainer.style.display = 'none';
    uploadBox.style.display = 'block';
    uploadBox.style.opacity = '1';
    fileInputBatch.value = '';
    document.getElementById('analyze-batch-btn').disabled = true;
    document.getElementById('batch-progress-text').textContent = '0/0';
}

// Handle single file selection
function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;
        uploadBox.style.opacity = '0';
        uploadBox.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            uploadBox.style.display = 'none';
            previewContainer.style.display = 'block';
            analyzeBtn.disabled = false;
        }, 300);
    };

    reader.readAsDataURL(file);
}

// Reset upload
function resetUpload() {
    selectedFile = null;
    fileInput.value = '';
    previewContainer.style.display = 'none';
    uploadBox.style.display = 'block';
    uploadBox.style.opacity = '1';
    uploadBox.style.transform = 'translateY(0)';
    analyzeBtn.disabled = true;
    resultsSection.style.display = 'none';
}

// Analyze image
async function analyzeImage() {
    if (!selectedFile) return;

    loading.style.display = 'block';
    resultsSection.style.display = 'none';
    analyzeBtn.disabled = true;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch('/predict', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            displayResults(data);
            saveToHistory(data);
        } else {
            showToast(currentLang === 'hi' ? 'विश्लेषण विफल' : 'Analysis failed');
        }
    } catch (error) {
        showToast(currentLang === 'hi' ? 'कनेक्शन त्रुटि' : 'Connection error');
    } finally {
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Display results with severity
function displayResults(data) {
    const pred = data.prediction;
    const isHealthy = pred.disease.toLowerCase().includes('healthy');
    const confidence = pred.confidence;

    // Set severity
    const severityBadge = document.getElementById('severity-badge');
    let severity, severityText, severityIcon;

    if (isHealthy) {
        severity = 'mild';
        severityIcon = '✅';
        severityText = currentLang === 'hi' ? 'स्वस्थ' : 'Healthy';
    } else if (confidence > 85) {
        severity = 'severe';
        severityIcon = '🔴';
        severityText = currentLang === 'hi' ? 'गंभीर' : 'Severe';
    } else if (confidence > 60) {
        severity = 'moderate';
        severityIcon = '🟠';
        severityText = currentLang === 'hi' ? 'मध्यम' : 'Moderate';
    } else {
        severity = 'mild';
        severityIcon = '🟡';
        severityText = currentLang === 'hi' ? 'हल्का' : 'Mild';
    }

    severityBadge.className = 'severity-badge ' + severity;
    severityBadge.innerHTML = `<span class="severity-icon">${severityIcon}</span><span class="severity-text">${severityText}</span>`;

    // Update result badge
    const badge = document.getElementById('result-badge');
    badge.className = 'result-badge ' + (isHealthy ? 'healthy' : 'disease');
    badge.innerHTML = `<span>${isHealthy ? '✓' : '⚠'}</span> ${isHealthy ? (currentLang === 'hi' ? 'पौधा स्वस्थ है' : 'Plant is Healthy') : (currentLang === 'hi' ? 'रोग का पता चला' : 'Disease Detected')}`;

    // Update icon
    const icon = document.getElementById('result-icon');
    icon.className = 'result-icon-large ' + (isHealthy ? 'healthy' : 'disease');
    icon.textContent = isHealthy ? '🌿' : '🔍';

    // Update main info
    document.getElementById('disease-name').textContent = pred.disease;
    document.getElementById('plant-type').textContent = pred.plant;
    document.getElementById('confidence-fill').style.width = confidence + '%';
    document.getElementById('confidence-text').textContent = confidence.toFixed(1) + '% ' + (currentLang === 'hi' ? 'विश्वास' : 'Confidence');

    // Update details
    document.getElementById('symptoms-text').textContent = pred.symptoms;
    document.getElementById('treatment-text').textContent = pred.treatment;
    document.getElementById('cost-text').textContent = pred.cost || 'N/A';
    document.getElementById('timing-text').textContent = pred.timing || 'Consult expert';
    document.getElementById('prevention-text').textContent = pred.prevention || 'Follow good practices';

    // Update predictions list
    const predictionsList = document.getElementById('predictions-list');
    predictionsList.innerHTML = `<h4>${currentLang === 'hi' ? 'अन्य संभावनाएं' : 'Other Possibilities'}</h4>`;

    data.top_3.forEach((p, index) => {
        if (index === 0) return;
        const name = p.class.split('___').pop().replace(/_/g, ' ');
        const item = document.createElement('div');
        item.className = 'prediction-item';
        item.innerHTML = `
            <span class="prediction-name">${name}</span>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${p.confidence}%"></div>
            </div>
            <span class="prediction-percent">${p.confidence.toFixed(1)}%</span>
        `;
        predictionsList.appendChild(item);
    });

    resultsSection.style.display = 'block';
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Language Toggle
function initLanguageToggle() {
    const langBtns = document.querySelectorAll('.lang-btn');

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            langBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLang = btn.dataset.lang;
            updateLanguage();
            updateUploadText();
        });
    });
}

function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
    showToast(currentLang === 'hi' ? 'भाषा बदली गई' : 'Language changed');
}

// History Panel
function initHistoryPanel() {
    document.getElementById('history-btn')?.addEventListener('click', () => {
        historyPanel.classList.add('show');
        renderHistory();
    });

    document.getElementById('close-history')?.addEventListener('click', () => {
        historyPanel.classList.remove('show');
    });
}

function saveToHistory(data) {
    const entry = {
        disease: data.prediction.disease,
        plant: data.prediction.plant,
        confidence: data.prediction.confidence.toFixed(1),
        date: new Date().toLocaleDateString(),
        image: previewImage?.src?.substring(0, 100) + '...'
    };

    scanHistory.unshift(entry);
    if (scanHistory.length > 10) scanHistory.pop();
    localStorage.setItem('floraScanHistory', JSON.stringify(scanHistory));
}

function renderHistory() {
    if (scanHistory.length === 0) {
        historyList.innerHTML = `<p class="no-history">${currentLang === 'hi' ? 'अभी तक कोई स्कैन नहीं' : 'No scans yet'}</p>`;
        return;
    }

    historyList.innerHTML = scanHistory.map(item => `
        <div class="history-item">
            <div class="history-info">
                <div class="history-disease">${item.disease}</div>
                <div class="history-date">${item.plant} • ${item.date}</div>
            </div>
            <div class="history-confidence">${item.confidence}%</div>
        </div>
    `).join('');
}

// Share Button
function initShareButton() {
    document.getElementById('share-btn')?.addEventListener('click', shareResult);
}

function shareResult() {
    const disease = document.getElementById('disease-name').textContent;
    const plant = document.getElementById('plant-type').textContent;
    const confidence = document.getElementById('confidence-text').textContent;

    const text = `🌿 FloraScan Result:\n${disease}\nPlant: ${plant}\n${confidence}\n\nAnalyzed with FloraScan - Plant Disease Detection`;

    if (navigator.share) {
        navigator.share({ title: 'FloraScan Result', text: text });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            showToast(currentLang === 'hi' ? 'परिणाम कॉपी हो गया!' : 'Result copied to clipboard!');
        });
    }
}

// Toast notification
function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Smooth scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// 3D Card effects
function init3DCardEffects() {
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const rotateX = (y - rect.height / 2) / 10;
            const rotateY = (rect.width / 2 - x) / 10;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
}

// Scroll animations
window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.opacity = 1 - (scrolled / 600);
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// Make removeBatchItem global
window.removeBatchItem = removeBatchItem;

// Disease Data for Modal
const diseaseData = {
    tomato: [
        { name: 'Bacterial Spot', icon: '🦠', desc: 'Dark spots on leaves & fruit' },
        { name: 'Early Blight', icon: '🍂', desc: 'Target-like rings on leaves' },
        { name: 'Late Blight', icon: '💧', desc: 'Brown patches, white mold' },
        { name: 'Leaf Mold', icon: '🌫️', desc: 'Yellow spots, green mold' },
        { name: 'Septoria Leaf Spot', icon: '⚪', desc: 'Tiny circular spots' },
        { name: 'Spider Mites', icon: '🕷️', desc: 'Webbing, yellow dots' },
        { name: 'Target Spot', icon: '🎯', desc: 'Bullseye pattern spots' },
        { name: 'Yellow Leaf Curl Virus', icon: '🌀', desc: 'Curling, yellow leaves' },
        { name: 'Mosaic Virus', icon: '🧩', desc: 'Mottled leaf pattern' },
        { name: 'Healthy', icon: '✅', desc: 'No disease detected', healthy: true }
    ],
    potato: [
        { name: 'Early Blight', icon: '🍂', desc: 'Concentric ring spots' },
        { name: 'Late Blight', icon: '💧', desc: 'Gray-green water spots' },
        { name: 'Healthy', icon: '✅', desc: 'No disease detected', healthy: true }
    ],
    pepper: [
        { name: 'Bacterial Spot', icon: '🦠', desc: 'Water-soaked dark spots' },
        { name: 'Healthy', icon: '✅', desc: 'No disease detected', healthy: true }
    ]
};

// Show Disease Modal
function showDiseaseModal(plant) {
    const modal = document.getElementById('disease-modal');
    const title = document.getElementById('modal-title');
    const list = document.getElementById('disease-list');

    const plantName = plant.charAt(0).toUpperCase() + plant.slice(1);
    title.textContent = currentLang === 'hi'
        ? `${plantName} के रोग`
        : `${plantName} Diseases`;

    const diseases = diseaseData[plant] || [];
    list.innerHTML = diseases.map(d => `
        <div class="disease-card ${d.healthy ? 'healthy' : ''}">
            <div class="disease-icon">${d.icon}</div>
            <div class="disease-info">
                <h4>${d.name}</h4>
                <p>${d.desc}</p>
            </div>
        </div>
    `).join('');

    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Close Disease Modal
function closeDiseaseModal() {
    const modal = document.getElementById('disease-modal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close modal on outside click
document.getElementById('disease-modal')?.addEventListener('click', (e) => {
    if (e.target.id === 'disease-modal') {
        closeDiseaseModal();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeDiseaseModal();
    }
});

// Make modal functions global
window.showDiseaseModal = showDiseaseModal;
window.closeDiseaseModal = closeDiseaseModal;
