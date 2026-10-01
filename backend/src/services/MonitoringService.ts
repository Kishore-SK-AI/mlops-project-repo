import { InferenceRequest } from '../models/InferenceRequest';
import { PipelineRun } from '../models/PipelineRun';
import { Deployment } from '../models/Deployment';
import { MonitoringEvent } from '../models/MonitoringEvent';
import { DatasetVersion } from '../models/DatasetVersion';

export class MonitoringService {
  public static async getOverview() {
    const totalRequests = await InferenceRequest.countDocuments();
    const attackRequests = await InferenceRequest.countDocuments({ prediction: 'ATTACK' });
    const normalRequests = await InferenceRequest.countDocuments({ prediction: 'NORMAL' });

    const recentReqs = await InferenceRequest.find().sort({ createdAt: -1 }).limit(100);
    const avgLatency = recentReqs.length > 0
      ? Number((recentReqs.reduce((acc, r) => acc + r.processingTimeMs, 0) / recentReqs.length).toFixed(2))
      : 12.4;

    const pipelineRuns = await PipelineRun.countDocuments();
    const activeDeployments = await Deployment.countDocuments({ status: 'ACTIVE' });
    const totalDeployments = await Deployment.countDocuments();

    const events = await MonitoringEvent.find().sort({ createdAt: -1 }).limit(10);

    return {
      totalRequests,
      attackRequests,
      normalRequests,
      avgLatencyMs: avgLatency,
      pipelineRuns,
      activeDeployments,
      totalDeployments,
      recentEvents: events,
      simulatedMode: true
    };
  }

  public static async getLatencyMetrics() {
    const requests = await InferenceRequest.find().sort({ createdAt: -1 }).limit(50);
    const latencyTimeSeries = requests.reverse().map((r, idx) => ({
      index: idx + 1,
      requestId: r.requestId,
      latencyMs: r.processingTimeMs,
      timestamp: r.createdAt
    }));

    return {
      avgLatencyMs: requests.length > 0 ? (requests.reduce((a, b) => a + b.processingTimeMs, 0) / requests.length).toFixed(2) : 12.0,
      timeSeries: latencyTimeSeries
    };
  }

  public static async getDataQuality() {
    const versions = await DatasetVersion.find().sort({ createdAt: -1 });
    const totalMissing = versions.reduce((a, v) => a + (v.validationSummary?.missingValues || 0), 0);
    const totalDuplicates = versions.reduce((a, v) => a + (v.validationSummary?.duplicateRows || 0), 0);

    return {
      datasetsAnalyzed: versions.length,
      totalMissingValues: totalMissing,
      totalDuplicateRows: totalDuplicates,
      versionsSummary: versions.map(v => ({
        version: v.version,
        records: v.recordCount,
        status: v.validationStatus,
        summary: v.validationSummary
      }))
    };
  }

  public static async getDriftMetrics() {
    const requests = await InferenceRequest.find().sort({ createdAt: -1 }).limit(100);
    
    // Group score distribution
    const lowRisk = requests.filter(r => r.anomalyScore < 0.35).length;
    const medRisk = requests.filter(r => r.anomalyScore >= 0.35 && r.anomalyScore < 0.65).length;
    const highRisk = requests.filter(r => r.anomalyScore >= 0.65).length;

    const total = requests.length || 1;

    return {
      driftDetected: false,
      driftStatus: 'STABLE (Simulated Reference Distribution)',
      distribution: [
        { category: 'Low Anomaly (0.00-0.35)', count: lowRisk, percentage: Number(((lowRisk / total) * 100).toFixed(1)) },
        { category: 'Medium Anomaly (0.35-0.65)', count: medRisk, percentage: Number(((medRisk / total) * 100).toFixed(1)) },
        { category: 'High Threat (0.65-1.00)', count: highRisk, percentage: Number(((highRisk / total) * 100).toFixed(1)) }
      ],
      sampleCount: requests.length
    };
  }

  public static async getErrors() {
    return await MonitoringEvent.find({ type: { $in: ['ERROR', 'QUALITY'] } })
      .sort({ createdAt: -1 })
      .limit(30);
  }
}
