export const prerender = false;

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT2r7rHiUTy7tfJNkVnajXQuXoELP_27frVBYS-S0EsXzQBI71VQcWbGmb9n8-J023R_Ldso-XJg5JY/pub?output=csv';

function splitCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
        if (char === '"')             inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
        else                          current += char;
    }
    values.push(current);
    return values.map(v => v.trim().replace(/^"|"$/g, ''));
}

function parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = splitCSVLine(lines[0]).map(h => h.toLowerCase());
    return lines.slice(1)
        .map(line => Object.fromEntries(headers.map((h, i) => [h, splitCSVLine(line)[i] ?? ''])))
        .filter(row => Object.values(row).some(v => v));
}

export async function GET() {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86_400_000);

    let fetchOk = false;
    let fetchError = null;
    let rowCount = 0;
    let pickedIndex = null;
    let pickedRow = null;
    let rawHeaders = null;

    try {
        const res = await fetch(SHEET_CSV_URL);
        fetchOk = res.ok;
        if (res.ok) {
            const text = await res.text();
            const rows = parseCSV(text);
            const lines = text.trim().split('\n');
            rawHeaders = lines[0];
            rowCount = rows.length;
            if (rows.length > 0) {
                pickedIndex = dayOfYear % rows.length;
                pickedRow = rows[pickedIndex];
            }
        } else {
            fetchError = `HTTP ${res.status}`;
        }
    } catch (e) {
        fetchError = e.message;
    }

    return new Response(JSON.stringify({
        serverTime: now.toISOString(),
        dayOfYear,
        fetchOk,
        fetchError,
        rowCount,
        pickedIndex,
        rawHeaders,
        pickedRow,
    }, null, 2), {
        headers: { 'Content-Type': 'application/json' },
    });
}
