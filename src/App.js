import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Toaster, toast } from 'react-hot-toast';
import { ShoppingCart, Package, BarChart2, ClipboardList, LogOut, Languages, Tag } from 'lucide-react';
import { supabase } from './supabaseClient';
import LoginView from './components/LoginView';
import POSView from './components/POSView';
import ProductManagementView from './components/ProductManagementView';
import ReportsView from './components/ReportsView';
import IngredientManagementView from './components/IngredientManagementView';
import CategoryManagementView from './components/CategoryManagementView';

function App() {
  const { t, i18n } = useTranslation();
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('pos');
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [sales, setSales] = useState([]);

  useEffect(() => {
    const checkSessionAndFetchProfile = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: profile, error } = await supabase.from('users').select('role').eq('id', session.user.id).single();
        if (error) console.error("Error fetching user profile:", error);
        else if (profile) setUserRole(profile.role);
      }
      setLoading(false);
    };
    checkSessionAndFetchProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (!newSession) setUserRole(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session && userRole) {
      fetchData();
    }
  }, [session, userRole]);

  async function fetchData() {
    const [productsRes, bundleItemsRes, ingredientsRes, recipesRes, salesRes, categoriesRes] = await Promise.all([
      supabase.from('products').select(`*, categories(name)`).order('id', { ascending: true }),
      supabase.from('bundle_items').select('*'),
      supabase.from('ingredients').select(`*, inventory(stock_quantity)`),
      supabase.from('recipes').select('*'),
      supabase.from('transactions').select(`*, transaction_items(*)`).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('name', { ascending: true })
    ]);

    const { data: categoriesData, error: categoriesError } = categoriesRes;
    if(categoriesError) console.error('Error fetching categories:', categoriesError);
    else setCategories(categoriesData);

    const { data: recipesData, error: recipesError } = recipesRes;
    if (recipesError) console.error('Error fetching recipes:', recipesError);
    
    const { data: ingredientsData, error: ingredientsError } = ingredientsRes;
    let formattedIngredients = [];
    if(ingredientsError) console.error('Error fetching ingredients:', ingredientsError);
    else {
        formattedIngredients = ingredientsData.map(ing => ({
          ...ing,
          stock_quantity: (ing.inventory && ing.inventory.length > 0) ? ing.inventory[0].stock_quantity : 0
        }));
        setIngredients(formattedIngredients);
    }

    const { data: productsData, error: productsError } = productsRes;
    const { data: bundleItemsData, error: bundleItemsError } = bundleItemsRes;
    if (productsError) console.error('Error fetching products:', productsError);
    if (bundleItemsError) console.error('Error fetching bundle items:', bundleItemsError);
    if (productsData) {
        const productsWithPrice = productsData.map(p => ({ 
            ...p, 
            price: p.selling_price, 
            stock: p.stock || 0,
            category: p.categories?.name || 'Uncategorized'
        }));
        const enrichedProducts = productsWithPrice.map(product => {
            let finalProduct = { ...product };
            if (product.is_bundle && bundleItemsData) {
                finalProduct.items = bundleItemsData.filter(item => item.bundle_product_id === product.id).map(bundleItem => {
                    const productDetails = productsWithPrice.find(p => p.id === bundleItem.item_product_id);
                    return { ...productDetails, quantityInBundle: bundleItem.quantity };
                });
            }
            if (!product.is_bundle && recipesData) {
                const productRecipeItems = recipesData.filter(r => r.product_id === product.id);
                finalProduct.recipeItems = productRecipeItems;
                const cost = productRecipeItems.reduce((totalCost, recipeItem) => {
                    const ingredient = formattedIngredients.find(ing => ing.id === recipeItem.ingredient_id);
                    return ingredient ? totalCost + (ingredient.cost_per_unit * recipeItem.quantity) : totalCost;
                }, 0);
                finalProduct.production_cost = cost;
            }
            return finalProduct;
        });
        setProducts(enrichedProducts);
    }

    const { data: salesData, error: salesError } = salesRes;
    if (salesError) console.error('Error fetching sales:', salesError);
    else {
        const enrichedSales = salesData.map(sale => ({ ...sale, id: sale.id, date: new Date(sale.created_at).toLocaleDateString(), items: sale.transaction_items, total: sale.total_amount, payment: sale.payment_method }));
        setSales(enrichedSales);
    }
  }
  
  const handleLogin = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else setAuthError(null);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully!');
  };

  const addCategory = (categoryData) => {
    toast.promise(supabase.from('categories').insert(categoryData), { loading: 'Adding...', success: () => { fetchData(); return 'Category added!'; }, error: 'Failed to add.' });
  };

  const updateCategory = (categoryId, categoryData) => {
    toast.promise(supabase.from('categories').update(categoryData).eq('id', categoryId), { loading: 'Updating...', success: () => { fetchData(); return 'Category updated!'; }, error: 'Failed to update.' });
  };

  const deleteCategory = (categoryId) => {
    toast.promise(supabase.from('categories').delete().eq('id', categoryId), { loading: 'Deleting...', success: () => { fetchData(); return 'Category deleted!'; }, error: 'Delete failed.' });
  };

  const addProduct = (formData) => {
    const { items, recipeItems, ...productDataForm } = formData;
    const productData = { ...productDataForm, selling_price: parseFloat(productDataForm.selling_price) || 0, stock: parseInt(productDataForm.stock, 10) || 0, category_id: parseInt(productDataForm.category_id, 10) || null };
    if (productData.is_bundle) productData.stock = 0;
    const promise = supabase.from('products').insert(productData).select().single()
      .then(async (result) => {
        if (result.error) throw result.error;
        const newProductId = result.data.id;
        if (productData.is_bundle) {
          const bundleItemsToInsert = items.map(item => ({ bundle_product_id: newProductId, ...item }));
          const { error } = await supabase.from('bundle_items').insert(bundleItemsToInsert);
          if (error) throw error;
        } else if (recipeItems) {
          const recipeItemsToInsert = recipeItems.map(item => ({ product_id: newProductId, ...item }));
          const { error } = await supabase.from('recipes').insert(recipeItemsToInsert);
          if (error) throw error;
        }
        return result;
      });
    toast.promise(promise, { loading: 'Adding...', success: () => { fetchData(); return 'Product added!'; }, error: (err) => `Failed to add product: ${err.message}` });
  };

  const updateProduct = (productId, formData) => {
    const { items, recipeItems, ...productDataForm } = formData;
    const productData = { ...productDataForm, selling_price: parseFloat(productDataForm.selling_price) || 0, stock: parseInt(productDataForm.stock, 10) || 0, category_id: parseInt(productDataForm.category_id, 10) || null };
    if (productData.is_bundle) productData.stock = 0;
    const promise = supabase.from('products').update(productData).eq('id', productId)
      .then(async (result) => {
        if (result.error) throw result.error;
        await Promise.all([
            supabase.from('bundle_items').delete().eq('bundle_product_id', productId),
            supabase.from('recipes').delete().eq('product_id', productId)
        ]);
        if (productData.is_bundle && items?.length > 0) {
            const bundleItemsToInsert = items.map(item => ({ bundle_product_id: productId, ...item }));
            const { error } = await supabase.from('bundle_items').insert(bundleItemsToInsert);
            if (error) throw error;
        } else if (!productData.is_bundle && recipeItems?.length > 0) {
            const recipeItemsToInsert = recipeItems.map(item => ({ product_id: productId, ...item }));
            const { error } = await supabase.from('recipes').insert(recipeItemsToInsert);
            if (error) throw error;
        }
        return result;
      });
    toast.promise(promise, { loading: 'Updating...', success: () => { fetchData(); return 'Product updated!'; }, error: (err) => `Update failed: ${err.message}` });
  };
  
  const deleteProduct = (productId) => {
    toast.promise(supabase.from('products').delete().eq('id', productId), { loading: 'Deleting...', success: () => { setProducts(prev => prev.filter(p => p.id !== productId)); return 'Product deleted!'; }, error: 'Delete failed.' });
  };

  const addIngredient = (formData) => {
    const { stock_quantity, ...ingredientDataForm } = formData;
    const ingredientData = { ...ingredientDataForm, cost_per_unit: parseFloat(ingredientDataForm.cost_per_unit) || 0, low_stock_threshold: parseInt(ingredientDataForm.low_stock_threshold, 10) || 10 };
    const stockQuantityNum = parseInt(stock_quantity, 10) || 0;
    const promise = supabase.from('ingredients').insert(ingredientData).select().single()
      .then(result => {
        if (result.error) throw result.error;
        return supabase.from('inventory').insert({ ingredient_id: result.data.id, stock_quantity: stockQuantityNum, stock_value: 0 });
      });
    toast.promise(promise, { loading: 'Adding...', success: () => { fetchData(); return 'Ingredient added!'; }, error: 'Failed to add.' });
  };

  const updateIngredient = (ingredientId, formData) => {
    const { stock_quantity, ...ingredientDataForm } = formData;
    const ingredientData = { ...ingredientDataForm, cost_per_unit: parseFloat(ingredientDataForm.cost_per_unit) || 0, low_stock_threshold: parseInt(ingredientDataForm.low_stock_threshold, 10) || 10 };
    const stockQuantityNum = parseInt(stock_quantity, 10) || 0;
    const promise = Promise.all([
      supabase.from('ingredients').update(ingredientData).eq('id', ingredientId),
      supabase.from('inventory').update({ stock_quantity: stockQuantityNum }).eq('ingredient_id', ingredientId)
    ]);
    toast.promise(promise, { loading: 'Updating...', success: () => { fetchData(); return 'Ingredient updated!'; }, error: 'Update failed.' });
  };

  const deleteIngredient = (ingredientId) => {
    toast.promise(supabase.from('ingredients').delete().eq('id', ingredientId), { loading: 'Deleting...', success: () => { setIngredients(prev => prev.filter(i => i.id !== ingredientId)); return 'Ingredient deleted!'; }, error: 'Delete failed.' });
  };

  const addToCart = (productToAdd) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productToAdd.id);
      if (existing) return prev.map(item => item.id === productToAdd.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...productToAdd, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, newQuantity) => {
    setCart(prev => {
      if (newQuantity <= 0) return prev.filter(item => item.id !== productId);
      return prev.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item);
    });
  };

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    // Remove tax
    // const taxAmount = subtotal * 0.15;
    // const totalAmount = subtotal + taxAmount;
    const totalAmount = subtotal;
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions').insert({ total_amount: totalAmount, /*tax_amount: taxAmount,*/ payment_method: paymentMethod }).select().single();
    if (transactionError) { toast.error('Checkout failed!'); return; }
    const transactionItems = cart.map(item => ({ transaction_id: transactionData.id, product_id: item.id, quantity: item.quantity, price_at_sale: item.price }));
    const { error: itemsError } = await supabase.from('transaction_items').insert(transactionItems);
    if (itemsError) { toast.error('Checkout failed!'); return; }
    const productStockDecrements = new Map();
    const ingredientStockDecrements = new Map();
    for (const cartItem of cart) {
        const fullProduct = products.find(p => p.id === cartItem.id);
        if (!fullProduct) continue;
        if (fullProduct.is_bundle && fullProduct.items) {
            for (const bundleSubItem of fullProduct.items) {
                productStockDecrements.set(bundleSubItem.id, (productStockDecrements.get(bundleSubItem.id) || 0) + (bundleSubItem.quantityInBundle * cartItem.quantity));
            }
        } else if (fullProduct.recipeItems && fullProduct.recipeItems.length > 0) {
            for (const recipeItem of fullProduct.recipeItems) {
                ingredientStockDecrements.set(recipeItem.ingredient_id, (ingredientStockDecrements.get(recipeItem.ingredient_id) || 0) + (recipeItem.quantity * cartItem.quantity));
            }
        } else {
             productStockDecrements.set(fullProduct.id, (productStockDecrements.get(fullProduct.id) || 0) + cartItem.quantity);
        }
    }
    const promises = [];
    for (const [productId, quantity] of productStockDecrements.entries()) {
      promises.push(supabase.rpc('decrement_stock', { product_id_to_update: productId, quantity_to_decrement: quantity }));
    }
    for (const [ingredientId, quantity] of ingredientStockDecrements.entries()) {
      promises.push(supabase.rpc('decrement_ingredient_stock', { ingredient_id_to_update: ingredientId, quantity_to_decrement: quantity }));
    }
    await Promise.all(promises);
    fetchData();
    setCart([]);
    toast.success('Checkout successful!');
  };

  if (loading) return <div className="bg-gray-800 h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!session) return <LoginView onLogin={handleLogin} error={authError} t={t} />;

  const renderContent = () => {
    switch (activeView) {
     case 'pos': return <POSView products={products} ingredients={ingredients} categories={categories} cart={cart} onAddToCart={addToCart} onUpdateCartQuantity={updateCartQuantity} onCheckout={handleCheckout} />;
      case 'products': return userRole === 'admin' ? <ProductManagementView products={products} categories={categories} allProducts={products} allIngredients={ingredients} userRole={userRole} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} /> : <div>Access Denied</div>;
      case 'ingredients': return userRole === 'admin' ? <IngredientManagementView ingredients={ingredients} userRole={userRole} onAddIngredient={addIngredient} onUpdateIngredient={updateIngredient} onDeleteIngredient={deleteIngredient} /> : <div>Access Denied</div>;
      case 'categories': return userRole === 'admin' ? <CategoryManagementView categories={categories} userRole={userRole} onAddCategory={addCategory} onUpdateCategory={updateCategory} onDeleteCategory={deleteCategory} /> : <div>Access Denied</div>;
      case 'reports': return userRole === 'admin' ? <ReportsView sales={sales} allProducts={products} /> : <div>Access Denied</div>;
      default: return <POSView products={products} ingredients={ingredients} categories={categories} cart={cart} onAddToCart={addToCart} onUpdateCartQuantity={updateCartQuantity} onCheckout={handleCheckout} />;
    }
  };
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#334155', color: '#fff' } }} />
      <div className="flex h-screen bg-gray-800 text-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <nav className="w-20 bg-gray-900 p-4 flex flex-col items-center justify-between">
            <div className="space-y-6">
                <SidebarIcon icon={<ShoppingCart size={28} />} text={t('pos')} active={activeView === 'pos'} onClick={() => setActiveView('pos')} language={i18n.language} />
                {userRole === 'admin' && (
                  <>
                    <SidebarIcon icon={<Package size={28} />} text={t('products')} active={activeView === 'products'} onClick={() => setActiveView('products')} language={i18n.language} />
                    <SidebarIcon icon={<Tag size={28} />} text={t('categories')} active={activeView === 'categories'} onClick={() => setActiveView('categories')} language={i18n.language} />
                    <SidebarIcon icon={<ClipboardList size={28} />} text={t('ingredients')} active={activeView === 'ingredients'} onClick={() => setActiveView('ingredients')} language={i18n.language} />
                    <SidebarIcon icon={<BarChart2 size={28} />} text={t('reports')} active={activeView === 'reports'} onClick={() => setActiveView('reports')} language={i18n.language} />
                  </>
                )}
            </div>
            <div className="space-y-6">
                <LanguageSwitcher onChangeLanguage={changeLanguage} currentLanguage={i18n.language} />
                <SidebarIcon icon={<LogOut size={28} />} text={t('signOut')} onClick={handleLogout} language={i18n.language} />
            </div>
        </nav>
        <main className="flex-1 overflow-y-auto">{renderContent()}</main>
      </div>
    </>
  );
}

