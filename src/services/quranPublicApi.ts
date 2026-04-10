import axios from 'axios';

const QURAN_API_BASE = 'https://api.quran.com/api/v4';

export const fetchSurahFromPublicApi = async (surahId: number) => {
  try {
    // 1. Fetch Arabic text (Uthmani)
    const arabicRes = await axios.get(`${QURAN_API_BASE}/quran/verses/uthmani`, {
      params: { chapter_number: surahId }
    });

    // 2. Fetch English translation (Clear Quran - ID 131)
    const englishRes = await axios.get(`${QURAN_API_BASE}/quran/translations/131`, {
      params: { chapter_number: surahId }
    });

    // 3. Fetch Bangla translation (Bayan Foundation - ID 161)
    const banglaRes = await axios.get(`${QURAN_API_BASE}/quran/translations/161`, {
      params: { chapter_number: surahId }
    });

    const arabicVerses = arabicRes.data.verses;
    const englishVerses = englishRes.data.translations;
    const banglaVerses = banglaRes.data.translations;

    const ayahs = arabicVerses.map((v: any, index: number) => {
      const verseNumber = index + 1;
      const surahPadded = surahId.toString().padStart(3, '0');
      const ayahPadded = verseNumber.toString().padStart(3, '0');
      
      return {
        id: v.id,
        surah_id: surahId,
        verse_number: verseNumber,
        verse_key: v.verse_key,
        text_uthmani: v.text_uthmani,
        translation_en: englishVerses[index]?.text || '',
        translation_bn: banglaVerses[index]?.text || '',
        // Using everyayah.com for reliable per-ayah audio
        audio_url: `https://everyayah.com/data/Alafasy_128kbps/${surahPadded}${ayahPadded}.mp3`
      };
    });

    return {
      id: surahId,
      ayahs
    };
  } catch (error) {
    console.error('Public API fetch failed', error);
    throw error;
  }
};
