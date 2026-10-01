import mongoose from 'mongoose';
import { ModelVersion, IModelVersion } from '../models/ModelVersion';
import { ExperimentRun } from '../models/ExperimentRun';
import { DatasetVersion } from '../models/DatasetVersion';
import { Deployment } from '../models/Deployment';

export class ModelRegistryService {
  public static async getAllModelVersions() {
    return await ModelVersion.find()
      .populate('datasetVersionId')
      .populate('experimentRunId')
      .sort({ createdAt: -1 });
  }

  public static async getModelVersionById(id: string) {
    return await ModelVersion.findById(id)
      .populate('datasetVersionId')
      .populate('experimentRunId');
  }

  public static async registerModelVersion(data: {
    modelName?: string;
    version?: string;
    modelType?: string;
    description?: string;
    experimentRunId?: string;
    datasetVersionId?: string;
  }) {
    let expRun = null;
    if (data.experimentRunId) {
      expRun = await ExperimentRun.findById(data.experimentRunId);
    }

    const versionStr = data.version || `v1.${Date.now().toString().slice(-4)}`;

    const metricsSummary = expRun
      ? {
          precision: expRun.metrics.precision,
          recall: expRun.metrics.recall,
          f1Score: expRun.metrics.f1Score,
          falsePositiveRate: expRun.metrics.falsePositiveRate,
          latencyMs: expRun.metrics.inferenceLatencyMs
        }
      : {
          precision: 0.94,
          recall: 0.91,
          f1Score: 0.925,
          falsePositiveRate: 0.03,
          latencyMs: 12.0
        };

    const modelVersion = new ModelVersion({
      modelName: data.modelName || '3Age-GraphThreatEngine',
      version: versionStr,
      modelType: data.modelType || 'Graph-Based Behavioral Threat Engine',
      description: data.description || 'Registered via Model Registry UI',
      datasetVersionId: data.datasetVersionId || expRun?.datasetVersionId,
      experimentRunId: expRun ? expRun._id : undefined,
      metricsSummary,
      configArtifact: {
        threshold: expRun?.parameters?.threshold || 0.65,
        patternRulesCount: 12,
        graphNodesCount: 48
      },
      status: 'Development',
      isSimulated: true
    });

    await modelVersion.save();
    return modelVersion;
  }

  public static async updateStatus(id: string, status: 'Development' | 'Staging' | 'Production' | 'Archived') {
    const modelVersion = await ModelVersion.findById(id);
    if (!modelVersion) throw new Error('Model version not found');

    modelVersion.status = status;
    await modelVersion.save();
    return modelVersion;
  }

  public static async getLineage(id: string) {
    const modelVersion = await ModelVersion.findById(id)
      .populate('datasetVersionId')
      .populate('experimentRunId');

    if (!modelVersion) throw new Error('Model version not found');

    const deployments = await Deployment.find({ modelVersionId: id });

    return {
      modelVersion,
      experimentRun: modelVersion.experimentRunId,
      datasetVersion: modelVersion.datasetVersionId,
      deployments
    };
  }
}
