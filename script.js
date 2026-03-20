// DOM Elements
const webcamFeed = document.getElementById('webcamFeed');
const countdownElement = document.getElementById('countdown');
const photoTakenIndicator = document.getElementById('photoTakenIndicator');
const captureButton = document.getElementById('captureButton');
const resetButton = document.getElementById('resetButton');
const saveButton = document.getElementById('saveButton');
const filterIntensitySlider = document.getElementById('filterIntensity');

const tempCanvas = document.getElementById('tempCanvas');
const tempCtx = tempCanvas.getContext('2d');

const finalCanvas = document.getElementById('finalCanvas');
const finalCtx = finalCanvas.getContext('2d');

const preview1 = document.getElementById('preview1');
const preview2 = document.getElementById('preview2');
const preview3 = document.getElementById('preview3');

// Variables
let capturedPhotos = [];
const MAX_PHOTOS = 3;
let stream = null;
let countdownInterval = null;

const KETUPAT_IMAGE_PATH = 'assets/ketupat.png'; // Path to ketupat image
let ketupatImage = new Image();
ketupatImage.src = KETUPAT_IMAGE_PATH;
ketupatImage.onload = () => {
    console.log('Ketupat image loaded.');
};
ketupatImage.onerror = () => {
    console.error('Failed to load ketupat image.');
};

// --- Camera Setup ---
async function initCamera() {
    try {
        // Request camera with optimal constraints
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: false
        };

        stream = await navigator.mediaDevices.getUserMedia(constraints);
        webcamFeed.srcObject = stream;
        
        // Ensure video plays
        webcamFeed.onloadedmetadata = () => {
            webcamFeed.play().catch(err => {
                console.error('Error playing video:', err);
            });
        };
        
        console.log('✅ Camera initialized successfully');
        console.log('Camera resolution:', stream.getVideoTracks()[0].getSettings());
        
    } catch (err) {
        console.error('❌ Error accessing camera:', err);
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        
        let errorMsg = 'Tidak bisa mengakses kamera.';
        
        if (err.name === 'NotAllowedError') {
            errorMsg = '❌ Akses kamera ditolak. Silakan izinkan akses kamera di browser Anda.';
        } else if (err.name === 'NotFoundError') {
            errorMsg = '❌ Kamera tidak ditemukan. Pastikan kamera terhubung dengan benar.';
        } else if (err.name === 'NotReadableError') {
            errorMsg = '❌ Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi tersebut dan coba lagi.';
        } else if (err.name === 'OverconstrainedError') {
            errorMsg = '❌ Browser tidak support spesifikasi kamera yang diminta. Silakan refresh halaman.';
        } else if (err.name === 'TypeError') {
            errorMsg = '❌ Browser Anda tidak support akses kamera. Gunakan browser modern (Chrome, Firefox, Safari, Edge).';
        }
        
        alert(errorMsg);
        
        // Try fallback with basic constraints
        try {
            console.log('Mencoba dengan constraints dasar...');
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            webcamFeed.srcObject = stream;
            webcamFeed.play();
            console.log('✅ Kamera berhasil dengan constraints dasar');
        } catch (fallbackErr) {
            console.error('❌ Fallback juga gagal:', fallbackErr);
            alert('Gagal mengakses kamera. Silakan check console untuk detail error.');
        }
    }
}

// --- Image Processing (Teal & Orange Filter) ---
function applyTealOrangeFilter(imageData, intensity) {
    const data = imageData.data;
    const maxIntensity = 100;
    const tealAmount = (intensity / maxIntensity) * 0.2;
    const orangeAmount = (intensity / maxIntensity) * 0.2;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        // Apply teal tint (more blue and green, less red)
        r = r * (1 - tealAmount);
        g = g * (1 + tealAmount);
        b = b * (1 + tealAmount);

        // Apply orange tint (more red and green, less blue)
        r = r * (1 + orangeAmount);
        g = g * (1 + orangeAmount);
        b = b * (1 - orangeAmount);

        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
    }
    return imageData;
}

// --- Photo Capture ---
function takePhoto() {
    return new Promise(resolve => {
        capturedPhotos = []; // Reset photos for new session
        updatePreview();
        captureNextPhoto(0, resolve);
    });
}

function captureNextPhoto(photoIndex, callback) {
    if (photoIndex < 3) {
        let count = 5;
        countdownElement.classList.remove('hidden');
        countdownElement.textContent = count;

        countdownInterval = setInterval(() => {
            count--;
            countdownElement.textContent = count;
            if (count === 0) {
                clearInterval(countdownInterval);
                countdownElement.classList.add('hidden');
                // Capture this photo
                captureFrame(photoIndex);
                // Wait 500ms then start next countdown
                setTimeout(() => {
                    if (photoIndex === 2) {
                        // All photos done
                        composeFinalCanvas();
                        if (callback) callback();
                    } else {
                        // Start countdown for next photo
                        captureNextPhoto(photoIndex + 1, callback);
                    }
                }, 500);
            }
        }, 1000);
    }
}

