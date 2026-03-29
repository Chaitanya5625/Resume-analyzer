// list-models.js
require('dotenv').config();
const fetch = require('node-fetch');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        console.log('❌ API key not found in .env file');
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    try {
        console.log('🔄 Fetching available models...');
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Error:', data.error?.message || 'Unknown error');
            return;
        }

        console.log('\n📋 Available Models:\n');
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                console.log(`Model: ${model.name || 'N/A'}`);
                console.log(`  - Version: ${model.version || 'N/A'}`);
                console.log(`  - Display Name: ${model.displayName || 'N/A'}`);
                console.log(`  - Description: ${model.description || 'N/A'}`);
                console.log(`  - Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
                console.log(`  - Output Token Limit: ${model.outputTokenLimit || 'N/A'}`);
                console.log(`  - Supported Methods: ${model.supportedMethods?.join(', ') || 'Not available'}`);
                console.log('-----------------------------------');
            });
        } else {
            console.log('No models found.');
        }

    } catch (error) {
        console.error('❌ Error fetching models:', error.message);
    }
}

listModels();