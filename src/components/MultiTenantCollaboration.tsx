/**
 * Multi-Tenant Collaboration
 * Team management, roles, shared workflows, and collaboration spaces
 */

import { useState, useEffect } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Users, 
  UserPlus, 
  Settings, 
  Shield, 
  Crown, 
  Eye, 
  Edit, 
  Trash2, 
  Mail, 
  Calendar, 
  Activity, 
  FolderOpen, 
  Share2, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Copy,
  Download,
  Upload,
  MessageSquare,
  Zap,
  Database,
  BarChart,
  Clock,
  TrendingUp,
  Save
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  avatar?: string;
  status: 'active' | 'pending' | 'inactive';
  last_active: string;
  permissions: string[];
  joined_at: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  slug: string;
  owner_id: string;
  members: TeamMember[];
  settings: {
    allow_invites: boolean;
    require_approval: boolean;
    default_role: 'editor' | 'viewer';
    max_members: number;
  };
  created_at: string;
  updated_at: string;
}

interface SharedWorkflow {
  id: string;
  name: string;
  description: string;
  team_id: string;
  created_by: string;
  shared_with: string[];
  permissions: 'read' | 'write' | 'admin';
  created_at: string;
  updated_at: string;
}

interface CollaborationSpace {
  id: string;
  name: string;
  type: 'project' | 'workspace' | 'knowledge_base';
  team_id: string;
  members: string[];
  content: any;
  settings: {
    is_public: boolean;
    allow_comments: boolean;
    version_control: boolean;
  };
  created_at: string;
  updated_at: string;
}

const ROLE_PERMISSIONS = {
  owner: ['read', 'write', 'delete', 'admin', 'invite', 'billing'],
  admin: ['read', 'write', 'delete', 'admin', 'invite'],
  editor: ['read', 'write'],
  viewer: ['read'],
};

const ROLE_COLORS = {
  owner: 'bg-yellow-500/20 text-yellow-300',
  admin: 'bg-red-500/20 text-red-300',
  editor: 'bg-blue-500/20 text-blue-300',
  viewer: 'bg-gray-500/20 text-gray-300',
};

