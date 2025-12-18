'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// Custom hook for smooth counting animation
function useCountAnimation(targetValue: number, duration: number = 2000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = performance.now();
    
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = startValue + (targetValue - startValue) * easeOutExpo;
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = targetValue;
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration]);

  return displayValue;
}

export interface StatOption {
  key: string;
  title: string;
  icon: string;
  color: 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'yellow';
  value: number;
  subtitle: string;
  prefix?: string; // For currency like "$"
}

interface CustomizableStatCardProps {
  userId: string;
  options: StatOption[];
  defaultKey?: string;
}

const colorClasses = {
  blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400 hover:border-blue-500/40 hover:shadow-blue-500/10',
  green: 'from-green-500/10 to-green-600/5 border-green-500/20 text-green-400 hover:border-green-500/40 hover:shadow-green-500/10',
  red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-400 hover:border-red-500/40 hover:shadow-red-500/10',
  orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20 text-orange-400 hover:border-orange-500/40 hover:shadow-orange-500/10',
  purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-400 hover:border-purple-500/40 hover:shadow-purple-500/10',
  yellow: 'from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400 hover:border-yellow-500/40 hover:shadow-yellow-500/10',
};

const textColorClasses = {
  blue: 'text-blue-400',
  green: 'text-green-400',
  red: 'text-red-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  yellow: 'text-yellow-400',
};

const subtextColorClasses = {
  blue: 'text-blue-400/60',
  green: 'text-green-400/60',
  red: 'text-red-400/60',
  orange: 'text-orange-400/60',
  purple: 'text-purple-400/60',
  yellow: 'text-yellow-400/60',
};

export function CustomizableStatCard({ 
  userId,
  options, 
  defaultKey = 'appointments',
}: CustomizableStatCardProps) {
  const [selectedKey, setSelectedKey] = useState<string>(defaultKey);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Load saved preference from database
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('dashboard_secondary_stat')
          .eq('user_id', userId)
          .single();
        
        if (data?.dashboard_secondary_stat && options.find(o => o.key === data.dashboard_secondary_stat)) {
          setSelectedKey(data.dashboard_secondary_stat);
        }
      } catch (error) {
        console.error('Error loading stat preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreference();
  }, [userId, options, supabase]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (key: string) => {
    setSelectedKey(key);
    setIsOpen(false);
    
    // Save to database
    try {
      await supabase
        .from('profiles')
        .update({ dashboard_secondary_stat: key })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error saving stat preference:', error);
    }
  };

  const selectedOption = options.find(o => o.key === selectedKey) || options[0];
  const colorClass = colorClasses[selectedOption.color];
  
  // Animate value
  const animatedValue = useCountAnimation(selectedOption.value);
  const formattedValue = Math.round(animatedValue).toLocaleString();
  const displayValue = selectedOption.prefix ? `${selectedOption.prefix}${formattedValue}` : formattedValue;

  return (
    <div className={`bg-gradient-to-br ${colorClass} rounded-xl p-6 border transition-all duration-200 hover:scale-[1.02] hover:shadow-lg relative overflow-visible ${isOpen ? 'z-[9999]' : ''}`}>
      {/* Stat Switcher Button */}
      <div className="absolute top-3 right-3 z-[9999]" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-gray-400 hover:text-white"
        >
          <span className="hidden sm:inline">Change</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A2647] border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-visible z-[9999]">
            <div className="p-2 border-b border-gray-700">
              <p className="text-xs text-gray-400 font-medium px-2">Select stat to display</p>
            </div>
            <div className="p-1">
              {options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSelect(option.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    selectedKey === option.key 
                      ? 'bg-blue-500/20 text-white' 
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{option.title}</p>
                    <p className="text-xs text-gray-500">{option.subtitle}</p>
                  </div>
                  {selectedKey === option.key && (
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{selectedOption.icon}</span>
      </div>
      <p className="text-gray-300 text-sm mb-1 font-medium">{selectedOption.title}</p>
      <p className={`text-4xl font-bold ${textColorClasses[selectedOption.color]}`}>
        {displayValue}
      </p>
      <p className={`text-xs mt-1 ${subtextColorClasses[selectedOption.color]}`}>
        {selectedOption.subtitle}
      </p>
    </div>
  );
}

