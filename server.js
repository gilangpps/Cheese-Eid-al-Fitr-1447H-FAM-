const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Ensure directories exist
const rawDir = path.join(__dirname, 'raw');
const boothDir = path.join(__dirname, 'booth');

if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
}
if (!fs.existsSync(boothDir)) {
    fs.mkdirSync(boothDir, { recursive: true });
}

// Helper function to save base64 image to file
function saveBase64Image(base64Data, filePath) {
    return new Promise((resolve, reject) => {
        const base64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFile(filePath, buffer, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(filePath);
            }
        });
    });
}

// Save raw photo
app.post('/api/save-raw-photo', async (req, res) => {
    try {
        const { imageData, filename } = req.body;
        if (!imageData || !filename) {
            return res.status(400).json({ error: 'Missing imageData or filename' });
        }

        const filePath = path.join(rawDir, filename);
        await saveBase64Image(imageData, filePath);
        console.log(`Raw photo saved: ${filePath}`);
        res.json({ success: true, message: 'Raw photo saved', filePath });
    } catch (err) {
        console.error('Error saving raw photo:', err);
        res.status(500).json({ error: 'Failed to save raw photo' });
    }
});

// Save final photo
app.post('/api/save-final-photo', async (req, res) => {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: 'Missing imageData' });
        }

        const timestamp = Date.now();
        const filename = `booth_${timestamp}.png`;
        const filePath = path.join(boothDir, filename);
        await saveBase64Image(imageData, filePath);
        console.log(`Final photo saved: ${filePath}`);
        res.json({ success: true, message: 'Final photo saved', filename, filePath });
    } catch (err) {
        console.error('Error saving final photo:', err);
        res.status(500).json({ error: 'Failed to save final photo' });
    }
});

app.listen(PORT, () => {
    console.log(`Photobooth server running at http://localhost:${PORT}`);
    console.log(`Raw photos will be saved to: ${rawDir}`);
    console.log(`Final photos will be saved to: ${boothDir}`);
});
