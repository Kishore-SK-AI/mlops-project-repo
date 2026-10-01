import mongoose, { Schema, Document } from 'mongoose';

export interface IInferenceRequest extends Document {
  requestId: string;
  deploymentId?: mongoose.Types.ObjectId;
  modelVersionId?: mongoose.Types.ObjectId;
  engineMode: string; // "SIMULATED / DEMO MODE"
  inputPayload: Record<string, any>;
  normalizedFeatures: Record<string, any>;
  graphAnalysis?: {
    processChain?: string[];
    isLivingOffTheLand?: boolean;
    suspiciousPathLength?: number;
    graphNodes?: Array<{ id: string; label: string; type: string }>;
    graphEdges?: Array<{ source: string; target: string; relationship: string }>;
  };
  prediction: 'ATTACK' | 'NORMAL';
  anomalyScore: number;
  threshold: number;
  reasonCodes: string[];
  processingTimeMs: number;
  createdAt: Date;
}

const InferenceRequestSchema = new Schema<IInferenceRequest>(
  {
    requestId: { type: String, required: true, unique: true },
    deploymentId: { type: Schema.Types.ObjectId, ref: 'Deployment' },
    modelVersionId: { type: Schema.Types.ObjectId, ref: 'ModelVersion' },
    engineMode: { type: String, default: 'SIMULATED / DEMO MODE' },
    inputPayload: { type: Schema.Types.Mixed, required: true },
    normalizedFeatures: { type: Schema.Types.Mixed, required: true },
    graphAnalysis: {
      processChain: [String],
      isLivingOffTheLand: Boolean,
      suspiciousPathLength: Number,
      graphNodes: [Schema.Types.Mixed],
      graphEdges: [Schema.Types.Mixed]
    },
    prediction: { type: String, enum: ['ATTACK', 'NORMAL'], required: true },
    anomalyScore: { type: Number, required: true },
    threshold: { type: Number, required: true },
    reasonCodes: { type: [String], default: [] },
    processingTimeMs: { type: Number, required: true }
  },
  { timestamps: true }
);

export const InferenceRequest = mongoose.model<IInferenceRequest>('InferenceRequest', InferenceRequestSchema);