function captureFrame(photoIndex = 0) {
    if (!stream) {
        alert('Kamera belum siap!');
        return;
    }

    // Set temp canvas to video dimensions
    tempCanvas.width = webcamFeed.videoWidth;
    tempCanvas.height = webcamFeed.videoHeight;

    // Draw video frame to temp canvas
    tempCtx.drawImage(webcamFeed, 0, 0, tempCanvas.width, tempCanvas.height);

    // Get image data and apply filter
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const filteredImageData = applyTealOrangeFilter(imageData, parseInt(filterIntensitySlider.value));
    tempCtx.putImageData(filteredImageData, 0, 0);

    const dataURL = tempCanvas.toDataURL('image/png');

    if (capturedPhotos.length < MAX_PHOTOS) {
        capturedPhotos.push(dataURL);
        updatePreview();
        showPhotoTakenIndicator();
        // Save individual photo with timestamp
        saveRawPhoto(dataURL, capturedPhotos.length);
        if (capturedPhotos.length === MAX_PHOTOS) {
            // All photos taken, compose final canvas
            composeFinalCanvas();
        }
    }
}

function saveRawPhoto(dataURL, photoNumber) {
    // Generate timestamp filename
    const now = new Date();
    const timestamp = now.getTime(); // milliseconds
    const filename = `photo_${timestamp}_${photoNumber}.png`;
    
    // Send to backend for saving
    fetch('http://localhost:3000/api/save-raw-photo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageData: dataURL,
            filename: filename
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Raw photo saved: ${data.filePath}`);
        } else {
            console.error('Failed to save raw photo:', data.error);
        }
    })
    .catch(err => console.error('Error saving raw photo:', err));
}

function saveFinalPhoto() {
    const dataURL = finalCanvas.toDataURL('image/png');
    
    // Send to backend for saving
    fetch('http://localhost:3000/api/save-final-photo', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            imageData: dataURL
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log(`Final photo saved: ${data.filePath}`);
            alert(`Gambar final berhasil disimpan: ${data.filename}`);
        } else {
            console.error('Failed to save final photo:', data.error);
            alert('Gagal menyimpan gambar final');
        }
    })
    .catch(err => {
        console.error('Error saving final photo:', err);
        alert('Error menyimpan gambar final. Pastikan server berjalan di localhost:3000');
    });
}

function showPhotoTakenIndicator() {
    photoTakenIndicator.classList.remove('hidden');
    setTimeout(() => {
        photoTakenIndicator.classList.add('hidden');
    }, 1000);
}

function updatePreview() {
    [preview1, preview2, preview3].forEach((img, index) => {
        if (capturedPhotos[index]) {
            img.src = capturedPhotos[index];
            img.classList.remove('hidden');
        } else {
            img.src = '';
            img.classList.add('hidden');
        }
    });
}

// --- Final Canvas Composition ---
function composeFinalCanvas() {
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Background
    finalCtx.fillStyle = '#fffdfd'; // Light background
    finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

    // Ketupat images (top left and top right)
    const ketupatSize = finalCanvas.width * 0.10; // 15% of canvas width (reduced)
    if (ketupatImage.complete && ketupatImage.naturalWidth > 0) {
        finalCtx.drawImage(ketupatImage, 10, 10, ketupatSize, ketupatSize); // Top-left
        finalCtx.drawImage(ketupatImage, finalCanvas.width - ketupatSize - 10, 10, ketupatSize, ketupatSize); // Top-right
    } else {
        console.warn('Ketupat image not loaded or invalid. Skipping drawing.');
        // Fallback: draw a rectangle or some placeholder if image not loaded
        finalCtx.fillStyle = 'lightgray';
        finalCtx.fillRect(10, 10, ketupatSize, ketupatSize);
        finalCtx.fillRect(finalCanvas.width - ketupatSize - 10, 10, ketupatSize, ketupatSize);
    }

    // "1447H 'Ied al Fitr" text - aligned with ketupat images
    finalCtx.font = '20px "Press Start 2P"';
    finalCtx.fillStyle = '#361b0c'; // Mahogany
    finalCtx.textAlign = 'center';
    finalCtx.fillText("1447H 'Ied al Fitr", finalCanvas.width / 2, ketupatSize + 15); // Aligned with ketupat

    // Photo Grid (3 rows) - full width, edge-to-edge with padding
    const photoPadding = 15; // Left and right padding
    const photoDisplayWidth = finalCanvas.width - (2 * photoPadding); // Width with padding
    const photoDisplayHeight = photoDisplayWidth * 0.5; // Height based on width ratio
    let currentY = ketupatSize + 30; // Start below the main title

    // Track loaded images to calculate final text position
    let loadedImagesCount = 0;

    capturedPhotos.forEach((dataURL, index) => {
        const img = new Image();
        img.src = dataURL;
        img.onload = () => {
            // Calculate scale to fit image in container WITHOUT cropping
            const imgAspectRatio = img.width / img.height;
            const containerAspectRatio = photoDisplayWidth / photoDisplayHeight;

            let displayWidth = photoDisplayWidth;
            let displayHeight = photoDisplayWidth / imgAspectRatio;
            let offsetY = 0;

            // If image is taller than container, fit to height instead
            if (displayHeight > photoDisplayHeight) {
                displayHeight = photoDisplayHeight;
                displayWidth = displayHeight * imgAspectRatio;
            }

            // Center horizontally if narrower than container
            const offsetX = (photoDisplayWidth - displayWidth) / 2;
            // Center vertically if shorter than container
            if (displayHeight < photoDisplayHeight) {
                offsetY = (photoDisplayHeight - displayHeight) / 2;
            }

            // Draw entire image scaled to fit (no cropping)
            finalCtx.drawImage(
                img,
                photoPadding + offsetX,
                currentY + offsetY,
                displayWidth,
                displayHeight
            );

            loadedImagesCount++;
            currentY += photoDisplayHeight + 5; // Add some padding between photos

            // Only add bottom text after all photos are drawn
            if (loadedImagesCount === MAX_PHOTOS) {
                drawBottomText(currentY);
            }
        };
    });

    if (capturedPhotos.length === 0) {
        // Draw bottom text immediately if no photos are captured yet
        drawBottomText(currentY);
    }
}

function drawBottomText(startY) {
    // "Minal 'Aidin Wal Faizin" text
    finalCtx.font = '18px "Press Start 2P"';
    finalCtx.fillStyle = '#361b0c'; // Mahogany
    finalCtx.textAlign = 'center';
    finalCtx.fillText("Minal 'Aidin Wal Faizin", finalCanvas.width / 2, startY + 45);

    // "Siswanto Family" text
    finalCtx.font = '16px "Roboto Mono"';
    finalCtx.fillStyle = '#57321e'; // Lighter color
    finalCtx.textAlign = 'center';
    finalCtx.fillText("Siswanto Family", finalCanvas.width / 2, startY + 70); // Below Minal 'Aidin Wal Faizin
}

// --- Event Listeners ---
captureButton.addEventListener('click', () => {
    if (capturedPhotos.length < MAX_PHOTOS) {
        captureButton.disabled = true;
        takePhoto().then(() => {
            captureButton.disabled = false;
        });
    } else {
        alert('Anda sudah mengambil 3 foto. Tekan Reset untuk mulai lagi.');
    }
});

resetButton.addEventListener('click', () => {
    capturedPhotos = [];
    updatePreview();
    finalCtx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
    composeFinalCanvas(); // Redraw canvas without photos
    console.log('Photobooth reset.');
});

saveButton.addEventListener('click', () => {
    if (capturedPhotos.length === MAX_PHOTOS) {
        saveButton.disabled = true;
        saveFinalPhoto();
        setTimeout(() => {
            saveButton.disabled = false;
        }, 1000);
    } else {
        alert('Mohon ambil 3 foto sebelum menyimpan hasil akhir.');
    }
});

filterIntensitySlider.addEventListener('input', () => {
    // Live preview of filter on webcam feed (can be implemented by drawing video to another canvas first)
    // For now, it will apply when photos are captured.
    console.log('Filter intensity changed to:', filterIntensitySlider.value);
});

// --- Mediapipe Hand Gesture (Placeholder) ---
// This section will be integrated later for hand gesture recognition.
// We'll need to load the MediaPipe Handpose model and set up detections.
// When a 'hand open' gesture is detected, it will trigger the takePhoto() function.
function setupMediapipe() {
    console.log('Mediapipe setup will go here.');
    // Example: const hand = new Hand({locateFile: (file) => { ... }});
    // hand.onResults((results) => { /* check for open hand gesture */ });
    // hand.initialize();
}

// --- Initialize ---
// Ensure DOM is ready before initializing
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 DOM loaded, initializing camera...');
        initCamera();
        composeFinalCanvas();
    });
} else {
    console.log('🚀 DOM already loaded, initializing camera...');
    initCamera();
    composeFinalCanvas();
}
// setupMediapipe(); // Call this when Mediapipe is ready to be integrated
