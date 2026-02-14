import { useState } from 'react';
import { 
  Brain, Upload, Download, Play, CheckCircle,
  TrendingUp, Database, Zap, Settings, Eye,
  FileText, BarChart3, AlertCircle, Sparkles,
  Target, Cpu, GitBranch, Clock, Award
} from 'lucide-react';

export function AIModelTraining() {
  const [trainingStatus, setTrainingStatus] = useState<'idle' | 'training' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);

  const modelStats = {
    trained: 0,
    accuracy: 0,
    totalData: 0,
    activeModels: 0,
  };

  const customModels: any[] = [];

  const trainingData: any[] = [];

  const modelTypes = [
    {
      name: 'Text Classification',
      description: 'Categorize text into predefined classes',
      icon: FileText,
      useCases: ['Email sorting', 'Ticket routing', 'Content tagging']
    },
    {
      name: 'Sentiment Analysis',
      description: 'Determine emotional tone of text',
      icon: Brain,
      useCases: ['Review analysis', 'Social monitoring', 'Feedback processing']
    },
    {
      name: 'Named Entity Recognition',
      description: 'Extract people, places, organizations from text',
      icon: Target,
      useCases: ['Document parsing', 'Data extraction', 'CRM enrichment']
    },
    {
      name: 'Regression',
      description: 'Predict numerical values',
      icon: TrendingUp,
      useCases: ['Sales forecasting', 'Price prediction', 'Trend analysis']
    },
    {
      name: 'Time Series Forecasting',
      description: 'Predict future values based on historical data',
      icon: BarChart3,
      useCases: ['Demand planning', 'Resource allocation', 'Trend prediction']
    },
    {
      name: 'Image Classification',
      description: 'Categorize images',
      icon: Eye,
      useCases: ['Product categorization', 'Quality control', 'Visual search']
    },
  ];

  const trainingMetrics = [
    { epoch: 1, accuracy: 72.3, loss: 0.84, time: '2m 34s' },
    { epoch: 2, accuracy: 81.6, loss: 0.56, time: '2m 31s' },
    { epoch: 3, accuracy: 87.9, loss: 0.38, time: '2m 29s' },
    { epoch: 4, accuracy: 92.4, loss: 0.24, time: '2m 27s' },
    { epoch: 5, accuracy: 94.8, loss: 0.16, time: '2m 25s' },
    { epoch: 6, accuracy: 96.2, loss: 0.11, time: '2m 23s' },
  ];

  const modelFeatures = [
    { name: 'Auto Data Preprocessing', description: 'Automatic data cleaning and formatting', enabled: true },
    { name: 'Hyperparameter Tuning', description: 'AI finds optimal model parameters', enabled: true },
    { name: 'Cross-Validation', description: 'Ensures model generalizes well', enabled: true },
    { name: 'Feature Engineering', description: 'Automatically creates relevant features', enabled: false },
    { name: 'Model Versioning', description: 'Track and compare model versions', enabled: true },
    { name: 'A/B Testing', description: 'Test models in production', enabled: true },
  ];

  const deploymentOptions = [
    { name: 'API Endpoint', description: 'RESTful API for predictions', active: true },
    { name: 'Batch Processing', description: 'Process large datasets', active: true },
    { name: 'Real-time Inference', description: 'Low-latency predictions', active: false },
    { name: 'Edge Deployment', description: 'Run on local devices', active: false },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Custom AI Model Training</h2>
        </div>
        <p className="text-slate-400">
          Train custom AI models on your data for specialized tasks
        </p>
      </div>

      {/* Model Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Brain className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{modelStats.trained}</div>
          <div className="text-sm text-slate-400">Custom models</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Target className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{modelStats.accuracy}%</div>
          <div className="text-sm text-slate-400">Avg accuracy</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Database className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{modelStats.totalData.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Training records</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Zap className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{modelStats.activeModels}</div>
          <div className="text-sm text-slate-400">Active models</div>
        </div>
      </div>

      {/* Training Interface */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Cpu className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Model Training</h3>
          </div>
          {trainingStatus === 'idle' && (
            <button
              onClick={() => {
                setTrainingStatus('training');
                let p = 0;
                const interval = setInterval(() => {
                  p += 2;
                  setProgress(p);
                  if (p >= 100) {
                    clearInterval(interval);
                    setTrainingStatus('complete');
                  }
                }, 100);
              }}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Training
            </button>
          )}
        </div>

        {trainingStatus === 'training' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-slate-400">Training in progress...</span>
              <span className="text-sm font-semibold text-cyan-400">{progress}%</span>
            </div>
            <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {trainingStatus === 'complete' && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">Training Complete!</div>
              <div className="text-xs text-slate-400">Model achieved 96.2% accuracy</div>
            </div>
          </div>
        )}

        {/* Training Metrics */}
        <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700/50">
          <h4 className="text-sm font-semibold text-white mb-4">Training Metrics</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700/50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Epoch</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Accuracy</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Loss</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-400">Time</th>
                </tr>
              </thead>
              <tbody>
                {trainingMetrics.map((metric) => (
                  <tr key={metric.epoch} className="border-b border-slate-700/30">
                    <td className="px-4 py-3 text-white">Epoch {metric.epoch}</td>
                    <td className="px-4 py-3">
                      <span className="text-green-400 font-semibold">{metric.accuracy}%</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{metric.loss}</td>
                    <td className="px-4 py-3 text-slate-400">{metric.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Performance Chart */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-white mb-3">Accuracy Trend</h4>
            <div className="relative h-32 flex items-end gap-2">
              {trainingMetrics.map((metric, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t transition-all"
                    style={{ height: `${metric.accuracy}%` }}
                  />
                  <span className="text-xs text-slate-500">E{metric.epoch}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Model Types */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Model Types</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {modelTypes.map((type, idx) => {
            const Icon = type.icon;
            return (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white text-sm mb-1">{type.name}</div>
                  </div>
                </div>
                <div className="text-xs text-slate-400 mb-3">{type.description}</div>
                <div className="space-y-1">
                  <div className="text-xs text-slate-500 font-semibold mb-1">Use Cases:</div>
                  {type.useCases.map((useCase, ucIdx) => (
                    <div key={ucIdx} className="text-xs text-slate-400">
                      • {useCase}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Training Data */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold text-white">Training Data</h3>
            </div>
            <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload
            </button>
          </div>

          <div className="space-y-3">
            {trainingData.map((data, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{data.dataset}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{data.records.toLocaleString()} records</span>
                      <span>•</span>
                      <span>{data.size}</span>
                      <span>•</span>
                      <span>{data.uploaded}</span>
                    </div>
                  </div>
                  {data.validated ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Models */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Award className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Your Custom Models</h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {customModels.map((model, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-semibold text-white mb-1">{model.name}</div>
                    <div className="text-xs text-slate-400 mb-2">{model.type}</div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                      <span>Accuracy: <span className="text-green-400 font-semibold">{model.accuracy}%</span></span>
                      <span>•</span>
                      <span>{model.predictions.toLocaleString()} predictions</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Trained on: {model.trainedOn}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    model.status === 'active' 
                      ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                      : model.status === 'training'
                      ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                      : 'bg-slate-700/50 text-slate-400'
                  }`}>
                    {model.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Model Features */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Training Features</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {modelFeatures.map((feature, idx) => (
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
      </div>

      {/* Deployment Options */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-400" />
          <h3 className="text-xl font-semibold text-white">Deployment Options</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {deploymentOptions.map((option, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border ${
                option.active
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-slate-950/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white mb-1">{option.name}</div>
                  <div className="text-xs text-slate-400">{option.description}</div>
                </div>
                {option.active && (
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-purple-400 mb-1">Custom AI for Your Business</div>
              <div className="text-xs text-slate-400">
                Train AI models on your specific data to solve unique business problems. Atlas handles data preprocessing, hyperparameter tuning, and deployment automatically. Your models learn from your data and improve over time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}