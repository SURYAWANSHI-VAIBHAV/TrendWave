import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAPI } from '../app/features/cartSlice';
import { getProductById } from '..';
import Button from '../components/Button/Button';
import LikeProduct from '../components/Like Product/LikeProduct';

const ProductDetails = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState('');
    const [selectedSize, setSelectedSize] = useState('Select Size');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const userId = useSelector((state) => state.user._id);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await getProductById(id);
                setProduct(response.data.data);
                setSelectedImage(response.data.data.image || '/default-image.jpg'); // Set default image
                setLoading(false);
            } catch (err) {
                setError('Product not found');
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    const handleAddToCart = () => {
        if (product && selectedSize !== 'Select Size') {
            dispatch(addToCartAPI({ userId, product: { id, price: product.price, image: selectedImage } }));
        } else {
            alert('Please select a size before adding to cart.');
        }
    };

    if (loading) {
        return <div className="container mx-auto p-4 text-center">Loading...</div>;
    }

    if (error) {
        return <div className="container mx-auto p-4 text-center text-red-600">{error}</div>;
    }

    if (!product) {
        return <div className="container mx-auto p-4 text-center">Product not found</div>;
    }

    // Calculate star rating
    const rating = product.rating || 0;
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
        <div className="container mx-auto py-10 px-4 md:px-20 mt-16">
            <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 flex justify-center">
                    <img
                        src={selectedImage || '/default-image.jpg'}
                        alt={product.name}
                        className="w-full max-w-md object-cover shadow-sm cursor-pointer mb-4"
                        onClick={() => setSelectedImage(product.image)}
                    />
                </div>
                <div className="md:w-1/2">
                    <div className='flex justify-end '>
                    <LikeProduct productId={product._id} className="text-xl"/>
                    </div>
                    <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
                    <p className="text-2xl font-semibold mb-4">₹{product.price?.toFixed(2)}</p>

                    <div className="flex items-center mb-4">
                        {[...Array(fullStars)].map((_, i) => (
                            <FaStar key={i} className="text-yellow-500" />
                        ))}
                        {hasHalfStar && <FaStarHalfAlt className="text-yellow-500" />}
                        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
                            <FaRegStar key={i} className="text-gray-300" />
                        ))}
                    </div>

                    <p className="text-gray-700 mb-4">{product.description}</p>

                    {product.sizes && product.sizes.length > 0 && (
                        <div className="mb-4">
                            <label htmlFor="size" className="block text-gray-700 font-medium mb-2">
                                Select Size:
                            </label>
                            <select
                                id="size"
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="border border-gray-300 bg-gray-50 py-2 px-4 w-40 "
                                aria-label="Select product size"
                            >
                                <option disabled>Select Size</option>
                                {product.sizes.map((size, index) => (
                                    <option key={index} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <Button
                        onClick={handleAddToCart}
                        size='xl'
                        className='flex-shrink'
                    >
                        Add to Cart
                    </Button>

                    <div className="mt-4 font-normal text-gray-700">
                        <p>Category: <span>{product.category}</span></p>
                        <p>Tags: <span>{product.tags?.join(', ')}</span></p>
                    </div>
                </div>
            </div>

            <div className="mt-16 border-b">
                <ul className="flex space-x-6 text-md font-semibold text-gray-600">
                    <li className="border-b-2 border-blue-600 py-3 px-6">Description</li>
                    <li className="py-3 px-6">Reviews (0)</li>
                </ul>
            </div>

            <div className="py-8 text-gray-700">
                <h2 className="text-lg mb-4 font-medium">Engaging Digital Marketing Customers</h2>
                <p>
                    A key objective is engaging digital marketing customers and allowing them to interact with the brand through servicing and delivery of digital media. Information is easy to access at a fast rate through the use of digital communications.
                </p>
                <p>
                    Users with access to the Internet can use many digital mediums, such as Facebook, YouTube, Forums, and Email, creating a multi-communication channel where information can be quickly exchanged around the world.
                </p>
            </div>
        </div>
    );
};

export default ProductDetails;
