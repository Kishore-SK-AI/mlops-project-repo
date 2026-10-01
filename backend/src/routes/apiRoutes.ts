import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as api from '../controllers/apiControllers';

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `dataset-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are accepted.'));
    }
  }
});

const router = Router();

// Health
router.get('/health', api.getHealth);

// Datasets
router.get('/datasets', api.getDatasets);
router.post('/datasets', upload.single('file'), api.uploadDataset);
router.get('/datasets/:id', api.getDatasetById);
router.get('/datasets/preview/:versionId', api.getDatasetPreview);
router.post('/datasets/:id/version', upload.single('file'), api.uploadNewVersion);
router.post('/datasets/:versionId/validate', api.validateDatasetVersion);
router.post('/datasets/:versionId/dvc-sync', api.dvcSyncDatasetVersion);
router.post('/datasets/dvc-sync-all', api.dvcSyncAllDatasetVersions);

// Pipelines
router.get('/pipelines', api.getPipelines);
router.get('/pipelines/runs', api.getPipelines);
router.post('/pipelines/run', api.runPipeline);
router.get('/pipelines/runs/:id', api.getPipelineRunById);

// Experiments
router.get('/experiments', api.getExperiments);
router.post('/experiments', api.createExperiment);
router.get('/experiments/compare', api.compareRuns);
router.get('/experiments/:id', api.getExperimentById);
router.post('/experiments/:id/run', api.runExperiment);

// Model Registry
router.get('/models', api.getModels);
router.post('/models/register', api.registerModel);
router.get('/models/:id', api.getModelById);
router.patch('/models/:id/status', api.updateModelStatus);
router.get('/models/:id/lineage', api.getModelLineage);

// Deployments
router.get('/deployments', api.getDeployments);
router.post('/deployments', api.createDeployment);
router.patch('/deployments/:id/status', api.updateDeploymentStatus);
router.get('/deployments/:id/health', api.getDeploymentHealth);
router.get('/deployments/:id/requests', api.getDeploymentRequests);

// Inference
router.post('/inference/predict', api.predictInference);
router.get('/inference/history', api.getInferenceHistory);
router.get('/inference/:requestId', api.getInferenceRequestById);

// Monitoring
router.get('/monitoring/overview', api.getMonitoringOverview);
router.get('/monitoring/latency', api.getMonitoringLatency);
router.get('/monitoring/data-quality', api.getMonitoringDataQuality);
router.get('/monitoring/drift', api.getMonitoringDrift);
router.get('/monitoring/errors', api.getMonitoringErrors);

// Settings
router.get('/settings', api.getSettings);
router.patch('/settings', api.updateSettings);

export default router;
