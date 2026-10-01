import mongoose, { Schema, Document } from 'mongoose';

export interface IPipelineStage {
  name: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  startTime?: Date;
  endTime?: Date;
  durationMs?: number;
  logs: string[];
}

export interface IPipelineRun extends Document {
  runId: string;
  datasetId?: mongoose.Types.ObjectId;
  datasetVersionId?: mongoose.Types.ObjectId;
  config: {
    stages: string[];
    threshold?: number;
    graphExtraction?: boolean;
    features?: string[];
  };
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  stages: IPipelineStage[];
  durationMs: number;
  modelVersionId?: mongoose.Types.ObjectId;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PipelineRunSchema = new Schema<IPipelineRun>(
  {
    runId: { type: String, required: true, unique: true },
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset' },
    datasetVersionId: { type: Schema.Types.ObjectId, ref: 'DatasetVersion' },
    config: {
      stages: { type: [String], default: [] },
      threshold: { type: Number, default: 0.65 },
      graphExtraction: { type: Boolean, default: true },
      features: { type: [String], default: [] }
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'PENDING'
    },
    stages: [
      {
        name: { type: String, required: true },
        status: {
          type: String,
          enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED'],
          default: 'PENDING'
        },
        startTime: Date,
        endTime: Date,
        durationMs: Number,
        logs: [String]
      }
    ],
    durationMs: { type: Number, default: 0 },
    modelVersionId: { type: Schema.Types.ObjectId, ref: 'ModelVersion' },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

export const PipelineRun = mongoose.model<IPipelineRun>('PipelineRun', PipelineRunSchema);
