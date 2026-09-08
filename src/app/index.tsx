import { Redirect } from 'expo-router';

/**
 * Deterministic entry route: every cold start lands here first, then goes
 * to login. (A group segment like `(auth)` can't be used as the Stack's
 * `initialRouteName` — React Navigation rejects it — so the redirect lives
 * in this index route instead. Authenticated users are bounced to tabs by
 * the AuthGate effect in `_layout.tsx`.)
 */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}
