import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

/**
 * Parsed search query structure
 */
export interface ParsedSearchQuery {
  count: number;
  role: string | null;
  location?: string | null;
  countryCode?: string | null;
  keywords: string[];
  googleQuery: string;
}

const ROLE_HINTS = [
  'engineer',
  'developer',
  'teacher',
  'headteacher',
  'deputy',
  'director',
  'manager',
  'principal',
  'leader',
  'lead',
  'head',
  'mat',
  'trust',
  'school',
  'slt',
  'it',
];

const STOPWORDS = new Set([
  'find',
  'me',
  'people',
  'person',
  'in',
  'at',
  'for',
  'with',
  'and',
  'the',
  'of',
  'to',
  'that',
  'who',
  'uk',
  'gb',
]);

/**
 * Zod schema for structured LLM output
 */
const SearchQuerySchema = z.object({
  count: z.number().min(1).max(50).describe('Number of profiles to find (1-50). If searching for a specific individual by name, set to 1.'),
  role: z.string().nullable().describe('Job title or role (e.g., "Software Engineer", "Product Manager"). If searching for a specific individual by name, set to null.'),
  location: z.string().optional().nullable().describe('Location or region (e.g., "San Francisco", "Remote", "Israel"). Can also be a company name if no geographic location is specified. Set to null if not mentioned.'),
  countryCode: z.string().length(2).optional().nullable().describe('2-letter ISO country code (e.g., "US", "IL", "GB", "DE"). Extract from location ONLY if it is a geographic location. Return null if location is a company name or not mentioned.'),
  keywords: z.array(z.string()).describe('Additional keywords or qualifications (e.g., ["Python", "startup", "AI", "MiniMax"]). For individual name searches, include the person\'s name here.'),
  googleQuery: z.string().describe('Optimized Google search query for LinkedIn profiles using site:linkedin.com/in. For individuals, use their full name in quotes.'),
});

/**
 * Parse a natural language search query into structured data using Gemini 2.0 Flash
 *
 * @param query - Natural language query (e.g., "5 AI Engineers in Israel")
 * @returns Structured search query with Google search string
 *
 * @example
 * ```ts
 * const result = await parseSearchQuery("5 AI Engineers in Israel");
 * // {
 * //   count: 5,
 * //   role: "AI Engineer",
 * //   location: "Israel",
 * //   keywords: [],
 * //   googleQuery: 'site:linkedin.com/in "AI Engineer" "Israel"'
 * // }
 * ```
 */
export async function parseSearchQuery(
  query: string
): Promise<ParsedSearchQuery> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return fallbackParseSearchQuery(query);
  }

  try {
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: SearchQuerySchema,
      prompt: `Parse this search query and create an optimized Google search query for finding LinkedIn profiles.

Input query: "${query}"

QUERY TYPES:
This can be either:
A) A job/role search: "5 AI Engineers in Israel", "Software engineers at Google"
B) An individual name search: "John Doe", "Elon Musk", "Satya Nadella"

Instructions:
1. DETECT QUERY TYPE:
   - If the query is a person's name (first and last name, or full name), treat it as an INDIVIDUAL SEARCH
   - If the query mentions a role/job title, treat it as a JOB/ROLE SEARCH

2. For JOB/ROLE SEARCHES:
   - Extract the number of profiles needed (default to 10 if not specified)
   - Identify the job role/title
   - Extract location if mentioned (geographic location OR company name)
   - Convert location to 2-letter ISO country code ONLY if geographic (Israel → IL, US → US, etc.)
   - Identify keywords or skills (technologies, companies, expertise)
   - Create Google query: site:linkedin.com/in "Job Title" "Location/Company" keywords

3. For INDIVIDUAL SEARCHES:
   - Set count to 1
   - Set role to null
   - Set location to null
   - Set countryCode to null
   - Add the person's name to keywords array
   - Create Google query: site:linkedin.com/in "Full Name"

IMPORTANT FLEXIBILITY RULES:
- Be VERY flexible with query interpretation
- Prioritize creating a working search over strict schema adherence
- For company names (MiniMax, Google, etc.), set countryCode to null
- For individual names, focus on finding exact matches

Examples:

JOB/ROLE SEARCHES:
- Input: "5 AI Engineers in Israel with Python experience"
  Output: count=5, role="AI Engineer", location="Israel", countryCode="IL", keywords=["Python"]
  googleQuery: site:linkedin.com/in "AI Engineer" "Israel" Python

- Input: "10 Product Managers in San Francisco"
  Output: count=10, role="Product Manager", location="San Francisco", countryCode="US", keywords=[]
  googleQuery: site:linkedin.com/in "Product Manager" "San Francisco"

- Input: "Software engineers that works in minimax"
  Output: count=10, role="Software Engineer", location="MiniMax", countryCode=null, keywords=["MiniMax"]
  googleQuery: site:linkedin.com/in "Software Engineer" MiniMax

- Input: "Java developers at Google"
  Output: count=10, role="Java Developer", location="Google", countryCode=null, keywords=["Java", "Google"]
  googleQuery: site:linkedin.com/in "Java Developer" Google

INDIVIDUAL SEARCHES:
- Input: "Elon Musk"
  Output: count=1, role=null, location=null, countryCode=null, keywords=["Elon Musk"]
  googleQuery: site:linkedin.com/in "Elon Musk"

- Input: "Satya Nadella"
  Output: count=1, role=null, location=null, countryCode=null, keywords=["Satya Nadella"]
  googleQuery: site:linkedin.com/in "Satya Nadella"

- Input: "John Smith CEO"
  Output: count=1, role=null, location=null, countryCode=null, keywords=["John Smith", "CEO"]
  googleQuery: site:linkedin.com/in "John Smith" CEO

Keep the googleQuery simple and effective for finding relevant LinkedIn profiles.`,
    });

    console.log(`[Parser] Parsed query: "${query}" -> role="${object.role}", count=${object.count}, country=${object.countryCode}`);

    return {
      count: object.count,
      role: object.role,
      location: object.location,
      countryCode: object.countryCode,
      keywords: object.keywords,
      googleQuery: object.googleQuery,
    };
  } catch (error) {
    console.error('[Parser] Error parsing search query:', error);
    return fallbackParseSearchQuery(query);
  }
}

function fallbackParseSearchQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
  const normalized = raw.toLowerCase();
  const countMatch = normalized.match(/\b([1-9]|[1-4]\d|50)\b/);
  const count = countMatch ? Number(countMatch[1]) : 10;

  const locationMatch =
    raw.match(/\b(?:in|near)\s+([A-Za-z][A-Za-z\s&-]{1,50})$/i) ??
    raw.match(/\b(?:in|near)\s+([A-Za-z][A-Za-z\s&-]{1,50})\b/i) ??
    raw.match(/\bat\s+([A-Za-z][A-Za-z0-9\s&-]{1,50})$/i);
  const location = locationMatch?.[1]?.trim() || null;

  const withoutCount = raw.replace(/\b([1-9]|[1-4]\d|50)\b/, '').trim();
  const withoutLocation = location
    ? withoutCount.replace(locationMatch?.[0] ?? '', '').trim()
    : withoutCount;
  const cleaned = withoutLocation.replace(/\s+/g, ' ').trim();

  const looksLikeIndividual =
    cleaned.split(/\s+/).length <= 4 &&
    !ROLE_HINTS.some((hint) => normalized.includes(hint)) &&
    !/\b(in|at|school|trust|academy|mat)\b/i.test(cleaned);

  if (looksLikeIndividual) {
    const fullName = cleaned || raw;
    const googleQuery = `site:linkedin.com/in "${fullName}"`;
    console.log(`[Parser] Fallback parsed individual query: "${query}"`);
    return {
      count: 1,
      role: null,
      location: null,
      countryCode: null,
      keywords: [fullName],
      googleQuery,
    };
  }

  const role = cleaned || raw;
  const countryCode = inferCountryCode(normalized, location);
  const keywords = raw
    .split(/\s+/)
    .map((token) => token.replace(/[^\w-]/g, ''))
    .filter(Boolean)
    .filter((token) => !STOPWORDS.has(token.toLowerCase()))
    .filter((token) => !/^\d+$/.test(token))
    .slice(0, 5);

  const queryParts = ['site:linkedin.com/in'];
  if (role) queryParts.push(`"${role}"`);
  if (location) queryParts.push(`"${location}"`);
  for (const keyword of keywords) {
    if (
      keyword.toLowerCase() !== role.toLowerCase() &&
      (!location || keyword.toLowerCase() !== location.toLowerCase())
    ) {
      queryParts.push(keyword);
    }
  }

  console.log(`[Parser] Fallback parsed role query: "${query}" -> role="${role}"`);
  return {
    count,
    role,
    location,
    countryCode,
    keywords,
    googleQuery: queryParts.join(' ').replace(/\s+/g, ' ').trim(),
  };
}

function inferCountryCode(normalizedQuery: string, location?: string | null): string | null {
  const combined = `${normalizedQuery} ${location ?? ''}`.toLowerCase();
  if (/\b(uk|united kingdom|britain|england|scotland|wales|northern ireland)\b/.test(combined)) {
    return 'GB';
  }
  if (/\b(us|usa|united states|america)\b/.test(combined)) {
    return 'US';
  }
  return null;
}
