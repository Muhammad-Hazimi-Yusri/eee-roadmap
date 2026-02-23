// src/types/verification.ts
// Types for the topic verification system.

/** The three independently-checkable aspects of a topic. */
export type VerificationAspect = 'content' | 'resources' | 'pedagogy';

export const VERIFICATION_ASPECTS: VerificationAspect[] = [
  'content',
  'resources',
  'pedagogy',
];

/** User roles controlling access to the verifier panel and admin page. */
export type UserRole = 'admin' | 'verifier';

/** A single active verification row from Supabase. */
export interface VerificationRow {
  id: string;
  topic_key: string;           // "trackSlug/topicId"
  aspect: VerificationAspect;
  verified_by: string;         // UUID
  verifier_name: string | null;
  verified_at: string;         // ISO 8601
  revoked_at: string | null;
  revoked_by: string | null;
}

/** A role assignment row from user_roles. */
export interface UserRoleRow {
  id: string;
  user_id: string;
  role: UserRole;
  granted_by: string | null;
  granted_at: string;
}

/** Per-topic verification summary computed client-side from fetched rows. */
export interface TopicVerificationStatus {
  topic_key: string;
  verified_aspects: VerificationAspect[];
  is_fully_verified: boolean;  // verified_aspects.length === 3
  verifications: VerificationRow[];
}

/** Per-section summary for the section header count pill. */
export interface SectionVerificationSummary {
  section_id: string;
  verified_topics: number;   // topics with all 3 aspects verified
  total_topics: number;
}

/** Track-level summary for the roadmaps index page badge. */
export interface TrackVerificationSummary {
  track_slug: string;
  verified_topics: number;
  total_topics: number;
  percent: number;
  is_fully_verified: boolean;  // all topics verified
}
