import mongoose, { Schema, Document } from 'mongoose';

export interface IMonitoringEvent extends Document {
  type: 'LATENCY' | 'ERROR' | 'DRIFT' | 'QUALITY' | 'DEPLOYMENT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  deploymentId?: mongoose.Types.ObjectId;
  message: string;
  details: Record<string, any>;
  timestamp: Date;
}

const MonitoringEventSchema = new Schema<IMonitoringEvent>(
  {
    type: {
      type: String,
      enum: ['LATENCY', 'ERROR', 'DRIFT', 'QUALITY', 'DEPLOYMENT'],
      required: true
    },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'CRITICAL'],
      default: 'INFO'
    },
    deploymentId: { type: Schema.Types.ObjectId, ref: 'Deployment' },
    message: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const MonitoringEvent = mongoose.model<IMonitoringEvent>('MonitoringEvent', MonitoringEventSchema);
