import React, { useState, useEffect, KeyboardEvent } from "react";
import axios from "axios";

interface Product {
  barcode: string;
  prod_name: string;
  prod_price: number;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIndex, setSelectedProductIndex] = useState<
    number | null
  >(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    // Fetch products from PHP backend
    const fetchProducts = async () => {
      try {
        const response = await axios.get<Product[]>(
          "http://localhost/phpdata/fetch_products.php"
        );

        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else {
          console.error("Unexpected response format:", response.data);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (products.length === 0) return; // No products to navigate

    if (event.key === "ArrowUp") {
      setSelectedProductIndex((prevIndex) =>
        prevIndex !== null && prevIndex > 0 ? prevIndex - 1 : prevIndex
      );
    } else if (event.key === "ArrowDown") {
      setSelectedProductIndex((prevIndex) =>
        prevIndex !== null && prevIndex < products.length - 1
          ? prevIndex + 1
          : prevIndex
      );
    } else if (event.key === "Enter" && selectedProductIndex !== null) {
      setSelectedProduct(products[selectedProductIndex]);
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProductIndex, products]);

  return (
    <div>
      <h1>Product List</h1>
      <table className="text-xl min-w-full">
        <thead>
          <tr className="bg-blue-800">
            <th className="bg-blue-800 w-full">Product Name</th>
            <th className="bg-blue-800 w-full">Price</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => (
            <tr
              key={product.barcode}
              className={selectedProductIndex === index ? "bg-blue-300" : ""}
            >
              <td className="py-4 px-6 text-black">{product.prod_name}</td>
              <td className="py-4 px-6 text-black">₱{product.prod_price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {selectedProduct && (
        <div>
          <h2>Selected Product</h2>
          <p>Barcode: {selectedProduct.barcode}</p>
          <p>Name: {selectedProduct.prod_name}</p>
          <p>Price: ₱{selectedProduct.prod_price.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
