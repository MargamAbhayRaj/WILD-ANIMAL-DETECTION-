import os
import numpy as np
from tensorflow.keras.models import load_model
import librosa

# Load the trained model
loaded_model = load_model("past.h5")

# Define class label mapping
class_label_mapping = {0: 'Birds', 1: 'Dog', 2: 'Elephant', 3: 'Leopard', 4: 'Tiger'}

# Function to extract and preprocess features from an MP3 file
def extract_and_preprocess_features(audio_path, expected_shape):
    try:
        audio_data, sample_rate = librosa.load(audio_path, sr=None)

        # Extract features
        mfccs = librosa.feature.mfcc(y=audio_data, sr=sample_rate, n_mfcc=40)
        zcr = librosa.feature.zero_crossing_rate(y=audio_data)
        mel_spectrogram = librosa.feature.melspectrogram(y=audio_data, sr=sample_rate)
        chroma = librosa.feature.chroma_stft(y=audio_data, sr=sample_rate)

        # Compute mean values
        mfcc_mean = np.mean(mfccs, axis=1)
        zcr_mean = np.mean(zcr, axis=1)
        mel_mean = np.mean(mel_spectrogram, axis=1)
        chroma_mean = np.mean(chroma, axis=1)

        # Combine features
        combined_features = np.concatenate((mfcc_mean, zcr_mean, mel_mean, chroma_mean))

        # Ensure consistent shape
        if combined_features.shape[0] < expected_shape[0]:
            padding = np.zeros(expected_shape[0] - combined_features.shape[0])
            combined_features = np.concatenate((combined_features, padding))
        elif combined_features.shape[0] > expected_shape[0]:
            combined_features = combined_features[:expected_shape[0]]

        return combined_features
    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None

# Function to predict class from an MP3 file
def predict_from_mp3(mp3_file_path):
    expected_input_shape = (1216,)  # Expected shape based on the training data
    features = extract_and_preprocess_features(mp3_file_path, expected_input_shape)

    if features is not None:
        # Reshape the features to match the model input
        features = features.reshape(1, -1)  # Reshape to (1, 1216)

        # Make predictions
        predictions = loaded_model.predict(features)
        predicted_class_labels = np.argmax(predictions, axis=1)
        predicted_class_name = class_label_mapping[predicted_class_labels[0]]

        print(f"Predicted Class Label for {mp3_file_path}: {predicted_class_name}")
        return predicted_class_name
    else:
        print(f"Error processing the file: {mp3_file_path}")
        return None

import tkinter as tk
from tkinter import filedialog

def upload_audio_file():
    """Opens a file dialog to select an audio file."""
    root = tk.Tk()
    root.withdraw()  # Hide the root window
    file_path = filedialog.askopenfilename(filetypes=[("Audio Files", "*.mp3")])
    return file_path

# Select file
audio_file = upload_audio_file()
print(f"📂 Selected File: {audio_file}")
predicted_class = predict_from_mp3(audio_file)
