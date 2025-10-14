// Simple test to verify Gemini API works
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');

async function testGemini() {
  console.log('Testing Gemini API...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.substring(0, 10)}...` : 'NOT SET');
  console.log('Model:', process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp');
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    console.log('\nSending test request...');
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
      contents: 'Say "Hello World" in JSON format with a "message" field'
    });
    
    console.log('\n✅ SUCCESS! Response:');
    console.log(response.text);
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error.message);
    console.error('\nFull error:', error);
  }
}

testGemini();
