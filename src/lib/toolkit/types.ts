// src/lib/toolkit/types.ts
// Schema for /toolkit/ recipes — copy-paste-ready snippets for power-systems
// consulting tasks (plotting, Excel/Word automation, VBA).

export type RecipeCategory = 'plotting' | 'excel' | 'word' | 'vba' | 'workflow';
export type RecipeLanguage = 'python' | 'vba' | 'powerquery' | 'shell';
export type RecipeDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type RecipeBlock =
  | { type: 'prose'; text: string }
  | { type: 'code'; language: RecipeLanguage; filename?: string; text: string }
  | { type: 'note'; kind?: 'tip' | 'warn' | 'gotcha'; text: string };

export interface Recipe {
  id: string;
  title: string;
  category: RecipeCategory;
  language: RecipeLanguage;
  difficulty: RecipeDifficulty;
  /** One-paragraph elevator pitch. */
  description: string;
  /** Short tags for filtering. */
  tags: string[];
  /** Optional package dependencies (pip / VBA references / etc.). */
  deps?: string[];
  /** Body of the recipe — alternating prose and code blocks. */
  blocks: RecipeBlock[];
  /** Optional related lab links. */
  relatedLabs?: { id: string; label: string }[];
}
