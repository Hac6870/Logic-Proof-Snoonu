import * as fs from 'fs';

/**
 * Robust CSV Parser (handles quoted fields, CRLF, etc.)
 * Reads file from filesystem (server-side only)
 */
export function parseCSV(filePath: string): any[] {
    let fileContent: string;
    try {
        fileContent = fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        console.warn(`Warning: Could not read ${filePath}`);
        return [];
    }

    // Normalize line endings
    const content = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = content.split('\n').filter(line => line.trim() !== '');

    if (lines.length < 2) {
        console.warn(`Warning: ${filePath} has fewer than 2 lines.`);
        return [];
    }

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    const data: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
            // Try to recover: if values.length is close, pad with empty strings
            while (values.length < headers.length) values.push('');
            if (values.length > headers.length) continue; // Skip malformed
        }

        const row: any = {};
        for (let j = 0; j < headers.length; j++) {
            row[headers[j].trim()] = values[j].trim();
        }
        data.push(row);
    }

    return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i++;
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
    }

    result.push(current);
    return result;
}
