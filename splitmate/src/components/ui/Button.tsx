import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: string;
  full?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300',
  ghost:     'bg-transparent hover:bg-slate-100 text-slate-500 border-transparent',
  danger:    'bg-red-50 hover:bg-red-100 text-red-600 border-red-200',
  success:   'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
};

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-1.5',
  lg: 'h-11 px-5 text-sm gap-2',
};

export function Button({ variant = 'primary', size = 'md', icon, full, children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold rounded-lg border
        transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${sizeClasses[size]} ${full ? 'w-full' : ''} ${className}
      `}
      {...props}
    >
      {icon && <i className={`fi fi-rr-${icon} flex items-center`} style={{ fontSize: 13 }} />}
      {children}
    </button>
  );
}
