import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  'w-full bg-slate-900/50 backdrop-blur-sm border rounded-lg px-4 py-2.5 text-white focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'border-slate-700/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.5)]',
        error: 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const Input = React.forwardRef(({ className, label, error, variant, ...props }, ref) => {
  const currentVariant = error ? 'error' : (variant || 'default');
  
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(inputVariants({ variant: currentVariant, className }))}
        onKeyDown={(e) => {
          if (props.type === 'number') {
            const isDigit = /^\d$/.test(e.key);
            const isControl = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Delete', 'Enter', 'Escape'].includes(e.key);
            const isAction = e.ctrlKey || e.metaKey;
            if (!isDigit && !isControl && !isAction) {
              e.preventDefault();
            }
          }
          if (props.onKeyDown) props.onKeyDown(e);
        }}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-500 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
