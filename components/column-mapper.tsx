'use client';

import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';

interface ColumnMapperProps {
  headers: { index: number; name: string }[];
  detections?: {
    name?: { index: number; confidence: string };
    phone?: { index: number; confidence: string };
    email?: { index: number; confidence: string };
    state?: { index: number; confidence: string };
    date?: { index: number; confidence: string };
  };
  onSave: (mapping: {
    name: number;
    phone: number;
    email: number;
    state: number;
    date: number;
  }) => void;
  onCancel: () => void;
  onBack?: () => void;
  sheetName: string;
  needsDateColumn?: boolean;
}

export function ColumnMapper({
  headers,
  detections,
  onSave,
  onCancel,
  onBack,
  sheetName,
  needsDateColumn = false,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState({
    name: detections?.name?.index ?? -1,
    phone: detections?.phone?.index ?? -1,
    email: -1, // Default to skip
    state: -1, // Default to skip
    date: -1, // Default to skip
  });

  const fields = [
    {
      key: 'name' as const,
      label: 'Name',
      required: true,
      icon: '👤',
      description: 'Full name or first name of the lead',
    },
    {
      key: 'phone' as const,
      label: 'Phone Number',
      required: true,
      icon: '📞',
      description: 'Contact phone number',
    },
    {
      key: 'email' as const,
      label: 'Email',
      required: false,
      icon: '📧',
      description: 'Email address',
    },
    {
      key: 'state' as const,
      label: 'State',
      required: false,
      icon: '🗺️',
      description: 'State or location',
    },
    {
      key: 'date' as const,
      label: 'Date Imported',
      required: needsDateColumn,
      icon: '📅',
      description: 'Date the lead was imported (for age-based calling)',
    },
  ];

  const handleSave = () => {
    if (mapping.name === -1 || mapping.phone === -1) {
      alert('Name and Phone Number are required fields!');
      return;
    }
    if (needsDateColumn && mapping.date === -1) {
      alert('Date Imported is required for age-based calling! Please select the column that contains the date your leads were imported.');
      return;
    }
    onSave(mapping);
  };

  const isValid = mapping.name !== -1 && mapping.phone !== -1 && (!needsDateColumn || mapping.date !== -1);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Map Your Columns</h2>
            <p className="text-blue-100 text-sm">Match your Google Sheet columns to the correct fields</p>
            <p className="text-blue-200 text-xs mt-1 font-semibold">{sheetName}</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/20 rounded-lg transition-all"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-4 mx-6 mt-6 mb-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-blue-300 font-medium mb-1">Smart Detection Active</p>
            <p className="text-gray-400">
              We've tried to automatically detect your columns. Please review and adjust if needed.
              <span className="text-white font-semibold ml-1">Name</span> and
              <span className="text-white font-semibold ml-1">Phone Number</span> must be selected.
              {needsDateColumn && (
                <span className="block mt-2 text-yellow-300">
                  ⚠️ <span className="text-white font-semibold">Date Imported</span> is REQUIRED for age-based calling!
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Column Mapping */}
        <div className="p-6 space-y-4">
          {fields.filter(field => field.key !== 'date' || needsDateColumn).map((field) => (
            <div
              key={field.key}
              className="bg-[#0B1437]/60 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 hover:border-blue-500/40 transition-all"
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 text-2xl shadow-lg shadow-blue-500/20">
                  {field.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-white font-bold text-lg">
                      {field.label}
                    </label>
                    {field.required && (
                      <span className="text-red-400 text-sm">*</span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">{field.description}</p>
                </div>
              </div>

              <select
                value={mapping[field.key]}
                onChange={(e) =>
                  setMapping({ ...mapping, [field.key]: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-[#0F172A]/80 backdrop-blur-sm border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value={-1}>-- {field.required ? 'Select a column' : 'Skip (optional)'} --</option>
                {headers.map((header) => (
                  <option key={header.index} value={header.index}>
                    Column {String.fromCharCode(65 + header.index)}: {header.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900/95 border-t border-gray-700 p-6 rounded-b-2xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {isValid ? (
              <>
                <Check className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-medium">Ready to sync!</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-medium">
                  {needsDateColumn && mapping.date === -1
                    ? 'Name, Phone, and Date Imported are required'
                    : 'Name and Phone are required'}
                </span>
              </>
            )}
          </div>
          <div className="flex gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-700/50 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                ← Back
              </button>
            )}
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg disabled:scale-100"
            >
              Save & Sync Leads
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

