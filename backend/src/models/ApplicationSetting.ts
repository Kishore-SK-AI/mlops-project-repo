import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationSetting extends Document {
  projectName: string;
  description: string;
  defaultThreshold: number;
  demoEngineMode: string;
  maxUploadSizeBytes: number;
  pipelineDefaultConfig: {
    stages: string[];
    graphExtraction: boolean;
  };
  uiPreferences: {
    compactMode: boolean;
    refreshIntervalSeconds: number;
  };
  updatedAt: Date;
}

const ApplicationSettingSchema = new Schema<IApplicationSetting>(
  {
    projectName: { type: String, default: '3Age — Graph Based Threat Engine' },
    description: {
      type: String,
      default: 'Behavioral cybersecurity threat detection engine utilizing process parent-child graph reconstruction and MLOps lifecycle tracking.'
    },
    defaultThreshold: { type: Number, default: 0.65 },
    demoEngineMode: { type: String, default: 'SIMULATED / DEMO MODE' },
    maxUploadSizeBytes: { type: Number, default: 52428800 }, // 50MB
    pipelineDefaultConfig: {
      stages: {
        type: [String],
        default: [
          'Data Ingestion',
          'Data Validation',
          'Preprocessing',
          'Feature Engineering',
          'Graph Feature Construction',
          'Simulated Training',
          'Evaluation',
          'Model Registration'
        ]
      },
      graphExtraction: { type: Boolean, default: true }
    },
    uiPreferences: {
      compactMode: { type: Boolean, default: false },
      refreshIntervalSeconds: { type: Number, default: 10 }
    }
  },
  { timestamps: true }
);

export const ApplicationSetting = mongoose.model<IApplicationSetting>('ApplicationSetting', ApplicationSettingSchema);
