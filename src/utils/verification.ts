// src/utils/verification.ts
// Fetch and mutate verification data via Supabase.
// All functions guard on isSupabaseConfigured, mirroring the pattern in src/lib/sync.ts.

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getCurrentUserId } from '../lib/sync';
import {
  VERIFICATION_ASPECTS,
  type VerificationAspect,
  type VerificationRow,
  type UserRole,
  type UserRoleRow,
  type TopicVerificationStatus,
  type SectionVerificationSummary,
  type TrackVerificationSummary,
} from '../types/verification';

// ============================================================
// ROLE QUERIES
// ============================================================

/** Returns the current user's roles, or [] if unauthenticated or Supabase unavailable. */
async function getCurrentUserRoles(): Promise<UserRole[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error || !data) return [];
  return data.map((r: { role: string }) => r.role as UserRole);
}

/** Returns true if the current user has the given role. */
export async function currentUserHasRole(role: UserRole): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes(role);
}

// ============================================================
// VERIFICATION FETCH
// ============================================================

/**
 * Fetch all active (non-revoked) verifications for topics in a track.
 * Uses LIKE prefix to avoid fetching other tracks' data.
 */
export async function fetchTrackVerifications(
  trackSlug: string
): Promise<VerificationRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .like('topic_key', `${trackSlug}/%`)
    .is('revoked_at', null);

  if (error || !data) return [];
  return data as VerificationRow[];
}

// ============================================================
// STATUS COMPUTATION (pure functions — no DB calls)
// ============================================================

/** Build a TopicVerificationStatus from a flat list of track rows. */
export function buildTopicStatus(
  topicKey: string,
  allRows: VerificationRow[]
): TopicVerificationStatus {
  const verifications = allRows.filter(r => r.topic_key === topicKey);
  const verified_aspects = verifications.map(r => r.aspect);
  return {
    topic_key: topicKey,
    verified_aspects,
    is_fully_verified: verified_aspects.length === VERIFICATION_ASPECTS.length,
    verifications,
  };
}

/** Compute per-section summaries. sections must provide id + items[].id. */
export function buildSectionSummaries(
  trackSlug: string,
  sections: { id: string; items: { id: string }[] }[],
  allRows: VerificationRow[]
): SectionVerificationSummary[] {
  return sections.map(section => {
    let verified_topics = 0;
    for (const item of section.items) {
      const status = buildTopicStatus(`${trackSlug}/${item.id}`, allRows);
      if (status.is_fully_verified) verified_topics++;
    }
    return { section_id: section.id, verified_topics, total_topics: section.items.length };
  });
}

/** Compute track-level summary. */
export function buildTrackSummary(
  trackSlug: string,
  sections: { id: string; items: { id: string }[] }[],
  allRows: VerificationRow[]
): TrackVerificationSummary {
  let verified_topics = 0;
  let total_topics = 0;
  for (const section of sections) {
    for (const item of section.items) {
      const status = buildTopicStatus(`${trackSlug}/${item.id}`, allRows);
      total_topics++;
      if (status.is_fully_verified) verified_topics++;
    }
  }
  return {
    track_slug: trackSlug,
    verified_topics,
    total_topics,
    percent: total_topics > 0 ? Math.round((verified_topics / total_topics) * 100) : 0,
    is_fully_verified: total_topics > 0 && verified_topics === total_topics,
  };
}

// ============================================================
// VERIFICATION MUTATIONS
// ============================================================

/**
 * Verify a specific aspect of a topic.
 * The partial unique index in the DB prevents duplicate active verifications.
 * Returns the inserted row, or null on error (e.g. already verified, no permission).
 */
export async function verifyAspect(
  topicKey: string,
  aspect: VerificationAspect,
  verifierName: string
): Promise<VerificationRow | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('verifications')
    .insert({ topic_key: topicKey, aspect, verified_by: userId, verifier_name: verifierName })
    .select()
    .single();

  if (error) {
    console.error('verifyAspect error:', error.message);
    return null;
  }
  return data as VerificationRow;
}

/**
 * Revoke a verification by setting revoked_at.
 * Admin-only (enforced by RLS, not client-side).
 */
export async function revokeVerification(verificationId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const userId = await getCurrentUserId();
  if (!userId) return false;

  const { error } = await supabase
    .from('verifications')
    .update({ revoked_at: new Date().toISOString(), revoked_by: userId })
    .eq('id', verificationId);

  return !error;
}

// ============================================================
// ADMIN: ROLE MANAGEMENT
// ============================================================

/** List all role assignments. Admin-only (RLS enforces). */
export async function listAllRoles(): Promise<UserRoleRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .order('granted_at', { ascending: false });

  if (error || !data) return [];
  return data as UserRoleRow[];
}

/** Grant a role to a user. Admin-only (RLS enforces). */
export async function grantRole(targetUserId: string, role: UserRole): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  const granterId = await getCurrentUserId();
  if (!granterId) return false;

  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: targetUserId, role, granted_by: granterId });

  return !error;
}

/** Revoke a role by deleting the role row. Admin-only (RLS enforces). */
export async function revokeRole(roleRowId: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;

  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('id', roleRowId);

  return !error;
}
