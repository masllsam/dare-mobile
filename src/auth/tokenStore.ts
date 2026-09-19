import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'dare_auth_token';

/**
 * Token persistence.
 * Native: expo-secure-store (Keychain/Keystore).
 * Web: secure store is unavailable at module scope, so fall back to
 * localStorage (with an in-memory mirror for SSR/prerender safety).
 */
let webMemoryToken: string | null = null;

function webStorage(): Storage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

export async function saveToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = token;
    try {
      webStorage()?.setItem(TOKEN_KEY, token);
    } catch {
      // localStorage unavailable (private mode etc.) — memory only
    }
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return webStorage()?.getItem(TOKEN_KEY) ?? webMemoryToken;
    } catch {
      return webMemoryToken;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  if (Platform.OS === 'web') {
    webMemoryToken = null;
    try {
      webStorage()?.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
