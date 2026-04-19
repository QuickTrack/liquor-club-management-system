import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, USER_STATUS } from '../config/constants.js';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: keyof typeof ROLES;
  branchId: mongoose.Types.ObjectId;
  status: keyof typeof USER_STATUS;
  profilePicture?: string;
  employeeId: string;
  dateOfBirth?: Date;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  authMethod: 'password' | 'pin' | 'biometric';
  pin?: string; // hashed PIN for quick login
  biometricData?: {
    type: 'fingerprint' | 'face';
    enrolled: boolean;
    enrolledAt?: Date;
  };
  permissions: string[];
  lastLogin?: Date;
  lastLoginIP?: string;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  comparePin(candidatePin: string): Promise<boolean>;
  hasPermission(permission: string): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email'],
    },
    password: {
      type: String,
      required: function() { return this.authMethod === 'password'; },
      minlength: 8,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [/^\+?254[0-9]{9}$|^07[0-9]{8}$/, 'Invalid Kenyan phone number'],
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CASHIER,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: 'Branch',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    authMethod: {
      type: String,
      enum: ['password', 'pin', 'biometric'],
      default: 'password',
    },
    pin: {
      type: String,
      minlength: 4,
      maxlength: 6,
    },
    biometricData: {
      type: {
        type: String,
        enum: ['fingerprint', 'face'],
      },
      enrolled: { type: Boolean, default: false },
      enrolledAt: Date,
    },
    permissions: [
      {
        type: String,
      },
    ],
    lastLogin: Date,
    lastLoginIP: String,
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockedUntil: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ employeeId: 1 });
UserSchema.index({ branchId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function (this: IUser) {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  if (this.password) {
    try {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
      return next(err as Error);
    }
  }

  // Hash PIN if provided
  if (this.isModified('pin') && this.pin) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.pin = await bcrypt.hash(this.pin, salt);
    } catch (err) {
      return next(err as Error);
    }
  }

  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Compare PIN method
UserSchema.methods.comparePin = async function (candidatePin: string): Promise<boolean> {
  if (!this.pin) return false;
  return bcrypt.compare(candidatePin, this.pin);
};

// Check if user has specific permission
UserSchema.methods.hasPermission = function (permission: string): boolean {
  // Super admin has all permissions
  if (this.role === ROLES.SUPER_ADMIN) return true;

  // Admin has all branch-level permissions
  if (this.role === ROLES.ADMIN || this.role === ROLES.MANAGER) return true;

  return this.permissions.includes(permission);
};

// Update failed login attempts
UserSchema.methods.incrementLoginAttempts = function () {
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
  } else {
    this.failedLoginAttempts += 1;
  }
};

// Reset login attempts on successful login
UserSchema.methods.resetLoginAttempts = function (ip?: string) {
  this.failedLoginAttempts = 0;
  this.lockedUntil = undefined;
  this.lastLogin = new Date();
  if (ip) this.lastLoginIP = ip;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
