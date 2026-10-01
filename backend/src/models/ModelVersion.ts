import mongoose, { Schema, Document } from 'mongoose';

export interface IModelVersion extends Document {
  modelName: string;
  version: string;
  modelType: string; // e.g. "Graph Neural Network (GNN)", "Random Forest + Execution Graph", "Rule-Based Pattern Matcher"
  description: string;
  datasetVersionId?: mongoose.Types.ObjectId;
  experimentRunId?: mongoose.Types.ObjectId;
  metricsSummary: {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    latencyMs: number;
  };
  configArtifact: {
    threshold: number;
    patternRulesCount: number;
    graphNodesCount: number;
    simulatedWeights?: Record<string, number>;
  };
  status: 'Development' | 'Staging' | 'Production' | 'Archived';
  isSimulated: boolean;
  registeredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ModelVersionSchema = new Schema<IModelVersion>(
  {
    modelName: { type: String, required: true, default: '3Age-ThreatEngine' },
    version: { type: String, required: true, unique: true },
    modelType: { type: String, default: 'Graph-Based Behavioral Threat Engine' },
    description: { type: String, default: '' },
    datasetVersionId: { type: Schema.Types.ObjectId, ref: 'DatasetVersion' },
    experimentRunId: { type: Schema.Types.ObjectId, ref: 'ExperimentRun' },
    metricsSummary: {
      precision: { type: Number, default: 0.94 },
      recall: { type: Number, default: 0.91 },
      f1Score: { type: Number, default: 0.925 },
      falsePositiveRate: { type: Number, default: 0.03 },
      latencyMs: { type: Number, default: 12.4 }
    },
    configArtifact: {
      threshold: { type: Number, default: 0.65 },
      patternRulesCount: { type: Number, default: 12 },
      graphNodesCount: { type: Number, default: 45 },
      simulatedWeights: { type: Schema.Types.Mixed, default: {} }
    },
    status: {
      type: String,
      enum: ['Development', 'Staging', 'Production', 'Archived'],
      default: 'Development'
    },
    isSimulated: { type: Boolean, default: true },
    registeredBy: { type: String, default: 'System Analyst' }
  },
  { timestamps: true }
);

export const ModelVersion = mongoose.model<IModelVersion>('ModelVersion', ModelVersionSchema);
