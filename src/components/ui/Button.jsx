import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-500/50 relative overflow-hidden group',
        secondary: 'bg-slate-800 text-white hover:bg-slate-700 active:bg-slate-900 hover:-translate-y-0.5 active:translate-y-0 shadow-lg border border-slate-600',
        outline: 'border-2 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white active:bg-slate-900 hover:-translate-y-0.5 active:translate-y-0',
        danger: 'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-500/50',
        ghost: 'text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg font-semibold',
        icon: 'p-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

const Button = React.forwardRef(({ 
  className, 
  variant, 
  size, 
  isLoading = false, 
  children, 
  disabled, 
  ...props 
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
