import { useState } from 'react';
import { 
  Table, Upload, Download, TrendingUp, PieChart,
  BarChart3, Filter, Search, Plus, Trash2,
  Eye, Brain, Sparkles, FileText, Calculator,
  Zap, CheckCircle, AlertCircle, ArrowUpDown
} from 'lucide-react';

export function SpreadsheetAnalysis() {
  const [selectedSheet, setSelectedSheet] = useState('sales_data');

  const sheetStats = {
    sheets: 0,
    rows: 0,
    analyzed: 0,
    insights: 0,
  };

  const recentSheets: any[] = [];

  const aiInsights: any[] = [];

  const sampleData: any[] = [];

  const quickAnalytics: any[] = [];

  const pivotTables: any[] = [];

  const availableFormulas = [
    { name: 'SUM', description: 'Add all numbers', example: '=SUM(A1:A10)' },
    { name: 'AVERAGE', description: 'Calculate mean', example: '=AVERAGE(B1:B20)' },
    { name: 'VLOOKUP', description: 'Vertical lookup', example: '=VLOOKUP(A2, B:C, 2, FALSE)' },
    { name: 'IF', description: 'Conditional logic', example: '=IF(C2>100, "High", "Low")' },
    { name: 'COUNTIF', description: 'Count with criteria', example: '=COUNTIF(D:D, "Completed")' },
    { name: 'SUMIF', description: 'Sum with criteria', example: '=SUMIF(E:E, ">1000", F:F)' },
  ];

  const chartTypes = [
    { name: 'Line Chart', icon: TrendingUp, color: 'blue' },
    { name: 'Bar Chart', icon: BarChart3, color: 'green' },
    { name: 'Pie Chart', icon: PieChart, color: 'purple' },
    { name: 'Area Chart', icon: TrendingUp, color: 'cyan' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Table className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Spreadsheet Analysis</h2>
        </div>
        <p className="text-slate-400">
          AI-powered data analysis, pivot tables, and visualizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{sheetStats.sheets}</div>
          <div className="text-sm text-slate-400">Spreadsheets</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Table className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{sheetStats.rows.toLocaleString()}</div>
          <div className="text-sm text-slate-400">Total rows</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Brain className="w-8 h-8 text-purple-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{sheetStats.analyzed}</div>
          <div className="text-sm text-slate-400">AI analyses</div>
        </div>
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Sparkles className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{sheetStats.insights}</div>
          <div className="text-sm text-slate-400">Insights found</div>
        </div>
      </div>

      {/* Quick Analytics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        {quickAnalytics.map((stat, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-cyan-500/20 rounded-xl p-6"
          >
            <div className="text-sm text-slate-400 mb-2">{stat.label}</div>
            <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
            <div className={`text-sm font-semibold ${
              stat.color === 'green' ? 'text-green-400' :
              stat.color === 'red' ? 'text-red-400' :
              'text-blue-400'
            }`}>
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Main Spreadsheet Interface */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl overflow-hidden mb-8">
        <div className="grid lg:grid-cols-12">
          {/* Sidebar */}
          <div className="lg:col-span-3 border-r border-slate-700/50 p-4">
            <button className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-lg font-semibold mb-6 transition-colors flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              Upload CSV/Excel
            </button>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white mb-3">Recent Sheets</h3>
              <div className="space-y-2">
                {recentSheets.map((sheet) => (
                  <button
                    key={sheet.id}
                    onClick={() => setSelectedSheet(sheet.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSheet === sheet.id
                        ? 'bg-cyan-500/20 border border-cyan-500/30'
                        : 'bg-slate-950/50 border border-slate-700/50 hover:border-cyan-500/30'
                    }`}
                  >
                    <div className="text-sm font-semibold text-white mb-1">{sheet.name}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                      <span>{sheet.rows} rows</span>
                      <span>•</span>
                      <span>{sheet.cols} cols</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{sheet.uploaded}</span>
                      <span className="text-cyan-400">{sheet.insights} insights</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3">Pivot Tables</h3>
              <div className="space-y-2">
                {pivotTables.map((pivot, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-3 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="text-sm font-semibold text-white mb-1">{pivot.name}</div>
                    <div className="text-xs text-slate-400">
                      {pivot.rows} × {pivot.cols}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Spreadsheet View */}
          <div className="lg:col-span-9">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Q1 Sales Data</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  Filter
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Calculator className="w-3 h-3" />
                  Formula
                </button>
                <button className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-xs text-cyan-400 transition-colors flex items-center gap-2">
                  <Brain className="w-3 h-3" />
                  AI Analyze
                </button>
                <button className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2">
                  <Download className="w-3 h-3" />
                  Export
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-950/50 border-b border-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">#</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Revenue</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Region</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.map((row) => (
                    <tr key={row.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                      <td className="px-4 py-3 text-slate-400">{row.id}</td>
                      <td className="px-4 py-3 text-white">{row.date}</td>
                      <td className="px-4 py-3 text-white">{row.product}</td>
                      <td className="px-4 py-3 text-white">{row.quantity}</td>
                      <td className="px-4 py-3 text-white font-semibold">{row.revenue}</td>
                      <td className="px-4 py-3 text-white">{row.region}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          row.status === 'Completed' ? 'bg-green-500/20 border border-green-500/30 text-green-400' :
                          row.status === 'Pending' ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400' :
                          'bg-red-500/20 border border-red-500/30 text-red-400'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Row */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-950/30">
              {sampleData.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p>No spreadsheet data loaded. Upload a CSV or Excel file to get started.</p>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Showing {sampleData.length} rows</span>
                  <div className="flex items-center gap-4 text-white font-semibold">
                    <span>Data loaded</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* AI Insights */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">AI Insights</h3>
          </div>

          <div className="space-y-3">
            {aiInsights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    insight.severity === 'positive' 
                      ? 'bg-green-500/10 border-green-500/30'
                      : insight.severity === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-cyan-500/10 border-cyan-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      insight.severity === 'positive'
                        ? 'bg-green-500/20'
                        : insight.severity === 'warning'
                        ? 'bg-yellow-500/20'
                        : 'bg-cyan-500/20'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        insight.severity === 'positive' ? 'text-green-400' :
                        insight.severity === 'warning' ? 'text-yellow-400' :
                        'text-cyan-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-1">{insight.title}</div>
                      <div className="text-sm text-slate-300">{insight.description}</div>
                    </div>
                  </div>
                  <button className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
                    {insight.action} →
                  </button>
                </div>
              );
            })}
            
            {aiInsights.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Brain className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p>No AI insights yet. Upload data and run analysis to discover patterns and trends.</p>
              </div>
            )}
          </div>
        </div>

        {/* Chart Visualizations */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Visualizations</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {chartTypes.map((chart, idx) => {
              const Icon = chart.icon;
              return (
                <button
                  key={idx}
                  className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className={`w-5 h-5 text-${chart.color}-400`} />
                    <span className="text-sm font-semibold text-white">{chart.name}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Empty Chart State */}
          <div className="bg-slate-950/50 rounded-lg p-4 border border-slate-700/50">
            <div className="text-center py-12 text-slate-400">
              <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p>No chart data available. Upload spreadsheet data to create visualizations.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Formula Helper */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="w-6 h-6 text-cyan-400" />
          <h3 className="text-xl font-semibold text-white">Formula Helper</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {availableFormulas.map((formula, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-950/50 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors cursor-pointer"
            >
              <div className="text-sm font-semibold text-cyan-400 mb-2">{formula.name}</div>
              <div className="text-xs text-slate-400 mb-2">{formula.description}</div>
              <div className="text-xs text-slate-500 font-mono bg-slate-900/50 p-2 rounded">
                {formula.example}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}