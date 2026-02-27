/**
 * Settings Profiles & Templates
 * Pre-configured setting profiles with import/export functionality
 */

import { useState, useEffect } from "react";
import { useActiveTenant } from "../lib/activeTenant";
import { API_BASE } from "../lib/api";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";
import { 
  User, 
  Shield, 
  Code, 
  Briefcase, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle, 
  AlertTriangle,
  Settings,
  Save,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";

interface SettingsProfile {
  id: string;
  name: string;
  description: string;
  category: 'system' | 'custom';
  icon: string;
  settings: {
    atlas_agent: any;
    integrations: any;
    security: any;
    performance: any;
  };
  created_at?: string;
  updated_at?: string;
}

const BUILTIN_PROFILES: SettingsProfile[] = [
  {
    id: 'developer',
    name: 'Developer',
    description: 'Debug mode, verbose logging, maximum automation',
    category: 'system',
    icon: 'code',
    settings: {
      atlas_agent: {
        voice: { enabled: true, speed: 1.2, voice_id: 'alloy' },
        personality: { tone: 'collaborative', formality: 'casual', response_style: 'concise' },
        memory: { retention_hours: 48, context_window: 20, auto_cleanup: true },
        orchestration: { auto_delegate: true, approval_threshold: 'low', escalation_enabled: false },
        compliance: { audit_level: 'minimal', human_in_loop: false, risk_sensitivity: 'low' },
      },
      integrations: {
        auto_connect: true,
        debug_mode: true,
        verbose_logging: true,
        test_mode: true,
      },
      security: {
        two_factor_required: false,
        session_timeout: 7200,
        api_key_rotation: false,
      },
      performance: {
        cache_enabled: true,
        compression_enabled: true,
        monitoring_level: 'verbose',
      },
    },
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'High-level summaries, voice enabled, strategic oversight',
    category: 'system',
    icon: 'briefcase',
    settings: {
      atlas_agent: {
        voice: { enabled: true, speed: 0.9, voice_id: 'onyx' },
        personality: { tone: 'strategic', formality: 'formal', response_style: 'detailed' },
        memory: { retention_hours: 72, context_window: 15, auto_cleanup: false },
        orchestration: { auto_delegate: true, approval_threshold: 'high', escalation_enabled: true },
        compliance: { audit_level: 'comprehensive', human_in_loop: true, risk_sensitivity: 'medium' },
      },
      integrations: {
        auto_connect: false,
        debug_mode: false,
        verbose_logging: false,
        test_mode: false,
      },
      security: {
        two_factor_required: true,
        session_timeout: 3600,
        api_key_rotation: true,
      },
      performance: {
        cache_enabled: true,
        compression_enabled: true,
        monitoring_level: 'standard',
      },
    },
  },
  {
    id: 'compliance',
    name: 'Compliance',
    description: 'Maximum audit, human approval, enterprise security',
    category: 'system',
    icon: 'shield',
    settings: {
      atlas_agent: {
        voice: { enabled: false, speed: 1.0, voice_id: 'alloy' },
        personality: { tone: 'professional', formality: 'formal', response_style: 'detailed' },
        memory: { retention_hours: 365, context_window: 5, auto_cleanup: false },
        orchestration: { auto_delegate: false, approval_threshold: 'high', escalation_enabled: true },
        compliance: { audit_level: 'comprehensive', human_in_loop: true, risk_sensitivity: 'high' },
      },
      integrations: {
        auto_connect: false,
        debug_mode: false,
        verbose_logging: true,
        test_mode: false,
      },
      security: {
        two_factor_required: true,
        session_timeout: 1800,
        api_key_rotation: true,
      },
      performance: {
        cache_enabled: false,
        compression_enabled: true,
        monitoring_level: 'comprehensive',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Basic functionality, minimal overhead',
    category: 'system',
    icon: 'user',
    settings: {
      atlas_agent: {
        voice: { enabled: false, speed: 1.0, voice_id: 'alloy' },
        personality: { tone: 'professional', formality: 'casual', response_style: 'concise' },
        memory: { retention_hours: 12, context_window: 5, auto_cleanup: true },
        orchestration: { auto_delegate: false, approval_threshold: 'high', escalation_enabled: false },
        compliance: { audit_level: 'minimal', human_in_loop: true, risk_sensitivity: 'medium' },
      },
      integrations: {
        auto_connect: false,
        debug_mode: false,
        verbose_logging: false,
        test_mode: false,
      },
      security: {
        two_factor_required: false,
        session_timeout: 14400,
        api_key_rotation: false,
      },
      performance: {
        cache_enabled: true,
        compression_enabled: false,
        monitoring_level: 'minimal',
      },
    },
  },
];

export default function SettingsProfiles() {
  const { tenantId } = useActiveTenant();
  const [profiles, setProfiles] = useState<SettingsProfile[]>(BUILTIN_PROFILES);
  const [customProfiles, setCustomProfiles] = useState<SettingsProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<SettingsProfile | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    settings: '',
  });

  useEffect(() => {
    loadCustomProfiles();
  }, [tenantId]);

  const loadCustomProfiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/settings/profiles`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setCustomProfiles(data.profiles || []);
        }
      }
    } catch (error) {
      console.error('Failed to load custom profiles:', error);
    }
  };

  const applyProfile = async (profile: SettingsProfile) => {
    setIsApplying(true);
    try {
      const response = await fetch(`${API_BASE}/v1/settings/apply-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({ profile_id: profile.id, settings: profile.settings }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success(`Applied ${profile.name} profile successfully`);
          setSelectedProfile(profile);
        } else {
          toast.error('Failed to apply profile');
        }
      } else {
        toast.error('Failed to apply profile');
      }
    } catch (error) {
      console.error('Failed to apply profile:', error);
      toast.error('Failed to apply profile');
    } finally {
      setIsApplying(false);
    }
  };

  const createCustomProfile = async () => {
    if (!newProfile.name || !newProfile.description || !newProfile.settings) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsCreating(true);
    try {
      let settings;
      try {
        settings = JSON.parse(newProfile.settings);
      } catch (error) {
        toast.error('Invalid JSON in settings');
        setIsCreating(false);
        return;
      }

      const response = await fetch(`${API_BASE}/v1/settings/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          name: newProfile.name,
          description: newProfile.description,
          category: 'custom',
          icon: 'settings',
          settings,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Custom profile created successfully');
          setNewProfile({ name: '', description: '', settings: '' });
          loadCustomProfiles();
        } else {
          toast.error('Failed to create profile');
        }
      } else {
        toast.error('Failed to create profile');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error('Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCustomProfile = async (profileId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/settings/profiles/${profileId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Profile deleted successfully');
          loadCustomProfiles();
        } else {
          toast.error('Failed to delete profile');
        }
      } else {
        toast.error('Failed to delete profile');
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const exportProfile = (profile: SettingsProfile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${profile.name}-profile.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Profile exported successfully');
  };

  const importProfile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const profile = JSON.parse(e.target?.result as string);
        
        // Validate profile structure
        if (!profile.name || !profile.description || !profile.settings) {
          toast.error('Invalid profile format');
          return;
        }

        // Create as custom profile
        const response = await fetch(`${API_BASE}/v1/settings/profiles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId || '',
          },
          body: JSON.stringify({
            ...profile,
            category: 'custom',
            icon: 'settings',
            id: `custom-${Date.now()}`,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.ok) {
            toast.success('Profile imported successfully');
            loadCustomProfiles();
          } else {
            toast.error('Failed to import profile');
          }
        } else {
          toast.error('Failed to import profile');
        }
      } catch (error) {
        console.error('Failed to import profile:', error);
        toast.error('Failed to import profile');
      }
    };
    reader.readAsText(file);
  };

  const getProfileIcon = (iconName: string) => {
    switch (iconName) {
      case 'code': return Code;
      case 'briefcase': return Briefcase;
      case 'shield': return Shield;
      case 'user': return User;
      case 'settings': return Settings;
      default: return Settings;
    }
  };

  const allProfiles = [...BUILTIN_PROFILES, ...customProfiles];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            Settings Profiles
          </h2>
          <p className="text-slate-400">Pre-configured settings templates and custom profiles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".json"
            onChange={importProfile}
            className="hidden"
            id="profile-import"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('profile-import')?.click()}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Current Profile */}
      {selectedProfile && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                {(() => {
                  const Icon = getProfileIcon(selectedProfile.icon);
                  return <Icon className="w-5 h-5 text-cyan-400" />;
                })()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedProfile.name}</h3>
                <p className="text-sm text-slate-400">{selectedProfile.description}</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </div>
        </Card>
      )}

      {/* System Profiles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Profiles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BUILTIN_PROFILES.map((profile) => {
            const Icon = getProfileIcon(profile.icon);
            const isActive = selectedProfile?.id === profile.id;
            
            return (
              <Card 
                key={profile.id} 
                className={`bg-slate-900/50 border-cyan-500/20 p-6 cursor-pointer transition-all hover:bg-slate-800/50 ${
                  isActive ? 'ring-2 ring-cyan-500' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{profile.name}</h4>
                      <p className="text-sm text-slate-400">{profile.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    System
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => applyProfile(profile)}
                    disabled={isApplying || isActive}
                    className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
                  >
                    {isActive ? 'Active' : 'Apply'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportProfile(profile)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Profiles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            Custom Profiles
          </h3>
          <Button
            onClick={() => setNewProfile({ name: '', description: '', settings: '' })}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Profile
          </Button>
        </div>

        {customProfiles.length === 0 ? (
          <Card className="bg-slate-900/50 border-cyan-500/20 p-12 text-center">
            <Settings className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Custom Profiles</h3>
            <p className="text-slate-400 mb-4">Create custom profiles to save your preferred settings</p>
            <Button
              onClick={() => setNewProfile({ name: '', description: '', settings: '' })}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Profile
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customProfiles.map((profile) => {
              const Icon = getProfileIcon(profile.icon);
              const isActive = selectedProfile?.id === profile.id;
              
              return (
                <Card 
                  key={profile.id} 
                  className={`bg-slate-900/50 border-cyan-500/20 p-6 cursor-pointer transition-all hover:bg-slate-800/50 ${
                    isActive ? 'ring-2 ring-cyan-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white">{profile.name}</h4>
                        <p className="text-sm text-slate-400">{profile.description}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Created {new Date(profile.created_at || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                      Custom
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={() => applyProfile(profile)}
                      disabled={isApplying || isActive}
                      className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50"
                    >
                      {isActive ? 'Active' : 'Apply'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportProfile(profile)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteCustomProfile(profile.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Profile Modal */}
      {newProfile.name !== '' && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Create Custom Profile</h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Profile Name</Label>
              <Input
                value={newProfile.name}
                onChange={(e) => setNewProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter profile name"
                className="bg-slate-800 border-slate-600"
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">Description</Label>
              <Textarea
                value={newProfile.description}
                onChange={(e) => setNewProfile(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this profile"
                className="bg-slate-800 border-slate-600"
                rows={3}
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">Settings (JSON)</Label>
              <Textarea
                value={newProfile.settings}
                onChange={(e) => setNewProfile(prev => ({ ...prev, settings: e.target.value }))}
                placeholder='{"atlas_agent": {"voice": {"enabled": true}}}'
                className="bg-slate-800 border-slate-600 font-mono text-sm"
                rows={10}
              />
              <p className="text-xs text-slate-400 mt-1">
                Enter settings as JSON format. Use current settings as reference.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={createCustomProfile}
                disabled={isCreating || !newProfile.name || !newProfile.description || !newProfile.settings}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isCreating ? 'Creating...' : 'Create Profile'}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setNewProfile({ name: '', description: '', settings: '' })}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
