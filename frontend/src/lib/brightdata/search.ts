import type { GoogleSearchResult, ProfileSummary } from '@/types/linkedin';

/**
 * Bright Data Google Search API
 * Direct API calls to search Google and extract LinkedIn URLs
 */
const BRIGHTDATA_API_URL = 'https://api.brightdata.com/request';

interface BrightDataGoogleSearchResult {
  title: string;
  link?: string;
  url?: string;
  snippet?: string;
  description?: string;
  position?: number;
}

interface BrightDataGoogleSearchResponse {
  organic?: BrightDataGoogleSearchResult[];
  images?: unknown[];
  pagination?: {
    current_page?: number;
  };
  related?: string[];
  ai_overview?: unknown;
}

/**
 * Get Bright Data API headers
 */
function getApiHeaders() {
  const apiToken = process.env.BRIGHTDATA_API_TOKEN;
  if (!apiToken) {
    throw new Error('BRIGHTDATA_API_TOKEN is not set in environment variables');
  }

  return {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };
}

type BrightDataSearchMode = 'unlocker' | 'serp';

function getSearchZoneName(): string {
  return process.env.BRIGHTDATA_SEARCH_ZONE || process.env.BRIGHTDATA_UNLOCKER_ZONE || 'unblocker';
}

function getSearchMode(zoneName: string): BrightDataSearchMode {
  const configured = process.env.BRIGHTDATA_SEARCH_PRODUCT?.toLowerCase();
  if (configured === 'serp') return 'serp';
  if (configured === 'unlocker') return 'unlocker';
  return /serp/i.test(zoneName) ? 'serp' : 'unlocker';
}

/**
 * Build Google search URL with JSON response format and geolocation
 */
function buildGoogleSearchUrl(
  query: string,
  page: number = 0,
  countryCode?: string | null,
  options?: { includeBrightDataJsonParam?: boolean },
): string {
  const encodedQuery = encodeURIComponent(query);
  const start = page * 10;
  const includeBrightDataJsonParam = options?.includeBrightDataJsonParam ?? true;
  let url = `https://www.google.com/search?q=${encodedQuery}&start=${start}`;

  if (includeBrightDataJsonParam) {
    url += '&brd_json=1';
  }

  if (countryCode) {
    url += `&gl=${countryCode.toUpperCase()}`;
  }

  return url;
}

/**
 * Execute Google search via Bright Data API
 */
