import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Card from './Card';
import Button from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Sim',
  cancelText = 'Não',
  type = 'warning'
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          bgColor: 'bg-red-500 bg-opacity-20',
          borderColor: 'border-red-500 border-opacity-30',
          confirmVariant: 'danger' as const
        };
      case 'info':
        return {
          iconColor: 'text-blue-500',
          bgColor: 'bg-blue-500 bg-opacity-20',
          borderColor: 'border-blue-500 border-opacity-30',
          confirmVariant: 'primary' as const
        };
      default: // warning
        return {
          iconColor: 'text-yellow-500',
          bgColor: 'bg-yellow-500 bg-opacity-20',
          borderColor: 'border-yellow-500 border-opacity-30',
          confirmVariant: 'warning' as const
        };
    }
  };

  const styles = getTypeStyles();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2 ${styles.bgColor} rounded-full`}>
                <AlertTriangle className={`h-5 w-5 ${styles.iconColor}`} />
              </div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className={`p-4 ${styles.bgColor} ${styles.borderColor} border rounded-lg mb-6`}>
            <p className="text-white text-sm leading-relaxed">{message}</p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              {cancelText}
            </Button>
            <Button
              variant={styles.confirmVariant}
              onClick={handleConfirm}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ConfirmModal;