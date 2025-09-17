import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const CategoryModal = ({ isOpen, onClose, onSave, category }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    } else {
      setName('');
    }
  }, [category, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{category ? t('editCategory') : t('addNewCategory')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('categoryName')}</label>
            <input
              type="text"
              name="name"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
            />
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t('saveCategory')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;

