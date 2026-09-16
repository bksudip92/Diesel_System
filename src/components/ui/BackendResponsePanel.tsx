import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { clearApiDebugEntries, useApiDebugEntries, type ApiDebugEntry } from '@/src/lib/api-debug';
import { getApiUrl } from '@/src/lib/env';
import { colors, radius, spacing } from '@/src/theme/tokens';

function formatJson(value: unknown): string {
  if (value === undefined) return '(empty)';
  try {
    return JSON.stringify(value, null, 2) ?? '(empty)';
  } catch {
    return String(value);
  }
}

function statusColor(entry: ApiDebugEntry): string {
  if (entry.status == null) return colors.textMuted;
  if (entry.ok) return colors.success;
  return colors.error;
}

function statusLabel(entry: ApiDebugEntry): string {
  if (entry.status == null) return 'NO RESPONSE';
  return String(entry.status);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleTimeString();
}

function EntryCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: ApiDebugEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const accent = statusColor(entry);
  return (
    <View style={[styles.entry, { borderLeftColor: accent }]}>
      <Pressable onPress={onToggle} style={styles.entryHeader}>
        <View style={styles.entryTitleRow}>
          <Text style={styles.method}>{entry.method}</Text>
          <Text style={styles.path} numberOfLines={1}>
            {entry.path}
          </Text>
        </View>
        <View style={styles.entryMetaRow}>
          <View style={[styles.pill, { backgroundColor: accent }]}>
            <Text style={styles.pillText}>{statusLabel(entry)}</Text>
          </View>
          <Text style={styles.meta}>{entry.durationMs}ms</Text>
          <Text style={styles.meta}>{formatTime(entry.timestamp)}</Text>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
        </View>
      </Pressable>

      {expanded ? (
        <View style={styles.entryBody}>
          {entry.errorCode ? (
            <Text style={styles.errorLine}>
              {entry.errorCode}
              {entry.errorMessage ? ` — ${entry.errorMessage}` : ''}
            </Text>
          ) : null}
          <Text style={styles.sectionLabel}>Request</Text>
          <Text style={styles.json} selectable>
            {formatJson(entry.requestBody)}
          </Text>
          <Text style={styles.sectionLabel}>Response</Text>
          <Text style={styles.json} selectable>
            {formatJson(entry.responseBody)}
          </Text>
          <Text style={styles.url} numberOfLines={2}>
            {entry.url}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/**
 * On-screen backend traffic inspector for debugging.
 *
 * Drop anywhere (currently the login screen): it subscribes to
 * `lib/api-debug.ts` — populated automatically by `apiFetch` — and renders
 * the latest request/response pairs with status, timing, and bodies.
 * Passwords/tokens are redacted at the recording site.
 */
export function BackendResponsePanel() {
  const entries = useApiDebugEntries();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  let baseUrl = '';
  try {
    baseUrl = getApiUrl();
  } catch (e) {
    baseUrl = e instanceof Error ? e.message : 'Invalid API URL';
  }

  const latest = entries[0];

  return (
    <View style={styles.card}>
      <Pressable
        onPress={() => setCollapsed((c) => !c)}
        style={styles.header}
        accessibilityRole="button"
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: latest ? statusColor(latest) : colors.textMuted,
              },
            ]}
          />
          <Text style={styles.title}>
            Backend response{entries.length > 1 ? `s (${entries.length})` : ''}
          </Text>
        </View>
        <Text style={styles.chevron}>{collapsed ? '▸' : '▾'}</Text>
      </Pressable>

      {!collapsed ? (
        <>
          <Text style={styles.baseUrl} numberOfLines={2}>
            API: {baseUrl}
          </Text>

          {entries.length === 0 ? (
            <Text style={styles.empty}>
              No requests yet — tap Login to see the request and backend response here.
            </Text>
          ) : (
            entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId == null ? entry.id === latest?.id : expandedId === entry.id}
                onToggle={() => setExpandedId((cur) => (cur === entry.id ? -1 : entry.id))}
              />
            ))
          )}

          {entries.length > 0 ? (
            <Pressable onPress={clearApiDebugEntries} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  chevron: {
    fontSize: 16,
    color: colors.textMuted,
    fontWeight: '700',
  },
  baseUrl: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  entry: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 4,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  entryHeader: {
    padding: spacing.sm + 4,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  method: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  path: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  entryMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pill: {
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textInverse,
  },
  meta: {
    fontSize: 11,
    color: colors.textMuted,
  },
  entryBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.sm + 4,
  },
  errorLine: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.error,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  json: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontFamily: 'monospace',
  },
  url: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  clearButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
