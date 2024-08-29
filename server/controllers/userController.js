
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { upload, compressAndSaveImage } from "../middlewares/multerConfig.js";

// Helper function to create a token
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


// Get user profile
const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Find user by ID and exclude the password from the response
    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// Change password
const changePassword = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Email, current password, and new password are required' });
  }

  try {
    await User.changePassword(email, currentPassword, newPassword);
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

    // Store token in the user's activeTokens array
    user.activeTokens.push(token);
    await user.save();

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

      const { name,phoneNumber, email, password, role } = req.body;

      if (!name ||!phoneNumber || !email || !password) {
        return res.status(400).json({ error: 'Name, email, phoneNumber and password are required.' });
      }

      try {
        const profileImage = req.file ? req.file.filename : null;
        const user = await User.signup(name,phoneNumber, email, password, profileImage, role);

        // Create a token with the role
        const token = createToken(user._id, user.role);

        // Store token in the user's activeTokens array
        user.activeTokens.push(token);
        await user.save();

        res.status(200).json({ userid: user._id, name,phoneNumber, email, profileImage, role: user.role, token });
      } catch (err) {
        console.log(err);
        
        res.status(400).json({ error: err.message });
      }
    });
  });
};

const editUserDetails = (req, res) => {
  upload.single('profileImage')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    // Compress image if provided
    compressAndSaveImage(req, res, async (compressErr) => {
      if (compressErr) {
        return res.status(400).json({ error: compressErr.message });
      }

      const userId = req.params.id;
      const { name, phoneNumber, email, password, role, designation, workingPlace } = req.body;

      try {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Update user details
        if (name !== undefined) user.name = name;
        if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;
        if (email !== undefined) user.email = email;
        if (password !== undefined) {
          // Hash the password before saving
          user.password = await bcrypt.hash(password, 10);
        }
        if (role !== undefined && ['User', 'Admin'].includes(role)) user.role = role;

        // Update designation only if it's provided in the request
        if (designation !== undefined) {
          user.designation = designation;
        }

        // Update workingPlace only if it's provided in the request
        if (workingPlace !== undefined) {
          user.workingPlace = workingPlace;
        }

        // Update profileImage if a file is uploaded
        if (req.file) {
          user.profileImage = req.file.filename;
        }

        await user.save();
        res.status(200).json({ message: 'User details updated successfully', user });
      } catch (err) {
        console.log(err);
        res.status(400).json({ error: err.message });
      }
    });
  });
};





// const deleteUser = async (req, res) => {
//   const userId = req.params.id;

//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Option 1: Soft delete (mark as deactivated)
//     user.isDeactivated = true;
//     await user.save();

//     // Option 2: Hard delete (permanently remove the user)
//     // await user.remove();

//     res.status(200).json({ message: 'User deleted successfully' });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };


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

const checkTokenValidity = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided, access denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the user is deactivated
    const user = await User.findById(decoded.id);
    if (!user || user.isDeactivated) {
      return res.status(403).json({ valid: false, error: 'User account is deactivated or not found' });
    }

    res.status(200).json({ valid: true });
  } catch (err) {
    res.status(401).json({ valid: false, error: 'Invalid token, access denied' });
  }
};

export { loginUser, signupUser, changePassword, getAllUsers,getUserProfile,editUserDetails, deactivateUser, activateUser,checkTokenValidity };
