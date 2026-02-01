from flask import Flask, request, jsonify, render_template
try:
    from flask_cors import CORS
    HAS_CORS = True
except ImportError:
    HAS_CORS = False
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
import numpy as np
import os
import json
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
if HAS_CORS:
    CORS(app)

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'model_v5_retrained.h5')
CLASS_NAMES_PATH = os.path.join(os.path.dirname(__file__), 'models', 'class_names.json')
IMG_SIZE = 224

# Load model and class names
print("Loading model...")
model = load_model(MODEL_PATH)
print("Model loaded!")

with open(CLASS_NAMES_PATH, 'r') as f:
    class_names = json.load(f)
print(f"Loaded {len(class_names)} classes")

def preprocess_image(img):
    """Preprocess image for prediction"""
    if img.mode != 'RGB':
        img = img.convert('RGB')
    img = img.resize((IMG_SIZE, IMG_SIZE))
    img_array = np.array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)
    return img_array

def get_disease_info(class_name):
    """Get disease information and recommendations"""
    disease_info = {
        'Pepper__bell___Bacterial_spot': {
            'disease': 'Bacterial Spot',
            'plant': 'Bell Pepper',
            'symptoms': 'Dark, water-soaked spots on leaves and fruit',
            'treatment': 'Remove infected plants, use copper-based fungicides, avoid overhead watering',
            'cost': '₹300-500',
            'timing': 'Apply early morning or evening, repeat every 7-10 days',
            'prevention': 'Use disease-free seeds, avoid overhead irrigation, rotate crops every 2-3 years'
        },
        'Pepper__bell___healthy': {
            'disease': 'Healthy',
            'plant': 'Bell Pepper',
            'symptoms': 'No disease symptoms',
            'treatment': 'Continue regular care and monitoring',
            'cost': '₹0',
            'timing': 'Regular watering in morning',
            'prevention': 'Maintain good drainage, balanced fertilization, regular inspection'
        },
        'Potato___Early_blight': {
            'disease': 'Early Blight',
            'plant': 'Potato',
            'symptoms': 'Dark brown spots with concentric rings on lower leaves',
            'treatment': 'Apply Mancozeb or Chlorothalonil fungicides, remove infected leaves',
            'cost': '₹400-700',
            'timing': 'Spray in morning when dew dries, repeat every 7 days for 3 weeks',
            'prevention': 'Use certified seed potatoes, ensure 3-year crop rotation, avoid wet foliage'
        },
        'Potato___Late_blight': {
            'disease': 'Late Blight',
            'plant': 'Potato',
            'symptoms': 'Water-soaked gray-green spots that turn brown, white mold on underside',
            'treatment': 'Apply Metalaxyl or Ridomil immediately, destroy infected plants',
            'cost': '₹500-800',
            'timing': 'Spray immediately upon detection, repeat every 5-7 days',
            'prevention': 'Plant resistant varieties, avoid overhead watering, destroy volunteer plants'
        },
        'Potato___healthy': {
            'disease': 'Healthy',
            'plant': 'Potato',
            'symptoms': 'No disease symptoms',
            'treatment': 'Continue regular care and monitoring',
            'cost': '₹0',
            'timing': 'Water deeply once a week',
            'prevention': 'Hill soil around plants, maintain proper spacing, inspect regularly'
        },
        'Tomato___Bacterial_spot': {
            'disease': 'Bacterial Spot',
            'plant': 'Tomato',
            'symptoms': 'Small, dark, raised spots on leaves and fruit',
            'treatment': 'Apply copper hydroxide spray, remove severely infected plants',
            'cost': '₹350-600',
            'timing': 'Apply in early morning, repeat every 5-7 days during wet weather',
            'prevention': 'Use pathogen-free seeds, avoid working with wet plants, stake plants properly'
        },
        'Tomato___Early_blight': {
            'disease': 'Early Blight',
            'plant': 'Tomato',
            'symptoms': 'Brown spots with target-like rings on older leaves, starts from bottom',
            'treatment': 'Apply Mancozeb or Chlorothalonil, remove infected lower leaves',
            'cost': '₹300-500',
            'timing': 'Spray in evening, repeat every 7-10 days',
            'prevention': 'Mulch around plants, water at base only, ensure good air circulation'
        },
        'Tomato___Late_blight': {
            'disease': 'Late Blight',
            'plant': 'Tomato',
            'symptoms': 'Large, irregular brown patches with white fuzzy growth',
            'treatment': 'Apply Metalaxyl + Mancozeb combination, remove infected parts immediately',
            'cost': '₹600-900',
            'timing': 'Apply immediately, before rain if possible, repeat every 5 days',
            'prevention': 'Avoid overhead irrigation, plant resistant varieties, destroy crop debris'
        },
        'Tomato___Leaf_Mold': {
            'disease': 'Leaf Mold',
            'plant': 'Tomato',
            'symptoms': 'Yellow spots on upper surface, olive-green velvety mold below',
            'treatment': 'Apply sulfur-based fungicides, improve greenhouse ventilation',
            'cost': '₹250-450',
            'timing': 'Spray when humidity is low, repeat every 10-14 days',
            'prevention': 'Reduce humidity to below 85%, ensure good spacing, prune lower leaves'
        },
        'Tomato___Septoria_leaf_spot': {
            'disease': 'Septoria Leaf Spot',
            'plant': 'Tomato',
            'symptoms': 'Small circular spots with dark borders and gray centers, many tiny spots',
            'treatment': 'Apply Mancozeb or copper-based fungicides, remove infected leaves',
            'cost': '₹300-550',
            'timing': 'Apply after rain or irrigation, repeat every 7-10 days',
            'prevention': 'Use drip irrigation, avoid splashing water, remove plant debris after harvest'
        },
        'Tomato___Spider_mites Two-spotted_spider_mite': {
            'disease': 'Spider Mites',
            'plant': 'Tomato',
            'symptoms': 'Tiny yellow dots, fine webbing, leaves turn bronze/yellow',
            'treatment': 'Spray with neem oil or insecticidal soap, use miticides for severe cases',
            'cost': '₹200-400',
            'timing': 'Spray undersides of leaves in evening, repeat every 3-5 days',
            'prevention': 'Maintain humidity, avoid dusty conditions, introduce predatory mites'
        },
        'Tomato___Target_Spot': {
            'disease': 'Target Spot',
            'plant': 'Tomato',
            'symptoms': 'Brown spots with concentric rings (bullseye pattern), leaf yellowing',
            'treatment': 'Apply Azoxystrobin or Chlorothalonil fungicides',
            'cost': '₹400-650',
            'timing': 'Spray before symptoms spread, repeat every 7-10 days',
            'prevention': 'Ensure proper plant spacing, stake plants, remove infected debris'
        },
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
            'disease': 'Yellow Leaf Curl Virus',
            'plant': 'Tomato',
            'symptoms': 'Leaves curl upward and yellow, stunted growth, no cure once infected',
            'treatment': 'Remove and destroy infected plants, control whiteflies with Imidacloprid',
            'cost': '₹350-600',
            'timing': 'Spray insecticide in early morning when whiteflies are less active',
            'prevention': 'Use virus-resistant varieties, install yellow sticky traps, use reflective mulch'
        },
        'Tomato___Tomato_mosaic_virus': {
            'disease': 'Mosaic Virus',
            'plant': 'Tomato',
            'symptoms': 'Mottled light/dark green leaves, leaf curling, reduced fruit quality',
            'treatment': 'No cure - remove infected plants immediately, disinfect hands and tools',
            'cost': '₹100-200 (disinfectant)',
            'timing': 'Remove infected plants same day, wash hands with milk solution',
            'prevention': 'Use virus-free seeds, wash hands before handling, avoid tobacco use near plants'
        },
        'Tomato___healthy': {
            'disease': 'Healthy',
            'plant': 'Tomato',
            'symptoms': 'No disease symptoms - leaves are green and vigorous',
            'treatment': 'Continue regular care and monitoring',
            'cost': '₹0',
            'timing': 'Water deeply 2-3 times per week in morning',
            'prevention': 'Regular inspection, balanced NPK fertilizer, proper staking and pruning'
        }
    }
    
    default_info = {
        'disease': class_name.split('___')[-1].replace('_', ' '),
        'plant': class_name.split('___')[0].replace('_', ' '),
        'symptoms': 'Please consult an expert for detailed information',
        'treatment': 'Please consult an agricultural expert',
        'cost': 'Consult local shop',
        'timing': 'Apply as per expert advice',
        'prevention': 'Maintain good agricultural practices'
    }
    
    return disease_info.get(class_name, default_info)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        if 'file' not in request.files:
            # Check for base64 image
            data = request.get_json()
            if data and 'image' in data:
                image_data = data['image'].split(',')[1]
                img_bytes = base64.b64decode(image_data)
                img = Image.open(BytesIO(img_bytes))
            else:
                return jsonify({'error': 'No image provided'}), 400
        else:
            file = request.files['file']
            if file.filename == '':
                return jsonify({'error': 'No file selected'}), 400
            img = Image.open(file.stream)
        
        # Preprocess and predict
        img_array = preprocess_image(img)
        predictions = model.predict(img_array, verbose=0)
        
        # Get top prediction
        pred_idx = int(np.argmax(predictions[0]))
        confidence = float(predictions[0][pred_idx]) * 100
        class_name = class_names[str(pred_idx)]
        
        # Get disease info
        info = get_disease_info(class_name)
        
        # Get top 3 predictions
        top_3_idx = np.argsort(predictions[0])[-3:][::-1]
        top_3 = [
            {
                'class': class_names[str(int(i))],
                'confidence': float(predictions[0][i]) * 100
            }
            for i in top_3_idx
        ]
        
        return jsonify({
            'success': True,
            'prediction': {
                'class': class_name,
                'confidence': confidence,
                'disease': info['disease'],
                'plant': info['plant'],
                'symptoms': info['symptoms'],
                'treatment': info['treatment'],
                'cost': info.get('cost', 'N/A'),
                'timing': info.get('timing', 'Consult expert'),
                'prevention': info.get('prevention', 'Follow good practices')
            },
            'top_3': top_3
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
