const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Allows large TurboWarp strings

// Connects automatically using Render's Environment Variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render connections
});

// Create table if it doesn't exist
const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS renders (
      id SERIAL PRIMARY KEY,
      data_string TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};
initDb().catch(console.error);

// Endpoint for your TurboWarp custom extension
app.post('/api/save', async (req, res) => {
  const incomingData = req.body.data;

  if (!incomingData) {
    return res.status(400).json({ status: 'Failed: No data provided' });
  }

  try {
    // Insert the TurboWarp string into the database
    await pool.query(
      'INSERT INTO renders (data_string) VALUES ($1)', 
      [incomingData]
    );
    res.json({ status: 'Saved to Render Database successfully!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'Database Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Endpoint to retrieve all saved data strings
app.get('/api/load', async (req, res) => {
  try {
    // Fetches all entries, newest first
    const result = await pool.query('SELECT * FROM renders ORDER BY created_at DESC');
    res.json({ status: 'Success', data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'Database Error' });
  }
});

