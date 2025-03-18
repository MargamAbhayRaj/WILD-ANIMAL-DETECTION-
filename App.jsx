import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:5000';

const wildlifeImages = [
  {
    url: 'https://images.pexels.com/photos/145939/pexels-photo-145939.jpeg',
    title: 'Tiger',
    type: 'dangerous',
    description: 'Extremely Dangerous Predator',
    sound: 'tiger',
    dangerLevel: 'high',
    warningMessage: 'EXTREME DANGER! Tiger detected in your area. Seek immediate shelter and contact authorities!'
  },
  {
    url: 'https://images.pexels.com/photos/133394/pexels-photo-133394.jpeg',
    title: ' Elephant',
    type: 'dangerous',
    description: 'Powerful Wild Animal',
    sound: 'elephant',
    dangerLevel: 'high',
    warningMessage: 'DANGER! Elephant detected nearby. Keep your distance and seek safe shelter!'
  },
  {
    url: 'https://images.pexels.com/photos/39857/leopard-leopard-spots-animal-wild-39857.jpeg',
    title: 'Leopard',
    type: 'dangerous',
    description: 'Stealthy Predator',
    sound: 'leopard',
    dangerLevel: 'high',
    warningMessage: 'EXTREME DANGER! Leopard detected in vicinity. Find secure shelter immediately!'
  },
  {
    url: 'https://images.pexels.com/photos/236622/pexels-photo-236622.jpeg',
    title: 'Dog',
    type: 'safe',
    description: 'Loyal Guardian',
    sound: 'dog',
    dangerLevel: 'low',
    warningMessage: 'Safe: Domestic dog detected in the area.'
  },
  {
    url: 'https://images.pexels.com/photos/326900/pexels-photo-326900.jpeg',
    title: 'Bird',
    type: 'safe',
    description: 'Common Bird',
    sound: 'birds',
    dangerLevel: 'low',
    warningMessage: 'Safe: Bird detected in the area.'
  }
];

function App() {
  const [isListening, setIsListening] = useState(false);
  const [animalDetected, setAnimalDetected] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [detectedSound, setDetectedSound] = useState('');
  const [detectedAnimal, setDetectedAnimal] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      handleNextImage();
    }, 6000);
    return () => clearInterval(interval);
  }, [currentImageIndex]);

  const handleNextImage = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentImageIndex((prevIndex) => 
        prevIndex === wildlifeImages.length - 1 ? 0 : prevIndex + 1
      );
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const handlePrevImage = () => {
    if (!isTransitioning) {
      setIsTransitioning(true);
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? wildlifeImages.length - 1 : prevIndex - 1
      );
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const handleImageClick = (index) => {
    if (!isTransitioning && index !== currentImageIndex) {
      setIsTransitioning(true);
      setCurrentImageIndex(index);
      setTimeout(() => setIsTransitioning(false), 1000);
    }
  };

  const uploadAudioFile = async (file) => {
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      // Check if the response is OK (status code 200-299)
      if (!response.ok) {
        const errorText = await response.text(); // Get the error text
        throw new Error(`Server error: ${errorText}`);
      }

      const data = await response.json();
      return data.predicted_class;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const toggleListening = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.mp3, .wav';
    fileInput.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        setIsListening(true);
        try {
          const detectedSound = await uploadAudioFile(file);
          setDetectedSound(detectedSound);
          
          const animal = wildlifeImages.find(animal => animal.sound === detectedSound);
          setDetectedAnimal(animal);
          setAnimalDetected(true);

          const animalIndex = wildlifeImages.findIndex(img => img.sound === detectedSound);
          if (animalIndex !== -1) {
            setCurrentImageIndex(animalIndex);
          }
        } catch (error) {
          alert('Error processing audio file: ' + error.message);
        } finally {
          setIsListening(false);
        }
      }
    };
    fileInput.click();
  };

  const sendEmergencyAlert = async () => {
    if (!detectedAnimal) return;

    // Hardcoded phone numbers for demo (replace with real WhatsApp numbers)
    const phoneNumbers = ['+1234567890', '+0987654321']; // Use numbers registered with WhatsApp

    try {
      const response = await fetch(`${API_URL}/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: detectedAnimal.warningMessage,
          phoneNumbers,
        }),
      });
      const data = await response.json();
      if (data.success) {
        console.log('WhatsApp alert sent for:', detectedAnimal.title);
        alert('Emergency WhatsApp alerts sent successfully!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error sending WhatsApp:', error);
      alert('Failed to send WhatsApp message: ' + error.message);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="App">
        <header className="header">
          <h1>Wild Animal Detection System</h1>
        </header>

        <div className="main-content">
          <div className="slider-section">
            <div className="image-slider">
              {wildlifeImages.map((image, index) => (
                <div
                  key={image.url}
                  className={`slide ${index === currentImageIndex ? 'active' : ''} ${image.type}`}
                  style={{ backgroundImage: `url(${image.url})` }}
                  onClick={() => handleImageClick(index)}
                >
                  <div className="image-title">
                    <h3>{image.title}</h3>
                    <span className="image-description">{image.description}</span>
                    <span className={`animal-type ${image.type}`}>
                      {image.type === 'dangerous' ? '⚠️ DANGEROUS' : '✓ SAFE'}
                    </span>
                  </div>
                </div>
              ))}
              
              <button className="slider-arrow left" onClick={handlePrevImage} aria-label="Previous image">❮</button>
              <button className="slider-arrow right" onClick={handleNextImage} aria-label="Next image">❯</button>
              
              <div className="slider-nav">
                {wildlifeImages.map((_, index) => (
                  <button
                    key={index}
                    className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                    onClick={() => handleImageClick(index)}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="right-section">
            <div className="content-container">
              <main className="main-section">
                <div 
                  className={`microphone-container ${isListening ? 'active' : ''}`}
                  onClick={toggleListening}
                  role="button"
                  tabIndex={0}
                >
                  <div className="microphone-icon">🎙️</div>
                  <div className="sound-waves"></div>
                </div>
                <div className={`status ${isListening ? 'active' : ''}`}>
                  {isListening ? 'Processing...' : 'Click microphone to upload audio'}
                  {detectedSound && (
                    <div className="detected-sound">
                      Detected: {detectedAnimal?.title || detectedSound}
                    </div>
                  )}
                </div>
                {animalDetected && detectedAnimal && (
                  <div className={`alert-box ${detectedAnimal.type}`}>
                    <div className="warning-icon">
                      {detectedAnimal.type === 'dangerous' ? '⚠️' : '✓'}
                    </div>
                    <h2>{detectedAnimal.type === 'dangerous' ? 'DANGER ALERT!' : 'SAFE DETECTION'}</h2>
                    <p className="alert-description">
                      {detectedAnimal.warningMessage}
                    </p>
                  </div>
                )}

                <div className="message-section">
                  <textarea
                    readOnly
                    value={detectedAnimal ? detectedAnimal.warningMessage : ''}
                    className={animalDetected ? 'show' : ''}
                  />
                  {detectedAnimal?.type === 'dangerous' && (
                    <button 
                      className={`send-alert ${animalDetected ? 'show' : ''}`}
                      onClick={sendEmergencyAlert}
                    >
                      Send Emergency WhatsApp Alert
                    </button>
                  )}
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;