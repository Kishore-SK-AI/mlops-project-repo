import mongoose from 'mongoose';
import { Deployment, IDeployment } from '../models/Deployment';
import { ModelVersion } from '../models/ModelVersion';
import { InferenceRequest } from '../models/InferenceRequest';
import { MonitoringEvent } from '../models/MonitoringEvent';

export class DeploymentService {
  public static async getAllDeployments() {
    return await Deployment.find()
      .populate('modelVersionId')
      .sort({ createdAt: -1 });
  }

  public static async getDeploymentById(id: string) {
    return await Deployment.findById(id).populate('modelVersionId');
  }

  public static async createDeployment(data: {
    name: string;
    modelVersionId: string;
    environment?: 'Staging' | 'Production';
  }) {
    const modelVersion = await ModelVersion.findById(data.modelVersionId);
    if (!modelVersion) throw new Error('Model version not found');

    const cleanName = data.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const endpointUrl = `/api/inference/predict?deployment=${cleanName}`;

    const deployment = new Deployment({
      name: data.name,
      modelVersionId: modelVersion._id,
      environment: data.environment || 'Production',
      status: 'ACTIVE',
      endpointUrl,
      requestCount: 0,
      lastHealthCheck: new Date(),
      isSimulated: true
    });

    await deployment.save();

    // Log monitoring deployment event
    await new MonitoringEvent({
      type: 'DEPLOYMENT',
      severity: 'INFO',
      deploymentId: deployment._id,
      message: `Created deployment "${deployment.name}" for Model Version ${modelVersion.version}`,
      details: { environment: deployment.environment, endpointUrl }
    }).save();

    return deployment;
  }

  public static async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    const deployment = await Deployment.findById(id);
    if (!deployment) throw new Error('Deployment not found');

    deployment.status = status;
    await deployment.save();

    await new MonitoringEvent({
      type: 'DEPLOYMENT',
      severity: 'WARNING',
      deploymentId: deployment._id,
      message: `Deployment "${deployment.name}" status changed to ${status}`,
      details: { status }
    }).save();

    return deployment;
  }

  public static async checkHealth(id: string) {
    const deployment = await Deployment.findById(id).populate('modelVersionId');
    if (!deployment) throw new Error('Deployment not found');

    deployment.lastHealthCheck = new Date();
    await deployment.save();

    const isHealthy = deployment.status === 'ACTIVE';

    return {
      deploymentId: deployment._id,
      name: deployment.name,
      status: deployment.status,
      isHealthy,
      environment: deployment.environment,
      endpointUrl: deployment.endpointUrl,
      lastHealthCheck: deployment.lastHealthCheck,
      isSimulated: true,
      message: isHealthy
        ? 'Simulated Endpoint operational & accepting inference traffic.'
        : 'Endpoint DEACTIVATED. New inference calls will be rejected (400 Bad Request).'
    };
  }

  public static async getDeploymentRequests(id: string) {
    return await InferenceRequest.find({ deploymentId: id })
      .sort({ createdAt: -1 })
      .limit(50);
  }
}
