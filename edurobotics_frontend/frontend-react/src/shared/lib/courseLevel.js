/**
 * Single source of truth for a course level's Spanish label and icon.
 *
 * Colors/gradients differ per view (badge vs pill vs text vs gradient), so each
 * view keeps its own color; the label and icon come from here so no view can
 * drift back to English ("Beginner") or diverge. Spread it and add color:
 *
 *   const LEVEL_CONFIG = {
 *     beginner: { ...COURSE_LEVELS.beginner, color: 'bg-emerald-100 …' },
 *     …
 *   }
 */
import { GraduationCap, Zap, Trophy } from 'lucide-react'

export const COURSE_LEVELS = {
  beginner: { label: 'Principiante', icon: GraduationCap },
  intermediate: { label: 'Intermedio', icon: Zap },
  advanced: { label: 'Avanzado', icon: Trophy },
}

/** Level config for a course, falling back to "beginner" for unknown/empty values. */
export const levelOf = (level) => COURSE_LEVELS[level] || COURSE_LEVELS.beginner
