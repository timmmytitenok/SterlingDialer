'use client';

import { useState } from 'react';
import { FileSpreadsheet, Check, Lock, Sparkles } from 'lucide-react';

interface SheetTab {
  title: string;
  sheetId: number;
  index: number;
  rowCount: number;
}

interface SheetTabSelectorProps {
  tabs: SheetTab[];
  existingTabs?: string[];
  onSelect: (tabName: string) => void;
  onCancel: () => void;
}

export function SheetTabSelector({ tabs, existingTabs = [], onSelect, onCancel }: SheetTabSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  const isTabInUse = (tabName: string) => existingTabs.includes(tabName);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Modal Container with Glow */}
      <div className="relative animate-in zoom-in-95 fade-in duration-300">
        {/* Background Glows */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-xl" />
        
        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-[#1A2647] via-[#15203a] to-[#0F172A] rounded-2xl border border-blue-500/30 max-w-lg w-full shadow-2xl shadow-blue-500/20 overflow-hidden">
          {/* Header Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[0.2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileSpreadsheet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Select Sheet/Tab
                </h2>
                <p className="text-gray-400 text-sm">Choose which tab you'd like to use</p>
              </div>
            </div>

            {/* Tabs List */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {tabs.map((tab) => {
                const inUse = isTabInUse(tab.title);
                const isSelected = selectedTab === tab.title;
                
                return (
                  <button
                    key={tab.sheetId}
                    onClick={() => !inUse && setSelectedTab(tab.title)}
                    disabled={inUse}
                    className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${
                      inUse
                        ? 'border-gray-700/50 bg-gray-800/30 cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'border-blue-500 bg-gradient-to-r from-blue-500/20 via-purple-500/15 to-pink-500/10 shadow-lg shadow-blue-500/20'
                        : 'border-gray-700 bg-[#0F172A]/50 hover:border-blue-500/50 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-purple-500/10 hover:shadow-lg hover:shadow-blue-500/10'
                    }`}
                  >
                    {/* Selection Glow */}
                    {isSelected && !inUse && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 animate-pulse" />
                    )}
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          inUse 
                            ? 'bg-gray-700/50' 
                            : isSelected 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-md shadow-blue-500/30' 
                            : 'bg-gray-700/50 group-hover:bg-gradient-to-br group-hover:from-blue-500/50 group-hover:to-purple-600/50'
                        }`}>
                          {inUse ? (
                            <Lock className="w-5 h-5 text-gray-500" />
                          ) : (
                            <FileSpreadsheet className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'}`} />
                          )}
                        </div>
                        <div>
                          <p className={`font-semibold text-lg ${inUse ? 'text-gray-500' : 'text-white'}`}>
                            {tab.title}
                          </p>
                          {inUse && (
                            <p className="text-xs text-gray-500 font-medium">Already connected</p>
                          )}
                        </div>
                      </div>
                      
                      {isSelected && !inUse && (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-in zoom-in duration-200">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onCancel}
                className="flex-1 px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white font-semibold rounded-xl transition-all duration-300 border-2 border-gray-600 hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => selectedTab && onSelect(selectedTab)}
                disabled={!selectedTab}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/30 disabled:scale-100 disabled:shadow-none relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Continue
                </span>
                {selectedTab && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
