import path from 'path';
import fs from 'fs';
import { Dataset } from '../models/Dataset';
import { DatasetVersion } from '../models/DatasetVersion';
import { PipelineRun } from '../models/PipelineRun';
import { Experiment } from '../models/Experiment';
import { ExperimentRun } from '../models/ExperimentRun';
import { ModelVersion } from '../models/ModelVersion';
import { Deployment } from '../models/Deployment';
import { InferenceRequest } from '../models/InferenceRequest';
import { ApplicationSetting } from '../models/ApplicationSetting';
import { DatasetService } from './DatasetService';
import { InferenceService } from './InferenceService';

export class SeedService {
  public static async seedIfEmpty() {
    try {
      // Seed Application Settings if missing
      const settingsCount = await ApplicationSetting.countDocuments();
      if (settingsCount === 0) {
        await new ApplicationSetting({
          projectName: '3Age — Graph Based Threat Engine',
          description: 'Behavioral cybersecurity threat detection engine utilizing process parent-child graph reconstruction and MLOps lifecycle tracking.',
          defaultThreshold: 0.65,
          demoEngineMode: 'SIMULATED / DEMO MODE',
          maxUploadSizeBytes: 52428800
        }).save();
        console.log('[Seed] Application settings initialized.');
      }

      // Ensure DVC tracking for all existing dataset versions in DB
      await this.ensureDvcTrackingForAllDatasets();

      // Check if dataset exists
      const datasetCount = await Dataset.countDocuments();
      if (datasetCount > 0) {
        console.log('[Seed] Database already contains records. Skipping seed.');
        return;
      }

      console.log('[Seed] Database is empty. Seeding initial MLOps records and sample telemetry dataset...');

      // 1. Seed Sample CSV Datasets with DVC tracking
      const csvPath1 = path.join(__dirname, '../../data/graph_threat_dataset.csv');
      const csvPath2 = path.join(__dirname, '../../data/process_log_20260714_100630.csv');
      const csvPath3 = path.join(__dirname, '../../data/synthetic_threat_dataset.csv');

      if (!fs.existsSync(csvPath1)) {
        console.warn(`[Seed] Seed dataset missing at ${csvPath1}`);
        return;
      }

      const { dataset, version } = await DatasetService.createDatasetWithVersion(
        'Endpoint Process Graph Telemetry',
        'Sample endpoint telemetry dataset containing process parent-child relationships, command line arguments, and network outbound bytes.',
        csvPath1,
        fs.statSync(csvPath1).size,
        ['Telemetry', 'ProcessGraph', 'LivingOffTheLand', 'Cybersecurity']
      );

      if (fs.existsSync(csvPath2)) {
        await DatasetService.createDatasetWithVersion(
          'System Process Activity Telemetry',
          'Raw endpoint process activity telemetry containing PIDs, parent processes, execution paths, CPU/Memory metrics, and timestamps.',
          csvPath2,
          fs.statSync(csvPath2).size,
          ['EndpointLogs', 'ProcessActivity', 'SystemTelemetry', 'DVC-Tracked']
        );
      }

      if (fs.existsSync(csvPath3)) {
        await DatasetService.createDatasetWithVersion(
          'Synthetic Behavioral Threat Features',
          'Feature engineered dataset containing normalized process features, registry access, temp file execution, and threat labels.',
          csvPath3,
          fs.statSync(csvPath3).size,
          ['FeatureEngineering', 'BehavioralFeatures', 'MLOpsDataset', 'DVC-Tracked']
        );
      }

      console.log(`[Seed] Seeded datasets with DVC versioning.`);

      // 2. Seed Experiment & Experiment Run
      const experiment = new Experiment({
        name: 'Graph Behavioral Threat Detection',
        description: 'Comparison of graph neural network vs pattern matcher on endpoint process chains.',
        algorithm: 'Graph Neural Network (Simulated)',
        runCount: 2
      });
      await experiment.save();

      const expRun1 = new ExperimentRun({
        experimentId: experiment._id,
        runName: 'Graph GNN Baseline Run',
        runNumber: 1,
        datasetVersionId: version._id,
        parameters: {
          algorithm: 'Graph Neural Network',
          threshold: 0.65,
          graphDepth: 3,
          learningRate: 0.001,
          simMode: true,
          featuresUsed: ['process_chain', 'parent_process', 'command_line', 'outbound_bytes']
        },
        metrics: {
          precision: 0.945,
          recall: 0.920,
          f1Score: 0.932,
          falsePositiveRate: 0.024,
          inferenceLatencyMs: 11.5,
          recordCount: 1000,
          durationMs: 1250
        },
        isDemoData: true,
        notes: 'Initial graph representation baseline experiment.'
      });
      await expRun1.save();

      const expRun2 = new ExperimentRun({
        experimentId: experiment._id,
        runName: 'Graph GNN Tuned Threshold 0.70',
        runNumber: 2,
        datasetVersionId: version._id,
        parameters: {
          algorithm: 'Graph Neural Network',
          threshold: 0.70,
          graphDepth: 4,
          learningRate: 0.0005,
          simMode: true,
          featuresUsed: ['process_chain', 'parent_process', 'command_line', 'outbound_bytes', 'file_entropy']
        },
        metrics: {
          precision: 0.962,
          recall: 0.908,
          f1Score: 0.934,
          falsePositiveRate: 0.018,
          inferenceLatencyMs: 12.8,
          recordCount: 1000,
          durationMs: 1480
        },
        isDemoData: true,
        notes: 'Tuned threshold to reduce false positive rate to 1.8%.'
      });
      await expRun2.save();

      // 3. Seed Registered Model Version
      const modelVer = new ModelVersion({
        modelName: '3Age-GraphThreatEngine',
        version: 'v1.0.0',
        modelType: 'Graph-Based Behavioral Threat Engine',
        description: 'Production-ready graph behavioral threat engine configuration.',
        datasetVersionId: version._id,
        experimentRunId: expRun2._id,
        metricsSummary: {
          precision: 0.962,
          recall: 0.908,
          f1Score: 0.934,
          falsePositiveRate: 0.018,
          latencyMs: 12.8
        },
        configArtifact: {
          threshold: 0.65,
          patternRulesCount: 14,
          graphNodesCount: 52
        },
        status: 'Production',
        isSimulated: true
      });
      await modelVer.save();

      // 4. Seed Deployment
      const deployment = new Deployment({
        name: 'threat-engine-prod',
        modelVersionId: modelVer._id,
        environment: 'Production',
        status: 'ACTIVE',
        endpointUrl: '/api/inference/predict?deployment=threat-engine-prod',
        requestCount: 5,
        lastHealthCheck: new Date(),
        isSimulated: true
      });
      await deployment.save();

      // 5. Seed Pipeline Run
      const pipelineRun = new PipelineRun({
        runId: `run_init_${Date.now()}`,
        datasetId: dataset._id,
        datasetVersionId: version._id,
        config: {
          stages: [
            'Data Ingestion',
            'Data Validation',
            'Preprocessing',
            'Feature Engineering',
            'Graph Feature Construction',
            'Simulated Training',
            'Evaluation',
            'Model Registration'
          ],
          threshold: 0.65,
          graphExtraction: true
        },
        status: 'COMPLETED',
        stages: [
          { name: 'Data Ingestion', status: 'COMPLETED', durationMs: 120, logs: ['Ingested 10 telemetry records from sample dataset.'] },
          { name: 'Data Validation', status: 'COMPLETED', durationMs: 95, logs: ['Validated CSV schema. 0 critical missing fields.'] },
          { name: 'Preprocessing', status: 'COMPLETED', durationMs: 110, logs: ['Normalized process chains and command-line text.'] },
          { name: 'Feature Engineering', status: 'COMPLETED', durationMs: 140, logs: ['Derived entropy scores and obfuscation indicators.'] },
          { name: 'Graph Feature Construction', status: 'COMPLETED', durationMs: 210, logs: ['Reconstructed process execution DAGs.'] },
          { name: 'Simulated Training', status: 'COMPLETED', durationMs: 380, logs: ['Evaluated pattern matching engine against dataset.'] },
          { name: 'Evaluation', status: 'COMPLETED', durationMs: 160, logs: ['Calculated evaluation metrics (F1: 0.934).'] },
          { name: 'Model Registration', status: 'COMPLETED', durationMs: 90, logs: [`Registered model version v1.0.0`] }
        ],
        durationMs: 1305,
        modelVersionId: modelVer._id
      });
      await pipelineRun.save();

      // 6. Seed Sample Inference Requests
      const sampleInferences = [
        {
          process_chain: ['winword.exe', 'powershell.exe', 'python.exe'],
          parent_process: 'winword.exe',
          process_name: 'powershell.exe',
          command_line: 'powershell.exe -ExecutionPolicy Bypass -enc AAAA1234',
          outbound_bytes: 45000000,
          dest_port: 4444
        },
        {
          process_chain: ['explorer.exe', 'chrome.exe'],
          parent_process: 'explorer.exe',
          process_name: 'chrome.exe',
          command_line: 'chrome.exe --no-sandbox',
          outbound_bytes: 142050,
          dest_port: 443
        },
        {
          process_chain: ['excel.exe', 'cmd.exe', 'mimikatz.exe'],
          parent_process: 'excel.exe',
          process_name: 'cmd.exe',
          command_line: 'cmd.exe /c mimikatz.exe sekurlsa::logonpasswords',
          outbound_bytes: 12000000,
          dest_port: 1337
        }
      ];

      for (const sample of sampleInferences) {
        await InferenceService.predict(sample, deployment._id.toString());
      }

      console.log('[Seed] Successfully seeded initial MLOps state and demo data.');
    } catch (err) {
      console.error('[Seed] Error during database seeding:', err);
    }
  }

  public static async ensureDvcTrackingForAllDatasets() {
    try {
      const { DvcService } = require('./DvcService');
      const versions = await DatasetVersion.find();
      let trackedCount = 0;

      for (const ver of versions) {
        if (!ver.dvcHash || !ver.dvcTracked || !ver.dvcContent) {
          if (ver.filePath && fs.existsSync(ver.filePath)) {
            const dvcMeta = DvcService.trackDataset(ver.filePath);
            ver.dvcTracked = dvcMeta.dvcTracked;
            ver.dvcHash = dvcMeta.dvcHash;
            ver.dvcFile = dvcMeta.dvcFile;
            ver.dvcContent = dvcMeta.dvcContent;
            await ver.save();
            trackedCount++;
          }
        }
      }

      if (trackedCount > 0) {
        console.log(`[DVC] Ensured DVC tracking & manifest generation for ${trackedCount} dataset versions.`);
      }
    } catch (err) {
      console.error('[DVC] Error ensuring DVC tracking for datasets:', err);
    }
  }
}
