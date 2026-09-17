import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartInfo, setCartInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCart = useCallback(async () => {
    if (!user || !user.id_user) {
      setCartInfo(null);
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`http://localhost:3001/api/carts/user/${user.id_user}`);
      if (!res.ok) throw new Error('Ошибка загрузки корзины');
      const data = await res.json();
      setCartInfo(data.cart);
      setItems(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addToCart = async (service, qty = 1) => {
    if (!user) return { success: false, error: 'Необходима авторизация' };
    try {
      setError(null);
      let activeCartId = cartInfo?.id_cart;

      if (!activeCartId) {
        const cartRes = await fetch(`http://localhost:3001/api/carts/user/${user.id_user}`);
        const cartData = await cartRes.json();
        setCartInfo(cartData.cart);
        activeCartId = cartData.cart.id_cart;
      }

      const res = await fetch('http://localhost:3001/api/carts_items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart_id: activeCartId,
          service_id: service.id_service,
          quantity: qty,
        }),
      });

      if (!res.ok) throw new Error('Не удалось добавить в корзину');
      await loadCart();
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const updateQuantity = async (serviceId, quantity) => {
    if (!user) return;
    try {
      setError(null);
      let activeCartId = cartInfo?.id_cart;
      if (!activeCartId) {
        const cartRes = await fetch(`http://localhost:3001/api/carts/user/${user.id_user}`);
        const cartData = await cartRes.json();
        setCartInfo(cartData.cart);
        activeCartId = cartData.cart.id_cart;
      }

      if (quantity <= 0) {
        return await removeFromCart(serviceId);
      }

      const res = await fetch(`http://localhost:3001/api/carts_items/${activeCartId}/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error('Ошибка обновления количества');
      await loadCart();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeFromCart = async (serviceId) => {
    if (!user) return;
    try {
      setError(null);
      let activeCartId = cartInfo?.id_cart;
      if (!activeCartId) {
        const cartRes = await fetch(`http://localhost:3001/api/carts/user/${user.id_user}`);
        const cartData = await cartRes.json();
        setCartInfo(cartData.cart);
        activeCartId = cartData.cart.id_cart;
      }

      const res = await fetch(`http://localhost:3001/api/carts_items/${activeCartId}/${serviceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка удаления из корзины');
      await loadCart();
    } catch (err) {
      setError(err.message);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    try {
      setError(null);
      let activeCartId = cartInfo?.id_cart;
      if (!activeCartId) {
        const cartRes = await fetch(`http://localhost:3001/api/carts/user/${user.id_user}`);
        const cartData = await cartRes.json();
        setCartInfo(cartData.cart);
        activeCartId = cartData.cart.id_cart;
      }

      if (!activeCartId) return;

      const res = await fetch(`http://localhost:3001/api/carts/${activeCartId}/items`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Ошибка очистки корзины');
      setItems([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const totalCount = items.reduce((acc, item) => acc + (parseInt(item.quantity, 10) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        cart: items,
        cartInfo,
        loading,
        error,
        totalCount,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        reloadCart: loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}