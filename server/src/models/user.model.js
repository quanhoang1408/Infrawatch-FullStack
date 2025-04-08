// src/models/user.model.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Trước khi lưu, hash password nếu đã thay đổi
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// Phương thức kiểm tra password
userSchema.methods.isPasswordMatch = async function(password) {
  return bcrypt.compare(password, this.password);
};

// Phương thức chuyển đổi thành JSON (loại bỏ password)
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;