import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  'rounded-xl border p-6 transition-all duration-300',
  {
    variants: {
      variant: {
        default: 'bg-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-xl shadow-black/20 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-500/10 hover:border-slate-600',
        glass: 'bg-slate-800/80 backdrop-blur-md border-slate-700/50 shadow-2xl',
        solid: 'bg-slate-800 border-slate-700/50 shadow-lg shadow-black/10',
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const Card = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant, className }))} {...props} />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mb-4', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn('text-xl font-bold text-white tracking-tight', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-400 mt-1', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-6 flex items-center', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
