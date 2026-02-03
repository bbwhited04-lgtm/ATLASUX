import { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Receipt,
  FileText, Bell, Calendar, PieChart, CreditCard,
  CheckCircle, AlertTriangle, Download, Upload,
  Sparkles, Clock, Target, Wallet, Calculator
} from 'lucide-react';

export function FinancialManagement() {
  const stats = {
    totalExpenses: 0,
    invoicesSent: 0,
    pendingPayments: 0,
    budgetRemaining: 0,
  };

  const expenses: any[] = [];
  const invoices: any[] = [];
  const paymentReminders: any[] = [];
  const budgetCategories: any[] = [];
  const taxDocuments: any[] = [];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-cyan-400" />
          <h2 className="text-3xl font-bold text-white">Financial Management</h2>
        </div>
        <p className="text-slate-400">
          Intelligent expense tracking and financial automation
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Wallet className="w-8 h-8 text-cyan-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">${stats.totalExpenses}</div>
          <div className="text-sm text-slate-400">Total Expenses</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <FileText className="w-8 h-8 text-blue-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.invoicesSent}</div>
          <div className="text-sm text-slate-400">Invoices Sent</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <AlertTriangle className="w-8 h-8 text-yellow-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">{stats.pendingPayments}</div>
          <div className="text-sm text-slate-400">Pending Payments</div>
        </div>

        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <Target className="w-8 h-8 text-green-400 mb-3" />
          <div className="text-3xl font-bold text-white mb-1">${stats.budgetRemaining}</div>
          <div className="text-sm text-slate-400">Budget Remaining</div>
        </div>
      </div>

      {/* Expense Tracking */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Receipt className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">Expense Tracking</h3>
          </div>
          <button className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-400 transition-colors flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Add Expense
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No expenses tracked yet. Upload receipts or manually log expenses.
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Invoice Generation */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">Invoice Generation</h3>
            </div>
            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-sm text-blue-400 transition-colors">
              Create Invoice
            </button>
          </div>

          <div className="text-center py-12 text-slate-400">
            No invoices created yet. Generate professional invoices automatically.
          </div>
        </div>

        {/* Payment Reminders */}
        <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="w-6 h-6 text-yellow-400" />
            <h3 className="text-xl font-semibold text-white">Payment Reminders</h3>
          </div>

          <div className="text-center py-12 text-slate-400">
            No pending reminders. Atlas will automatically remind clients about unpaid invoices.
          </div>
        </div>
      </div>

      {/* Budget Tracking */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <PieChart className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-semibold text-white">Budget Tracking</h3>
          </div>
          <button className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-sm text-green-400 transition-colors">
            Set Budget
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No budgets configured. Set monthly budgets and get alerts when approaching limits.
        </div>
      </div>

      {/* Tax Document Preparation */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6 text-cyan-400" />
            <h3 className="text-xl font-semibold text-white">Tax Document Preparation</h3>
          </div>
          <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-sm text-cyan-400 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Generate Report
          </button>
        </div>

        <div className="text-center py-12 text-slate-400">
          No tax documents available. Atlas will organize your expenses for tax season.
        </div>
      </div>

      {/* Budget Alerts */}
      <div className="bg-slate-900/50 border border-cyan-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-semibold text-white">Budget Alerts</h3>
        </div>

        <div className="text-center py-12 text-slate-400">
          No budget alerts. You'll be notified when approaching budget limits.
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-yellow-500/10 border border-green-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-green-400 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-green-400 mb-1">Automated Financial Management</div>
              <div className="text-xs text-slate-400">
                Track expenses automatically with receipt scanning, generate professional invoices, set up payment reminders, monitor budgets with smart alerts, and prepare tax documents effortlessly. Atlas handles your finances so you can focus on your business.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
