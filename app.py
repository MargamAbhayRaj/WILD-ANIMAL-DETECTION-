from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import numpy as np
from tensorflow.keras.models import load_model
import librosa
from twilio.rest import Client
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify that environment variables are loaded correctly
TWILIO_SID = os.getenv('TWILIO_SID')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'  # Twilio sandbox number

if not TWILIO_SID or not TWILIO_AUTH_TOKEN or not TWILIO_PHONE_NUMBER:
    raise ValueError("Missing Twilio credentials in .env file!")

# Initialize Twilio client
twilio_client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create uploads directory if it doesn't exist
if not os.path.exists('uploads'):
    os.makedirs('uploads')

# Load the trained model
try:
    loaded_model = load_model("past.h5")
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Error loading model: {e}")
    exit(1)

# Define class label mapping
class_label_mapping = {0: 'Birds', 1: 'Dog', 2: 'Elephant', 3: 'Leopard', 4: 'Tiger'}

def extract_and_preprocess_features(audio_path, expected_shape):
    try:
        audio_data, sample_rate = librosa.load(audio_path, sr=None)
        mfccs = librosa.feature.mfcc(y=audio_data, sr=sample_rate, n_mfcc=40)
        zcr = librosa.feature.zero_crossing_rate(y=audio_data)
        mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=sample_rate)
        chroma = librosa.feature.chroma_stft(y=audio_data, sr=sample_rate)

        mfcc_mean = np.mean(mfccs, axis=1)
        zcr_mean = np.mean(zcr, axis=1)
        mel_mean = np.mean(mel_spectrogram, axis=1)
        chroma_mean = np.mean(chroma, axis=1)

        combined_features = np.concatenate((mfcc_mean, zcr_mean, mel_mean, chroma_mean))

        if combined_features.shape[0] < expected_shape[0]:
            padding = np.zeros(expected_shape[0] - combined_features.shape[0])
            combined_features = np.concatenate((combined_features, padding))
        elif combined_features.shape[0] > expected_shape[0]:
            combined_features = combined_features[:expected_shape[0]]

        return combined_features
    except Exception as e:
        logger.error(f"Error processing {audio_path}: {e}")
        return None

def predict_from_mp3(mp3_file_path):
    expected_input_shape = (1216,)
    features = extract_and_preprocess_features(mp3_file_path, expected_input_shape)

    if features is not None:
        features = features.reshape(1, -1)
        predictions = loaded_model.predict(features)
        predicted_class_labels = np.argmax(predictions, axis=1)
        predicted_class_name = class_label_mapping[predicted_class_labels[0]]
        logger.info(f"Predicted class: {predicted_class_name}")
        return predicted_class_name.lower()
    return None

@app.route('/predict', methods=['POST'])
def predict():
    logger.info("Received prediction request")
    if 'audio' not in request.files:
        logger.error("No file provided")
        return jsonify({'error': 'No file provided'}), 400

    audio_file = request.files['audio']
    if not audio_file.filename.endswith(('.mp3', '.wav')):
        logger.error("Invalid file type")
        return jsonify({'error': 'Invalid file type. Use .mp3 or .wav'}), 400

    audio_path = os.path.join('uploads', audio_file.filename)
    audio_file.save(audio_path)

    predicted_class = predict_from_mp3(audio_path)
    os.remove(audio_path)  # Clean up

    if predicted_class:
        return jsonify({'predicted_class': predicted_class}), 200
    logger.error("Error processing the file")
    return jsonify({'error': 'Error processing the file'}), 500

@app.route('/send-whatsapp', methods=['POST'])
def send_whatsapp():
    data = request.get_json()
    phone_numbers = data.get('phoneNumbers')
    content_sid = 'HXb5b62575e6e4ff6129ad7c8efe1f983e'  # Your template SID
    content_variables = '{"1":"12/1","2":"3pm"}'  # Example variables, customize as needed

    if not phone_numbers:
        logger.error("Missing phone numbers")
        return jsonify({'error': 'Missing phone numbers'}), 400

    try:
        for number in phone_numbers:
            twilio_client.messages.create(
                from_=TWILIO_WHATSAPP_NUMBER,
                to='whatsapp:+919160390600',
                content_sid=content_sid,
                content_variables=content_variables
            )
        logger.info("WhatsApp messages sent successfully")
        return jsonify({'success': True, 'message': 'WILD ANIMAL DETECTED! GET TO THE SAFE PLACE IMMEDIATELY'}), 200
    except Exception as e:
        logger.error(f"Error sending WhatsApp message: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
