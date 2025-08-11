
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { getDashboardStats, getPaginatedEntries } = require('./db_queries');
const camelcaseKeys = require('camelcase-keys');
const snakecaseKeys = require('snakecase-keys');
const { GoogleGenAI, Type } = require("@google/genai");

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const JWT_SECRET = process.env.JWT_SECRET || 'a-secure-default-secret-for-development-only';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('JWT_SECRET must be set in production');
  process.exit(1);
}

app.use((req, res, next) => {
    const originalJson = res.json;
    res.json = function(body) {
        if (body) {
            body = camelcaseKeys(body, { deep: true });
        }
        originalJson.call(this, body);
    };
    next();
});

app.use((req, res, next) => {
    if (req.body) {
        req.body = snakecaseKeys(req.body, { deep: true });
    }
    next();
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const createUser = async (email, password) => {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await db.query('INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email', [email, passwordHash]);
    return result.rows[0];
};

app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ msg: 'Please enter all fields' });

    try {
        const newUser = await createUser(email, password);
        res.status(201).json(newUser);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ msg: 'User with this email already exists.' });
        }
        console.error(err.message);
        res.status(500).json({ msg: 'Server error during registration.'});
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.status(400).json({ msg: 'Invalid credentials' });
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        const payload = { userId: user.id };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

        res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error during login.'}); }
});

app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const result = await db.query('SELECT id, email FROM users WHERE id = $1', [req.user.userId]);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'User not found' });
        res.json({ user: result.rows[0] });
    } catch(err) { console.error(err.message); res.status(500).json({ msg: 'Server error fetching user.'}); }
});

app.post('/api/scan-receipt', authenticateToken, async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ msg: 'AI service is not configured.' });
    }

    const { image, mime_type } = req.body;
    if (!image || !mime_type) {
        return res.status(400).json({ msg: 'Image data and mimeType are required.' });
    }

    try {
        const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});
        const prompt = `Analyze this fuel receipt image. If both Diesel and DEF purchases are present, extract separate line items for each. Return a concise JSON with:
- city, state (2-letter), date (YYYY-MM-DD)
- odometer (number) if present anywhere on the receipt (handwritten or printed)
- dieselGallons (number) and dieselCost (number) if Diesel present
- defGallons (number) and defCost (number) if DEF present
Use numeric values only for costs and gallons without currency symbols.`;
        const imagePart = { inlineData: { data: image, mimeType: mime_type } };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [ {text: prompt}, imagePart ] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                city: { type: Type.STRING },
                state: { type: Type.STRING, description: '2-letter abbreviation' },
                date: { type: Type.STRING, description: 'YYYY-MM-DD format' },
                odometer: { type: Type.NUMBER, description: 'Vehicle odometer if present' },
                dieselGallons: { type: Type.NUMBER, description: 'Gallons of Diesel' },
                dieselCost: { type: Type.NUMBER, description: 'Cost of Diesel' },
                defGallons: { type: Type.NUMBER, description: 'Gallons of DEF' },
                defCost: { type: Type.NUMBER, description: 'Cost of DEF' },
              }
            }
          }
        });

        const text = await response.text();
        const parsedData = JSON.parse(text);

        res.json(parsedData);
    } catch (error) {
        console.error('Error scanning receipt:', error);
        res.status(500).json({ msg: 'Failed to analyze receipt with AI.' });
    }
});

app.get('/api/dashboard', authenticateToken, async (req, res) => {
    try {
        const stats = await getDashboardStats(db, req.user.userId);
        res.json(stats);
    } catch (err) {
        console.error('Error fetching dashboard stats:', err.message);
        res.status(500).json({ msg: 'Server error fetching dashboard data.' });
    }
});

app.get('/api/entries', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const data = await getPaginatedEntries(db, req.user.userId, page, limit);
        res.json(data);
    } catch (err) {
        console.error('Error fetching paginated entries:', err.message);
        res.status(500).json({ msg: 'Server error fetching entries.' });
    }
});

app.post('/api/entries', authenticateToken, async (req, res) => {
    try {
        const { truck_number, date_time, odometer, city, state, fuel_type, custom_fuel_type, amount, cost, receipt_url, is_ignored } = req.body;
        const newEntry = await db.query(
            'INSERT INTO fuel_entries (user_id, truck_number, date_time, odometer, city, state, fuel_type, custom_fuel_type, amount, cost, receipt_url, is_ignored, created_at, last_edited_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()) RETURNING *',
            [req.user.userId, truck_number, date_time, odometer, city, state, fuel_type, custom_fuel_type, amount, cost, receipt_url, is_ignored]
        );
        res.status(201).json(newEntry.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.put('/api/entries/:id', authenticateToken, async (req, res) => {
    try {
        const { truck_number, date_time, odometer, city, state, fuel_type, custom_fuel_type, amount, cost, receipt_url } = req.body;
        const { id } = req.params;
        const updatedEntry = await db.query(
            'UPDATE fuel_entries SET truck_number=$1, date_time=$2, odometer=$3, city=$4, state=$5, fuel_type=$6, custom_fuel_type=$7, amount=$8, cost=$9, receipt_url=$10, last_edited_at=NOW() WHERE id=$11 AND user_id=$12 RETURNING *',
            [truck_number, date_time, odometer, city, state, fuel_type, custom_fuel_type, amount, cost, receipt_url, id, req.user.userId]
        );
        if (updatedEntry.rows.length === 0) return res.status(404).json({ msg: 'Entry not found or user not authorized.' });
        res.json(updatedEntry.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.put('/api/entries/:id/ignore', authenticateToken, async (req, res) => {
    try {
        const { is_ignored } = req.body;
        const { id } = req.params;
        const result = await db.query('UPDATE fuel_entries SET is_ignored=$1, last_edited_at=NOW() WHERE id=$2 AND user_id=$3 RETURNING *', [is_ignored, id, req.user.userId]);
        if (result.rows.length === 0) return res.status(404).json({ msg: 'Entry not found or user not authorized.' });
        res.json(result.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.delete('/api/entries/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM fuel_entries WHERE id=$1 AND user_id=$2', [id, req.user.userId]);
        res.sendStatus(204);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.get('/api/trucks', authenticateToken, async (req, res) => {
    try {
        const allTrucks = await db.query('SELECT * FROM trucks WHERE user_id = $1 ORDER BY number ASC', [req.user.userId]);
        res.json(allTrucks.rows);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.post('/api/trucks', authenticateToken, async (req, res) => {
    try {
        const { number, make_model } = req.body;
        const newTruck = await db.query('INSERT INTO trucks (user_id, number, make_model) VALUES ($1, $2, $3) RETURNING *', [req.user.userId, number, make_model]);
        res.status(201).json(newTruck.rows[0]);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

app.delete('/api/trucks/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM trucks WHERE id=$1 AND user_id=$2', [id, req.user.userId]);
        res.sendStatus(204);
    } catch (err) { console.error(err.message); res.status(500).json({ msg: 'Server error' }); }
});

const PORT = process.env.PORT || 10000;
const startServer = async () => {
    await db.initDb();

    // Create a demo user if one doesn't exist
    const demoUserEmail = 'demo@iftaway.com';
    try {
        const demoUserRes = await db.query('SELECT id FROM users WHERE email = $1', [demoUserEmail]);
        if (demoUserRes.rows.length === 0) {
            console.log('Demo user not found, creating one...');
            await createUser(demoUserEmail, 'password123');
            console.log(`Demo user created. Email: ${demoUserEmail}, Password: password123`);
        }
    } catch (err) {
        console.error("Error during demo user check/creation:", err);
    }

    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
};
startServer();
