'use client';

import { useState } from 'react';
import { FileSpreadsheet, Check } from 'lucide-react';

interface SheetTab {
  title: string;
  sheetId: number;
  index: number;
  rowCount: number;
}

interface SheetTabSelectorProps {
  tabs: SheetTab[];
  onSelect: (tabName: string) => void;
  onCancel: () => void;
}

export function SheetTabSelector({ tabs, onSelect, onCancel }: SheetTabSelectorProps) {
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-[#1A2647] rounded-2xl border border-gray-800 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Select Sheet/Tab</h2>
            <p className="text-gray-400">Choose which tab contains your leads</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {tabs.map((tab) => (
              <button
                key={tab.sheetId}
                onClick={() => setSelectedTab(tab.title)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedTab === tab.title
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-700 bg-[#0F172A]/50 hover:border-blue-500/50 hover:bg-[#0F172A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-white font-semibold text-lg">{tab.title}</p>
                  {selectedTab === tab.title && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedTab && onSelect(selectedTab)}
              disabled={!selectedTab}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white font-semibold rounded-xl transition-all hover:scale-105 disabled:scale-100"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
