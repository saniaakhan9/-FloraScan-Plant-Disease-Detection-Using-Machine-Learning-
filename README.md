# 🌿 FloraScan - Plant Disease Detection

A deep learning-based web application for detecting diseases in plant leaves using transfer learning with MobileNetV2.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)
![TensorFlow](https://img.shields.io/badge/TensorFlow-2.10+-orange.svg)
![Flask](https://img.shields.io/badge/Flask-2.0+-green.svg)

## 📋 Overview

FloraScan is a final year project that uses computer vision and deep learning to identify diseases in plant leaves. The system supports detection of 15 different disease classes across Tomato, Potato, and Bell Pepper plants.

## 🎯 Features

- **Disease Detection**: Identifies 15 types of plant diseases
- **Web Interface**: Modern, responsive UI with glassmorphism design
- **Real-time Analysis**: Upload and analyze leaf images instantly
- **Treatment Suggestions**: Provides symptoms and treatment recommendations

## 📊 Model Performance

| Model | Validation Accuracy |
|-------|---------------------|
| ANN Baseline | 7.5% |
| Basic CNN | 68.7% |
| Improved CNN | 80.4% |
| Transfer Learning (MobileNetV2) | 83.5% |
| **Fine-tuned (Best)** | **84.5%** |

## 🗂️ Project Structure

```
FloraScan/
├── app.py                  # Flask application
├── requirements.txt        # Python dependencies
├── models/                 # Trained models
│   ├── model_v5_retrained.h5
│   └── class_names.json
├── notebooks/              # Jupyter notebooks
│   ├── 00_ann_baseline.ipynb
│   ├── 01_basic_cnn.ipynb
│   ├── 02_improved_cnn.ipynb
│   ├── 03_transfer_learning.ipynb
│   ├── 04_final_model.ipynb
│   ├── 05_model_comparison.ipynb
│   └── 05_retrain_model.ipynb
├── static/
│   ├── css/style.css
│   ├── js/main.js
│   └── images/
├── templates/
│   └── index.html
└── results/                # Generated graphs
```

## 🚀 Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/FloraScan.git
cd FloraScan
```

2. **Create virtual environment**
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Linux/Mac
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Run the application**
```bash
python app.py
```

5. **Open browser**
```
http://localhost:5000
```

## 🧪 Training Notebooks

| Notebook | Description |
|----------|-------------|
| `00_ann_baseline.ipynb` | Baseline ANN model |
| `01_basic_cnn.ipynb` | Basic CNN architecture |
| `02_improved_cnn.ipynb` | CNN with regularization |
| `03_transfer_learning.ipynb` | MobileNetV2 transfer learning |
| `04_final_model.ipynb` | Fine-tuning MobileNetV2 |
| `05_model_comparison.ipynb` | Model comparison dashboard |

## 🌱 Supported Plants & Diseases

### Tomato (10 classes)
- Bacterial Spot, Early Blight, Late Blight, Leaf Mold
- Septoria Leaf Spot, Spider Mites, Target Spot
- Yellow Leaf Curl Virus, Mosaic Virus, Healthy

### Potato (3 classes)
- Early Blight, Late Blight, Healthy

### Pepper (2 classes)
- Bacterial Spot, Healthy

## 📸 Screenshots

*Run the application to see the modern glassmorphic UI with animations!*

## 🛠️ Technologies Used

- **Backend**: Python, Flask, TensorFlow/Keras
- **Frontend**: HTML5, CSS3, JavaScript
- **Model**: MobileNetV2 (Transfer Learning)
- **Dataset**: PlantVillage Dataset

## 📄 License

This project is for educational purposes - Final Year Project 2025.

## 👤 Author

**SANIA KHAN**
- Final Year Computer Science Student
- Project: FloraScan - Plant Disease Detection
