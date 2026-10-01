import mongoose, { Schema, Document } from 'mongoose';

export interface IDataset extends Document {
  name: string;
  description: string;
  currentVersion: string;
  totalRecords: number;
  totalFeatures: number;
  fileSize: number;
  filePath?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DatasetSchema = new Schema<IDataset>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    currentVersion: { type: String, default: 'v1.0' },
    totalRecords: { type: Number, default: 0 },
    totalFeatures: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    filePath: { type: String },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

export const Dataset = mongoose.model<IDataset>('Dataset', DatasetSchema);
