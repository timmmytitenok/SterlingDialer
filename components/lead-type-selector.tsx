'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, Loader2, AlertCircle, Lock } from 'lucide-react';

// Lead type values that will be stored and sent to Retell for SCRIPT selection
// The lead_type determines which Retell script is used
// 2 = Final Expense → uses Agent 1
// 3 = Final Expense Veteran → uses Agent 1
// 4 = Mortgage Protection → uses Agent 2
// 5 = Final Expense #2 → uses Agent 1
// 6 = Mortgage Protection #2 → uses Agent 2
export type LeadTypeValue = 2 | 3 | 4 | 5 | 6;

export interface LeadTypeResult {
  leadType: LeadTypeValue;
  scriptType: 'final_expense' | 'mortgage_protection';
  isVeteran: boolean;
  label: string;
}

interface AgentConfig {
  id: string | null;
  phone: string | null;
  name: string;
  type: 'final_expense' | 'final_expense_2' | 'mortgage_protection' | 'mortgage_protection_2';
  isConfigured: boolean;
}

interface LeadTypeSelectorProps {
  onSelect: (result: LeadTypeResult) => void;
  onCancel: () => void;
}

export function LeadTypeSelector({ onSelect, onCancel }: LeadTypeSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Only 2 agents per user
  const [agent1, setAgent1] = useState<AgentConfig>({ id: null, phone: null, name: 'Agent 1', type: 'final_expense', isConfigured: false });
  const [agent2, setAgent2] = useState<AgentConfig>({ id: null, phone: null, name: 'Agent 2', type: 'mortgage_protection', isConfigured: false });

  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        const response = await fetch('/api/user/agent-config');
        if (!response.ok) throw new Error('Failed to fetch agent config');
        
        const data = await response.json();
        setAgent1(data.agents.agent1);
        setAgent2(data.agents.agent2);
      } catch (err: any) {
        console.error('Error fetching agent config:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentConfig();
  }, []);

  // Map agent type to lead_type value
  const getLeadTypeForAgent = (agentType: string): LeadTypeValue => {
    switch (agentType) {
      case 'final_expense': return 2;
      case 'final_expense_2': return 5;
      case 'mortgage_protection': return 4;
      case 'mortgage_protection_2': return 6;
      default: return 2;
    }
  };

  // Get script type from agent type
  const getScriptType = (agentType: string): 'final_expense' | 'mortgage_protection' => {
    if (agentType.includes('mortgage')) return 'mortgage_protection';
    return 'final_expense';
  };

  const handleAgent1Select = () => {
    const leadType = getLeadTypeForAgent(agent1.type);
    onSelect({
      leadType,
      scriptType: getScriptType(agent1.type),
      isVeteran: false,
      label: agent1.name,
    });
  };

  const handleAgent2Select = () => {
    const leadType = getLeadTypeForAgent(agent2.type);
    onSelect({
      leadType,
      scriptType: getScriptType(agent2.type),
      isVeteran: false,
      label: agent2.name,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl p-8 border border-blue-500/30">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading your AI agents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#1A2647] to-[#0F172A] rounded-2xl p-8 border border-red-500/30 max-w-md">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-center mb-4">{error}</p>
          <button onClick={onCancel} className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  // Check if any agents are configured
  const hasAnyAgent = agent1.isConfigured || agent2.isConfigured;

  // Get emoji based on agent type
  const getAgentEmoji = (agentType: string, isConfigured: boolean): string => {
    if (!isConfigured) return '🔒';
    if (agentType.includes('mortgage')) return '🏠';
    return '💚';
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Modal Container with Glow */}
      <div className="relative animate-in zoom-in-95 fade-in duration-300">
        {/* Background Glows */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-xl" />

        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-[#1A2647] via-[#15203a] to-[#0F172A] rounded-2xl border border-blue-500/30 max-w-lg w-full overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Header Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

          {/* Header */}
          <div className="p-6 border-b border-gray-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-3xl">
                🤖
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Select AI Agent</h2>
                <p className="text-gray-400 text-sm">Choose which script to use for these leads</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-all group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Info Banner */}
            <div className="p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
              <div className="relative">
                <p className="text-blue-300 font-semibold mb-1">AI Script Selection</p>
                <p className="text-gray-300 text-sm">
                  Select which AI agent will call these leads. Each agent has its own script and phone number.
                </p>
              </div>
            </div>

            {!hasAnyAgent && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-amber-400 font-semibold mb-1">⚠️ No Agents Configured</p>
                <p className="text-gray-300 text-sm">
                  Contact your admin to set up AI agents for your account.
                </p>
              </div>
            )}

            {/* Agent 1 Button */}
            <button
              onClick={handleAgent1Select}
              disabled={!agent1.isConfigured}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 group text-left flex items-center gap-4 relative overflow-hidden ${
                agent1.isConfigured
                  ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/5 hover:from-green-500/20 hover:to-emerald-600/15 border-green-500/30 hover:border-green-500/60'
                  : 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed'
              }`}
            >
              {!agent1.isConfigured && (
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-600/50">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">Not Configured</span>
                  </div>
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg transition-transform ${
                agent1.isConfigured 
                  ? 'bg-gradient-to-br from-green-500 to-emerald-600 group-hover:scale-110' 
                  : 'bg-gray-700/50'
              }`}>
                {getAgentEmoji(agent1.type, agent1.isConfigured)}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold transition-colors ${
                  agent1.isConfigured ? 'text-white group-hover:text-green-400' : 'text-gray-500'
                }`}>
                  {agent1.name}
                </h3>
                {!agent1.isConfigured && (
                  <p className="text-gray-500 text-sm">Contact admin to configure</p>
                )}
              </div>
              {agent1.isConfigured && (
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
              )}
            </button>

            {/* Agent 2 Button */}
            <button
              onClick={handleAgent2Select}
              disabled={!agent2.isConfigured}
              className={`w-full p-5 rounded-xl border-2 transition-all duration-300 group text-left flex items-center gap-4 relative overflow-hidden ${
                agent2.isConfigured
                  ? 'bg-gradient-to-br from-blue-500/10 to-indigo-600/5 hover:from-blue-500/20 hover:to-indigo-600/15 border-blue-500/30 hover:border-blue-500/60'
                  : 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed'
              }`}
            >
              {!agent2.isConfigured && (
                <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/90 rounded-lg border border-gray-600/50">
                    <Lock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-400 text-sm font-medium">Not Configured</span>
                  </div>
                </div>
              )}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-lg transition-transform ${
                agent2.isConfigured 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 group-hover:scale-110' 
                  : 'bg-gray-700/50'
              }`}>
                {getAgentEmoji(agent2.type, agent2.isConfigured)}
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold transition-colors ${
                  agent2.isConfigured ? 'text-white group-hover:text-blue-400' : 'text-gray-500'
                }`}>
                  {agent2.name}
                </h3>
                {!agent2.isConfigured && (
                  <p className="text-gray-500 text-sm">Contact admin to configure</p>
                )}
              </div>
              {agent2.isConfigured && (
              <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800/50 bg-[#0F172A]/50">
            <button
              onClick={onCancel}
              className="w-full px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border-2 border-gray-600 hover:border-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
