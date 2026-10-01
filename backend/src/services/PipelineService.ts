import mongoose from 'mongoose';
import { PipelineRun, IPipelineRun } from '../models/PipelineRun';
import { DatasetVersion } from '../models/DatasetVersion';
import { Experiment } from '../models/Experiment';
import { ExperimentRun } from '../models/ExperimentRun';
import { ModelVersion } from '../models/ModelVersion';

export class PipelineService {
  public static async getAllRuns() {
    return await PipelineRun.find()
      .populate('datasetId', 'name currentVersion')
      .populate('datasetVersionId', 'version recordCount validationStatus')
      .populate('modelVersionId', 'version modelName status')
      .sort({ createdAt: -1 });
  }

  public static async getRunById(id: string) {
    return await PipelineRun.findById(id)
      .populate('datasetId')
      .populate('datasetVersionId')
      .populate('modelVersionId');
  }

  public static async executePipeline(
    datasetId: string,
    datasetVersionId: string,
    config: {
      stages?: string[];
      threshold?: number;
      graphExtraction?: boolean;
      features?: string[];
    } = {}
  ): Promise<IPipelineRun> {
    const stageNames = config.stages || [
      'Data Ingestion',
      'Data Validation',
      'Preprocessing',
      'Feature Engineering',
      'Graph Feature Construction',
      'Simulated Training',
      'Evaluation',
      'Model Registration'
    ];

    const runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const pipelineRun = new PipelineRun({
      runId,
      datasetId: new mongoose.Types.ObjectId(datasetId),
      datasetVersionId: new mongoose.Types.ObjectId(datasetVersionId),
      config: {
        stages: stageNames,
        threshold: config.threshold ?? 0.65,
        graphExtraction: config.graphExtraction ?? true,
        features: config.features || ['process_chain', 'parent_process', 'command_line', 'outbound_bytes']
      },
      status: 'RUNNING',
      stages: stageNames.map((s) => ({
        name: s,
        status: 'PENDING',
        logs: []
      }))
    });
    await pipelineRun.save();

    // Execute stages sequentially in background/async simulation
    this.runStagesAsync(pipelineRun._id.toString()).catch((err) => {
      console.error(`[PipelineEngine] Failed run ${runId}:`, err);
    });

    return pipelineRun;
  }

  private static async runStagesAsync(runDbId: string) {
    const startTime = Date.now();
    const run = await PipelineRun.findById(runDbId);
    if (!run) return;

    try {
      const versionDoc = await DatasetVersion.findById(run.datasetVersionId);
      const recCount = versionDoc?.recordCount || 1000;

      for (let i = 0; i < run.stages.length; i++) {
        const stage = run.stages[i];
        stage.status = 'RUNNING';
        stage.startTime = new Date();
        stage.logs.push(`[${new Date().toISOString()}] Started stage: ${stage.name}`);
        await run.save();

        // Simulate step work delay & meaningful log outputs
        await new Promise((res) => setTimeout(res, 400));

        switch (stage.name) {
          case 'Data Ingestion':
            stage.logs.push(`Loaded dataset file. Extracted ${recCount} rows and ${versionDoc?.featureCount || 12} features.`);
            break;
          case 'Data Validation':
            stage.logs.push(`Schema validation passed. Missing values rate: ${versionDoc?.validationSummary.missingValues || 0}`);
            break;
          case 'Preprocessing':
            stage.logs.push(`Normalized numerical features (CPU, memory, bytes). Handled missing categorical values.`);
            break;
          case 'Feature Engineering':
            stage.logs.push(`Extracted command-line entropy, obfuscation flags, and privilege escalation metrics.`);
            break;
          case 'Graph Feature Construction':
            stage.logs.push(`Constructed parent-child process execution DAGs. Extracted graph depth and Living-off-the-Land paths.`);
            break;
          case 'Simulated Training':
            stage.logs.push(`SIMULATED ENGINE: Evaluated pattern matcher & graph heuristic scoring algorithm against training subset.`);
            break;
          case 'Evaluation':
            stage.logs.push(`DEMO METRICS CALCULATED: Precision=0.942, Recall=0.915, F1=0.928, FPR=0.028 across ${recCount} samples.`);
            break;
          case 'Model Registration':
            // Automatically register a model version and link lineage!
            const newModelVerStr = `v1.${Date.now().toString().slice(-3)}`;

            // Create experiment record if needed
            let exp = await Experiment.findOne({ name: 'Graph Behavioral Threat Detection' });
            if (!exp) {
              exp = new Experiment({
                name: 'Graph Behavioral Threat Detection',
                description: 'Process graph & Living-off-the-Land detection experiment track',
                algorithm: 'Graph Neural Network (Simulated)'
              });
              await exp.save();
            }

            const expRun = new ExperimentRun({
              experimentId: exp._id,
              runName: `Pipeline Run ${run.runId}`,
              runNumber: (exp.runCount || 0) + 1,
              datasetVersionId: run.datasetVersionId,
              parameters: {
                algorithm: 'Graph-Neural-Network',
                threshold: run.config.threshold || 0.65,
                simMode: true,
                featuresUsed: run.config.features
              },
              metrics: {
                precision: 0.942,
                recall: 0.915,
                f1Score: 0.928,
                falsePositiveRate: 0.028,
                inferenceLatencyMs: 11.2,
                recordCount: recCount,
                durationMs: 1420
              },
              isDemoData: true
            });
            await expRun.save();
            exp.runCount += 1;
            await exp.save();

            const modelVer = new ModelVersion({
              modelName: '3Age-GraphThreatEngine',
              version: newModelVerStr,
              modelType: 'Graph-Based Behavioral Threat Engine',
              description: `Generated automatically by Pipeline Run ${run.runId}`,
              datasetVersionId: run.datasetVersionId,
              experimentRunId: expRun._id,
              metricsSummary: {
                precision: 0.942,
                recall: 0.915,
                f1Score: 0.928,
                falsePositiveRate: 0.028,
                latencyMs: 11.2
              },
              configArtifact: {
                threshold: run.config.threshold || 0.65,
                patternRulesCount: 14,
                graphNodesCount: 52
              },
              status: 'Development',
              isSimulated: true
            });
            await modelVer.save();

            run.modelVersionId = modelVer._id;
            stage.logs.push(`Successfully registered Model Version ${newModelVerStr} (ID: ${modelVer._id})`);
            break;
        }

        stage.status = 'COMPLETED';
        stage.endTime = new Date();
        stage.durationMs = stage.endTime.getTime() - stage.startTime.getTime();
        stage.logs.push(`[${new Date().toISOString()}] Stage ${stage.name} finished in ${stage.durationMs}ms`);
      }

      run.status = 'COMPLETED';
      run.durationMs = Date.now() - startTime;
      await run.save();
    } catch (err: any) {
      run.status = 'FAILED';
      run.errorMessage = err.message || 'Pipeline execution failed';
      await run.save();
    }
  }
}
