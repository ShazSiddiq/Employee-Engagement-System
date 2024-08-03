import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Joi from 'joi';

const signupSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(3)
    .max(50)
    .pattern(/^(?!\s*$)(?!^\d+$)[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Name must contain at least one non-space character and cannot be only numbers.',
    }),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  profileImage: Joi.required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  newPassword: Joi.string().min(6).required(),
});

const deactivateUserSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
});

// Mongoose schema definition
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
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
});

// Static method for user signup
userSchema.statics.signup = async function (name, email, password, profileImage, role) {
  // Validate input using Joi
  const { error } = signupSchema.validate({ name, email, password ,profileImage});
  if (error) {
    throw new Error(error.details[0].message);
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw new Error('Email already in use');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const user = await this.create({ name, email, password: hash, profileImage, role });

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
    throw new Error('Please enter your valid email');
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

// Static method for changing password
userSchema.statics.changePassword = async function (email, newPassword) {
  // Validate input using Joi
  const { error } = changePasswordSchema.validate({ email, newPassword });
  if (error) {
    throw new Error(error.details[0].message);
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw new Error('User not found');
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);

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
