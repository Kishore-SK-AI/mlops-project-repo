import mongoose, { Schema, Document } from 'mongoose';

export interface IExperiment extends Document {
  name: string;
  description: string;
  algorithm: string; // e.g. "Graph-Neural-Network", "Isolation-Forest", "Rule-Graph-Pattern-Matcher"
  status: 'ACTIVE' | 'ARCHIVED';
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExperimentSchema = new Schema<IExperiment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    algorithm: { type: String, default: 'Graph-Neural-Network' },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' },
    runCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Experiment = mongoose.model<IExperiment>('Experiment', ExperimentSchema);
