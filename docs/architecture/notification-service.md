# Notification Service

The Notification Service is a centralized, persistent Zustand store that manages all in-app notifications across the Livex platform — update events, sync status, auth changes, tips, and feature announcements.

---

## Purpose

Provide a single source of truth for user-facing notifications, with persistent storage, categorization, priority levels, action buttons, and read/dismiss state tracking.

## Responsibilities

| Responsibility                   | Owner                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notification store & persistence | [NotificationService.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/notifications/NotificationService.ts)              |
| Update event publishing          | [stateMachine.ts](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/studio-core/src/lib/updater/stateMachine.ts)                                  |
| Auth & sync event publishing     | [App.tsx](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/src/App.tsx)                                                               |
| Timeline UI rendering            | [StudioHub.tsx](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/packages/ui-shared/src/components/hub/StudioHub.tsx) `renderNotificationCenterContent()` |

## Architecture

```mermaid
graph TD
    subgraph Publishers
        Updater[Updater FSM]
        Auth[Auth Subscriber]
        Sync[Sync Status Subscriber]
    end

    subgraph NotificationService
        Store[useNotificationService<br/>Zustand Store]
        Persist[Encrypted localStorage<br/>studio-notifications-storage-v1]
    end

    subgraph UI
        Hub[Hub Notification Center]
        Badge[Settings Nav Badge]
    end

    Updater -->|publish()| Store
    Auth -->|publish()| Store
    Sync -->|publish()| Store
    Store -->|persist| Persist
    Store -->|subscribe| Hub
    Store -->|getUnreadCount()| Badge
```

## Dependencies

- `zustand` + `zustand/middleware` (persist) — State management and persistence
- `secureReadLocal` / `secureWriteLocal` from `../security.js` — Encrypted localStorage adapter

## Data Flow

1. **Publishing**: Subsystems call `useNotificationService.getState().publish({ category, priority, title, subtitle, ... })`.
2. **ID Generation**: Auto-generated as `notif_<random>_<timestamp>`.
3. **Storage**: Notification array persisted to encrypted localStorage under key `studio-notifications-storage-v1`.
4. **Rendering**: Hub UI subscribes to the store and renders notifications as a timeline feed.
5. **Actions**: Interactive buttons (e.g., "Install Now") trigger action handlers that drive Updater or Sync pipelines.

## Lifecycle

| Event                 | Notification Published                                         |
| --------------------- | -------------------------------------------------------------- |
| Update available      | `app_update` — "Update Available" with version info            |
| Download starts       | `ota_update` — "Downloading Update"                            |
| Verification complete | `download_complete` — "Download Verified"                      |
| Install ready         | `install_ready` — "Ready to Install" with "Install Now" action |
| Install failed        | `install_failed` — "Installation Failed"                       |
| User signs in         | `account_event` — "Signed In" with email                       |
| User signs out        | `account_event` — "Signed Out"                                 |
| Sync success          | `sync_event` — "Settings Synced"                               |
| Sync failure          | `sync_event` — "Sync Failed"                                   |

## Public API

### Types

```typescript
type NotificationCategory =
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

type NotificationPriority = 'low' | 'normal' | 'high';

interface NotificationAction {
  label: string;
  actionId: string;
}

interface NotificationItem {
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
```

### Store Actions

| Action                  | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `publish(notification)` | Creates notification with auto-generated ID and timestamp. Prepends to array. |
| `markAsRead(id)`        | Sets `read: true` for matching notification.                                  |
| `markAllAsRead()`       | Sets `read: true` for all notifications.                                      |
| `dismiss(id)`           | Sets `dismissed: true` (soft delete).                                         |
| `clearAll()`            | Empties the notifications array.                                              |
| `getUnreadCount()`      | Returns count where `!read && !dismissed`.                                    |

## Design Decisions

1. **Soft delete via `dismissed`**: Notifications are flagged, not removed, preserving history for debugging.
2. **Encrypted persistence**: Uses the same secure storage adapter as navigation and settings stores.
3. **Prepend ordering**: New notifications are prepended (newest first) for reverse-chronological timeline display.
4. **Category-based icons and colors**: The UI maps each `NotificationCategory` to a Material Symbol icon and accent color.
5. **Decoupled publishers**: Subsystems publish to the store via static `getState()` calls — no coupling between publishers.

## Known Constraints

- No notification deduplication — the same event published twice creates two entries.
- No maximum notification count — the array grows unbounded. Consider pruning old notifications.
- No push notification integration (native OS notifications). This is in-app only.

## Future Improvements

- Automatic pruning of notifications older than 30 days.
- Deduplication by category + relatedFeature within a time window.
- Native push notification bridge via Capacitor Local Notifications plugin.
- Notification grouping by category in the timeline UI.
