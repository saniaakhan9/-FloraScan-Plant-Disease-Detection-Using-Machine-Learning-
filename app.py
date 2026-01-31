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
            'treatment': 'Remove infected plants, use copper-based fungicides, avoid overhead watering'
        },
        'Pepper__bell___healthy': {
            'disease': 'Healthy',
            'plant': 'Bell Pepper',
            'symptoms': 'No disease symptoms',
            'treatment': 'Continue regular care and monitoring'
        },
        'Potato___Early_blight': {
            'disease': 'Early Blight',
            'plant': 'Potato',
            'symptoms': 'Dark brown spots with concentric rings on lower leaves',
            'treatment': 'Apply fungicides, remove infected leaves, ensure good air circulation'
        },
        'Potato___Late_blight': {
            'disease': 'Late Blight',
            'plant': 'Potato',
            'symptoms': 'Water-soaked gray-green spots that turn brown',
            'treatment': 'Apply fungicides immediately, destroy infected plants, avoid wet conditions'
        },
        'Potato___healthy': {
            'disease': 'Healthy',
            'plant': 'Potato',
            'symptoms': 'No disease symptoms',
            'treatment': 'Continue regular care and monitoring'
        },
        'Tomato___Bacterial_spot': {
            'disease': 'Bacterial Spot',
            'plant': 'Tomato',
            'symptoms': 'Small, dark spots on leaves and fruit',
            'treatment': 'Remove infected plants, use copper sprays, practice crop rotation'
        },
        'Tomato___Early_blight': {
            'disease': 'Early Blight',
            'plant': 'Tomato',
            'symptoms': 'Brown spots with target-like rings on older leaves',
            'treatment': 'Apply fungicides, mulch around plants, water at base'
        },
        'Tomato___Late_blight': {
            'disease': 'Late Blight',
            'plant': 'Tomato',
            'symptoms': 'Large, irregular brown patches on leaves',
            'treatment': 'Apply fungicides, remove infected parts, improve air flow'
        },
        'Tomato___Leaf_Mold': {
            'disease': 'Leaf Mold',
            'plant': 'Tomato',
            'symptoms': 'Yellow spots on upper leaf surface, olive-green mold below',
            'treatment': 'Improve ventilation, reduce humidity, apply fungicides'
        },
        'Tomato___Septoria_leaf_spot': {
            'disease': 'Septoria Leaf Spot',
            'plant': 'Tomato',
            'symptoms': 'Small circular spots with dark borders and gray centers',
            'treatment': 'Remove infected leaves, apply fungicides, avoid wetting foliage'
        },
        'Tomato___Spider_mites Two-spotted_spider_mite': {
            'disease': 'Spider Mites',
            'plant': 'Tomato',
            'symptoms': 'Tiny yellow spots, webbing on undersides of leaves',
            'treatment': 'Spray with water, use insecticidal soap, introduce predatory mites'
        },
        'Tomato___Target_Spot': {
            'disease': 'Target Spot',
            'plant': 'Tomato',
            'symptoms': 'Brown spots with concentric rings resembling a target',
            'treatment': 'Apply fungicides, remove infected leaves, ensure proper spacing'
        },
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
            'disease': 'Yellow Leaf Curl Virus',
            'plant': 'Tomato',
            'symptoms': 'Yellowing and upward curling of leaves, stunted growth',
            'treatment': 'Remove infected plants, control whiteflies, use resistant varieties'
        },
        'Tomato___Tomato_mosaic_virus': {
            'disease': 'Mosaic Virus',
            'plant': 'Tomato',
            'symptoms': 'Mottled light and dark green pattern on leaves',
            'treatment': 'Remove infected plants, sanitize tools, use virus-free seeds'
        },
        'Tomato___healthy': {
            'disease': 'Healthy',
            'plant': 'Tomato',
            'symptoms': 'No disease symptoms',
            'treatment': 'Continue regular care and monitoring'
        }
    }
    
    return disease_info.get(class_name, {
        'disease': class_name.split('___')[-1].replace('_', ' '),
        'plant': class_name.split('___')[0].replace('_', ' '),
        'symptoms': 'Please consult an expert for detailed information',
        'treatment': 'Please consult an agricultural expert'
    })

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
                'treatment': info['treatment']
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
