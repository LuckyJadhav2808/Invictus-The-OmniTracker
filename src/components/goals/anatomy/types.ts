export type MuscleGroup =
  | "chest"
  | "upper-chest"
  | "shoulders"
  | "rear-delts"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "lats"
  | "traps"
  | "lower-back"
  | "neck";

export type MuscleActivationTier = "primary" | "secondary" | "inactive";

export type AnatomyOrientation = "front" | "back";

export interface MuscleHighlightMap {
  primary?: MuscleGroup[];
  secondary?: MuscleGroup[];
}

export interface MuscleMetadata {
  id: MuscleGroup;
  name: string;
  latinName: string;
  defaultOrientation: AnatomyOrientation;
  commonExercises: string[];
}
