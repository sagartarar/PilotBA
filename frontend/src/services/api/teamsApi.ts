/**
 * Teams API Service
 * 
 * Provides API functions for team/workspace management.
 */

import { apiClient } from './client';

// ============================================================================
// TYPES
// ============================================================================

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: TeamRole;
  member_count: number;
}

export interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: TeamRole;
  joined_at: string;
}

export interface CreateTeamRequest {
  name: string;
  description?: string;
}

export interface UpdateTeamRequest {
  name?: string;
  description?: string;
}

export interface InviteUserRequest {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleRequest {
  role: TeamRole;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

export const teamsApi = {
  /**
   * Create a new team
   */
  createTeam: (data: CreateTeamRequest) =>
    apiClient.post<Team>('/teams', data),

  /**
   * List all teams the user belongs to
   */
  listTeams: () =>
    apiClient.get<Team[]>('/teams'),

  /**
   * Get team details
   */
  getTeam: (teamId: string) =>
    apiClient.get<Team>(`/teams/${teamId}`),

  /**
   * Update team details
   */
  updateTeam: (teamId: string, data: UpdateTeamRequest) =>
    apiClient.put<Team>(`/teams/${teamId}`, data),

  /**
   * Delete a team (owner only)
   */
  deleteTeam: (teamId: string) =>
    apiClient.delete(`/teams/${teamId}`),

  /**
   * List team members
   */
  listMembers: (teamId: string) =>
    apiClient.get<TeamMember[]>(`/teams/${teamId}/members`),

  /**
   * Invite a user to the team
   */
  inviteMember: (teamId: string, data: InviteUserRequest) =>
    apiClient.post<TeamMember>(`/teams/${teamId}/members`, data),

  /**
   * Update member role
   */
  updateMemberRole: (teamId: string, userId: string, data: UpdateMemberRoleRequest) =>
    apiClient.put(`/teams/${teamId}/members/${userId}`, data),

  /**
   * Remove a member from the team
   */
  removeMember: (teamId: string, userId: string) =>
    apiClient.delete(`/teams/${teamId}/members/${userId}`),

  /**
   * Leave a team
   */
  leaveTeam: (teamId: string) =>
    apiClient.post(`/teams/${teamId}/leave`),
};

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

/**
 * Check if a role can manage team members
 */
export function canManageMembers(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if a role can manage team settings
 */
export function canManageSettings(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Check if a role can delete the team
 */
export function canDeleteTeam(role: TeamRole): boolean {
  return role === 'owner';
}

/**
 * Check if a role can create content
 */
export function canCreateContent(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/**
 * Check if a role can edit content
 */
export function canEditContent(role: TeamRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'member';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: TeamRole): string {
  const names: Record<TeamRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
    viewer: 'Viewer',
  };
  return names[role];
}

/**
 * Get available roles for assignment (owners can assign any, admins can assign lower)
 */
export function getAssignableRoles(currentUserRole: TeamRole): TeamRole[] {
  if (currentUserRole === 'owner') {
    return ['admin', 'member', 'viewer'];
  }
  if (currentUserRole === 'admin') {
    return ['member', 'viewer'];
  }
  return [];
}

