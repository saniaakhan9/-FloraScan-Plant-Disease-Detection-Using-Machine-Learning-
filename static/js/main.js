/* ============================================
   FLORASCAN - JavaScript Interactions
   ============================================ */

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const uploadBox = document.getElementById('upload-box');
const previewContainer = document.getElementById('preview-container');
const previewImage = document.getElementById('preview-image');
const analyzeBtn = document.getElementById('analyze-btn');
const resetBtn = document.getElementById('reset-btn');
const loading = document.getElementById('loading');
const resultsSection = document.getElementById('results-section');

let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initUploadHandlers();
    initSmoothScroll();
    init3DCardEffects();
});

// Upload Handlers
function initUploadHandlers() {
    // Click to upload
    uploadBox.addEventListener('click', () => fileInput.click());

    // Drag and drop
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
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleFile(file);
        }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    // Reset button
    resetBtn.addEventListener('click', resetUpload);

    // Analyze button
    analyzeBtn.addEventListener('click', analyzeImage);
}

// Handle file selection
function handleFile(file) {
    selectedFile = file;
    const reader = new FileReader();

    reader.onload = (e) => {
        previewImage.src = e.target.result;

        // Smooth transition
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

    // Show loading
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
        } else {
            showError(data.error || 'Analysis failed');
        }
    } catch (error) {
        showError('Connection error: ' + error.message);
    } finally {
        loading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Display results
function displayResults(data) {
    const pred = data.prediction;
    const isHealthy = pred.disease.toLowerCase().includes('healthy');

    // Update badge
    const badge = document.getElementById('result-badge');
    badge.className = 'result-badge ' + (isHealthy ? 'healthy' : 'disease');
    badge.innerHTML = `<span>${isHealthy ? '✓' : '⚠'}</span> ${isHealthy ? 'Plant is Healthy' : 'Disease Detected'}`;

    // Update icon
    const icon = document.getElementById('result-icon');
    icon.className = 'result-icon-large ' + (isHealthy ? 'healthy' : 'disease');
    icon.textContent = isHealthy ? '🌿' : '🔍';

    // Update main info
    document.getElementById('disease-name').textContent = pred.disease;
    document.getElementById('plant-type').textContent = pred.plant;

    // Update confidence
    const confidence = pred.confidence;
    document.getElementById('confidence-fill').style.width = confidence + '%';
    document.getElementById('confidence-text').textContent = confidence.toFixed(1) + '% Confidence';

    // Update details
    document.getElementById('symptoms-text').textContent = pred.symptoms;
    document.getElementById('treatment-text').textContent = pred.treatment;

    // Update predictions list
    const predictionsList = document.getElementById('predictions-list');
    predictionsList.innerHTML = '<h4>Other Possibilities</h4>';

    data.top_3.forEach((p, index) => {
        if (index === 0) return; // Skip first (main prediction)

        const item = document.createElement('div');
        item.className = 'prediction-item';

        const name = p.class.split('___').pop().replace(/_/g, ' ');
        item.innerHTML = `
            <span class="prediction-name">${name}</span>
            <div class="prediction-bar">
                <div class="prediction-fill" style="width: ${p.confidence}%"></div>
            </div>
            <span class="prediction-percent">${p.confidence.toFixed(1)}%</span>
        `;

        predictionsList.appendChild(item);
    });

    // Show results with animation
    resultsSection.style.display = 'block';

    // Scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

// Show error
function showError(message) {
    alert('Error: ' + message);
}

// Smooth scroll for navigation
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// 3D Card hover effects
function init3DCardEffects() {
    const cards = document.querySelectorAll('.category-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

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
