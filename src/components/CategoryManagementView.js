import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import CategoryModal from './modals/CategoryModal'; // Import the dedicated modal
import ConfirmationModal from './modals/ConfirmationModal'; // Import the confirmation modal

const CategoryManagementView = ({ categories = [], userRole, onAddCategory, onUpdateCategory, onDeleteCategory }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const isAdmin = userRole === 'admin';

  const handleOpenAddModal = () => {
    if (!isAdmin) return;
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (category) => {
    if (!isAdmin) return;
    setEditingCategory(category);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSaveCategory = (categoryData) => {
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, categoryData);
    } else {
      onAddCategory(categoryData);
    }
    handleCloseModal();
  };
  
  const handleOpenConfirmModal = (categoryId) => {
    if (!isAdmin) return;
    setCategoryToDelete(categoryId);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setCategoryToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete);
    }
    handleCloseConfirmModal();
  };

  return (
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{t('categoryManagement')}</h2>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              {t('addCategory')}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-gray-900 rounded-lg shadow-lg">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-900">
              <tr className="border-b border-gray-700">
                <th className="p-4">{t('id')}</th>
                <th className="p-4">{t('name')}</th>
                {isAdmin && <th className="p-4">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {categories.map(category => (
                <tr key={category.id} className="border-b border-gray-800 hover:bg-gray-700">
                  <td className="p-4">{category.id}</td>
                  <td className="p-4 font-semibold">{category.name}</td>
                  {isAdmin && (
                    <td className="p-4">
                      <div className="flex space-x-2">
                        <button onClick={() => handleOpenEditModal(category)} className="text-blue-400 hover:text-blue-300">
                          <Edit size={20} />
                        </button>
                        <button onClick={() => handleOpenConfirmModal(category.id)} className="text-red-500 hover:text-red-400">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title={t('deleteCategoryTitle')}
        message={t('deleteCategoryMessage')}
      />
    </>
  );
};

export default CategoryManagementView;

