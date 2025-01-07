require("dotenv").config();
const port = process.env.PORT || 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const bcrypt = require("bcrypt");

app.use(express.json());
app.use(cors());

const saltRounds = 10;
const JWT_SECRET = process.env.JWT_SECRET;

// Database Connection With MongoDB
mongoose.connect(process.env.MONGO_URL);

// API Creation
app.get("/", (req, res) => {
  res.send("Express app is running.");
});

// Image Storage Engine
const upload = multer({
  storage: multer.diskStorage({
    destination: "./upload/images",
    filename: (req, file, cb) => {
      return cb(
        null,
        `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
      );
    },
  }),
});

// Creating Upload Endpoint for images

app.use("/images", express.static("upload/images"));

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Schema for Creating Products
const Product = mongoose.model("Product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  try {
    let products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
      id: id,
      name: req.body.name,
      image: req.body.image,
      category: req.body.category,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
    });

    await product.save();
    console.log("Saved");
    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (err) {
    console.error("Error adding product: ", err);
    res.status(500).json({ success: false, error: "Failed to add product" });
  }
});

// Creating API for deleting products
app.post("/removeproduct", async (req, res) => {
  try {
    await Product.findOneAndDelete({ id: req.body.id });
    console.log("Removed");
    res.json({
      success: true,
      name: req.body.name,
    });
  } catch (err) {
    console.error("Error removing product: ", err);
    res.status(500).json({ success: false, error: "Failed to remove product" });
  }
});

// Creating API for getting all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  console.log("All products fetched");
  res.send(products);
});

// Schema creating for User model
const Users = mongoose.model("User", {
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  cartData: {
    type: Object,
  },
  data: {
    type: Date,
    default: Date.now,
  },
});

// Creating Endpoint for registering the user ( SIGNUP )
app.post("/signup", async (req, res) => {
  try {
    // check if the user already exists
    let existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        errors: "This email address already exists",
      });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
      cart[i] = 0;
    }

    const hashedPassword = await bcrypt.hash(req.body.passowrd, saltRounds);
    const user = new Users({
      name: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      cartData: cart,
    });

    await user.save();

    const data = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(data, JWT_SECRET);

    res.json({ success: true, token });
  } catch (err) {
    console.error("Error signing up: ", err);
    res.status(500).json({ success: false, errors: "Failed to sign up!" });
  }
});

// Creating endpoint for user LOGIN
app.post("/login", async (req, res) => {
  try {
    let user = await Users.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, errors: "Invalid email or password!" });
    }

    const passCompare = await bcrypt.compare(req.body.passowrd, user.passowrd);
    if (!passCompare) {
      return res
        .status(400)
        .json({ success: false, errors: "Invalid email or password!" });
    }

    const data = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(data, JWT_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    console.log("Error loggin in: ", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// Creating endpoint for "new collection" data
app.get("/newcollections", async (req, res) => {
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log("NewCollection Fetched");
  res.send(newcollection);
});

// Creating endpoint for popular in women section
app.get("/popularinwomen", async (req, res) => {
  let products = await Product.find({ category: "women" });
  let popular_in_women = products.slice(0, 4);
  console.log("Popular in women fetched");
  res.send(popular_in_women);
});

// Creating middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using valid token" });
  } else {
    try {
      const data = jwt.verify(token, JWT_SECRET);
      req.user = data.user;
      next();
    } catch (err) {
      res
        .status(401)
        .send({ errors: "Please authenticate using a valid token" });
    }
  }
};

const updateCart = async (userId, itemId, quantity) => {
  const user = await Users.findById(userId);
  if (!user) throw new Error("User not found");

  const updatedCartData = {
    ...user.cartData,
    [itemId]: (user.cartData[itemId] || 0) + quantity,
  };

  if (updatedCartData[itemId] < 0) {
    updatedCartData[itemId] = 0;
  }

  await Users.findByIdAndUpdate(userId, { cartData: updatedCartData });
  return updatedCartData;
};

app.post("/addtocart", fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ errors: "Item ID is required" });
    }
    const cartData = await updateCart(req.user.id, req.body.itemId, 1);
    console.log("Added", req.body.itemId);
    res.status(200).json({ success: true, cartData });
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ errors: "Failed to add item to cart" });
  }
});

// Creating endpoint to remove product from cartdata
app.post("/removefromcart", fetchUser, async (req, res) => {
  try {
    const { itemId } = req.body;
    if (!itemId) {
      return res.status(400).json({ errors: "Item ID is required" });
    }

    const cartData = await updateCart(req.user.id, req.body.itemId, -1);

    console.log("Removed", itemId);
    res.status(200).json({ success: true, cartData });
  } catch (err) {
    console.error("Error removing from cart", err);
    res.status(500).json({ errors: "Failed to remove item from cart" });
  }
});

app.post("/getcart", fetchUser, async (req, res) => {
  try {
    const user = await Users.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ errors: "User not found" });
    }

    res.status(200).json({ cartData: user.cartData });
  } catch (err) {
    console.error("Error fetching cart:", err);
    res.status(500).json({ errors: "Failed to fetch cart data" });
  }
});

app.listen(port, (err) => {
  if (!err) {
    console.log("Server running on port " + port);
  } else {
    console.log("Error: " + err);
  }
});
