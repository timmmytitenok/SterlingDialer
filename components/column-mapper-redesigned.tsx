'use client';

import { useState } from 'react';
import { X, Check, AlertCircle, Sparkles } from 'lucide-react';

interface ColumnMapperRedesignedProps {
  headers: { index: number; name: string }[];
  detections?: {
    name?: { index: number; confidence: string };
    phone?: { index: number; confidence: string };
    email?: { index: number; confidence: string };
    age?: { index: number; confidence: string };
    state?: { index: number; confidence: string };
  };
  onSave: (mapping: {
    name: number;
    phone: number;
    email: number;
    age: number;
    state: number;
  }) => void;
  onCancel: () => void;
  sheetName: string;
}

export function ColumnMapperRedesigned({
  headers,
  detections,
  onSave,
  onCancel,
  sheetName,
}: ColumnMapperRedesignedProps) {
  const [mapping, setMapping] = useState({
    name: detections?.name?.index ?? -1,
    phone: detections?.phone?.index ?? -1,
    email: detections?.email?.index ?? -1,
    age: detections?.age?.index ?? -1,
    state: detections?.state?.index ?? -1,
  });

  const fields = [
    {
      key: 'name' as const,
      label: 'Name',
      required: true,
      icon: '👤',
      description: 'Full name or first name of the lead',
      gradient: 'from-blue-600 to-cyan-600',
    },
    {
      key: 'phone' as const,
      label: 'Phone Number',
      required: true,
      icon: '📞',
      description: 'Contact phone number (required so AI can call)',
      gradient: 'from-purple-600 to-pink-600',
    },
    {
      key: 'email' as const,
      label: 'Email',
      required: false,
      icon: '📧',
      description: 'Email address (optional - for storing additional data)',
      gradient: 'from-green-600 to-emerald-600',
    },
    {
      key: 'age' as const,
      label: 'Age',
      required: false,
      icon: '🎂',
      description: 'Lead age (optional - for storing additional data)',
      gradient: 'from-orange-600 to-red-600',
    },
    {
      key: 'state' as const,
      label: 'State',
      required: false,
      icon: '🗺️',
      description: 'State or location (optional - for storing additional data)',
      gradient: 'from-indigo-600 to-purple-600',
    },
  ];

  const handleSave = () => {
    if (mapping.name === -1 || mapping.phone === -1) {
      alert('Name and Phone Number are required fields!');
      return;
    }
    onSave(mapping);
  };

  const isValid = mapping.name !== -1 && mapping.phone !== -1;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-[#1A2647] rounded-2xl border border-gray-800 max-w-5xl w-full max-h-[92vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="p-8 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Map Your Columns</h2>
            <p className="text-gray-400">{sheetName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-5 mx-8 mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl flex-shrink-0">
          <p className="text-blue-300 font-semibold mb-1">
            ✨ Our smart auto-detection tried mapping the columns by itself
          </p>
          <p className="text-gray-300 text-sm">
            But it is YOUR job to verify and confirm the columns match up so the data is correct!
          </p>
        </div>

        {/* Column Mapping */}
        <div className="p-8 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(92vh - 320px)' }}>
          {fields.map((field) => (
            <div
              key={field.key}
              className="bg-[#0F172A]/50 rounded-xl border border-gray-700 p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${field.gradient} flex items-center justify-center text-2xl shadow-lg`}>
                  {field.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="text-white font-bold text-lg">
                      {field.label}
                    </label>
                    {field.required && (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                        REQUIRED
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mt-1">{field.description}</p>
                </div>
              </div>

              <select
                value={mapping[field.key]}
                onChange={(e) =>
                  setMapping({ ...mapping, [field.key]: parseInt(e.target.value) })
                }
                className="w-full px-5 py-4 bg-[#0B1437] border-2 border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg text-white focus:outline-none transition-all text-base"
              >
                <option value={-1}>
                  {field.required ? '-- Select a column --' : '-- Skip (optional) --'}
                </option>
                {headers.map((header) => (
                  <option key={header.index} value={header.index}>
                    Column {String.fromCharCode(65 + header.index)}: {header.name || '(Empty)'}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            {isValid ? (
              <>
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-green-400 font-semibold text-sm">Ready to import!</p>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-red-400 font-semibold text-sm">Select Name and Phone</p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:scale-100 flex items-center gap-2"
            >
              {isValid && <Check className="w-5 h-5" />}
              Import Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

