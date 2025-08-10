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
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(mimeType)) {
    throw new HttpsError('invalid-argument', 'Invalid image format. Please use JPEG, PNG, WebP, or PDF.');
  }

  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Extract fields from this fuel receipt image. Return ONLY a valid JSON object with these exact keys:
{
  "city": string | null,
  "state": string | null, // 2-letter code
  "date": string | null,  // YYYY-MM-DD
  "time": string | null,  // HH:MM 24h if available
  "fuelType": string | null,
  "amount": number | null,        // total gallons if only one fuel
  "cost": number | null,          // total cost if only one fuel
  "odometer": number | null,      // vehicle miles if present (printed or handwritten). Prefer the number written near the words "miles" or "odometer" if multiple numbers appear.
  "dieselGallons": number | null, // if Diesel present (line item)
  "dieselCost": number | null,
  "defGallons": number | null,    // if DEF present (line item)
  "defCost": number | null
}
Guidance:
- Many receipts have a handwritten odometer at the top like "594,454 miles". If found, parse the digits (ignore commas and the word miles).
- If both Diesel and DEF are present, populate the separate diesel/def fields. If only one fuel is present, use the generic amount and cost fields instead.
- Use numeric values only (no currency symbols). Use null for any field you cannot determine.`;

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
    
    // Extract JSON substring
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response');
    }
    
    const json = JSON.parse(jsonMatch[0]);

    // Normalize helpers
    const toNumber = (v: any) => (typeof v === 'number' ? v : (typeof v === 'string' ? Number(String(v).replace(/[^0-9.\-]/g, '')) : null));
    const toString = (v: any) => (typeof v === 'string' ? v.trim() : null);

    // Validate and sanitize response
    return {
      cost: toNumber(json.cost),
      amount: toNumber(json.amount),
      city: toString(json.city),
      state: toString(json.state)?.toUpperCase() || null,
      date: toString(json.date),
      time: toString(json.time),
      fuelType: toString(json.fuelType),
      odometer: toNumber(json.odometer),
      dieselGallons: toNumber(json.dieselGallons),
      dieselCost: toNumber(json.dieselCost),
      defGallons: toNumber(json.defGallons),
      defCost: toNumber(json.defCost)
    };
    
  } catch (error: any) {
    console.error('Receipt scan error:', error);
    throw new HttpsError('internal', 'Failed to process receipt. Please try again or enter manually.');
  }
});

