import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Joi from 'joi';

// Joi schemas for validation
const signupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^(?!\s*$)(?!^\d+$)[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must contain at least one non-space character and cannot be only numbers.',
      'string.min': 'Name must be at least 3 characters long.',
      'string.max': 'Name cannot be more than 50 characters long.',
    }),
    phoneNumber: Joi.string()
    .pattern(/^[0-9]+$/)
    .min(10) // Minimum length for a mobile number (you can adjust this)
    .max(15) // Maximum length for a mobile number (you can adjust this)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must contain only digits from 0 to 9.',
      'string.min': 'Phone number must be at least 10 digits long.',
      'string.max': 'Phone number must be at most 15 digits long.',
      'string.empty': 'Phone number is required.',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email must be a valid email.',
  }),
  password: Joi.string().min(6).max(20).required().messages({
    'string.min': 'Password must be at least 6 characters long.',
    'string.max': 'Password cannot be more than 20 characters long.',
    'string.empty': 'Password cannot be empty',
    'any.required': 'Password is required',
  }),
  profileImage: Joi.required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

const deactivateUserSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

const activateUserSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

// Mongoose schema definition
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber:{
    type: String,
    // required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  designation:{
    type: String,
  },
  workingPlace:{
    type: String,
  },
  profileImage: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['User', 'Admin'],
    default: 'User'
  },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  isDeactivated: {
    type: Boolean,
    default: false,
  },
  activeTokens: [{ 
    type: String,
  }],  // Array to store active tokens
  resetPasswordToken: { type: String }, // Token for password reset
  resetPasswordExpires: { type: Date }, // Expiration time for reset token
});

// Static method for user signup
userSchema.statics.signup = async function (name,phoneNumber, email, password, profileImage, role) {
  // Validate input using Joi
  const { error } = signupSchema.validate({ name,phoneNumber, email, password, profileImage });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw new Error('Email already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({ name , phoneNumber, email, password: hash, profileImage, role });

  return user;
};

// Static method for user login
userSchema.statics.login = async function (email, password) {
  // Validate input using Joi
  const { error } = loginSchema.validate({ email, password });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw new Error("This email does not exist. Please enter a valid email.");
  }

  if (user.isDeactivated) {
    throw new Error('User is deactivated');
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    throw new Error('Incorrect password');
  }

  return user;
};

// change password
userSchema.statics.changePassword = async function (email, currentPassword, newPassword) {
  // Validate input using Joi
  const { error } = changePasswordSchema.validate({ email, currentPassword, newPassword });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify the current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  // Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

  // Update the password
  user.password = hash;
  await user.save();

  return user;
};


// Static method for deactivating a user
userSchema.statics.deactivateUser = async function (userId) {
  // Validate input using Joi
  const { error } = deactivateUserSchema.validate({ userId });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const user = await this.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  user.isDeactivated = true;
  user.activeTokens = [];  // Clear all active tokens
  await user.save();

  return user;
};

// Static method for activating a user
userSchema.statics.activateUser = async function (userId) {
  const { error } = activateUserSchema.validate({ userId });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const user = await this.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.isDeactivated = false;
  await user.save();

  return user;
};

const User = mongoose.model('User', userSchema);

export default User;
