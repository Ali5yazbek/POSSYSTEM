import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Search, AlertTriangle, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import IngredientModal from './modals/IngredientModal';
import ConfirmationModal from './modals/ConfirmationModal';

const IngredientManagementView = ({ ingredients, userRole, onAddIngredient, onUpdateIngredient, onDeleteIngredient }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [ingredientToDelete, setIngredientToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  const isAdmin = userRole === 'admin';

  const sortedAndFilteredIngredients = useMemo(() => {
    let sortableIngredients = [...ingredients];

    sortableIngredients = sortableIngredients.filter(ingredient =>
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key !== null) {
      sortableIngredients.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableIngredients;
  }, [ingredients, searchTerm, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
        return <ChevronsUpDown size={16} className="ml-2 opacity-30" />;
    }
    if (sortConfig.direction === 'ascending') {
        return <ChevronUp size={16} className="ml-2" />;
    }
    return <ChevronDown size={16} className="ml-2" />;
  };

  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingIngredient(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ingredient) => {
    if (!isAdmin) return;
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(null);
  };

  const handleSaveIngredient = (formData) => {
    if (editingIngredient) {
      onUpdateIngredient(editingIngredient.id, formData);
    } else {
      onAddIngredient(formData);
    }
    handleCloseModal();
  };
  
  const handleOpenConfirmModal = (ingredientId) => {
    if (!isAdmin) return;
    setIngredientToDelete(ingredientId);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIngredientToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (ingredientToDelete) {
      onDeleteIngredient(ingredientToDelete);
    }
    handleCloseConfirmModal();
  };

  return (
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{t('ingredientInventory')}</h2>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              {t('addIngredient')}
            </button>
          )}
        </div>
        
        <div className="mb-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={t('searchProducts')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg shadow-lg">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="border-b border-gray-700">
                <th className="p-4"><button onClick={() => requestSort('id')} className="flex items-center">{t('id')} {getSortIcon('id')}</button></th>
                <th className="p-4"><button onClick={() => requestSort('name')} className="flex items-center">{t('name')} {getSortIcon('name')}</button></th>
                <th className="p-4"><button onClick={() => requestSort('unit_of_measurement')} className="flex items-center">{t('unit')} {getSortIcon('unit_of_measurement')}</button></th>
                <th className="p-4"><button onClick={() => requestSort('cost_per_unit')} className="flex items-center">{t('costPerUnit')} {getSortIcon('cost_per_unit')}</button></th>
                <th className="p-4"><button onClick={() => requestSort('stock_quantity')} className="flex items-center">{t('stockQuantity')} {getSortIcon('stock_quantity')}</button></th>
                {isAdmin && <th className="p-4">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredIngredients.map(ingredient => {
                const isLowStock = ingredient.stock_quantity < ingredient.low_stock_threshold;
                return (
                  <tr key={ingredient.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-4">{ingredient.id}</td>
                    <td className="p-4 font-semibold">{ingredient.name}</td>
                    <td className="p-4">{ingredient.unit_of_measurement}</td>
                    <td className="p-4">{ingredient.cost_per_unit.toFixed(2)} SAR</td>
                    <td className={`p-4 font-semibold ${isLowStock ? 'text-yellow-400' : ''}`}>
                      <div className="flex items-center">
                        {isLowStock && <AlertTriangle size={16} className="mr-2" />}
                        {ingredient.stock_quantity}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenEditModal(ingredient)} className="text-blue-400 hover:text-blue-300">
                            <Edit size={20} />
                          </button>
                          <button onClick={() => handleOpenConfirmModal(ingredient.id)} className="text-red-500 hover:text-red-400">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <IngredientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveIngredient}
        ingredient={editingIngredient}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title={t('deleteIngredientTitle')}
        message={t('deleteIngredientMessage')}
      />
    </>
  );
};

export default IngredientManagementView;

