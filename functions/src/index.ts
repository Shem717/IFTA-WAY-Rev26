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

import * as admin from 'firebase-admin';
admin.initializeApp();

const db = admin.firestore();

// A helper function to calculate distance between two odometer readings
const calculateDistance = (odometer1: number, odometer2: number): number => {
    return Math.abs(odometer2 - odometer1);
};

export const generateReport = onCall({
    region: 'us-central1',
    maxInstances: 10,
    timeoutSeconds: 60
}, async (req) => {
    if (!req.auth) {
        throw new HttpsError('unauthenticated', 'Must be authenticated to generate reports.');
    }
    const uid = req.auth.uid;

    const { year, quarter } = req.data;
    if (!year || !quarter || quarter < 1 || quarter > 4) {
        throw new HttpsError('invalid-argument', 'Valid year and quarter are required.');
    }

    const startDate = new Date(year, (quarter - 1) * 3, 1);
    const endDate = new Date(year, quarter * 3, 0, 23, 59, 59);

    try {
        const entriesSnapshot = await db.collection(`users/${uid}/fuel_entries`)
            .where('dateTime', '>=', startDate.toISOString())
            .where('dateTime', '<=', endDate.toISOString())
            .where('isIgnored', '==', false)
            .orderBy('dateTime', 'asc')
            .get();

        const entries = entriesSnapshot.docs.map(doc => doc.data());

        if (entries.length < 2) {
             return { message: "Not enough data to generate a report. At least two fuel entries are required for mileage calculation." };
        }

        const jurisdictionData: { [key: string]: { miles: number; fuel: number; cost: number } } = {};

        const entriesByTruck = entries.reduce((acc, entry) => {
            const truckNum = entry.truckNumber || 'default';
            (acc[truckNum] = acc[truckNum] || []).push(entry);
            return acc;
        }, {} as Record<string, any[]>);

        let totalMiles = 0;

        Object.values(entriesByTruck).forEach(truckEntries => {
            if (truckEntries.length > 1) {
                for (let i = 0; i < truckEntries.length - 1; i++) {
                    const miles = calculateDistance(truckEntries[i].odometer, truckEntries[i + 1].odometer);
                    const state = truckEntries[i].state;
                    if (!jurisdictionData[state]) jurisdictionData[state] = { miles: 0, fuel: 0, cost: 0 };
                    jurisdictionData[state].miles += miles;
                    totalMiles += miles;
                }
            }
        });

        entries.forEach(entry => {
            const state = entry.state;
            if (!jurisdictionData[state]) jurisdictionData[state] = { miles: 0, fuel: 0, cost: 0 };
            jurisdictionData[state].fuel += entry.amount;
            jurisdictionData[state].cost += entry.cost;
        });

        const reportRows = Object.entries(jurisdictionData).map(([state, data]) => ({
            jurisdiction: state,
            totalMiles: data.miles,
            totalFuel: data.fuel,
            totalCost: data.cost
        }));

        const totalDieselGallons = entries.filter(e => e.fuelType === 'diesel').reduce((sum, e) => sum + e.amount, 0);
        const overallMPG = totalDieselGallons > 0 ? totalMiles / totalDieselGallons : 0;

        return {
            reportRows,
            overallMPG,
        };

    } catch (error: any) {
        console.error(`Report generation failed for user ${uid}:`, error);
        throw new HttpsError('internal', 'Failed to generate report due to a server error.');
    }
});
