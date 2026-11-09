import { Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Android is always edge-to-edge, but some devices report a 0 top inset while
// still drawing the app under the status bar, so fall back to its real height.
export const useTopInset = () => {
  const { top } = useSafeAreaInsets();
  return Platform.OS === 'android' ? Math.max(top, StatusBar.currentHeight ?? 0) : top;
};
