import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { z } from 'zod';

// Settings schema with vim mode configuration
const SettingsSchema = z.object({
  vimMode: z.boolean().default(false).describe('Enable vim keybindings in the chat input'),
});

export type Settings = z.infer<typeof SettingsSchema>;

// Settings file location in home directory
const SETTINGS_DIR = join(homedir(), '.buster');
const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json');

// Default settings
const DEFAULT_SETTINGS: Settings = {
  vimMode: false,
};

// Ensure the .buster directory exists
function ensureSettingsDir(): void {
  if (!existsSync(SETTINGS_DIR)) {
    mkdirSync(SETTINGS_DIR, { recursive: true });
  }
}

// Load settings from disk
export function loadSettings(): Settings {
  ensureSettingsDir();

  try {
    if (existsSync(SETTINGS_PATH)) {
      const data = readFileSync(SETTINGS_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      return SettingsSchema.parse(parsed);
    }
  } catch (error) {
    console.error('Failed to load settings, using defaults:', error);
  }

  // Return defaults if file doesn't exist or parsing fails
  return DEFAULT_SETTINGS;
}

// Save settings to disk
export function saveSettings(settings: Partial<Settings>): Settings {
  ensureSettingsDir();

  const current = loadSettings();
  const updated = { ...current, ...settings };
  const validated = SettingsSchema.parse(updated);

  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(validated, null, 2));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }

  return validated;
}

// Toggle a boolean setting
export function toggleSetting(key: keyof Settings): Settings {
  const current = loadSettings();
  const currentValue = current[key];

  if (typeof currentValue === 'boolean') {
    return saveSettings({ [key]: !currentValue });
  }

  return current;
}

// Get a single setting value
export function getSetting<K extends keyof Settings>(key: K): Settings[K] {
  const settings = loadSettings();
  return settings[key];
}

// Update a single setting
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Settings {
  return saveSettings({ [key]: value });
}
