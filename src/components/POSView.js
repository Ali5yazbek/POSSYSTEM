import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, Package } from 'lucide-react';

const POSView = ({ products, ingredients = [], cart, onAddToCart, onUpdateCartQuantity, onCheckout }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = useMemo(() => ['All', ...new Set(products.map(p => p.category))], [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const categoryMatch = filter === 'All' || product.category === filter;
      const searchMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [products, filter, searchTerm]);

  const ingredientsMap = useMemo(() => {
    const map = new Map();
    (ingredients || []).forEach(ing => map.set(ing.id, ing));
    return map;
  }, [ingredients]);

  // helpers
  const fmtQty = (n) => {
    if (n === null || n === undefined) return '0';
    const num = parseFloat(n);
    return Number.isInteger(num) ? String(num) : String(num.toFixed(3)).replace(/\.?0+$/, '');
  };

  const expandRecipe = (item) => {
    if (item.is_bundle) return [];
    const recipe = item.recipeItems || [];
    return recipe.map(r => {
      const ing = ingredientsMap.get(r.ingredient_id);
      const lineCost = (ing?.cost_per_unit || 0) * (r.quantity || 0);
      return {
        id: r.ingredient_id,
        name: ing?.name ?? `#${r.ingredient_id}`,
        qty: r.quantity,
        unit: ing?.unit_of_measurement ?? '',
        lineCost
      };
    });
  };

  const getUnitCost = (item) => {
    if (item.is_bundle) {
      return (item.items || []).reduce(
        (sum, sub) => sum + ((sub.production_cost || 0) * (sub.quantityInBundle || 1)),
        0
      );
    }
    const fromRecipe = (item.recipeItems || []).reduce((sum, r) => {
      const ing = ingredientsMap.get(r.ingredient_id);
      return sum + ((ing?.cost_per_unit || 0) * (r.quantity || 0));
    }, 0);
    return fromRecipe || item.production_cost || 0;
  };

  const cartSubtotal = useMemo(
    () => cart.reduce((total, item) => total + item.price * item.quantity, 0),
    [cart]
  );

  const cartCostTotal = useMemo(
    () => cart.reduce((total, item) => total + getUnitCost(item) * item.quantity, 0),
    [cart, ingredientsMap]
  );

  const cartTotal = cartSubtotal; // no tax

  return (
    <div className="flex h-full">
      {/* Product Selection Area */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">{t('pointOfSale')}</h2>
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

        {/* Category Filters */}
        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
                filter === category ? 'bg-indigo-500 text-white' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} onAddToCart={() => onAddToCart(product)} />
            ))}
          </div>
        </div>
      </div>

      {/* Cart Area */}
      <div className="w-96 bg-gray-900 p-6 flex flex-col shadow-lg">
        <h3 className="text-2xl font-bold mb-4">{t('currentOrder')}</h3>
        <div className="flex-1 overflow-y-auto -mr-6 pr-6">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">{t('cartIsEmpty')}</p>
          ) : (
            cart.map(item => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateCartQuantity}
                expandRecipe={expandRecipe}
                getUnitCost={getUnitCost}
                fmtQty={fmtQty}
              />
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex justify-between text-lg text-gray-400 mb-2">
              <span>{t('cost') || 'Cost'}</span>
              <span>SAR{cartCostTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg mb-2">
              <span>{t('subtotal')}</span>
              <span>SAR{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-2xl font-bold mb-6">
              <span>{t('total')}</span>
              <span>SAR{cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={() => onCheckout('Cash')}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {t('checkout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => (
  <button
    onClick={onAddToCart}
    className="relative bg-gray-700 rounded-lg p-4 text-left flex flex-col h-full hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
  >
    {product.is_bundle && (
      <div className="absolute top-2 right-2 bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center">
        <Package size={12} className="mr-1" />
        Bundle
      </div>
    )}
    <div className="w-full h-24 bg-gray-500 rounded-md mb-3"></div>
    <div className="flex-1">
      <h4 className="font-semibold">{product.name}</h4>
      <p className="text-gray-400 text-sm">{product.category}</p>
      {product.is_bundle && product.items && (
        <div className="mt-2 text-xs text-gray-300">
          {product.items.map(item => (
            <p key={item.id}>• {item.quantityInBundle}x {item.name}</p>
          ))}
        </div>
      )}
    </div>
    <p className="text-lg font-bold mt-2">SAR{product.price.toFixed(2)}</p>
  </button>
);

const CartItem = ({ item, onUpdateQuantity, expandRecipe, getUnitCost, fmtQty }) => {
  const unitCost = getUnitCost(item);
  const totalCost = unitCost * item.quantity;
  const subtotal = item.price * item.quantity;

  const recipe = !item.is_bundle ? expandRecipe(item) : [];

  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="font-semibold">{item.name}</p>

        {/* Bundle composition */}
        {item.is_bundle && item.items && (
          <div className="pl-2 mt-1 text-xs text-gray-400">
            {item.items.map(sub => (
              <div key={sub.id} className="flex gap-2">
                <span className="truncate">• {sub.name}</span>
                <span className="shrink-0 whitespace-nowrap">{sub.quantityInBundle}x</span>
              </div>
            ))}
          </div>
        )}

        {/* Recipe lines (clean one-liners) */}
        {!item.is_bundle && recipe.length > 0 && (
          <div className="pl-2 mt-1 text-xs text-gray-300 space-y-1">
            {recipe.map(r => (
              <div key={r.id} className="flex items-baseline gap-2">
                <span className="grow truncate">• {r.name}</span>
                <span className="shrink-0 whitespace-nowrap text-gray-400">{fmtQty(r.qty)} {r.unit}</span>
                <span className="shrink-0 whitespace-nowrap text-gray-500">SAR{r.lineCost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <p className="text-gray-400 text-sm mt-1">
          Subtotal: SAR{subtotal.toFixed(2)}
        </p>
        <p className="text-gray-400 text-sm">
          Cost: SAR{totalCost.toFixed(2)}
        </p>
      </div>
      <div className="flex items-center">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value, 10))}
          className="w-16 bg-gray-800 border border-gray-700 rounded-md text-center mx-2"
        />
        <p className="font-bold w-16 text-right">SAR{subtotal.toFixed(2)}</p>
        <button onClick={() => onUpdateQuantity(item.id, 0)} className="ml-2 text-gray-500 hover:text-red-400">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default POSView;
