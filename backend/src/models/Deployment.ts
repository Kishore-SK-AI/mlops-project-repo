import mongoose, { Schema, Document } from 'mongoose';

export interface IDeployment extends Document {
  name: string;
  modelVersionId: mongoose.Types.ObjectId;
  environment: 'Staging' | 'Production';
  status: 'ACTIVE' | 'INACTIVE';
  endpointUrl: string;
  requestCount: number;
  lastHealthCheck: Date;
  isSimulated: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema = new Schema<IDeployment>(
  {
    name: { type: String, required: true, unique: true },
    modelVersionId: { type: Schema.Types.ObjectId, ref: 'ModelVersion', required: true },
    environment: { type: String, enum: ['Staging', 'Production'], default: 'Production' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    endpointUrl: { type: String, required: true },
    requestCount: { type: Number, default: 0 },
    lastHealthCheck: { type: Date, default: Date.now },
    isSimulated: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);
