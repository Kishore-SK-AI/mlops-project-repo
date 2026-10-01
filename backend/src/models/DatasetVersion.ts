import mongoose, { Schema, Document } from 'mongoose';

export interface IColumnSchema {
  name: string;
  type: string;
  sampleValue?: any;
  nullCount: number;
}

export interface IDatasetVersion extends Document {
  datasetId: mongoose.Types.ObjectId;
  version: string;
  recordCount: number;
  featureCount: number;
  schemaDetails: IColumnSchema[];
  validationStatus: 'VALID' | 'WARNING' | 'FAILED';
  validationSummary: {
    missingValues: number;
    duplicateRows: number;
    schemaIssues: string[];
  };
  checksum: string;
  dvcTracked: boolean;
  dvcHash: string;
  dvcFile: string;
  dvcContent: string;
  fileSize: number;
  filePath: string;
  createdAt: Date;
}

const ColumnSchema = new Schema<IColumnSchema>(
  {
    name: { type: String, required: true },
    type: { type: String, required: true },
    sampleValue: { type: Schema.Types.Mixed },
    nullCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const DatasetVersionSchema = new Schema<IDatasetVersion>(
  {
    datasetId: { type: Schema.Types.ObjectId, ref: 'Dataset', required: true },
    version: { type: String, required: true },
    recordCount: { type: Number, required: true, default: 0 },
    featureCount: { type: Number, required: true, default: 0 },
    schemaDetails: { type: [ColumnSchema], default: [] },
    validationStatus: {
      type: String,
      enum: ['VALID', 'WARNING', 'FAILED'],
      default: 'VALID'
    },
    validationSummary: {
      missingValues: { type: Number, default: 0 },
      duplicateRows: { type: Number, default: 0 },
      schemaIssues: { type: [String], default: [] }
    },
    checksum: { type: String, default: '' },
    dvcTracked: { type: Boolean, default: true },
    dvcHash: { type: String, default: '' },
    dvcFile: { type: String, default: '' },
    dvcContent: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    filePath: { type: String, required: true }
  },
  { timestamps: true }
);

export const DatasetVersion = mongoose.model<IDatasetVersion>('DatasetVersion', DatasetVersionSchema);
