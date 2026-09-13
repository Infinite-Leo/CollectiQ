/**
 * CollectiQ Phonetic & Identity Matcher Service
 * Implements:
 * 1. Double Metaphone sound encoding (converts phonetic pronunciations to sound keys)
 * 2. Jaro-Winkler string similarity (robust against transpositions and typos)
 * 3. Regional / Bengali surname alias normalization
 */

// Bengali & Indian regional surname alias canonical map
const SURNAME_ALIASES = {
    'mukherjee': 'mukhopadhyay',
    'mukhopadhyay': 'mukhopadhyay',
    'mookerjee': 'mukhopadhyay',

    'banerjee': 'bandyopadhyay',
    'bandyopadhyay': 'bandyopadhyay',
    'bannerjee': 'bandyopadhyay',

    'chatterjee': 'chattopadhyay',
    'chattopadhyay': 'chattopadhyay',
    'chatterji': 'chattopadhyay',

    'ganguly': 'gangopadhyay',
    'gangopadhyay': 'gangopadhyay',
    'ganguli': 'gangopadhyay',

    'bhattacharya': 'bhattacharya',
    'bhattacharjee': 'bhattacharya',
    'bhattacharji': 'bhattacharya',

    'chakraborty': 'chakraborty',
    'chakrabarti': 'chakraborty',
    'chakravarty': 'chakraborty',

    'roy': 'ray',
    'ray': 'ray',

    'dutta': 'datta',
    'datta': 'datta',

    'ghosh': 'ghose',
    'ghose': 'ghose',

    'das': 'das',
    'dash': 'das',

    'sen': 'sen',
    'sengupta': 'sengupta',
    'sen gupta': 'sengupta',

    'deb': 'de',
    'dey': 'de',
    'de': 'de',
};

/**
 * Normalizes common regional surnames to their canonical root
 */
export function normalizeRegionalNames(text = '') {
    if (!text) return '';
    const tokens = text.toLowerCase().trim().split(/\s+/);
    const normalizedTokens = tokens.map((t) => SURNAME_ALIASES[t] || t);
    return normalizedTokens.join(' ');
}

/**
 * Simplified Double Metaphone phonetic encoder
 * Produces primary sound code for names (e.g., Sourav -> SRF, Saurabh -> SRF, Debashis -> TBS)
 */
export function getDoubleMetaphone(str = '') {
    let clean = str.toUpperCase().replace(/[^A-Z]/g, '');
    if (!clean) return '';

    // Handle common silent prefixes or initial letter mappings
    if (clean.startsWith('GN') || clean.startsWith('KN') || clean.startsWith('PN') || clean.startsWith('WR')) {
        clean = clean.slice(1);
    }

    let code = '';
    let i = 0;

    while (i < clean.length && code.length < 4) {
        const c = clean[i];
        const next = clean[i + 1] || '';
        const prev = clean[i - 1] || '';

        // Vowels at the beginning retain 'A'
        if ('AEIOUY'.includes(c)) {
            if (i === 0) code += 'A';
            i++;
            continue;
        }

        switch (c) {
            case 'B':
                code += 'P';
                if (next === 'B') i++;
                break;
            case 'C':
                if (next === 'H') {
                    code += 'X';
                    i++;
                } else if ('EIY'.includes(next)) {
                    code += 'S';
                } else {
                    code += 'K';
                }
                break;
            case 'D':
                if (next === 'G' || (next === 'J')) {
                    code += 'J';
                    i++;
                } else {
                    code += 'T';
                }
                break;
            case 'F':
            case 'V':
                code += 'F';
                break;
            case 'G':
                if (next === 'H') {
                    i++; // silent gh or soft
                } else if ('EIY'.includes(next)) {
                    code += 'J';
                } else {
                    code += 'K';
                }
                break;
            case 'H':
                // retain H only if preceded by non-vowel
                if (i === 0 || !'AEIOUY'.includes(prev)) {
                    code += 'H';
                }
                break;
            case 'J':
                code += 'J';
                break;
            case 'K':
            case 'Q':
                code += 'K';
                break;
            case 'L':
                code += 'L';
                break;
            case 'M':
                code += 'M';
                break;
            case 'N':
                code += 'N';
                break;
            case 'P':
                if (next === 'H') {
                    code += 'F';
                    i++;
                } else {
                    code += 'P';
                }
                break;
            case 'R':
                code += 'R';
                break;
            case 'S':
                if (next === 'H') {
                    code += 'X';
                    i++;
                } else {
                    code += 'S';
                }
                break;
            case 'T':
                if (next === 'H') {
                    code += '0'; // Theta sound
                    i++;
                } else if (next === 'I' && 'AO'.includes(clean[i + 2] || '')) {
                    code += 'X';
                } else {
                    code += 'T';
                }
                break;
            case 'W':
                if ('AEIOUY'.includes(next)) code += 'A';
                break;
            case 'X':
                code += 'KS';
                break;
            case 'Z':
                code += 'S';
                break;
            default:
                break;
        }

        i++;
    }

    return code;
}

