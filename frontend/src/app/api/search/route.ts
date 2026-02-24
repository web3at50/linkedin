import { NextRequest, NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/search/parser';
import { searchLinkedInProfiles } from '@/lib/brightdata/search';
import { cacheSearchResults, getCachedSearchResults } from '@/lib/redis/search-cache';
import { cacheProfileSummary } from '@/lib/redis/profile-cache';
import { requireAuthenticatedUser } from '@/lib/auth';
import type { ParsedSearchQuery } from '@/lib/search/parser';
import type { ProfileSummary } from '@/types/linkedin';

function tryParseLinkedInProfileQuery(query: string): ProfileSummary | null {
  const trimmed = query.trim();

  try {
    const url = new URL(trimmed);
    const hostname = url.hostname.toLowerCase();
    if (!(hostname === 'linkedin.com' || hostname === 'www.linkedin.com' || hostname.endsWith('.linkedin.com'))) {
      return null;
    }

    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] !== 'in' || !parts[1]) {
      return null;
    }

    const linkedinId = decodeURIComponent(parts[1]).replace(/\/+$/, '');
    if (!linkedinId) {
      return null;
    }

    const cleanUrl = `https://www.linkedin.com/in/${linkedinId}`;

    return {
      linkedinUrl: cleanUrl,
      linkedinId,
      title: `LinkedIn profile: ${linkedinId}`,
      snippet: 'Direct LinkedIn URL (manual input)',
      name: undefined,
      headline: undefined,
      location: undefined,
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthenticatedUser();
    if (!auth.ok) {
      return auth.response;
    }

    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 },
      );
    }

    if (query.length < 2 || query.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Query must be 2-500 characters' },
        { status: 400 },
      );
    }

    console.log('[Search API] Query:', query);

    const directLinkedInSummary = tryParseLinkedInProfileQuery(query);
    if (directLinkedInSummary) {
      console.log('[Search API] Direct LinkedIn URL mode:', directLinkedInSummary.linkedinUrl);

      const parsedQuery: ParsedSearchQuery = {
        count: 1,
        role: null,
        location: null,
        countryCode: null,
        keywords: [directLinkedInSummary.linkedinId],
        googleQuery: '',
      };

      await cacheProfileSummary(directLinkedInSummary);

      return NextResponse.json({
        success: true,
        count: 1,
        results: [directLinkedInSummary],
        parsedQuery,
        cached: false,
        timestamp: Date.now(),
        mode: 'direct-linkedin-url',
      });
    }

    const cachedResults = await getCachedSearchResults(query);

    if (cachedResults) {
      console.log('[Search API] Returning cached search results');
      return NextResponse.json({
        success: true,
        count: cachedResults.count,
        results: cachedResults.results,
        parsedQuery: cachedResults.parsedQuery,
        cached: true,
        timestamp: cachedResults.timestamp,
      });
    }

    const parsedQuery = await parseSearchQuery(query);
    console.log('[Search API] Parsed query:', parsedQuery);

    const summaries = await searchLinkedInProfiles(
      parsedQuery.googleQuery,
      parsedQuery.count,
      parsedQuery.countryCode,
    );

    await cacheSearchResults(query, parsedQuery, summaries);

    await Promise.all(summaries.map((summary) => cacheProfileSummary(summary)));

    console.log('[Search API] Returning fresh search results:', summaries.length);

    return NextResponse.json({
      success: true,
      count: summaries.length,
      results: summaries,
      parsedQuery,
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed',
      },
      { status: 500 },
    );
  }
}
