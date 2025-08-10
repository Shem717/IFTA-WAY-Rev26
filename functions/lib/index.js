"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanReceipt = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const generative_ai_1 = require("@google/generative-ai");
const GEMINI_API_KEY = (0, params_1.defineSecret)('GEMINI_API_KEY');
exports.scanReceipt = (0, https_1.onCall)({
    secrets: [GEMINI_API_KEY],
    region: 'us-central1',
    maxInstances: 10,
    timeoutSeconds: 60
}, async (req) => {
    if (!req.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Must be authenticated');
    }
    const { imageBase64, mimeType } = req.data || {};
    if (!imageBase64 || !mimeType) {
        throw new https_1.HttpsError('invalid-argument', 'imageBase64 and mimeType required');
    }
    // Validate image size (max 10MB)
    const imageSize = Math.ceil((imageBase64.length * 3) / 4);
    if (imageSize > 10 * 1024 * 1024) {
        throw new https_1.HttpsError('invalid-argument', 'Image too large. Maximum size is 10MB.');
    }
    // Validate mime type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
        throw new https_1.HttpsError('invalid-argument', 'Invalid image format. Please use JPEG, PNG, or WebP.');
    }
    try {
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY.value());
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
        ]);
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
    }
    catch (error) {
        console.error('Receipt scan error:', error);
        throw new https_1.HttpsError('internal', 'Failed to process receipt. Please try again or enter manually.');
    }
});