/**
 * Jaro-Winkler string distance algorithm (returns value between 0.0 and 1.0)
 */
export function jaroWinkler(s1 = '', s2 = '') {
    const a = s1.toLowerCase().trim();
    const b = s2.toLowerCase().trim();

    if (a === b) return 1.0;
    if (!a || !b) return 0.0;

    const matchWindow = Math.floor(Math.max(a.length, b.length) / 2) - 1;
    const aMatches = new Array(a.length).fill(false);
    const bMatches = new Array(b.length).fill(false);

    let matches = 0;
    let transpositions = 0;

    for (let i = 0; i < a.length; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(i + matchWindow + 1, b.length);

        for (let j = start; j < end; j++) {
            if (bMatches[j] || a[i] !== b[j]) continue;
            aMatches[i] = true;
            bMatches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0.0;

    let k = 0;
    for (let i = 0; i < a.length; i++) {
        if (!aMatches[i]) continue;
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
    }

    const m = matches;
    const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;

    // Winkler prefix bonus (up to 4 characters)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
        if (a[i] === b[i]) prefix++;
        else break;
    }

    return Math.min(1.0, Number((jaro + prefix * 0.1 * (1 - jaro)).toFixed(4)));
}

/**
 * Evaluates whether two names represent the same donor phonetically and semantically
 */
export function compareDonorNames(queryName = '', targetName = '') {
    if (!queryName || !targetName) {
        return { isMatch: false, confidence: 0, reason: 'Empty input' };
    }

    const normQuery = normalizeRegionalNames(queryName);
    const normTarget = normalizeRegionalNames(targetName);

    // 1. Direct or normalized string match
    if (normQuery === normTarget) {
        return {
            isMatch: true,
            confidence: 0.98,
            match_type: 'EXACT_OR_ALIAS_MATCH',
            reason: `Name directly matches or resolves to identical surname alias ("${targetName}")`,
        };
    }

    // 2. Jaro-Winkler Similarity on normalized strings
    const similarity = jaroWinkler(normQuery, normTarget);

    // 3. Word-by-word Phonetic Metaphone Matching
    const queryWords = normQuery.split(/\s+/).filter(Boolean);
    const targetWords = normTarget.split(/\s+/).filter(Boolean);

    const queryCodes = queryWords.map((w) => getDoubleMetaphone(w));
    const targetCodes = targetWords.map((w) => getDoubleMetaphone(w));

    let phoneticHits = 0;
    queryCodes.forEach((qc) => {
        if (qc && targetCodes.includes(qc)) {
            phoneticHits++;
        }
    });

    const phoneticOverlapRatio = queryCodes.length > 0 ? phoneticHits / queryCodes.length : 0;

    if (phoneticOverlapRatio >= 0.80 || (phoneticOverlapRatio >= 0.5 && similarity >= 0.82)) {
        const finalConfidence = Math.min(0.95, Number((similarity * 0.5 + phoneticOverlapRatio * 0.5).toFixed(2)));
        return {
            isMatch: true,
            confidence: finalConfidence,
            match_type: 'PHONETIC_MATCH',
            reason: `Phonetic sound & spelling similarity (${Math.round(finalConfidence * 100)}%) with "${targetName}"`,
            phonetic_codes: { query: queryCodes, target: targetCodes },
        };
    }

    if (similarity >= 0.84) {
        return {
            isMatch: true,
            confidence: similarity,
            match_type: 'FUZZY_STRING_MATCH',
            reason: `Close typographical match (${Math.round(similarity * 100)}%) with "${targetName}"`,
        };
    }

    return {
        isMatch: false,
        confidence: similarity,
        match_type: 'NONE',
        reason: 'Below similarity threshold',
    };
}
