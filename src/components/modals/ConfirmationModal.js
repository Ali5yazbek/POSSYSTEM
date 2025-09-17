import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <div className="mr-4 bg-red-500/20 p-2 rounded-full">
                <AlertTriangle className="text-red-500" size={24} />
            </div>
            <h2 className="text-2xl font-bold">{title || 'Confirm Action'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        
        <p className="text-gray-300 mb-8">
            {message || 'Are you sure you want to proceed? This action cannot be undone.'}
        </p>
        
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            {t('confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

