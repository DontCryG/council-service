import { forwardRef } from 'react';
import { cn } from '../../utils/cn';

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-300 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-4 py-2.5 text-white',
          'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.5)]',
          className
        )}
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
