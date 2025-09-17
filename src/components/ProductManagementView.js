import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, Package, Search, AlertTriangle, ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import ProductModal from './modals/ProductModal';
import ConfirmationModal from './modals/ConfirmationModal';

const ProductManagementView = ({ products, categories, allProducts, allIngredients, userRole, onAddProduct, onUpdateProduct, onDeleteProduct }) => {
  const { t } = useTranslation();
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'ascending' });

  const isAdmin = userRole === 'admin';
  const LOW_STOCK_THRESHOLD = 10;

  const sortedAndFilteredProducts = useMemo(() => {
    let sortableProducts = [...products];

    sortableProducts = sortableProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key !== null) {
      sortableProducts.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'cost') {
          aValue = a.production_cost || 0;
          bValue = b.production_cost || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableProducts;
  }, [products, searchTerm, sortConfig]);

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
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    if (!isAdmin) return;
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    handleCloseProductModal();
  };
  
  const handleOpenConfirmModal = (productId) => {
    if (!isAdmin) return;
    setProductToDelete(productId);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setProductToDelete(null);
    setIsConfirmModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete);
    }
    handleCloseConfirmModal();
  };
  
  const calculateGrossMargin = (price, cost) => {
    if (!price || price === 0) return 0;
    const margin = ((price - cost) / price) * 100;
    return margin;
  };

  return (
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">{t('productManagement')}</h2>
          {isAdmin && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus size={20} className="mr-2" />
              {t('addProduct')}
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
                <th className="p-4">{t('category')}</th>
                <th className="p-4"><button onClick={() => requestSort('price')} className="flex items-center">{t('price')} {getSortIcon('price')}</button></th>
                <th className="p-4"><button onClick={() => requestSort('cost')} className="flex items-center">{t('cost')} {getSortIcon('cost')}</button></th>
                <th className="p-4">{t('grossMargin')}</th>
                <th className="p-4"><button onClick={() => requestSort('stock')} className="flex items-center">{t('stock')} {getSortIcon('stock')}</button></th>
                {isAdmin && <th className="p-4">{t('actions')}</th>}
              </tr>
            </thead>
            <tbody>
              {sortedAndFilteredProducts.map(product => {
                const cost = product.production_cost || 0;
                const margin = calculateGrossMargin(product.price, cost);
                const marginColor = margin > 50 ? 'text-green-400' : margin > 25 ? 'text-yellow-400' : 'text-red-400';
                const isLowStock = !product.is_bundle && product.stock < LOW_STOCK_THRESHOLD;
                
                return (
                  <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-700">
                    <td className="p-4">{product.id}</td>
                    <td className="p-4 font-semibold">
                      <div className="flex items-center">
                        <span>{product.name}</span>
                        {product.is_bundle && (
                          <span className="ml-3 flex items-center text-xs font-semibold bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full">
                            <Package size={12} className="mr-1" />
                            Bundle
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">{product.category}</td>
                    <td className="p-4">{product.price.toFixed(2)} SAR</td>
                    <td className="p-4 text-gray-400">{cost.toFixed(2)} SAR</td>
                    <td className={`p-4 font-semibold ${marginColor}`}>{margin.toFixed(1)}%</td>
                    <td className={`p-4 font-semibold ${isLowStock ? 'text-yellow-400' : ''}`}>
                      <div className="flex items-center">
                        {isLowStock && <AlertTriangle size={16} className="mr-2" />}
                        {product.is_bundle ? 'N/A' : product.stock}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <button onClick={() => handleOpenEditModal(product)} className="text-blue-400 hover:text-blue-300"><Edit size={20} /></button>
                          <button onClick={() => handleOpenConfirmModal(product.id)} className="text-red-500 hover:text-red-400"><Trash2 size={20} /></button>
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

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={handleCloseProductModal}
        onSave={handleSaveProduct}
        product={editingProduct}
        allProducts={allProducts}
        allIngredients={allIngredients}
        categories={categories}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title={t('deleteProductTitle')}
        message={t('deleteProductMessage')}
      />
    </>
  );
};

export default ProductManagementView;

