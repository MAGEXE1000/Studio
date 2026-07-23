import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { secureReadLocal, secureWriteLocal } from '../security.js';

export type NotificationCategory =
  | 'app_update'
  | 'ota_update'
  | 'download_complete'
  | 'install_ready'
  | 'install_failed'
  | 'whats_new'
  | 'release_notes'
  | 'sync_event'
  | 'backup_event'
  | 'cloud_event'
  | 'account_event'
  | 'tip'
  | 'feature_announcement'
  | 'system_message';

export type NotificationPriority = 'low' | 'normal' | 'high';

export interface NotificationAction {
  label: string;
  actionId: string;
}

export interface NotificationItem {
  id: string;
  timestamp: number;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  subtitle: string;
  icon?: string;
  badge?: string;
  actions?: NotificationAction[];
  read: boolean;
  dismissed: boolean;
  relatedFeature?: string;
}

export interface NotificationServiceStore {
  notifications: NotificationItem[];

  publish: (
    notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read' | 'dismissed'>
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  clearAll: () => void;
  getUnreadCount: () => number;
}

export const useNotificationService = create<NotificationServiceStore>()(
  persist(
    (set, get) => ({
      notifications: [
        // Seed some initial welcome notifications if empty
        {
          id: 'welcome-tip',
          timestamp: Date.now() - 3600000 * 2, // 2 hours ago
          category: 'tip',
          priority: 'low',
          title: 'Welcome to Livex Studio',
          subtitle:
            'Explore the newly unified design language, tabs navigation, and theme configurations in settings.',
          icon: 'info',
          read: false,
          dismissed: false,
        },
      ],

      publish: (notification) => {
        const notifications = get().notifications;
        const existingIndex = notifications.findIndex(
          (n) => n.category === notification.category && n.title === notification.title && !n.dismissed
        );

        if (existingIndex !== -1) {
          set((state) => {
            const updated = [...state.notifications];
            updated[existingIndex] = {
              ...updated[existingIndex],
              subtitle: notification.subtitle,
              timestamp: Date.now(),
              actions: notification.actions,
              read: false,
            };
            return { notifications: updated };
          });
          return;
        }

        const id = 'notif_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
        const timestamp = Date.now();
        const newItem: NotificationItem = {
          ...notification,
          id,
          timestamp,
          read: false,
          dismissed: false,
        };
        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      dismiss: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, dismissed: true } : n
          ),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read && !n.dismissed).length;
      },
    }),
    {
      name: 'studio-notifications-storage-v1',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
      storage: createJSONStorage(() => ({
        getItem: (name) => secureReadLocal(name),
        setItem: (name, value) => secureWriteLocal(name, value),
        removeItem: (name) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(name);
          }
        },
      })),
    }
  )
);
