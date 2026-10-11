import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';

/**
 * Revive X brand typeface: Inter (SIL Open Font License), loaded once per app
 * through useRevivexFonts(). Components reference faces by family name, so
 * never combine these with fontWeight on iOS.
 */
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Resolves true once the faces are available (or failed to load, so the UI never blocks forever). */
export function useRevivexFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  return loaded || Boolean(error);
}
