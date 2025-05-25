import { useState, useEffect } from 'react';

export interface UIPreferences {
  mirrorMode: boolean;
}

const DEFAULT_PREFERENCES: UIPreferences = {
  mirrorMode: true, // Default to mirror mode on (standard for selfie cameras)
};

export const useLocalStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = (newValue: T | ((val: T) => T)) => {
    try {
      const valueToStore = newValue instanceof Function ? newValue(value) : newValue;
      setValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [value, setStoredValue] as const;
};

export const useUIPreferences = () => {
  return useLocalStorage<UIPreferences>('ui-preferences', DEFAULT_PREFERENCES);
}; 