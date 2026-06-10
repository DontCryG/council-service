import Modal from './Modal';
import Button from './Button';
import { WarningCircle } from '@phosphor-icons/react';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "ยืนยันการทำรายการ?", 
  message = "คุณแน่ใจหรือไม่ว่าต้องการทำรายการนี้?", 
  confirmText = "ยืนยัน", 
  cancelText = "ยกเลิก",
  isLoading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} hideCloseButton>
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
          <WarningCircle size={32} weight="fill" className="text-amber-500" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 mb-8 max-w-sm">
          {message}
        </p>
        <div className="flex gap-3 w-full">
          <Button 
            variant="ghost" 
            className="flex-1" 
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" 
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
