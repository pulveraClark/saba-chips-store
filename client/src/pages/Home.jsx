import { useRef } from "react";

function Home() {
  const productsRef = useRef(null);

  const products = [
    { id: 1, name: "Saba Chips Classic", price: 50, image: "🍟", desc: "Original flavor" },
    { id: 2, name: "Saba Chips BBQ", price: 55, image: "🔥", desc: "Smoky BBQ" },
    { id: 3, name: "Saba Chips Sweet", price: 60, image: "🍯", desc: "Sweet & crunchy" },
    { id: 4, name: "Saba Chips Spicy", price: 65, image: "🌶️", desc: "Fire hot!" },
  ];

  const scrollToProducts = () => {
    productsRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const handleAddToCart = (product) => {
    // 🛒 Simulate cart (future API)
    const cartItem = `${product.name} - ₱${product.price}`;
    alert(`${cartItem} added to cart! 🛒`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-500 to-green-600 text-white py-24 text-center px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Saba Chips
          </h1>
          <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto leading-relaxed opacity-95">
            Crispy, delicious banana chips made fresh daily with love ❤️
          </p>
          <button 
            onClick={scrollToProducts}
            className="bg-yellow-400 text-green-900 px-10 py-5 rounded-full text-xl font-bold hover:bg-yellow-500 shadow-2xl transform hover:scale-105 transition-all duration-300 mx-auto block"
          >
            Shop Now ↓
          </button>
        </div>
      </section>

      {/* Products Section */}
      <section ref={productsRef} className="px-6 py-20 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Our Delicious Chips
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Made from the freshest bananas, perfectly crispy every time
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl p-8 hover:-translate-y-4 transition-all duration-500 border border-gray-100 overflow-hidden hover:border-green-200"
            >
              {/* Product Image */}
              <div className="text-6xl mb-8 text-center p-6 bg-gradient-to-br from-green-50 to-yellow-50 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                {product.image}
              </div>
              
              {/* Product Info */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-green-600 transition-colors duration-300">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-8 leading-relaxed">{product.desc}</p>
                <div className="text-4xl font-bold text-green-600 mb-10">
                  ₱{product.price}
                </div>
                
                {/* Add to Cart */}
                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-green-900 py-5 rounded-2xl font-bold text-xl hover:from-yellow-500 hover:to-yellow-600 shadow-xl transform hover:scale-105 group-hover:shadow-2xl transition-all duration-300"
                >
                  Add to Cart 🛒
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;