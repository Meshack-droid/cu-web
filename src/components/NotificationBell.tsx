import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, CheckCheck, Sparkles, Calendar, Award, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '@/features/notifications/notifications.api';

function timeAgo(iso: string) {
  if (!iso) return 'recently';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (isNaN(seconds) || seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getNotificationIcon(type?: string) {
  switch (type) {
    case 'welcome':
      return <Award size={15} className="text-amber-600" />;
    case 'meeting':
    case 'event':
      return <Calendar size={15} className="text-primary-600" />;
    case 'announcement':
      return <Sparkles size={15} className="text-purple-600" />;
    default:
      return <Info size={15} className="text-primary-600" />;
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Polls every 30s when authenticated
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: isAuthenticated ? 30000 : false,
    enabled: isAuthenticated,
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: fetchNotifications,
    enabled: Boolean(open && isAuthenticated),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prevList = queryClient.getQueryData<Notification[]>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<number>(['notifications', 'unread-count']) ?? 0;

      queryClient.setQueryData<Notification[]>(['notifications', 'list'], (old = []) =>
        old.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
      queryClient.setQueryData<number>(['notifications', 'unread-count'], (old = 0) =>
        Math.max(0, old - 1)
      );

      return { prevList, prevCount };
    },
    onError: (_err, _id, context) => {
      if (context) {
        queryClient.setQueryData(['notifications', 'list'], context.prevList);
        queryClient.setQueryData(['notifications', 'unread-count'], context.prevCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const prevList = queryClient.getQueryData<Notification[]>(['notifications', 'list']);
      const prevCount = queryClient.getQueryData<number>(['notifications', 'unread-count']) ?? 0;

      queryClient.setQueryData<Notification[]>(['notifications', 'list'], (old = []) =>
        old.map((n) => ({ ...n, read_at: new Date().toISOString() }))
      );
      queryClient.setQueryData<number>(['notifications', 'unread-count'], 0);

      return { prevList, prevCount };
    },
    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(['notifications', 'list'], context.prevList);
        queryClient.setQueryData(['notifications', 'unread-count'], context.prevCount);
      }
    },
    onSettled: () => {
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
        className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Click outside overlay */}
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 z-50 mt-2 w-84 sm:w-96 rounded-2xl border border-slate-200/90 bg-white/98 shadow-2xl backdrop-blur-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 bg-slate-50/70">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary-950">Notifications</span>
                  {unreadCount > 0 ? (
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      All read
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    disabled={markAllReadMutation.isPending}
                    className="flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-900 transition"
                  >
                    <CheckCheck size={13} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Body list */}
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100/80">
                {isLoading && (
                  <div className="px-4 py-8 text-center text-xs text-slate-400 font-medium">
                    Loading fellowship notifications...
                  </div>
                )}

                {!isLoading && notifications.length === 0 && (
                  <div className="px-4 py-10 text-center space-y-2">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                      <Bell size={18} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                      You are all caught up with TUMCU announcements and updates.
                    </p>
                  </div>
                )}

                {notifications.map((n: Notification) => {
                  const isUnread = !n.read_at && !(n as any).readAt;
                  const displayTitle = n.title || 'Fellowship Notification';
                  const displayBody =
                    n.body || 'You have a new update from Technical University of Mombasa Christian Union.';

                  return (
                    <div
                      key={n.id}
                      onClick={() => isUnread && markReadMutation.mutate(n.id)}
                      className={`group flex items-start gap-3 px-4 py-3.5 text-left transition cursor-pointer hover:bg-slate-50/80 ${
                        isUnread ? 'bg-primary-50/30' : 'bg-white'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl ${
                          isUnread ? 'bg-primary-100 text-primary-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-bold truncate ${isUnread ? 'text-primary-950' : 'text-slate-700'}`}>
                            {displayTitle}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary-600 ring-2 ring-primary-200" />
                          )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2">{displayBody}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] font-medium text-slate-400">{timeAgo(n.created_at)}</span>
                          {isUnread && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markReadMutation.mutate(n.id);
                              }}
                              className="text-[10px] font-bold text-primary-700 hover:underline flex items-center gap-0.5"
                            >
                              <Check size={11} /> Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
