import mongoose, { Schema, Document } from 'mongoose';

export interface IExperimentRun extends Document {
  experimentId: mongoose.Types.ObjectId;
  runName: string;
  runNumber: number;
  datasetVersionId?: mongoose.Types.ObjectId;
  parameters: {
    algorithm: string;
    threshold: number;
    graphDepth?: number;
    learningRate?: number;
    randomSeed?: number;
    simMode: boolean;
    featuresUsed?: string[];
  };
  metrics: {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    inferenceLatencyMs: number;
    recordCount: number;
    durationMs: number;
  };
  isDemoData: boolean;
  notes?: string;
  createdAt: Date;
}

const ExperimentRunSchema = new Schema<IExperimentRun>(
  {
    experimentId: { type: Schema.Types.ObjectId, ref: 'Experiment', required: true },
    runName: { type: String, required: true },
    runNumber: { type: Number, required: true },
    datasetVersionId: { type: Schema.Types.ObjectId, ref: 'DatasetVersion' },
    parameters: {
      algorithm: { type: String, required: true },
      threshold: { type: Number, default: 0.65 },
      graphDepth: { type: Number, default: 3 },
      learningRate: { type: Number, default: 0.001 },
      randomSeed: { type: Number, default: 42 },
      simMode: { type: Boolean, default: true },
      featuresUsed: [String]
    },
    metrics: {
      precision: { type: Number, required: true },
      recall: { type: Number, required: true },
      f1Score: { type: Number, required: true },
      falsePositiveRate: { type: Number, required: true },
      inferenceLatencyMs: { type: Number, required: true },
      recordCount: { type: Number, required: true },
      durationMs: { type: Number, required: true }
    },
    isDemoData: { type: Boolean, default: true },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const ExperimentRun = mongoose.model<IExperimentRun>('ExperimentRun', ExperimentRunSchema);
