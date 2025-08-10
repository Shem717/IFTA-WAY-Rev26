import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

export const scanReceipt = onCall({ 
  secrets: [GEMINI_API_KEY], 
  region: 'us-central1',
  maxInstances: 10,
  timeoutSeconds: 60
}, async (req) => {
  if (!req.auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { imageBase64, mimeType } = req.data || {};
  if (!imageBase64 || !mimeType) {
    throw new HttpsError('invalid-argument', 'imageBase64 and mimeType required');
  }

  // Validate image size (max 10MB)
  const imageSize = Math.ceil((imageBase64.length * 3) / 4);
  if (imageSize > 10 * 1024 * 1024) {
    throw new HttpsError('invalid-argument', 'Image too large. Maximum size is 10MB.');
  }

  // Validate mime type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(mimeType)) {
    throw new HttpsError('invalid-argument', 'Invalid image format. Please use JPEG, PNG, or WebP.');
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extract ALL fields from this fuel receipt image. Return ONLY a valid JSON object with these exact keys: cost (number), amount (number), city (string), state (string 2-letter), date (YYYY-MM-DD), time (HH:MM in 24-hour format), fuelType (string), odometer (number). Look for handwritten odometer readings, total cost, gallons, and location. If any field cannot be determined, use null for that field.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ] as any);

    const text = (await result.response).text();
    
    // Better JSON extraction
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const json = JSON.parse(jsonMatch[0]);
    
    // Validate and sanitize response
    return {
      cost: typeof json.cost === 'number' ? json.cost : null,
      amount: typeof json.amount === 'number' ? json.amount : null,
      city: typeof json.city === 'string' ? json.city.trim() : null,
      state: typeof json.state === 'string' ? json.state.trim().toUpperCase() : null,
      date: typeof json.date === 'string' ? json.date : null,
      time: typeof json.time === 'string' ? json.time : null,
      fuelType: typeof json.fuelType === 'string' ? json.fuelType.trim() : null,
      odometer: typeof json.odometer === 'number' ? json.odometer : null
    };
    
  } catch (error: any) {
    console.error('Receipt scan error:', error);
    throw new HttpsError('internal', 'Failed to process receipt. Please try again or enter manually.');
  }
});

