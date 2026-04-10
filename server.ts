import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { STATIC_SURAHS } from './src/data/surah-list.js';

const db = new Database('quran.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS surahs (
    id INTEGER PRIMARY KEY,
    name_arabic TEXT,
    name_complex TEXT,
    name_simple TEXT,
    revelation_place TEXT,
    revelation_order INTEGER,
    verses_count INTEGER,
    pages TEXT
  );

  CREATE TABLE IF NOT EXISTS ayahs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    surah_id INTEGER,
    verse_number INTEGER,
    verse_key TEXT,
    text_uthmani TEXT,
    text_indopak TEXT,
    text_tajweed TEXT,
    translation_en TEXT,
    translation_bn TEXT,
    audio_url TEXT,
    FOREIGN KEY(surah_id) REFERENCES surahs(id)
  );

  CREATE TABLE IF NOT EXISTS bookmarks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'surah' or 'ayah'
    target_id INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed Surahs if empty
const surahCount = db.prepare('SELECT COUNT(*) as count FROM surahs').get() as { count: number };
if (surahCount.count === 0) {
  console.log('Seeding initial surah list...');
  const insert = db.prepare(`
    INSERT INTO surahs (id, name_arabic, name_complex, name_simple, revelation_place, revelation_order, verses_count, pages)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const transaction = db.transaction((data) => {
    for (const surah of data) {
      insert.run(
        surah.id,
        surah.name_arabic,
        surah.name_complex,
        surah.name_simple,
        surah.revelation_place,
        surah.revelation_order,
        surah.verses_count,
        JSON.stringify([])
      );
    }
  });
  transaction(STATIC_SURAHS);
}

// Migration: Add text_tajweed to ayahs if it doesn't exist
try {
  db.prepare('SELECT text_tajweed FROM ayahs LIMIT 1').get();
} catch (e) {
  console.log('Adding text_tajweed column to ayahs table...');
  db.exec('ALTER TABLE ayahs ADD COLUMN text_tajweed TEXT');
}

// Migration: Ensure pages column in surahs is TEXT
try {
  db.prepare('SELECT pages FROM surahs LIMIT 1').get();
} catch (e) {
  console.log('Adding pages column to surahs table...');
  db.exec('ALTER TABLE surahs ADD COLUMN pages TEXT');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/surahs', (req, res) => {
    const surahs = db.prepare('SELECT * FROM surahs ORDER BY id ASC').all();
    res.json(surahs);
  });

  app.get('/api/surahs/:id', (req, res) => {
    const surah = db.prepare('SELECT * FROM surahs WHERE id = ?').get(req.params.id) as any;
    const ayahs = db.prepare('SELECT * FROM ayahs WHERE surah_id = ? ORDER BY verse_number ASC').all(req.params.id);
    res.json({ ...surah, ayahs });
  });

  app.get('/api/search', (req, res) => {
    const query = req.query.q;
    if (!query) return res.json([]);
    const results = db.prepare(`
      SELECT a.*, s.name_simple as surah_name 
      FROM ayahs a 
      JOIN surahs s ON a.surah_id = s.id 
      WHERE a.translation_en LIKE ? OR a.translation_bn LIKE ? OR a.text_uthmani LIKE ? OR a.text_tajweed LIKE ?
      LIMIT 50
    `).all(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    res.json(results);
  });

  app.get('/api/bookmarks', (req, res) => {
    const ids = req.query.ids;
    if (!ids) return res.json([]);
    const idList = (ids as string).split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    if (idList.length === 0) return res.json([]);
    
    const placeholders = idList.map(() => '?').join(',');
    const results = db.prepare(`
      SELECT a.*, s.name_simple as surah_name 
      FROM ayahs a 
      JOIN surahs s ON a.surah_id = s.id 
      WHERE a.id IN (${placeholders})
    `).all(...idList);
    res.json(results);
  });

  // Data Sync Route (Internal/Admin)
  app.post('/api/sync/surahs', async (req, res) => {
    try {
      const response = await axios.get('https://api.quran.com/api/v4/chapters?language=en');
      const chapters = response.data.chapters;
      
      const insert = db.prepare(`
        INSERT OR REPLACE INTO surahs (id, name_arabic, name_complex, name_simple, revelation_place, revelation_order, verses_count, pages)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((data) => {
        for (const chapter of data) {
          insert.run(
            chapter.id,
            chapter.name_arabic,
            chapter.name_complex,
            chapter.name_simple,
            chapter.revelation_place,
            chapter.revelation_order,
            chapter.verses_count,
            JSON.stringify(chapter.pages || [])
          );
        }
      });

      transaction(chapters);
      res.json({ status: 'success', count: chapters.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to sync surahs' });
    }
  });

  app.post('/api/sync/ayahs/:surahId', async (req, res) => {
    const { surahId } = req.params;
    try {
      // Fetch Arabic text (Uthmani)
      const arabicRes = await axios.get(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${surahId}`);
      // Fetch Tajweed text
      const tajweedRes = await axios.get(`https://api.quran.com/api/v4/quran/verses/tajweed?chapter_number=${surahId}`);
      // Fetch English translation (Sahih International - 131)
      const enRes = await axios.get(`https://api.quran.com/api/v4/quran/translations/131?chapter_number=${surahId}`);
      // Fetch Bangla translation (Taisirul Quran - 161)
      const bnRes = await axios.get(`https://api.quran.com/api/v4/quran/translations/161?chapter_number=${surahId}`);
      // Fetch Audio (Mishary Rashid Alafasy - 7)
      const audioRes = await axios.get(`https://api.quran.com/api/v4/recitations/7/by_chapter/${surahId}`);

      const verses = arabicRes.data.verses;
      const tajweedVerses = tajweedRes.data.verses;
      const enTranslations = enRes.data.translations;
      const bnTranslations = bnRes.data.translations;
      const audioFiles = audioRes.data.audio_files;

      const insert = db.prepare(`
        INSERT OR REPLACE INTO ayahs (surah_id, verse_number, verse_key, text_uthmani, text_tajweed, translation_en, translation_bn, audio_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (let i = 0; i < verses.length; i++) {
          let audioUrl = '';
          if (audioFiles && audioFiles[i]) {
            audioUrl = audioFiles[i].url;
            if (!audioUrl.startsWith('http')) {
              audioUrl = `https://download.quranicaudio.com/quran/mishari_rashid_al-afasy/${audioUrl}`;
            }
          } else {
            audioUrl = `https://audio.qurancentral.com/mishary-rashid-alafasy/${String(surahId).padStart(3, '0')}${String(i + 1).padStart(3, '0')}.mp3`;
          }

          insert.run(
            surahId,
            i + 1,
            verses[i].verse_key,
            verses[i].text_uthmani,
            tajweedVerses[i]?.text_tajweed || verses[i].text_uthmani,
            enTranslations[i]?.text || '',
            bnTranslations[i]?.text || '',
            audioUrl
          );
        }
      });

      transaction();
      res.json({ status: 'success', count: verses.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to sync ayahs' });
    }
  });

  app.post('/api/sync/full', async (req, res) => {
    try {
      const surahs = db.prepare('SELECT id FROM surahs').all() as { id: number }[];
      if (surahs.length === 0) {
        return res.status(400).json({ error: 'Please sync surah list first' });
      }

      // This is a long-running process, in a real app we'd use a background worker
      // For this app, we'll return a stream or just a success message if it's small enough
      // But 114 surahs is a lot. Let's do it in chunks or just provide the endpoint
      // and let the frontend handle the iteration for better UX.
      res.json({ status: 'started', total: surahs.length });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Full sync failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
