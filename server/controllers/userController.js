import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { upload, compressAndSaveImage } from "../middlewares/multerConfig.js";

const createToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }

    const usersData = users.map(user => ({
      userid: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isDeactivated: user.isDeactivated,
      role: user.role
    }));

    res.status(200).json(usersData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required' });
  }

  try {
    const user = await User.changePassword(email, newPassword);

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // Create token with the role
    const token = createToken(user._id, user.role);

    res.status(200).json({ userid: user._id, email, name: user.name, role: user.role, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Signup user
const signupUser = async (req, res) => {
  upload.single('profileImage')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Compress image
    compressAndSaveImage(req, res, async (compressErr) => {
      if (compressErr) {
        return res.status(400).json({ error: compressErr.message });
      }

      const { name, email, password, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      try {
        const profileImage = req.file ? req.file.filename : null;
        const user = await User.signup(name, email, password, profileImage, role);

        // Create a token with the role
        const token = createToken(user._id, user.role);

        res.status(200).json({ userid: user._id, name, email, profileImage, role: user.role, token });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
  });
};

// Deactivate user
const deactivateUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.deactivateUser(userId);

    res.status(200).json({ message: 'User deactivated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Activate user
const activateUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.activateUser(userId);

    res.status(200).json({ message: 'User activated successfully', user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export { loginUser, signupUser, changePassword, getAllUsers, deactivateUser, activateUser };
