/**
 * Teams Context
 * 
 * Provides team/workspace state management for the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { teamsApi, Team, TeamMember, TeamRole, CreateTeamRequest } from '../services/api/teamsApi';
import { useAuth } from './AuthContext';

// ============================================================================
// TYPES
// ============================================================================

interface TeamsContextType {
  teams: Team[];
  currentTeam: Team | null;
  members: TeamMember[];
  isLoading: boolean;
  error: string | null;
  
  // Team operations
  loadTeams: () => Promise<void>;
  selectTeam: (teamId: string | null) => Promise<void>;
  createTeam: (data: CreateTeamRequest) => Promise<Team>;
  updateTeam: (teamId: string, data: Partial<CreateTeamRequest>) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  
  // Member operations
  loadMembers: (teamId: string) => Promise<void>;
  inviteMember: (email: string, role: TeamRole) => Promise<void>;
  updateMemberRole: (userId: string, role: TeamRole) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TeamsContext = createContext<TeamsContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load teams when authenticated
  const loadTeams = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await teamsApi.listTeams();
      setTeams(response.data);
      
      // Restore previously selected team if still valid
      const savedTeamId = localStorage.getItem('current_team_id');
      if (savedTeamId) {
        const team = response.data.find(t => t.id === savedTeamId);
        if (team) {
          setCurrentTeam(team);
        }
      }
    } catch (err) {
      setError('Failed to load teams');
      console.error('Error loading teams:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load teams on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadTeams();
    } else {
      setTeams([]);
      setCurrentTeam(null);
      setMembers([]);
    }
  }, [isAuthenticated, loadTeams]);

  // Select a team
  const selectTeam = useCallback(async (teamId: string | null) => {
    if (!teamId) {
      setCurrentTeam(null);
      setMembers([]);
      localStorage.removeItem('current_team_id');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await teamsApi.getTeam(teamId);
      setCurrentTeam(response.data);
      localStorage.setItem('current_team_id', teamId);
      
      // Also load members
      const membersResponse = await teamsApi.listMembers(teamId);
      setMembers(membersResponse.data);
    } catch (err) {
      setError('Failed to load team');
      console.error('Error loading team:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new team
  const createTeam = useCallback(async (data: CreateTeamRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamsApi.createTeam(data);
      const newTeam = response.data;
      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    } catch (err) {
      setError('Failed to create team');
      console.error('Error creating team:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update team
  const updateTeam = useCallback(async (teamId: string, data: Partial<CreateTeamRequest>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamsApi.updateTeam(teamId, data);
      const updatedTeam = response.data;
      
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
      
      if (currentTeam?.id === teamId) {
        setCurrentTeam(updatedTeam);
      }
    } catch (err) {
      setError('Failed to update team');
      console.error('Error updating team:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  // Delete team
  const deleteTeam = useCallback(async (teamId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await teamsApi.deleteTeam(teamId);
      setTeams(prev => prev.filter(t => t.id !== teamId));
      
      if (currentTeam?.id === teamId) {
        setCurrentTeam(null);
        setMembers([]);
        localStorage.removeItem('current_team_id');
      }
    } catch (err) {
      setError('Failed to delete team');
      console.error('Error deleting team:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  // Load members
  const loadMembers = useCallback(async (teamId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamsApi.listMembers(teamId);
      setMembers(response.data);
    } catch (err) {
      setError('Failed to load members');
      console.error('Error loading members:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Invite member
  const inviteMember = useCallback(async (email: string, role: TeamRole) => {
    if (!currentTeam) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await teamsApi.inviteMember(currentTeam.id, { email, role });
      setMembers(prev => [...prev, response.data]);
      
      // Update member count
      setTeams(prev => prev.map(t => 
        t.id === currentTeam.id 
          ? { ...t, member_count: t.member_count + 1 }
          : t
      ));
      setCurrentTeam(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null);
    } catch (err) {
      setError('Failed to invite member');
      console.error('Error inviting member:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  // Update member role
  const updateMemberRole = useCallback(async (userId: string, role: TeamRole) => {
    if (!currentTeam) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await teamsApi.updateMemberRole(currentTeam.id, userId, { role });
      setMembers(prev => prev.map(m => 
        m.user_id === userId ? { ...m, role } : m
      ));
    } catch (err) {
      setError('Failed to update member role');
      console.error('Error updating member role:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  // Remove member
  const removeMember = useCallback(async (userId: string) => {
    if (!currentTeam) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await teamsApi.removeMember(currentTeam.id, userId);
      setMembers(prev => prev.filter(m => m.user_id !== userId));
      
      // Update member count
      setTeams(prev => prev.map(t => 
        t.id === currentTeam.id 
          ? { ...t, member_count: Math.max(0, t.member_count - 1) }
          : t
      ));
      setCurrentTeam(prev => prev ? { ...prev, member_count: Math.max(0, prev.member_count - 1) } : null);
    } catch (err) {
      setError('Failed to remove member');
      console.error('Error removing member:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  // Leave team
  const leaveTeam = useCallback(async () => {
    if (!currentTeam) return;
    
    setIsLoading(true);
    setError(null);

    try {
      await teamsApi.leaveTeam(currentTeam.id);
      setTeams(prev => prev.filter(t => t.id !== currentTeam.id));
      setCurrentTeam(null);
      setMembers([]);
      localStorage.removeItem('current_team_id');
    } catch (err) {
      setError('Failed to leave team');
      console.error('Error leaving team:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTeam]);

  return (
    <TeamsContext.Provider value={{
      teams,
      currentTeam,
      members,
      isLoading,
      error,
      loadTeams,
      selectTeam,
      createTeam,
      updateTeam,
      deleteTeam,
      loadMembers,
      inviteMember,
      updateMemberRole,
      removeMember,
      leaveTeam,
    }}>
      {children}
    </TeamsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTeams() {
  const context = useContext(TeamsContext);
  if (!context) {
    throw new Error('useTeams must be used within TeamsProvider');
  }
  return context;
}

