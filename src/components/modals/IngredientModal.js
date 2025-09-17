import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const IngredientModal = ({ isOpen, onClose, onSave, ingredient }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    unit_of_measurement: '',
    cost_per_unit: '',
    stock_quantity: '',
    low_stock_threshold: 10, // Add new field with default
  });

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name || '',
        unit_of_measurement: ingredient.unit_of_measurement || '',
        cost_per_unit: ingredient.cost_per_unit || '',
        stock_quantity: ingredient.stock_quantity || '',
        low_stock_threshold: ingredient.low_stock_threshold || 10,
      });
    } else {
      setFormData({
        name: '',
        unit_of_measurement: '',
        cost_per_unit: '',
        stock_quantity: '',
        low_stock_threshold: 10,
      });
    }
  }, [ingredient, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{ingredient ? t('editIngredient') : t('addNewIngredient')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('ingredientName')}</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="unit_of_measurement" className="block text-sm font-medium text-gray-300">{t('unitExample')}</label>
                <input
                  type="text"
                  name="unit_of_measurement"
                  id="unit_of_measurement"
                  value={formData.unit_of_measurement}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="cost_per_unit" className="block text-sm font-medium text-gray-300">{t('costPerUnit')}</label>
                <input
                  type="number"
                  name="cost_per_unit"
                  id="cost_per_unit"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-300">{t('initialStockQuantity')}</label>
                <input
                  type="number"
                  name="stock_quantity"
                  id="stock_quantity"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
                />
              </div>
              <div>
                <label htmlFor="low_stock_threshold" className="block text-sm font-medium text-gray-300">Low Stock Alert</label>
                <input
                  type="number"
                  name="low_stock_threshold"
                  id="low_stock_threshold"
                  min="0"
                  value={formData.low_stock_threshold}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="mt-8 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              {t('saveIngredient')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientModal;