export default function MultiTenantCollaboration() {
  const { tenantId } = useActiveTenant();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sharedWorkflows, setSharedWorkflows] = useState<SharedWorkflow[]>([]);
  const [collaborationSpaces, setCollaborationSpaces] = useState<CollaborationSpace[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('teams');

  useEffect(() => {
    loadTeams();
  }, [tenantId]);

  useEffect(() => {
    if (selectedTeam) {
      loadTeamMembers(selectedTeam.id);
      loadSharedWorkflows(selectedTeam.id);
      loadCollaborationSpaces(selectedTeam.id);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/teams`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setTeams(data.teams || []);
          if (data.teams?.length > 0 && !selectedTeam) {
            setSelectedTeam(data.teams[0]);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    }
  };

  const loadTeamMembers = async (teamId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/teams/${teamId}/members`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setTeamMembers(data.members || []);
        }
      }
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  const loadSharedWorkflows = async (teamId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/teams/${teamId}/workflows`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setSharedWorkflows(data.workflows || []);
        }
      }
    } catch (error) {
      console.error('Failed to load shared workflows:', error);
    }
  };

  const loadCollaborationSpaces = async (teamId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/teams/${teamId}/spaces`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setCollaborationSpaces(data.spaces || []);
        }
      }
    } catch (error) {
      console.error('Failed to load collaboration spaces:', error);
    }
  };

  const inviteMember = async () => {
    if (!inviteEmail || !selectedTeam) return;

    setIsInviting(true);
    try {
      const response = await fetch(`${API_BASE}/v1/teams/${selectedTeam.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Invitation sent successfully');
          setInviteEmail('');
          loadTeamMembers(selectedTeam.id);
        } else {
          toast.error('Failed to send invitation');
        }
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to invite member:', error);
      toast.error('Failed to invite member');
    } finally {
      setIsInviting(false);
    }
  };

  const updateMemberRole = async (memberId: string, newRole: TeamMember['role']) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`${API_BASE}/v1/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Member role updated');
          loadTeamMembers(selectedTeam.id);
        } else {
          toast.error('Failed to update role');
        }
      } else {
        toast.error('Failed to update role');
      }
    } catch (error) {
      console.error('Failed to update member role:', error);
      toast.error('Failed to update role');
    }
  };

  const removeMember = async (memberId: string) => {
    if (!selectedTeam) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`${API_BASE}/v1/teams/${selectedTeam.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Member removed successfully');
          loadTeamMembers(selectedTeam.id);
        } else {
          toast.error('Failed to remove member');
        }
      } else {
        toast.error('Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  const createTeam = async () => {
    const teamName = prompt('Enter team name:');
    if (!teamName) return;

    try {
      const response = await fetch(`${API_BASE}/v1/teams`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          name: teamName,
          description: `Team for ${teamName}`,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Team created successfully');
          loadTeams();
        } else {
          toast.error('Failed to create team');
        }
      } else {
        toast.error('Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      toast.error('Failed to create team');
    }
  };

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            Team Collaboration
          </h2>
          <p className="text-slate-400">Manage teams, members, and shared workflows</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={createTeam}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Team Selector */}
      {teams.length > 0 && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Select Team</h3>
            <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
              {teams.length} teams
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedTeam?.id === team.id
                    ? 'bg-cyan-500/10 border-cyan-500'
                    : 'bg-slate-800/30 border-slate-600 hover:bg-slate-800/50'
                }`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium">{team.name}</h4>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 text-xs">
                    {team.members.length} members
                  </Badge>
                </div>
                <p className="text-sm text-slate-400 mb-3">{team.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  Created {new Date(team.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {selectedTeam && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="members" className="data-[state=active]:bg-cyan-600">
              <Users className="w-4 h-4 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="workflows" className="data-[state=active]:bg-cyan-600">
              <Zap className="w-4 h-4 mr-2" />
              Workflows
            </TabsTrigger>
            <TabsTrigger value="spaces" className="data-[state=active]:bg-cyan-600">
              <FolderOpen className="w-4 h-4 mr-2" />
              Spaces
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-cyan-600">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Team Members</h3>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-slate-800 border-slate-600 pl-10 w-64"
                    />
                  </div>
                  <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                    {teamMembers.length} members
                  </Badge>
                </div>
              </div>

              {/* Invite Member */}
              <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-600 mb-6">
                <h4 className="text-white font-medium mb-3">Invite New Member</h4>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Email address"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 flex-1"
                  />
                  <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={inviteMember}
                    disabled={isInviting || !inviteEmail}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isInviting ? 'Inviting...' : 'Invite'}
                  </Button>
                </div>
              </div>

              {/* Members List */}
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-cyan-500/20 text-cyan-300">
                          {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-medium">{member.name}</h4>
                          <Badge className={ROLE_COLORS[member.role]}>
                            {member.role}
                          </Badge>
                          {member.status === 'pending' && (
                            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-300">
                              Pending
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{member.email}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          Last active {new Date(member.last_active).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value: any) => updateMemberRole(member.id, value)}
                        disabled={member.role === 'owner'}
                      >
                        <SelectTrigger className="bg-slate-700 border-slate-600 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {member.role !== 'owner' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeMember(member.id)}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Workflows Tab */}
          <TabsContent value="workflows" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Shared Workflows</h3>
                <Button
                  onClick={() => {
                    // TODO: Open workflow sharing modal
                    toast.info('Workflow sharing coming soon');
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Workflow
                </Button>
              </div>

              {sharedWorkflows.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Shared Workflows</h4>
                  <p className="text-slate-400 mb-4">Share workflows with your team members</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sharedWorkflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{workflow.name}</h4>
                        <p className="text-sm text-slate-400 mb-2">{workflow.description}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            Shared with {workflow.shared_with.length} members
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Updated {new Date(workflow.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                          {workflow.permissions}
                        </Badge>
                        <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Spaces Tab */}
          <TabsContent value="spaces" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Collaboration Spaces</h3>
                <Button
                  onClick={() => {
                    // TODO: Open space creation modal
                    toast.info('Space creation coming soon');
                  }}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Space
                </Button>
              </div>

              {collaborationSpaces.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">No Collaboration Spaces</h4>
                  <p className="text-slate-400 mb-4">Create spaces for team collaboration</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {collaborationSpaces.map((space) => (
                    <div
                      key={space.id}
                      className="p-4 bg-slate-800/30 rounded-lg border border-slate-600 cursor-pointer hover:bg-slate-800/50"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-white font-medium">{space.name}</h4>
                        <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                          {space.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-400 mb-3">
                        {space.members.length} members • {space.settings.is_public ? 'Public' : 'Private'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Updated {new Date(space.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Team Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <Label className="text-white font-medium">Team Name</Label>
                  <Input
                    value={selectedTeam.name}
                    onChange={(e) => {
                      // TODO: Update team name
                      toast.info('Team name update coming soon');
                    }}
                    className="bg-slate-800 border-slate-600 mt-2"
                  />
                </div>

                <div>
                  <Label className="text-white font-medium">Description</Label>
                  <Textarea
                    value={selectedTeam.description}
                    onChange={(e) => {
                      // TODO: Update team description
                      toast.info('Team description update coming soon');
                    }}
                    className="bg-slate-800 border-slate-600 mt-2"
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-medium">Team Policies</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div>
                      <p className="text-white font-medium">Allow Member Invites</p>
                      <p className="text-sm text-slate-400">Members can invite others to the team</p>
                    </div>
                    <div className="w-12 h-6 bg-cyan-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div>
                      <p className="text-white font-medium">Require Approval</p>
                      <p className="text-sm text-slate-400">New members require admin approval</p>
                    </div>
                    <div className="w-12 h-6 bg-slate-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600">
                    <div>
                      <p className="text-white font-medium">Default Role</p>
                      <p className="text-sm text-slate-400">Role assigned to new members</p>
                    </div>
                    <Select defaultValue="editor">
                      <SelectTrigger className="bg-slate-700 border-slate-600 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="editor">Editor</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-600">
                  <Button className="bg-cyan-600 hover:bg-cyan-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!teams.length && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-12 text-center">
          <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Teams Yet</h3>
          <p className="text-slate-400 mb-4">Create your first team to start collaborating</p>
          <Button
            onClick={createTeam}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </Card>
      )}
    </div>
  );
}
