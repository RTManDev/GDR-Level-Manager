const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.text({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const initDb = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS plain_text_store (
      id INT PRIMARY KEY,
      content TEXT NOT NULL
    );
  `);
  await pool.query(`
    INSERT INTO plain_text_store (id, content) 
    VALUES (1, '') 
    ON CONFLICT (id) DO NOTHING;
  `);
};
initDb().catch(console.error);

app.post('/api/save', async (req, res) => {
  const newText = req.body || '';
  try {
    await pool.query(
      `UPDATE plain_text_store SET content = content || $1 WHERE id = 1`, 
      [newText]
    );
    res.send('Success: Text appended!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

app.get('/api/load', async (req, res) => {
  try {
    const result = await pool.query('SELECT content FROM plain_text_store WHERE id = 1');
    // Delivers the exact string body from row index 0
    res.send(result.rows[0].content);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

app.post('/api/clear', async (req, res) => {
  try {
    await pool.query("UPDATE plain_text_store SET content = '' WHERE id = 1");
    res.send('Success: Cloud data cleared!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Database Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