export async function searchGoogle(
  query: string,
  page: number = 0,
  countryCode?: string | null,
): Promise<BrightDataGoogleSearchResponse> {
  const searchZone = getSearchZoneName();
  const searchMode = getSearchMode(searchZone);
  const searchUrl = buildGoogleSearchUrl(query, page, countryCode, {
    includeBrightDataJsonParam: searchMode === 'unlocker',
  });

  try {
    const body: Record<string, unknown> = {
      url: searchUrl,
      zone: searchZone,
      // SERP API supports structured JSON responses directly.
      format: searchMode === 'serp' ? 'json' : 'raw',
      method: 'GET',
    };

    if (searchMode === 'serp' && countryCode) {
      body.country = countryCode.toLowerCase();
    }

    const response = await fetch(BRIGHTDATA_API_URL, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      const details = errorText ? ` - ${errorText.slice(0, 500)}` : '';
      throw new Error(`Google search failed: ${response.status} ${response.statusText}${details}`);
    }

    const textData = await response.text();
    const rawData = JSON.parse(textData) as unknown;
    const searchData = normalizeSearchResponse(rawData);

    console.log(
      `[Google Search] Found ${searchData.organic?.length || 0} organic results for query: "${query}" (${searchMode} zone: ${searchZone})`,
    );

    return searchData;
  } catch (error) {
    console.error('[Google Search] Error:', error);
    throw new Error(
      `Failed to search Google: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Extract and validate LinkedIn profile URLs from search results
 */
export function extractLinkedInUrls(searchResults: BrightDataGoogleSearchResponse): string[] {
  if (!searchResults.organic?.length) {
    return [];
  }

  const linkedInUrls: string[] = [];

  for (const result of searchResults.organic) {
    const url = result.link ?? result.url;
    if (!url) continue;

    if (isValidLinkedInProfileUrl(url)) {
      const cleanUrl = normalizeLinkedInUrl(url);
      linkedInUrls.push(cleanUrl);
    }
  }

  console.log(`[LinkedIn URLs] Extracted ${linkedInUrls.length} LinkedIn profile URLs`);

  return linkedInUrls;
}

function isValidLinkedInProfileUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      (parsed.hostname === 'linkedin.com' ||
        parsed.hostname === 'www.linkedin.com' ||
        parsed.hostname.endsWith('.linkedin.com')) &&
      parsed.pathname.startsWith('/in/')
    );
  } catch {
    return false;
  }
}

function normalizeLinkedInUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `https://www.linkedin.com${parsed.pathname}`;
  } catch {
    return url;
  }
}

function normalizeGoogleResult(result: BrightDataGoogleSearchResult, index: number): GoogleSearchResult {
  const link = result.link ?? result.url ?? '';
  return {
    title: result.title,
    link,
    description: result.snippet ?? result.description ?? '',
    position: result.position ?? index + 1,
  };
}

function normalizeSearchResponse(rawData: unknown): BrightDataGoogleSearchResponse {
  if (!rawData || typeof rawData !== 'object') {
    return {};
  }

  const record = rawData as Record<string, unknown>;

  if (Array.isArray(record.organic)) {
    return record as unknown as BrightDataGoogleSearchResponse;
  }

  if (Array.isArray(record.organic_results)) {
    return {
      organic: (record.organic_results as BrightDataGoogleSearchResult[]).map((item, index) => ({
        title: item.title ?? '',
        link: item.link ?? item.url,
        url: item.url,
        snippet: item.snippet ?? item.description,
        description: item.description,
        position: item.position ?? index + 1,
      })),
    };
  }

  if (record.results && typeof record.results === 'object') {
    const nested = record.results as Record<string, unknown>;
    if (Array.isArray(nested.organic)) {
      return { organic: nested.organic as BrightDataGoogleSearchResult[] };
    }
    if (Array.isArray(nested.organic_results)) {
      return {
        organic: (nested.organic_results as BrightDataGoogleSearchResult[]).map((item, index) => ({
          title: item.title ?? '',
          link: item.link ?? item.url,
          url: item.url,
          snippet: item.snippet ?? item.description,
          description: item.description,
          position: item.position ?? index + 1,
        })),
      };
    }
  }

  return record as unknown as BrightDataGoogleSearchResponse;
}

function extractLinkedInId(url: string): string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    const inIndex = segments.findIndex((segment) => segment === 'in');
    const candidate = inIndex >= 0 ? segments[inIndex + 1] : segments[0];
    return candidate?.split(/[?#]/)[0]?.replace(/\/$/, '') ?? url;
  } catch {
    return url;
  }
}

export function extractProfileSummary(result: GoogleSearchResult): ProfileSummary {
  const linkedinUrl = normalizeLinkedInUrl(result.link);
  const linkedinId = extractLinkedInId(linkedinUrl);

  const titleParts = result.title.split(' - ');
  const rawName = titleParts[0]?.replace(' | LinkedIn', '').trim() ?? '';
  const name = rawName || undefined;
  const headlineCandidate = titleParts.slice(1).join(' - ').replace(' | LinkedIn', '').trim();
  const headline = headlineCandidate || undefined;

  const location = result.description ? extractLocationFromSnippet(result.description) : undefined;

  return {
    linkedinUrl,
    linkedinId,
    title: result.title,
    snippet: result.description,
    name,
    headline,
    location,
  };
}

function extractLocationFromSnippet(snippet: string): string | undefined {
  const locationMatch = snippet.match(/Location:\s*([^·]+)/i);
  if (locationMatch?.[1]) {
    return locationMatch[1].trim();
  }

  const parts = snippet.split(' · ');
  if (parts.length > 1) {
    const candidate = parts[parts.length - 1].trim();
    if (candidate && candidate.length <= 80) {
      return candidate;
    }
  }

  return undefined;
}

export async function searchLinkedInProfiles(
  query: string,
  maxResults: number = 10,
  countryCode?: string | null,
): Promise<ProfileSummary[]> {
  console.log('[Google Search] Searching for LinkedIn profiles:', {
    query,
    maxResults,
    countryCode,
  });

  try {
    const searchResults = await searchGoogle(query, 0, countryCode);
    const organicResults = searchResults.organic ?? [];

    const normalizedResults = organicResults.map((result, index) => normalizeGoogleResult(result, index));

    const linkedinResults = normalizedResults.filter((result) => isValidLinkedInProfileUrl(result.link));

    const summaries = linkedinResults.slice(0, maxResults).map(extractProfileSummary);

    console.log('[Google Search] Found summaries:', summaries.length);
    return summaries;
  } catch (error) {
    console.error('[Google Search] Error:', error);
    throw new Error('Failed to search LinkedIn profiles');
  }
}

export async function findLinkedInProfiles(
  query: string,
  maxResults: number = 10,
  countryCode?: string | null,
): Promise<string[]> {
  try {
    const summaries = await searchLinkedInProfiles(query, maxResults, countryCode);
    return summaries.map((summary) => summary.linkedinUrl);
  } catch (error) {
    console.error('[Find LinkedIn Profiles] Error:', error);
    throw new Error(`Failed to find LinkedIn profiles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
