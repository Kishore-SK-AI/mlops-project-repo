import { Request, Response, NextFunction } from 'express';
import { DatasetService } from '../services/DatasetService';
import { DatasetVersion } from '../models/DatasetVersion';
import { PipelineService } from '../services/PipelineService';
import { ExperimentService } from '../services/ExperimentService';
import { ModelRegistryService } from '../services/ModelRegistryService';
import { DeploymentService } from '../services/DeploymentService';
import { InferenceService } from '../services/InferenceService';
import { MonitoringService } from '../services/MonitoringService';
import { ApplicationSetting } from '../models/ApplicationSetting';
import mongoose from 'mongoose';

// --- HEALTH CONTROLLER ---
export const getHealth = async (req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'CONNECTED' : dbState === 2 ? 'CONNECTING' : 'DISCONNECTED';
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: '3Age — Graph Based Threat Engine API',
    demoMode: 'SIMULATED / DEMO MODE',
    database: dbStatus,
    uptimeSeconds: process.uptime()
  });
};

// --- DATASET CONTROLLER ---
export const getDatasets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const datasets = await DatasetService.getAllDatasets();
    res.json({ success: true, data: datasets });
  } catch (err) { next(err); }
};

export const getDatasetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await DatasetService.getDatasetById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Dataset not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const uploadDataset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }
    const name = req.body.name || req.file.originalname.replace(/\.[^/.]+$/, '');
    const description = req.body.description || '';
    const tags = req.body.tags ? req.body.tags.split(',').map((t: string) => t.trim()) : [];

    const result = await DatasetService.createDatasetWithVersion(
      name,
      description,
      req.file.path,
      req.file.size,
      tags
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const uploadNewVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
    }
    const result = await DatasetService.createNewVersion(req.params.id, req.file.path, req.file.size);
    res.status(201).json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getDatasetPreview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const preview = await DatasetService.getDatasetPreview(req.params.versionId);
    res.json({ success: true, data: preview });
  } catch (err) { next(err); }
};

export const validateDatasetVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await DatasetService.validateDatasetVersion(req.params.versionId);
    res.json({ success: true, data: version });
  } catch (err) { next(err); }
};

export const dvcSyncDatasetVersion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const version = await DatasetVersion.findById(req.params.versionId);
    if (!version) return res.status(404).json({ success: false, error: 'Version not found' });

    const { DvcService } = require('../services/DvcService');
    const dvcMeta = DvcService.trackDataset(version.filePath);

    version.dvcTracked = dvcMeta.dvcTracked;
    version.dvcHash = dvcMeta.dvcHash;
    version.dvcFile = dvcMeta.dvcFile;
    version.dvcContent = dvcMeta.dvcContent;
    await version.save();

    res.json({ success: true, data: { version, dvcMeta } });
  } catch (err) { next(err); }
};

export const dvcSyncAllDatasetVersions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { SeedService } = require('../services/SeedService');
    await SeedService.ensureDvcTrackingForAllDatasets();
    const versions = await DatasetVersion.find();
    res.json({ success: true, message: `DVC tracking synced across all ${versions.length} dataset versions.`, data: versions });
  } catch (err) { next(err); }
};

// --- PIPELINE CONTROLLER ---
export const getPipelines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await PipelineService.getAllRuns();
    res.json({ success: true, data: runs });
  } catch (err) { next(err); }
};

export const runPipeline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { datasetId, datasetVersionId, config } = req.body;
    if (!datasetId || !datasetVersionId) {
      return res.status(400).json({ success: false, error: 'datasetId and datasetVersionId are required' });
    }
    const pipelineRun = await PipelineService.executePipeline(datasetId, datasetVersionId, config);
    res.status(202).json({ success: true, data: pipelineRun });
  } catch (err) { next(err); }
};

export const getPipelineRunById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = await PipelineService.getRunById(req.params.id);
    if (!run) return res.status(404).json({ success: false, error: 'Pipeline run not found' });
    res.json({ success: true, data: run });
  } catch (err) { next(err); }
};

// --- EXPERIMENT CONTROLLER ---
export const getExperiments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const experiments = await ExperimentService.getAllExperiments();
    res.json({ success: true, data: experiments });
  } catch (err) { next(err); }
};

export const createExperiment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, algorithm } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Experiment name is required' });
    const experiment = await ExperimentService.createExperiment(name, description, algorithm);
    res.status(201).json({ success: true, data: experiment });
  } catch (err) { next(err); }
};

export const getExperimentById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await ExperimentService.getExperimentById(req.params.id);
    if (!data) return res.status(404).json({ success: false, error: 'Experiment not found' });
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const runExperiment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { datasetVersionId, parameters } = req.body;
    if (!datasetVersionId) return res.status(400).json({ success: false, error: 'datasetVersionId is required' });
    const run = await ExperimentService.runExperiment(req.params.id, datasetVersionId, parameters);
    res.status(201).json({ success: true, data: run });
  } catch (err) { next(err); }
};

