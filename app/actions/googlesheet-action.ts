interface ResearchScoreData {
  symbol: string
  score: number | null
  [key: string]: any 
}

export async function fetchTokenResearch(): Promise<ResearchScoreData[]> {
  const API_KEY = 'AIzaSyC8QxJez_UTHUJS7vFj1J3Sje0CWS9tXyk';
  const SHEET_ID = '1Nra5QH-JFAsDaTYSyu-KocjbkZ0MATzJ4R-rUt-gLe0';
  const SHEET_NAME = 'Dashcoin Scoring';
  const RANGE = `${SHEET_NAME}!A1:K30`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.values || data.values.length < 2) {
      console.warn('No data found in Google Sheet');
      return [];
    }

    const [header, ...rows] = data.values;
    
    const structured = rows.map((row: any) => {
      const entry: Record<string, any> = {};
      header.forEach((key: string, i: number) => {
        entry[key.trim()] = row[i] || '';
      });
      return entry;
    });

    return structured.map((entry: any) => {
      return {
        symbol: (entry['Project'] || '').toString().toUpperCase(),
        score: entry['Score'] !== undefined && entry['Score'] !== '' ? parseFloat(entry['Score']) : null,
      };
    });
  } catch (err) {
    console.error('Google Sheets API error:', err);
    return [];
  }
}