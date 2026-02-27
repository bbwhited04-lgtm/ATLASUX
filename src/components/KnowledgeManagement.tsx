/**
 * Knowledge Base Management
 * Document upload, AI training, search, and versioning
 */

import { useState, useEffect, useRef } from "react";
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
import { Separator } from "./ui/separator";
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  Download, 
  Trash2, 
  Eye, 
  Edit, 
  Copy, 
  History, 
  Brain, 
  BookOpen, 
  Tag, 
  Calendar, 
  User, 
  Filter,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap
} from "lucide-react";
import { toast } from "sonner";

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  created_at: string;
  updated_at: string;
  version: number;
  status: 'active' | 'draft' | 'archived';
  metadata: {
    word_count: number;
    reading_time: number;
    last_trained?: string;
    training_status: 'pending' | 'training' | 'completed' | 'failed';
  };
}

interface TrainingJob {
  id: string;
  document_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  progress: number;
  error_message?: string;
}

const CATEGORIES = [
  'Technical Documentation',
  'Business Processes',
  'Agent Knowledge',
  'Compliance',
  'User Guides',
  'API Documentation',
  'Training Materials',
  'Research Data',
  'Policies',
  'Other',
];

const STATUS_COLORS = {
  active: 'bg-green-500/20 text-green-300',
  draft: 'bg-yellow-500/20 text-yellow-300',
  archived: 'bg-gray-500/20 text-gray-300',
};

