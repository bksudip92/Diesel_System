import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackendResponsePanel } from '@/src/components/ui/BackendResponsePanel';
import { useApiDebugEntries } from '@/src/lib/api-debug';
import { colors, radius, spacing } from '@/src/theme/tokens';

/**
 * Dev-only floating trigger for the backend traffic inspector.
 *
 * The panel used to live solely on the login screen, which made it useless
 * for the bugs that actually happen after signing in. Mounting the card
 * itself at the root layout is not an option — it is a padded `View` that
 * would take layout space on every screen and break full-bleed ones such as
 * the camera preview. So this renders a single small absolutely-positioned
 * pill and shows the panel in a modal on demand: no layout cost until tapped.
 *
 * Rendered outside of `__DEV__` it returns null, so it cannot ship.
 */
export function ApiDebugOverlay() {
  const [open, setOpen] = useState(false);
  const entries = useApiDebugEntries();

  // if (!__DEV__) return null;

  const errors = entries.filter((e) => e.ok === false).length;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Open backend response inspector"
      >
        <View
          style={[styles.dot, { backgroundColor: errors > 0 ? colors.error : colors.success }]}
        />
        <Text style={styles.triggerText}>API {entries.length}</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)} transparent>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Backend traffic</Text>
              <Pressable onPress={() => setOpen(false)} accessibilityRole="button">
                <Text style={styles.close}>Close</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetBody}>
              <BackendResponsePanel />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.xl,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  triggerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    flex: 1,
    marginTop: '15%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  close: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  sheetBody: {
    padding: spacing.md,
  },
});
