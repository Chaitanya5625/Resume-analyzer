// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fetch = require('node-fetch');
const PDFParser = require('pdf2json');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.static('public')); // Serve frontend files
app.use(express.json());

// Configure Multer (File Upload)
const upload = multer({ storage: multer.memoryStorage() });

// Helper function to extract text from PDF using pdf2json
function extractTextFromPDF(buffer) {
    return new Promise((resolve, reject) => {
        const pdfParser = new PDFParser();

        pdfParser.on('pdfParser_dataError', (err) => {
            reject(new Error('Failed to parse PDF: ' + err.parserError));
        });

        pdfParser.on('pdfParser_dataReady', () => {
            let fullText = '';
            
            // Extract text from all pages
            if (pdfParser.data && pdfParser.data.Pages) {
                pdfParser.data.Pages.forEach(page => {
                    if (page.Texts) {
                        page.Texts.forEach(text => {
                            // Decode URL-encoded text
                            fullText += decodeURIComponent(text.R[0].T) + ' ';
                        });
                    }
                });
            }
            
            resolve(fullText);
        });

        // Load PDF from buffer
        pdfParser.parseBuffer(buffer);
    });
}

app.post('/analyze', upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        let resumeText = "";

        // 1. Extract Text based on file type
        if (req.file.mimetype === 'application/pdf') {
            try {
                console.log('Parsing PDF...');
                resumeText = await extractTextFromPDF(req.file.buffer);
                console.log('PDF parsed. Text length:', resumeText.length);
            } catch (pdfError) {
                console.error('PDF Parse Error:', pdfError);
                return res.status(500).json({ error: 'Failed to read PDF file. ' + pdfError.message });
            }
        } else {
            // For txt, md, etc.
            resumeText = req.file.buffer.toString('utf-8');
        }

        if (!resumeText || resumeText.trim().length < 50) {
            return res.status(400).json({ error: 'Resume text is too short or unreadable.' });
        }

        // 2. Define the Prompt
        const promptText = `
            You are an expert Resume Reviewer and Career Coach.
            Analyze the following resume text and provide a comprehensive report.
            
            Structure your response with the following headers:
            1. **ATS Compatibility Score (out of 10)**: Check for keywords and formatting.
            2. **Strengths**: What is this candidate doing well?
            3. **Areas for Improvement**: Specific advice on content, action verbs, and quantifiable results.
            4. **Missing Keywords**: What industry standard keywords are missing?
            5. **Final Verdict**: A brief summary.

            Resume Content:
            ${resumeText}
        `;

        // 3. Call Gemini API using REST
        const apiKey = process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured on server.' });
        }

        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Gemini API Error:', data);
            return res.status(500).json({ error: data.error?.message || 'Failed to get response from AI.' });
        }

        // 4. Extract text from Gemini response
        if (!data.candidates || !data.candidates[0]) {
            return res.status(500).json({ error: 'Invalid response from AI.' });
        }

        const analysisText = data.candidates[0].content.parts[0].text;

        // 5. Send back to frontend
        res.json({ analysis: analysisText });

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: 'Server error processing request.' });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});