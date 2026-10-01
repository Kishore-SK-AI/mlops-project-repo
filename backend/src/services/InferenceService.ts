import { InferenceRequest } from '../models/InferenceRequest';
import { Deployment } from '../models/Deployment';
import { ModelVersion } from '../models/ModelVersion';
import { SimulatedInferenceEngine, InferenceInput, InferenceOutput } from './SimulatedInferenceEngine';
import { MonitoringEvent } from '../models/MonitoringEvent';

export class InferenceService {
  public static async predict(
    inputPayload: InferenceInput,
    deploymentId?: string
  ): Promise<InferenceOutput> {
    let deployment = null;
    let modelVersion = null;
    let threshold = 0.65;
    let modelName = '3Age-GraphThreatEngine';
    let modelVerStr = 'v1.0.0-sim';

    if (deploymentId) {
      deployment = await Deployment.findById(deploymentId).populate('modelVersionId');
      if (!deployment) throw new Error('Deployment target not found');

      if (deployment.status !== 'ACTIVE') {
        throw new Error(`Deployment "${deployment.name}" is currently INACTIVE. Active deployment required for inference.`);
      }

      if (deployment.modelVersionId) {
        modelVersion = deployment.modelVersionId as any;
        threshold = modelVersion.configArtifact?.threshold ?? 0.65;
        modelName = modelVersion.modelName;
        modelVerStr = modelVersion.version;
      }
    } else {
      // Pick first ACTIVE deployment if none passed
      deployment = await Deployment.findOne({ status: 'ACTIVE' }).populate('modelVersionId');
      if (deployment && deployment.modelVersionId) {
        modelVersion = deployment.modelVersionId as any;
        threshold = modelVersion.configArtifact?.threshold ?? 0.65;
        modelName = modelVersion.modelName;
        modelVerStr = modelVersion.version;
      }
    }

    // Call modular SimulatedInferenceEngine
    const result = await SimulatedInferenceEngine.predict(inputPayload, {
      threshold,
      modelName,
      modelVersion: modelVerStr
    });

    // Save persistent InferenceRequest
    const reqDoc = new InferenceRequest({
      requestId: result.requestId,
      deploymentId: deployment ? deployment._id : undefined,
      modelVersionId: modelVersion ? modelVersion._id : undefined,
      engineMode: result.engineMode,
      inputPayload,
      normalizedFeatures: result.normalizedFeatures,
      graphAnalysis: result.graphAnalysis,
      prediction: result.prediction,
      anomalyScore: result.anomalyScore,
      threshold: result.threshold,
      reasonCodes: result.reasonCodes,
      processingTimeMs: result.processingTimeMs
    });
    await reqDoc.save();

    // Increment request count on deployment
    if (deployment) {
      deployment.requestCount += 1;
      await deployment.save();
    }

    // Log monitoring events for critical attacks or high latency
    if (result.prediction === 'ATTACK') {
      await new MonitoringEvent({
        type: 'QUALITY',
        severity: 'WARNING',
        deploymentId: deployment ? deployment._id : undefined,
        message: `High Threat Attack Detected (Score: ${result.anomalyScore}, Req: ${result.requestId})`,
        details: { requestId: result.requestId, reasonCodes: result.reasonCodes, processChain: result.graphAnalysis.processChain }
      }).save();
    }

    return result;
  }

  public static async getHistory(limit: number = 50) {
    return await InferenceRequest.find()
      .populate('deploymentId', 'name environment')
      .populate('modelVersionId', 'version modelName')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  public static async getRequestById(requestId: string) {
    return await InferenceRequest.findOne({ requestId })
      .populate('deploymentId')
      .populate('modelVersionId');
  }
}
