import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Plus, Trash2 } from 'lucide-react';

// The modal now correctly receives `categories` to populate the dropdown.
const ProductModal = ({ isOpen, onClose, onSave, product, allProducts, allIngredients, categories }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    category_id: '', // Corrected to use category_id
    selling_price: '',
    stock: '',
    description: '',
    is_bundle: false,
    items: [], 
    recipeItems: [],
  });
  
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        category_id: product.category_id || '', // Corrected to use category_id
        selling_price: product.selling_price || product.price || '',
        stock: product.stock || 0,
        description: product.description || '',
        is_bundle: product.is_bundle || false,
        items: product.items?.map(item => ({ item_product_id: item.id, quantity: item.quantityInBundle })) || [],
        recipeItems: product.recipeItems?.map(item => ({ ingredient_id: item.ingredient_id, quantity: item.quantity })) || [],
      });
    } else {
      setFormData({
        name: '', category_id: '', selling_price: '', stock: 0, description: '', is_bundle: false, items: [], recipeItems: [],
      });
    }
    setSelectedProductToAdd('');
    setSelectedIngredientToAdd('');
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleAddItemToBundle = () => {
    if (!selectedProductToAdd || formData.items.some(item => item.item_product_id === parseInt(selectedProductToAdd))) return;
    const newItem = { item_product_id: parseInt(selectedProductToAdd), quantity: 1 };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setSelectedProductToAdd('');
  };

  const handleRemoveItemFromBundle = (productId) => {
    setFormData(prev => ({ ...prev, items: prev.items.filter(item => item.item_product_id !== productId) }));
  };

  const handleItemQuantityChange = (productId, newQuantity) => {
     const quantity = Math.max(1, parseInt(newQuantity, 10) || 1);
     setFormData(prev => ({ ...prev, items: prev.items.map(item => item.item_product_id === productId ? { ...item, quantity } : item) }));
  };
  
  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientToAdd || formData.recipeItems.some(item => item.ingredient_id === parseInt(selectedIngredientToAdd))) return;
    const newItem = { ingredient_id: parseInt(selectedIngredientToAdd), quantity: 1 };
    setFormData(prev => ({ ...prev, recipeItems: [...prev.recipeItems, newItem] }));
    setSelectedIngredientToAdd('');
  };

  const handleRemoveIngredientFromRecipe = (ingredientId) => {
    setFormData(prev => ({ ...prev, recipeItems: prev.recipeItems.filter(item => item.ingredient_id !== ingredientId) }));
  };

  const handleRecipeItemQuantityChange = (ingredientId, newQuantity) => {
     const quantity = Math.max(0.01, parseFloat(newQuantity) || 0.01);
     setFormData(prev => ({ ...prev, recipeItems: prev.recipeItems.map(item => item.ingredient_id === ingredientId ? { ...item, quantity } : item) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };
  
  if (!isOpen) return null;

  const addableProducts = allProducts.filter(p => !p.is_bundle && p.id !== product?.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{product ? t('editProduct') : t('addNewProduct')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('productName')}</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-300">{t('category')}</label>
                <select 
                    name="category_id" 
                    id="category_id" 
                    value={formData.category_id} 
                    onChange={handleChange} 
                    required 
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"
                >
                    <option value="" disabled>Select a category</option>
                    {/* The categories prop is now correctly used here */}
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="selling_price" className="block text-sm font-medium text-gray-300">{t('price')}</label>
                <input type="number" name="selling_price" id="selling_price" step="0.01" min="0" value={formData.selling_price} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500" />
              </div>
            </div>
             <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">{t('descriptionOptional')}</label>
                <textarea name="description" id="description" rows="2" value={formData.description} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500"></textarea>
            </div>
            
            <div className="flex items-center justify-between bg-gray-700/50 p-3 rounded-md">
              <label htmlFor="is_bundle" className="font-medium text-gray-200">{t('isThisABundle')}</label>
              <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="is_bundle" id="is_bundle" checked={formData.is_bundle} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
            </div>
            
            {formData.is_bundle && (
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold">{t('bundleItems')}</h3>
                <div className="flex gap-2">
                  <select value={selectedProductToAdd} onChange={(e) => setSelectedProductToAdd(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500">
                    <option value="" disabled>{t('selectProductToAdd')}</option>
                    {addableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <button type="button" onClick={handleAddItemToBundle} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus size={16} /></button>
                </div>
                <div className="space-y-2">
                  {formData.items.map(item => {
                    const itemDetails = allProducts.find(p => p.id === item.item_product_id);
                    return (
                      <div key={item.item_product_id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                        <span>{itemDetails?.name || '...'}</span>
                        <div className="flex items-center gap-2">
                          <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemQuantityChange(item.item_product_id, e.target.value)} className="w-16 bg-gray-800 border-gray-600 rounded-md text-center" />
                          <button type="button" onClick={() => handleRemoveItemFromBundle(item.item_product_id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {!formData.is_bundle && (
              <div className="space-y-4 pt-4 border-t border-gray-700">
                <h3 className="text-lg font-semibold">{t('recipeIngredients')}</h3>
                <div className="flex gap-2">
                  <select value={selectedIngredientToAdd} onChange={(e) => setSelectedIngredientToAdd(e.target.value)} className="flex-1 bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500">
                    <option value="" disabled>{t('selectIngredientToAdd')}</option>
                    {allIngredients?.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  <button type="button" onClick={handleAddIngredientToRecipe} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><Plus size={16} /></button>
                </div>
                <div className="space-y-2">
                  {formData.recipeItems.map(item => {
                    const itemDetails = allIngredients.find(i => i.id === item.ingredient_id);
                    return (
                      <div key={item.ingredient_id} className="flex items-center justify-between bg-gray-700 p-2 rounded-md">
                        <span>{itemDetails?.name || '...'}</span>
                        <div className="flex items-center gap-2">
                            <input type="number" step="0.01" min="0.01" value={item.quantity} onChange={(e) => handleRecipeItemQuantityChange(item.ingredient_id, e.target.value)} className="w-20 bg-gray-800 border-gray-600 rounded-md text-center" />
                            <span className="text-sm text-gray-400">{itemDetails?.unit_of_measurement}</span>
                            <button type="button" onClick={() => handleRemoveIngredientFromRecipe(item.ingredient_id)} className="text-red-500 hover:text-red-400"><Trash2 size={18} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                 <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-300">{t('stockQuantityOverride')}</label>
                    <input type="number" name="stock" id="stock" min="0" value={formData.stock} onChange={handleChange} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-indigo-500" />
                </div>
              </div>
            )}
          </div>
          <div className="mt-8 flex justify-end space-x-4 pt-6 border-t border-gray-700">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">{t('cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{t('saveProduct')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;

