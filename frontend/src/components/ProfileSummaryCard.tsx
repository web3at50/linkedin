'use client';

import { useCallback, useState } from 'react';
import type { CachedProfile, ProfileSummary, ActivityItem } from '@/types/linkedin';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, ExternalLink, Loader2, BookmarkPlus, RefreshCw } from 'lucide-react';
import ProfileDetails from '@/components/ProfileDetails';
import { ActivityFeed } from '@/components/ActivityFeed';

interface ProfileSummaryCardProps {
  summary: ProfileSummary;
}

export default function ProfileSummaryCard({ summary }: ProfileSummaryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedProspectId, setSavedProspectId] = useState<string | null>(null);
  const [fullProfile, setFullProfile] = useState<CachedProfile | null>(null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [activityCounts, setActivityCounts] = useState<{ posts: number; activity: number; total: number } | null>(null);

  const handleExpand = useCallback(async () => {
    if (!isExpanded && !fullProfile) {
      setIsLoadingProfile(true);
      setError(null);

      try {
        const response = await fetch(`/api/profile/${encodeURIComponent(summary.linkedinId)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load profile');
        }

        setFullProfile(data.profile as CachedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoadingProfile(false);
      }
    }

    setIsExpanded((prev) => !prev);
  }, [fullProfile, isExpanded, summary.linkedinId]);

  const handleFetchActivity = useCallback(async (refresh = false) => {
    setIsLoadingActivity(true);
    setActivityError(null);

    try {
      const url = `/api/profile/${encodeURIComponent(summary.linkedinId)}/activity${refresh ? '?refresh=1' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load activity');
      }

      setActivityItems((data.items as ActivityItem[]) ?? []);
      setActivityCounts(data.counts ?? null);
    } catch (err) {
      setActivityError(err instanceof Error ? err.message : 'Failed to fetch activity');
    } finally {
      setIsLoadingActivity(false);
    }
  }, [summary.linkedinId]);

  const handleSaveProspect = useCallback(async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinId: summary.linkedinId,
          includeActivity: activityItems.length > 0,
          status: 'new',
          priority: 'medium',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save prospect');
      }

      setSavedProspectId(data.prospect?.id ?? null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save prospect');
    } finally {
      setIsSaving(false);
    }
  }, [activityItems.length, summary.linkedinId]);

  const displayTitle = summary.name || summary.title;

  return (
    <Card className="border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold leading-tight text-slate-900 line-clamp-2">
            {displayTitle}
          </h3>
          {summary.headline && (
            <p className="text-sm text-slate-600 line-clamp-2">{summary.headline}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {summary.location && (
              <Badge variant="secondary" className="w-fit">
                {summary.location}
              </Badge>
            )}
            {savedProspectId && (
              <Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">
                Saved Prospect
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-sm text-slate-600">
        {summary.snippet && <p className="line-clamp-4 leading-relaxed">{summary.snippet}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleExpand} disabled={isLoadingProfile}>
            {isLoadingProfile ? (
              'Loading...'
            ) : isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Hide details
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                View details
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleFetchActivity(activityItems.length > 0)}
            disabled={isLoadingActivity}
          >
            {isLoadingActivity ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Loading activity...
              </>
            ) : activityItems.length > 0 ? (
              <>
                <RefreshCw className="mr-1 h-4 w-4" />
                Refresh activity
              </>
            ) : (
              'Fetch Activity'
            )}
          </Button>

          <Button size="sm" onClick={handleSaveProspect} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <BookmarkPlus className="mr-1 h-4 w-4" />
                Save Prospect
              </>
            )}
          </Button>

          <Button size="sm" variant="outline" asChild>
            <a
              href={summary.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open LinkedIn
            </a>
          </Button>
        </div>

        {saveError && <p className="text-sm text-red-700">{saveError}</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}
        {activityError && <p className="text-sm text-red-700">{activityError}</p>}

        {activityItems.length > 0 && (
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Activity feed (on-demand)</span>
              {activityCounts && (
                <span>
                  {activityCounts.posts} posts • {activityCounts.activity} activity items
                </span>
              )}
            </div>
            <ActivityFeed items={activityItems} />
          </div>
        )}

        {isExpanded && (
          <div className="border-t border-slate-200 pt-4">
            {!error && !fullProfile && isLoadingProfile && (
              <p className="text-sm text-slate-500">Loading profile details...</p>
            )}
            {fullProfile && <ProfileDetails profile={fullProfile} />}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

