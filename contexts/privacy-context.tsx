'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PrivacyContextType {
  blurSensitive: boolean;
  setBlurSensitive: (value: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  blurSensitive: false,
  setBlurSensitive: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [blurSensitive, setBlurSensitive] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_blur_sensitive');
    if (stored === 'true') {
      setBlurSensitive(true);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('admin_blur_sensitive', blurSensitive ? 'true' : 'false');
  }, [blurSensitive]);

  return (
    <PrivacyContext.Provider value={{ blurSensitive, setBlurSensitive }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

// Helper component to blur text
export function BlurredText({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  const { blurSensitive } = usePrivacy();
  
  return (
    <span 
      className={`${className} ${blurSensitive ? 'blur-sm select-none' : ''}`}
      style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
    >
      {children}
    </span>
  );
}

// Helper component specifically for phone numbers
export function BlurredPhone({ 
  phone, 
  className = '' 
}: { 
  phone: string; 
  className?: string;
}) {
  const { blurSensitive } = usePrivacy();
  
  return (
    <span 
      className={`${className} ${blurSensitive ? 'blur-sm select-none' : ''}`}
      style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
    >
      {phone}
    </span>
  );
}

// Helper component specifically for names
export function BlurredName({ 
  name, 
  className = '' 
}: { 
  name: string; 
  className?: string;
}) {
  const { blurSensitive } = usePrivacy();
  
  return (
    <span 
      className={`${className} ${blurSensitive ? 'blur-sm select-none' : ''}`}
      style={blurSensitive ? { filter: 'blur(4px)', userSelect: 'none' } : {}}
    >
      {name}
    </span>
  );
}

