import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
} from '@/features/notifications/notifications.api';

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // Polls on the same cadence as the backend dispatcher (30s), so a newly
  // sent notification shows up here without the user needing to refresh.
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 30000,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
    enabled: open,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700"
      >
        <Bell size={20} />
        {!!unreadCount && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-outside overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-[var(--radius-card)] border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-primary-900">
              Notifications
            </div>
            <div className="max-h-96 overflow-y-auto">
              {isLoading && <div className="px-4 py-6 text-center text-sm text-slate-400">Loading...</div>}
              {!isLoading && notifications?.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-slate-400">
                  No notifications yet.
                </div>
              )}
              {notifications?.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.read_at && markReadMutation.mutate(n.id)}
                  className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    !n.read_at ? 'bg-primary-50/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!n.read_at && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600" />}
                    <span className="text-sm font-medium text-primary-900">{n.title}</span>
                  </div>
                  {n.body && <p className="line-clamp-2 pl-3.5 text-xs text-slate-500">{n.body}</p>}
                  <span className="pl-3.5 text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
