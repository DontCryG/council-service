import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import { X } from '@phosphor-icons/react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className,
  closeOnOutsideClick = true,
  hideCloseButton = false
}) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeOnOutsideClick ? onClose : undefined}
      />
      
      {/* Modal Panel */}
      <div 
        className={cn(
          'relative z-10 w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col',
          'animate-in fade-in zoom-in-95 duration-200',
          className
        )}
      >
        {/* Header (Optional) */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        )}
        
        {!title && !hideCloseButton && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-20 shadow-sm"
          >
            <X size={16} weight="bold" />
          </button>
        )}
        
        {/* Content */}
        <div className={cn("p-6 overflow-y-auto max-h-[90vh]", !title && "pt-6")}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
