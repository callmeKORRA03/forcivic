import mongoose, { Document, Schema } from 'mongoose';

export interface ICitizen extends Document {
  fullName: string;
  email: string;
  password?: string;
  phonenumber?: string;
  civicId?: string;
  isVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitizenSchema: Schema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
    },
    phonenumber: {
      type: String,
    },
    civicId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const CitizenModel = mongoose.model<ICitizen>('Citizen', CitizenSchema);