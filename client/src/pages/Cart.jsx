import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCart, removeFromCartAPI, updateQuantityAPI } from '../app/features/cartSlice';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button/Button';

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, totalPrice } = useSelector((state) => state?.cart);
  const userId = useSelector((state) => state.user._id);

  const handleRemove = (productId) => {
    dispatch(removeFromCartAPI({ userId, productId }));
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity < 1) return; 
    dispatch(updateQuantityAPI({ userId, productId, quantity }));
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  useEffect(() => {

    dispatch(fetchCart(userId));
  }, [ handleRemove]);
  return (
    <div className="min-h-screen flex items-center justify-center flex-col bg-gray-50 px-4 mx-auto p-6 pt-24">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 leading-none">Shopping Cart</h1>

      {items?.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-500 text-lg">Your cart is empty.</p>
          <Link to="/products" className="text-blue-600 hover:underline mt-4 inline-block">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg p-6 w-full md:w-2/3 mx-auto">
          <ul className="space-y-6">
            {items?.map((item) => (
              <li key={item._id} className="flex items-center justify-between border-b pb-4 last:border-none">
                <Link to={`/products/${item.productId._id}`}>
                  <img
                    src={item.image}
                    alt={item.productId.name}
                    className="w-24 h-24 object-cover rounded"
                  />
                </Link>

                <div className='xs:w-full flex flex-col gap-2 xs:flex-row justify-end xs:justify-between'>
                <div className="flex flex-col xs:items-start items-end xs:mx-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {item.productId.name}
                  </h2>
                  <p className="text-gray-500 text-sm">
                    Price: {item.price.toFixed(2)} RS
                  </p>
                </div>

                <div className="flex xs:self-end xs:items-center gap-4">
                  <input
                    type="number"
                    value={item.quantity}
                    min="1"
                    className="w-16 p-2 border rounded-md text-center"
                    onChange={(e) =>
                      handleQuantityChange(item.productId._id, parseInt(e.target.value, 10))
                    }
                  />
                  <Button onClick={() => handleRemove(item.productId._id)} type="button" variant="danger" size="md">
                    Remove
                  </Button>
                </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-right">
            <h2 className="text-xl font-semibold text-gray-800">
              Total Price: {totalPrice?.toFixed(2)} RS
            </h2>
          </div>

          {/* Checkout Button */}
          <div className="mt-8 flex justify-end">
            <Button onClick={handleCheckout} variant="primary" size="lg" className="w-full sm:w-auto">
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
