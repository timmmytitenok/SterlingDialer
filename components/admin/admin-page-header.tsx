import { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4 mb-6 md:mb-8 pt-6 md:pt-0">
      <div>
        <h1 className="text-4xl md:text-4xl font-bold text-white mb-4 md:mb-2 px-2 md:px-0">
          {title}
        </h1>
        {description && (
          <p className="text-sm md:text-base text-gray-400 hidden md:block">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

