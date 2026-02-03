import { useState } from 'react';
import { 
  Code, Terminal, FileCode, Play, Download, Copy,
  CheckCircle, AlertCircle, Zap, Brain, Sparkles,
  FileText, Folder, GitBranch, Settings, Search,
  Upload, Save, Trash2, Eye, EyeOff
} from 'lucide-react';

export function CodeGeneration() {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [isGenerating, setIsGenerating] = useState(false);

  const languages = [
    { name: 'JavaScript', value: 'javascript', icon: '🟨', color: 'yellow' },
    { name: 'Python', value: 'python', icon: '🐍', color: 'blue' },
    { name: 'TypeScript', value: 'typescript', icon: '🔷', color: 'cyan' },
    { name: 'React', value: 'react', icon: '⚛️', color: 'blue' },
    { name: 'Node.js', value: 'node', icon: '🟩', color: 'green' },
    { name: 'SQL', value: 'sql', icon: '🗄️', color: 'purple' },
    { name: 'HTML/CSS', value: 'html', icon: '🌐', color: 'orange' },
    { name: 'Bash', value: 'bash', icon: '💻', color: 'slate' },
  ];

  const codeStats = {
    generated: 1247,
    executed: 892,
    saved: 445,
    timeSaved: '67h',
  };

  const recentProjects = [
    {
      name: 'API Integration Script',
      language: 'python',
      lines: 156,
      created: '2 hours ago',
      status: 'success'
    },
    {
      name: 'Data Processing Pipeline',
      language: 'javascript',
      lines: 234,
      created: '1 day ago',
      status: 'success'
    },
    {
      name: 'Database Migration',
      language: 'sql',
      lines: 89,
      created: '2 days ago',
      status: 'error'
    },
  ];

  const codeTemplates = [
    { 
      name: 'API Client', 
      description: 'RESTful API client with error handling',
      language: 'javascript',
      uses: 89
    },
    { 
      name: 'Data Scraper', 
      description: 'Web scraping with pagination support',
      language: 'python',
      uses: 67
    },
    { 
      name: 'Automation Script', 
      description: 'Task automation with scheduling',
      language: 'bash',
      uses: 145
    },
    { 
      name: 'Database Query', 
      description: 'Complex SQL queries with joins',
      language: 'sql',
      uses: 56
    },
  ];

  const aiFeatures = [
    { name: 'Code Generation', description: 'Generate code from natural language', enabled: true },
    { name: 'Bug Detection', description: 'AI finds bugs and suggests fixes', enabled: true },
    { name: 'Code Explanation', description: 'Explains complex code in plain English', enabled: true },
    { name: 'Optimization', description: 'Suggests performance improvements', enabled: true },
    { name: 'Documentation', description: 'Auto-generates code comments', enabled: false },
    { name: 'Refactoring', description: 'Improves code structure', enabled: true },
  ];

  const sampleCode = `// AI-Generated API Client
class APIClient {
  constructor(baseURL, apiKey) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = \`\${this.baseURL}\${endpoint}\`;
    const config = {
      ...options,
      headers: { ...this.headers, ...options.headers }
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

// Usage Example
const client = new APIClient('https://api.example.com', 'your-api-key');
const data = await client.get('/users');
console.log(data);`;

  const executionLog = [
    { timestamp: '10:23:45', level: 'info', message: 'Starting script execution...' },
    { timestamp: '10:23:46', level: 'success', message: 'Connected to API successfully' },
    { timestamp: '10:23:47', level: 'info', message: 'Fetching user data...' },
    { timestamp: '10:23:48', level: 'success', message: 'Retrieved 1,247 records' },
    { timestamp: '10:23:49', level: 'warning', message: 'Rate limit approaching (90% used)' },
    { timestamp: '10:23:50', level: 'success', message: 'Script completed successfully' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Code className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Code Generation & Developer Tools</h2>
        </div>
        <p className="text-slate-400">
          Generate, debug, and deploy code with AI assistance
        </p>
      </div>

      {/* Code Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileCode className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{codeStats.generated.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Scripts generated</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Play className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{codeStats.executed.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Successfully executed</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Save className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{codeStats.saved.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Saved projects</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{codeStats.timeSaved}</div>
          <div className="text-sm text-slate-400">Development time saved</div>
        </div>
      </div>

      {/* Main Code Editor */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden mb-8">
        <div className="grid lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3 border-r border-slate-700/50 p-4">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Language</h3>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setSelectedLanguage(lang.value)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      selectedLanguage === lang.value
                        ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-400'
                        : 'text-slate-400 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="text-xl">{lang.icon}</span>
                    <span className="text-sm font-semibold">{lang.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Templates</h3>
              <div className="space-y-2">
                {codeTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                  >
                    <div className="text-sm font-semibold text-white mb-1">{template.name}</div>
                    <div className="text-xs text-slate-400 mb-2">{template.description}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{template.language}</span>
                      <span className="text-xs text-slate-600">{template.uses} uses</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-9">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold text-white">api-client.js</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button 
                  onClick={() => setIsGenerating(!isGenerating)}
                  className="px-4 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 rounded text-xs font-semibold transition-colors flex items-center gap-2"
                >
                  <Play className="w-3 h-3" />
                  Run
                </button>
              </div>
            </div>

            {/* Code Content */}
            <div className="bg-slate-950 p-6 font-mono text-sm overflow-auto max-h-[500px]">
              <pre className="text-slate-300">
                <code>{sampleCode}</code>
              </pre>
            </div>

            {/* AI Suggestions */}
            <div className="p-4 border-t border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
              <div className="flex items-start gap-3">
                <Brain className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-cyan-400 mb-2">AI Analysis</div>
                  <div className="space-y-2">
                    <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>Code is well-structured with proper error handling</span>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <span>Consider adding request timeout configuration for better resilience</span>
                    </div>
                    <div className="text-xs text-slate-300 bg-slate-900/50 p-2 rounded flex items-start gap-2">
                      <Sparkles className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                      <span>Suggestion: Add retry logic for failed requests</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Execution Terminal */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Terminal className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Execution Log</h3>
          </div>

          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs max-h-64 overflow-y-auto">
            {executionLog.map((log, idx) => (
              <div key={idx} className="mb-1 flex items-start gap-3">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span className={
                  log.level === 'success' ? 'text-green-400' :
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-yellow-400' :
                  'text-slate-400'
                }>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Folder className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Recent Projects</h3>
            </div>
            <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors">
              View All
            </button>
          </div>

          <div className="space-y-3">
            {recentProjects.map((project, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white mb-1">{project.name}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{project.language}</span>
                      <span>•</span>
                      <span>{project.lines} lines</span>
                      <span>•</span>
                      <span>{project.created}</span>
                    </div>
                  </div>
                  {project.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Code Features */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-semibold text-white">AI Developer Assistant</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {aiFeatures.map((feature, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-white text-sm">{feature.name}</div>
                <button
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    feature.enabled
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                      : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      feature.enabled ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="text-xs text-slate-400">{feature.description}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">AI-Powered Development</div>
              <div className="text-xs text-slate-400">
                Atlas can generate production-ready code, debug issues, explain complex logic, and suggest optimizations. Simply describe what you need in plain English.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