export default function KnowledgeManagement() {
  const { tenantId } = useActiveTenant();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    category: '',
    tags: [] as string[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
    loadTrainingJobs();
  }, [tenantId]);

  const loadDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/documents`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setDocuments(data.documents || []);
        }
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadTrainingJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/training-jobs`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setTrainingJobs(data.jobs || []);
        }
      }
    } catch (error) {
      console.error('Failed to load training jobs:', error);
    }
  };

  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', selectedCategory === 'all' ? 'Other' : selectedCategory);
      
      const response = await fetch(`${API_BASE}/v1/knowledge/upload`, {
        method: 'POST',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Document uploaded successfully');
          loadDocuments();
        } else {
          toast.error('Failed to upload document');
        }
      } else {
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const createDocument = async () => {
    if (!editForm.title || !editForm.content) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          category: editForm.category || 'Other',
          tags: editForm.tags,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Document created successfully');
          setIsEditing(false);
          setEditForm({ title: '', content: '', category: '', tags: [] });
          loadDocuments();
        } else {
          toast.error('Failed to create document');
        }
      } else {
        toast.error('Failed to create document');
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      toast.error('Failed to create document');
    }
  };

  const updateDocument = async () => {
    if (!selectedDocument || !editForm.title || !editForm.content) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/documents/${selectedDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({
          title: editForm.title,
          content: editForm.content,
          category: editForm.category || selectedDocument.category,
          tags: editForm.tags,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Document updated successfully');
          setIsEditing(false);
          setSelectedDocument(null);
          setEditForm({ title: '', content: '', category: '', tags: [] });
          loadDocuments();
        } else {
          toast.error('Failed to update document');
        }
      } else {
        toast.error('Failed to update document');
      }
    } catch (error) {
      console.error('Failed to update document:', error);
      toast.error('Failed to update document');
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Document deleted successfully');
          loadDocuments();
          if (selectedDocument?.id === documentId) {
            setSelectedDocument(null);
          }
        } else {
          toast.error('Failed to delete document');
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      toast.error('Failed to delete document');
    }
  };

  const trainDocument = async (documentId: string) => {
    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId || '',
        },
        body: JSON.stringify({ document_id: documentId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          toast.success('Training job started');
          loadTrainingJobs();
        } else {
          toast.error('Failed to start training');
        }
      } else {
        toast.error('Failed to start training');
      }
    } catch (error) {
      console.error('Failed to start training:', error);
      toast.error('Failed to start training');
    }
  };

  const searchDocuments = async () => {
    if (!searchQuery.trim()) {
      loadDocuments();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/v1/knowledge/search?q=${encodeURIComponent(searchQuery)}&category=${selectedCategory}`, {
        headers: {
          'X-Tenant-ID': tenantId || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          setDocuments(data.documents || []);
        }
      }
    } catch (error) {
      console.error('Failed to search documents:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(searchDocuments, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

  const filteredDocuments = documents.filter(doc => 
    selectedCategory === 'all' || doc.category === selectedCategory
  );

  const startEdit = (document?: KnowledgeDocument) => {
    if (document) {
      setEditForm({
        title: document.title,
        content: document.content,
        category: document.category,
        tags: document.tags,
      });
      setSelectedDocument(document);
    } else {
      setEditForm({ title: '', content: '', category: '', tags: [] });
      setSelectedDocument(null);
    }
    setIsEditing(true);
  };

  const addTag = (tag: string) => {
    if (tag && !editForm.tags.includes(tag)) {
      setEditForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const removeTag = (tag: string) => {
    setEditForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            Knowledge Base Management
          </h2>
          <p className="text-slate-400">Manage documents, AI training, and knowledge search</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={() => startEdit()}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Document
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadDocument(file);
            }}
            className="hidden"
            accept=".txt,.md,.pdf,.doc,.docx"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800 border-slate-600 pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-slate-800 border-slate-600 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Create/Edit Document Modal */}
      {isEditing && (
        <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {selectedDocument ? 'Edit Document' : 'Create Document'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white font-medium">Title</Label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter document title"
                className="bg-slate-800 border-slate-600"
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">Category</Label>
              <Select
                value={editForm.category}
                onValueChange={(category) => setEditForm(prev => ({ ...prev, category }))}
              >
                <SelectTrigger className="bg-slate-800 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-white font-medium">Content</Label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter document content"
                className="bg-slate-800 border-slate-600 min-h-[200px]"
              />
            </div>
            
            <div>
              <Label className="text-white font-medium">Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editForm.tags.map(tag => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="bg-cyan-500/20 text-cyan-300 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <Input
                placeholder="Add tag and press Enter"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addTag(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
                className="bg-slate-800 border-slate-600"
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={selectedDocument ? updateDocument : createDocument}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                {selectedDocument ? 'Update' : 'Create'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedDocument(null);
                  setEditForm({ title: '', content: '', category: '', tags: [] });
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="documents" className="data-[state=active]:bg-cyan-600">
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="training" className="data-[state=active]:bg-cyan-600">
            <Brain className="w-4 h-4 mr-2" />
            Training
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-cyan-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Document List */}
            <div className="lg:col-span-2 space-y-4">
              {filteredDocuments.length === 0 ? (
                <Card className="bg-slate-900/50 border-cyan-500/20 p-12 text-center">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Documents Found</h3>
                  <p className="text-slate-400 mb-4">
                    {searchQuery ? 'Try adjusting your search terms' : 'Upload or create your first document'}
                  </p>
                  <Button
                    onClick={() => startEdit()}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Document
                  </Button>
                </Card>
              ) : (
                filteredDocuments.map((document) => (
                  <Card
                    key={document.id}
                    className="bg-slate-900/50 border-cyan-500/20 p-6 cursor-pointer hover:bg-slate-800/50"
                    onClick={() => setSelectedDocument(document)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-1">{document.title}</h4>
                        <p className="text-sm text-slate-400 line-clamp-2">{document.content.substring(0, 150)}...</p>
                      </div>
                      <Badge className={STATUS_COLORS[document.status]}>
                        {document.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {document.category}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(document.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {document.author}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            trainDocument(document.id);
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <Brain className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(document);
                          }}
                          className="border-slate-600 text-slate-300 hover:bg-slate-800"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(document.id);
                          }}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    
                    {document.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {document.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                      <span>{document.metadata.word_count} words</span>
                      <span>{document.metadata.reading_time} min read</span>
                      <span>Version {document.version}</span>
                      {document.metadata.last_trained && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          Trained {new Date(document.metadata.last_trained).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* Document Preview */}
            <div className="lg:col-span-1">
              {selectedDocument ? (
                <Card className="bg-slate-900/50 border-cyan-500/20 p-6 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Preview</h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDocument(null)}
                      className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                      ×
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">{selectedDocument.title}</h4>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={STATUS_COLORS[selectedDocument.status]}>
                            {selectedDocument.status}
                          </Badge>
                          <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                            {selectedDocument.category}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-sm text-slate-400 space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          {selectedDocument.author}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          Created {new Date(selectedDocument.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <History className="w-3 h-3" />
                          Version {selectedDocument.version}
                        </div>
                      </div>
                      
                      {selectedDocument.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedDocument.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="bg-cyan-500/20 text-cyan-300 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <Separator />
                      
                      <div>
                        <h5 className="text-white font-medium mb-2">Content</h5>
                        <div className="text-sm text-slate-300 whitespace-pre-wrap">
                          {selectedDocument.content}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>Word count: {selectedDocument.metadata.word_count}</div>
                        <div>Reading time: {selectedDocument.metadata.reading_time} minutes</div>
                        <div>Training status: {selectedDocument.metadata.training_status}</div>
                      </div>
                    </div>
                  </ScrollArea>
                </Card>
              ) : (
                <Card className="bg-slate-900/50 border-cyan-500/20 p-6 text-center">
                  <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Select a document to preview</p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Training Jobs</h3>
            
            {trainingJobs.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">No Training Jobs</h4>
                <p className="text-slate-400 mb-4">Train documents to improve Atlas knowledge</p>
              </div>
            ) : (
              <div className="space-y-4">
                {trainingJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        job.status === 'completed' ? 'bg-green-400' :
                        job.status === 'running' ? 'bg-yellow-400 animate-pulse' :
                        job.status === 'failed' ? 'bg-red-400' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <div className="text-white font-medium">
                          Training Job #{job.id.slice(-8)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {job.started_at && `Started ${new Date(job.started_at).toLocaleString()}`}
                        </div>
                        {job.error_message && (
                          <div className="text-sm text-red-400">{job.error_message}</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-slate-400">
                        {job.progress}% complete
                      </div>
                      <Badge variant="secondary" className={
                        job.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                        job.status === 'running' ? 'bg-yellow-500/20 text-yellow-300' :
                        job.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }>
                        {job.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{documents.length}</p>
                </div>
                <FileText className="w-8 h-8 text-cyan-400" />
              </div>
            </Card>
            
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Trained Documents</p>
                  <p className="text-2xl font-bold text-white">
                    {documents.filter(d => d.metadata.last_trained).length}
                  </p>
                </div>
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
            
            <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Words</p>
                  <p className="text-2xl font-bold text-white">
                    {documents.reduce((sum, doc) => sum + doc.metadata.word_count, 0).toLocaleString()}
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-green-400" />
              </div>
            </Card>
          </div>
          
          <Card className="bg-slate-900/50 border-cyan-500/20 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Document Categories</h3>
            <div className="space-y-3">
              {CATEGORIES.map(category => {
                const count = documents.filter(doc => doc.category === category).length;
                if (count === 0) return null;
                
                return (
                  <div key={category} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="text-white">{category}</div>
                    <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-300">
                      {count} documents
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
