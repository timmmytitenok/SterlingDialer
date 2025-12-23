'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User info blur modes
export type UserInfoBlurMode = 'none' | 'last_name' | 'full';

interface PrivacyContextType {
  blurSensitive: boolean;
  setBlurSensitive: (value: boolean) => void;
  userInfoBlur: UserInfoBlurMode;
  setUserInfoBlur: (value: UserInfoBlurMode) => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  blurSensitive: false,
  setBlurSensitive: () => {},
  userInfoBlur: 'none',
  setUserInfoBlur: () => {},
});

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [blurSensitive, setBlurSensitive] = useState(false);
  const [userInfoBlur, setUserInfoBlur] = useState<UserInfoBlurMode>('none');

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin_blur_sensitive');
    if (stored === 'true') {
      setBlurSensitive(true);
    }
    
    const storedUserBlur = localStorage.getItem('admin_user_info_blur') as UserInfoBlurMode;
    if (storedUserBlur && ['none', 'last_name', 'full'].includes(storedUserBlur)) {
      setUserInfoBlur(storedUserBlur);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem('admin_blur_sensitive', blurSensitive ? 'true' : 'false');
  }, [blurSensitive]);

  useEffect(() => {
    localStorage.setItem('admin_user_info_blur', userInfoBlur);
  }, [userInfoBlur]);

  return (
    <PrivacyContext.Provider value={{ blurSensitive, setBlurSensitive, userInfoBlur, setUserInfoBlur }}>
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

// Helper function to blur user's display name based on mode
export function getBlurredDisplayName(displayName: string, mode: UserInfoBlurMode): { 
  text: string; 
  shouldBlur: boolean;
  blurredPart?: string;
} {
  if (mode === 'none') {
    return { text: displayName, shouldBlur: false };
  }
  
  if (mode === 'full') {
    return { text: displayName, shouldBlur: true };
  }
  
  // mode === 'last_name' - blur only the last name
  const parts = displayName.trim().split(' ');
  if (parts.length <= 1) {
    // Only one word, blur it as it could be their name
    return { text: displayName, shouldBlur: true };
  }
  
  // Keep first name visible, blur the rest
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  return { 
    text: firstName, 
    shouldBlur: false, 
    blurredPart: lastName 
  };
}

// Helper component for user display name with blur options
export function BlurredUserName({ 
  displayName, 
  className = '' 
}: { 
  displayName: string; 
  className?: string;
}) {
  const { userInfoBlur } = usePrivacy();
  const result = getBlurredDisplayName(displayName, userInfoBlur);
  
  if (userInfoBlur === 'none') {
    return <span className={className}>{displayName}</span>;
  }
  
  if (userInfoBlur === 'full') {
    return (
      <span 
        className={`${className} select-none`}
        style={{ filter: 'blur(8px)', userSelect: 'none' }}
      >
        {displayName}
      </span>
    );
  }
  
  // Last name blur mode
  if (result.blurredPart) {
    return (
      <span className={className}>
        {result.text}{' '}
        <span 
          className="select-none"
          style={{ filter: 'blur(8px)', userSelect: 'none' }}
        >
          {result.blurredPart}
        </span>
      </span>
    );
  }
  
  // Single name - blur it
  return (
    <span 
      className={`${className} select-none`}
      style={{ filter: 'blur(8px)', userSelect: 'none' }}
    >
      {displayName}
    </span>
  );
}

// Helper component for user email with blur
export function BlurredUserEmail({ 
  email, 
  className = '' 
}: { 
  email: string; 
  className?: string;
}) {
  const { userInfoBlur } = usePrivacy();
  
  if (userInfoBlur === 'none') {
    return <span className={className}>{email}</span>;
  }
  
  // Both 'full' and 'last_name' modes blur the email
  return (
    <span 
      className={`${className} select-none`}
      style={{ filter: 'blur(8px)', userSelect: 'none' }}
    >
      {email}
    </span>
  );
}