const LanguageSwitcher = ({ onChangeLanguage, currentLanguage }) => {
  return (
    <div className="relative group">
        <button className="flex flex-col items-center justify-center h-16 w-16 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors duration-200">
            <Languages size={28} />
        </button>
        <div className="absolute bottom-full mb-2 w-24 p-1 rounded-md shadow-lg bg-gray-900 text-xs font-bold transition-all duration-200 scale-0 group-hover:scale-100 origin-bottom">
            <button 
                onClick={() => onChangeLanguage('en')}
                className={`w-full text-left px-2 py-1 rounded ${currentLanguage === 'en' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-700'}`}
            >
                English
            </button>
            <button 
                onClick={() => onChangeLanguage('ar')}
                className={`w-full text-left px-2 py-1 rounded ${currentLanguage === 'ar' ? 'bg-indigo-500 text-white' : 'hover:bg-gray-700'}`}
            >
                العربية
            </button>
        </div>
    </div>
  );
};


const SidebarIcon = ({ icon, text, active, onClick, language }) => (
  <button onClick={onClick} className={`relative flex flex-col items-center justify-center h-16 w-16 rounded-lg transition-colors duration-200 ${active ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'} group`}>
    {icon}
    <span className={`absolute w-auto p-2 m-2 min-w-max rounded-md shadow-md text-white bg-gray-900 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 ${language === 'ar' ? 'right-20 origin-right' : 'left-20 origin-left'}`}>
      {text}
    </span>
  </button>
);


export default App;


