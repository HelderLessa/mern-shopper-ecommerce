import { createContext, useEffect, useState } from "react";

export const ShopContext = createContext(null);

const getDefaultCart = () => {
  let cart = {};
  for (let index = 0; index < 300 + 1; index++) {
    cart[index] = 0;
  }
  return cart;
};

const ShopContextProvider = (props) => {
  const [all_product, setAll_Product] = useState([]);
  const [cartItems, setCartItems] = useState(getDefaultCart());

  useEffect(() => {
    fetch("http://localhost:4000/allproducts")
      .then((response) => response.json())
      .then((data) => setAll_Product(data));
  }, []);

  useEffect(() => {
    const fetchCartData = async () => {
      if (localStorage.getItem("auth-token")) {
        try {
          const response = await fetch("http://localhost:4000/getcart", {
            method: "POST",
            headers: {
              Accept: "application/json",
              "auth-token": `${localStorage.getItem("auth-token")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({}),
          });

          const data = await response.json();
          if (response.ok) {
            setCartItems(data.cartData); // Atualiza o estado com os dados do backend
          } else {
            throw new Error(data.errors || "Failed to fetch cart data");
          }
        } catch (err) {
          console.error("Error fetching cart data:", err);
        }
      }
    };

    fetchCartData();
  }, []);

  const addToCart = async (itemId) => {
    if (localStorage.getItem("auth-token")) {
      try {
        const response = await fetch("http://localhost:4000/addtocart", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "auth-token": `${localStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId: itemId }),
        });

        const data = await response.json();

        if (response.ok) {
          setCartItems(data.cartData); // Atualiza o estado com o carrinho atualizado
        } else {
          throw new Error(data.errors ?? "Failed to add item to cart");
        }
      } catch (err) {
        console.error("Error adding to cart:", err);
      }
    } else {
      alert("You need to log in to add items to the cart!");
    }
  };

  const removeFromCart = async (itemId) => {
    if (localStorage.getItem("auth-token")) {
      try {
        const response = await fetch("http://localhost:4000/removefromcart", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "auth-token": `${localStorage.getItem("auth-token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId: itemId }),
        });

        const data = await response.json();

        if (response.ok) {
          // Atualiza o estado do carrinho com os dados retornados
          setCartItems(data.cartData);
        } else {
          throw new Error(data.errors ?? "Failed to remove item from cart");
        }
      } catch (err) {
        console.error("Error removing from cart:", err);
        alert("Failed to remove item from cart. Please try again!");
      }
    } else {
      alert("You need to log in to remove items from the cart!");
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = all_product.find(
          (product) => product.id === Number(item)
        );
        totalAmount += itemInfo.new_price * cartItems[item];
      }
    }
    return totalAmount;
  };

  const getTotalCartItems = () => {
    let totalItem = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalItem += cartItems[item];
      }
    }
    return totalItem;
  };

  const contextValue = {
    all_product,
    cartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    getTotalCartItems,
  };

  return (
    <ShopContext.Provider value={contextValue}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;