export const compareRuns = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ids = (req.query.ids as string || '').split(',').map((id: string) => id.trim()).filter(Boolean);
    if (ids.length === 0) return res.status(400).json({ success: false, error: 'Pass run IDs in query parameter ?ids=id1,id2' });
    const runs = await ExperimentService.compareRuns(ids);
    res.json({ success: true, data: runs });
  } catch (err) { next(err); }
};

// --- MODEL REGISTRY CONTROLLER ---
export const getModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await ModelRegistryService.getAllModelVersions();
    res.json({ success: true, data: models });
  } catch (err) { next(err); }
};

export const registerModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const modelVersion = await ModelRegistryService.registerModelVersion(req.body);
    res.status(201).json({ success: true, data: modelVersion });
  } catch (err) { next(err); }
};

export const getModelById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await ModelRegistryService.getModelVersionById(req.params.id);
    if (!model) return res.status(404).json({ success: false, error: 'Model version not found' });
    res.json({ success: true, data: model });
  } catch (err) { next(err); }
};

export const updateModelStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['Development', 'Staging', 'Production', 'Archived'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid model status' });
    }
    const updated = await ModelRegistryService.updateStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const getModelLineage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lineage = await ModelRegistryService.getLineage(req.params.id);
    res.json({ success: true, data: lineage });
  } catch (err) { next(err); }
};

// --- DEPLOYMENT CONTROLLER ---
export const getDeployments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deployments = await DeploymentService.getAllDeployments();
    res.json({ success: true, data: deployments });
  } catch (err) { next(err); }
};

export const createDeployment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, modelVersionId, environment } = req.body;
    if (!name || !modelVersionId) {
      return res.status(400).json({ success: false, error: 'Deployment name and modelVersionId are required' });
    }
    const deployment = await DeploymentService.createDeployment({ name, modelVersionId, environment });
    res.status(201).json({ success: true, data: deployment });
  } catch (err) { next(err); }
};

export const updateDeploymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be ACTIVE or INACTIVE' });
    }
    const updated = await DeploymentService.updateStatus(req.params.id, status);
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
};

export const getDeploymentHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await DeploymentService.checkHealth(req.params.id);
    res.json({ success: true, data: health });
  } catch (err) { next(err); }
};

export const getDeploymentRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requests = await DeploymentService.getDeploymentRequests(req.params.id);
    res.json({ success: true, data: requests });
  } catch (err) { next(err); }
};

// --- INFERENCE CONTROLLER ---
export const predictInference = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deploymentId = (req.query.deploymentId as string) || req.body.deploymentId;
    const input = req.body.input || req.body;
    if (!input || typeof input !== 'object') {
      return res.status(400).json({ success: false, error: 'Input record object required' });
    }
    const result = await InferenceService.predict(input, deploymentId);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Inference execution failed' });
  }
};

export const getInferenceHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Number(req.query.limit || 50);
    const history = await InferenceService.getHistory(limit);
    res.json({ success: true, data: history });
  } catch (err) { next(err); }
};

export const getInferenceRequestById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const request = await InferenceService.getRequestById(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, error: 'Inference request record not found' });
    res.json({ success: true, data: request });
  } catch (err) { next(err); }
};

// --- MONITORING CONTROLLER ---
export const getMonitoringOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const overview = await MonitoringService.getOverview();
    res.json({ success: true, data: overview });
  } catch (err) { next(err); }
};

export const getMonitoringLatency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const latency = await MonitoringService.getLatencyMetrics();
    res.json({ success: true, data: latency });
  } catch (err) { next(err); }
};

export const getMonitoringDataQuality = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quality = await MonitoringService.getDataQuality();
    res.json({ success: true, data: quality });
  } catch (err) { next(err); }
};

export const getMonitoringDrift = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drift = await MonitoringService.getDriftMetrics();
    res.json({ success: true, data: drift });
  } catch (err) { next(err); }
};

export const getMonitoringErrors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = await MonitoringService.getErrors();
    res.json({ success: true, data: errors });
  } catch (err) { next(err); }
};

// --- SETTINGS CONTROLLER ---
export const getSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await ApplicationSetting.findOne();
    if (!settings) {
      settings = new ApplicationSetting();
      await settings.save();
    }
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let settings = await ApplicationSetting.findOne();
    if (!settings) {
      settings = new ApplicationSetting();
    }
    if (req.body.projectName) settings.projectName = req.body.projectName;
    if (req.body.description) settings.description = req.body.description;
    if (req.body.defaultThreshold !== undefined) settings.defaultThreshold = Number(req.body.defaultThreshold);
    if (req.body.maxUploadSizeBytes !== undefined) settings.maxUploadSizeBytes = Number(req.body.maxUploadSizeBytes);
    if (req.body.uiPreferences) {
      settings.uiPreferences = { ...settings.uiPreferences, ...req.body.uiPreferences };
    }

    await settings.save();
    res.json({ success: true, data: settings });
  } catch (err) { next(err); }
};
