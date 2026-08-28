import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/store/auth.store';
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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Polls on the same cadence as the backend dispatcher (30s) when authenticated
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: isAuthenticated ? 30000 : false,
    enabled: isAuthenticated,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
    enabled: Boolean(open && isAuthenticated),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return (
    <div className="relative" ref={containerRef}>
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-primary-700"
      >
        <Bell size={20} />
        {!!unreadCount && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white shadow-sm"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* click-outside overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 z-50 mt-2 w-80 rounded-[var(--radius-card)] border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-sm font-bold text-primary-950">
                <span>Notifications</span>
                {unreadCount ? (
                  <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                    {unreadCount} unread
                  </span>
                ) : null}
              </div>
              <div className="max-h-96 overflow-y-auto">
                {isLoading && <div className="px-4 py-6 text-center text-sm text-slate-400">Loading...</div>}
                {!isLoading && notifications?.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No notifications yet.
                  </div>
                )}
                {notifications?.map((n) => (
                  <motion.button
                    whileHover={{ backgroundColor: 'rgba(241, 245, 249, 0.7)' }}
                    key={n.id}
                    onClick={() => !n.read_at && markReadMutation.mutate(n.id)}
                    className={`flex w-full flex-col gap-0.5 border-b border-slate-50 px-4 py-3 text-left transition-colors ${
                      !n.read_at ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {!n.read_at && (
                        <motion.span
                          layoutId={`unread-${n.id}`}
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-600"
                        />
                      )}
                      <span className="text-sm font-medium text-primary-900">{n.title}</span>
                    </div>
                    {n.body && <p className="line-clamp-2 pl-3.5 text-xs text-slate-500">{n.body}</p>}
                    <span className="pl-3.5 text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
