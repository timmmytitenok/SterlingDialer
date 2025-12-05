'use client';

import { useState } from 'react';
import { X, Check, AlertCircle, Sparkles, FileSpreadsheet } from 'lucide-react';

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
      glowColor: 'blue',
    },
    {
      key: 'phone' as const,
      label: 'Phone Number',
      required: true,
      icon: '📞',
      description: 'Contact phone number (required so AI can call)',
      gradient: 'from-green-600 to-emerald-600',
      glowColor: 'green',
    },
    {
      key: 'email' as const,
      label: 'Email',
      required: false,
      icon: '📧',
      description: 'Email address (optional)',
      gradient: 'from-purple-600 to-pink-600',
      glowColor: 'purple',
    },
    {
      key: 'age' as const,
      label: 'Age',
      required: false,
      icon: '🎂',
      description: 'Lead age (optional)',
      gradient: 'from-orange-600 to-red-600',
      glowColor: 'orange',
    },
    {
      key: 'state' as const,
      label: 'State',
      required: false,
      icon: '🗺️',
      description: 'State or location (optional)',
      gradient: 'from-indigo-600 to-purple-600',
      glowColor: 'indigo',
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      {/* Modal Container with Glow */}
      <div className="relative animate-in zoom-in-95 fade-in duration-300">
        {/* Background Glows */}
        <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl animate-pulse" />
        <div className="absolute -inset-2 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 rounded-3xl blur-xl" />
        
        {/* Main Modal */}
        <div className="relative bg-gradient-to-br from-[#1A2647] via-[#15203a] to-[#0F172A] rounded-2xl border border-blue-500/30 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/20">
          {/* Header Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[0.2px] bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          
          {/* Header */}
          <div className="p-6 border-b border-gray-800/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileSpreadsheet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Map Your Columns
                </h2>
                <p className="text-gray-400 text-sm">{sheetName}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-white/10 rounded-lg transition-all group"
            >
              <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
            </button>
          </div>

          {/* Info Banner */}
          <div className="mx-6 mt-1 p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/30 rounded-xl flex-shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="relative">
              <p className="text-blue-300 font-semibold mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Our smart auto-detection mapped the columns
              </p>
              <p className="text-gray-300 text-sm">
                Verify and confirm the columns match up so your data is correct!
              </p>
            </div>
          </div>

          {/* Column Mapping */}
          <div className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 320px)' }}>
            {fields.map((field, index) => {
              const isSelected = mapping[field.key] !== -1;
              return (
                <div
                  key={field.key}
                  className={`relative bg-gradient-to-br from-[#0F172A]/80 to-[#0F172A]/50 rounded-xl border-2 p-5 transition-all duration-300 group ${
                    isSelected 
                      ? 'border-green-500/50 shadow-lg shadow-green-500/10' 
                      : field.required 
                      ? 'border-red-500/30 hover:border-red-500/50' 
                      : 'border-gray-700/50 hover:border-blue-500/50'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Selection indicator glow */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-transparent to-transparent rounded-xl pointer-events-none" />
                  )}
                  
                  <div className="relative flex items-center gap-4 mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${field.gradient} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {field.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <label className="text-white font-bold text-lg">
                          {field.label}
                        </label>
                        {field.required && (
                          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-bold border border-red-500/30">
                            REQUIRED
                          </span>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center animate-in zoom-in duration-200">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-green-400/60 text-xs">Click to change</span>
                          </div>
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
                    className={`w-full px-5 py-4 bg-[#0B1437] border-2 rounded-xl text-white focus:outline-none transition-all text-base cursor-pointer hover:bg-[#0F172A] ${
                      isSelected 
                        ? 'border-green-500/50 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 hover:border-green-400' 
                        : 'border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 hover:border-gray-600'
                    }`}
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
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800/50 bg-[#0F172A]/50 flex flex-col sm:flex-row items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              {isValid ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/40 animate-pulse">
                    <Check className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-bold">Ready to import!</p>
                    <p className="text-green-400/60 text-xs">All required fields mapped</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/40">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-red-400 font-bold">Missing required fields</p>
                    <p className="text-red-400/60 text-xs">Select Name and Phone columns</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onCancel}
                className="flex-1 sm:flex-none px-6 py-4 bg-gray-700/50 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border-2 border-gray-600 hover:border-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-500 hover:via-emerald-500 hover:to-teal-500 disabled:from-gray-700 disabled:via-gray-700 disabled:to-gray-800 disabled:text-gray-500 text-white rounded-xl font-bold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-green-500/30 disabled:scale-100 disabled:shadow-none flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {isValid && <Check className="w-5 h-5" />}
                  Import Leads
                </span>
                {isValid && (
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

