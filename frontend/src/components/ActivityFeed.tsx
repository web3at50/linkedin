'use client';

import { ExternalLink, MessageSquare, Repeat2, ThumbsUp, FileText, CircleHelp } from 'lucide-react';
import type { ActivityItem } from '@/types/linkedin';
import { Badge } from '@/components/ui/badge';

function ActivityIcon({ kind }: { kind: ActivityItem['kind'] }) {
  switch (kind) {
    case 'post':
      return <FileText className="h-4 w-4" />;
    case 'comment':
      return <MessageSquare className="h-4 w-4" />;
    case 'reaction':
      return <ThumbsUp className="h-4 w-4" />;
    case 'repost':
      return <Repeat2 className="h-4 w-4" />;
    default:
      return <CircleHelp className="h-4 w-4" />;
  }
}

export function ActivityFeed({
  items,
  emptyLabel = 'No recent activity found',
}: {
  items: ActivityItem[];
  emptyLabel?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-lg border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <ActivityIcon kind={item.kind} />
                <span className="capitalize">{item.kind}</span>
                {item.sourceLabel && (
                  <Badge variant="outline" className="text-[11px]">
                    {item.sourceLabel}
                  </Badge>
                )}
              </div>

              {item.title && <p className="text-sm font-medium text-slate-800">{item.title}</p>}
              {item.snippet && <p className="text-sm text-slate-600">{item.snippet}</p>}

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {item.occurredAt && <span>{item.occurredAt}</span>}
                {item.rawInteraction && <span>• {item.rawInteraction}</span>}
              </div>
            </div>

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              Open
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

