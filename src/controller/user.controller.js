require("dotenv").config();
const bcrypt = require("bcrypt");
const usermodel = require("../modeling/user");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await usermodel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new usermodel({
      username,
      email,
      password: hashedPassword,
      // role: role,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await usermodel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Remove password field before sending response
    const userObj = user.toObject(); // Convert to a plain JS object
    delete userObj.password; // Delete password field

    if (user.role === process.env.ROLE) {
      const admin_access_token = jwt.sign(
        { id: user._id },
        process.env.ADMIN_ACCESS_TOKEN,
        {
          expiresIn: "1d",
        }
      );

      const oneday = 24 * 60 * 60 * 1000;
      const expiresin = Date.now() + oneday;

      res.status(200).json({
        message: "Login successful",
        expiresin: expiresin,
        admin_access_token: admin_access_token,
        user: userObj, // Use userObj without password
      });
    } else if (!user.role) {
      const user_access_token = jwt.sign(
        { id: user._id },
        process.env.USER_ACCESS_TOKEN,
        {
          expiresIn: "1d",
        }
      );

      const oneday = 24 * 60 * 60 * 1000;
      const expiresin = Date.now() + oneday;

      res.status(200).json({
        message: "Login successful",
        expiresin: expiresin,
        user_access_token: user_access_token,
        user: userObj, // Use userObj without password
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { register, login };
