import { findLogoElement, normalizeState } from "../state/elementUtils";
import type { EditorState } from "../state/types";
import type { OgTemplate, TemplateState } from "./types";

export * from "./types";

/**
 * Dynamically discovers and loads all template definitions from `./definitions/*.json`.
 * Adding a JSON file to `./definitions/` automatically registers it without manual code updates.
 */
const templateModules = import.meta.glob<OgTemplate | { default: OgTemplate }>(
  "./definitions/*.json",
  { eager: true },
);

export const BUILTIN_TEMPLATES: OgTemplate[] = Object.values(templateModules).map((mod) =>
  "default" in mod ? mod.default : mod,
);

/**
 * Applies a template to the current editor state.
 * Normalizes state into elements: [] and merges typography, placement, and background
 * while preserving an existing uploaded logo image unless overridden.
 */
export function applyTemplate(currentState: EditorState, template: OgTemplate): EditorState {
  const normCurrent = normalizeState(currentState);
  const normTemplate = normalizeState(template.state);

  const currentLogo = findLogoElement(normCurrent);
  const existingLogoSrc = currentLogo?.src?.startsWith("data:image/svg+xml")
    ? null
    : (currentLogo?.src ?? null);

  const elements = normTemplate.elements.map((el) => {
    if (el.type === "logo") {
      return {
        ...el,
        src: el.src !== undefined ? el.src : existingLogoSrc,
      };
    }
    return el;
  });

  return {
    templateId: template.id,
    background: template.state.background ?? normCurrent.background,
    safeArea: template.state.safeArea,
    elements,
  };
}

/**
 * Parses and validates a template JSON string.
 */
export function parseTemplateJson(jsonString: string): OgTemplate {
  const data = JSON.parse(jsonString) as Partial<OgTemplate>;

  if (!data || typeof data !== "object") {
    throw new Error("Invalid JSON: Expected an object.");
  }
  if (!data.id || typeof data.id !== "string") {
    throw new Error("Invalid Template JSON: Missing or invalid 'id' field.");
  }
  if (!data.name || typeof data.name !== "string") {
    throw new Error("Invalid Template JSON: Missing or invalid 'name' field.");
  }
  if (!data.state || typeof data.state !== "object") {
    throw new Error("Invalid Template JSON: Missing or invalid 'state' object.");
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "Custom imported template",
    category: data.category ?? "Custom",
    badge: data.badge ?? "Custom",
    state: data.state as TemplateState,
  };
}

/**
 * Serializes the current EditorState into a standardized template JSON string.
 */
export function exportTemplateJson(
  state: EditorState,
  name: string = "Custom Template",
  description: string = "Exported from Shareframe",
): string {
  const normalized = normalizeState(state);
  const template: OgTemplate = {
    id: `custom-${Date.now()}`,
    name,
    description,
    category: "Custom",
    badge: "Custom",
    state: {
      background: normalized.background,
      elements: normalized.elements,
    },
  };

  return JSON.stringify(template, null, 2);
}
