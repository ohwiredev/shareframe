/**
 * Internal feature flags configuration.
 */
export interface FeatureFlags {
  /**
   * Internal flag to enable or disable the website metadata import feature.
   * Set to `false` to disable URL metadata extraction and website import modals.
   */
  ENABLE_WEBSITE_IMPORT: boolean;
}

export const FEATURE_FLAGS: FeatureFlags = {
  ENABLE_WEBSITE_IMPORT: import.meta.env.VITE_ENABLE_WEBSITE_IMPORT !== "false",
};

/**
 * Helper function to check if a specific feature is enabled.
 */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return FEATURE_FLAGS[flag];
}
