import mongoose from 'mongoose';
import { Experiment } from '../models/Experiment';
import { ExperimentRun } from '../models/ExperimentRun';
import { DatasetVersion } from '../models/DatasetVersion';

export class ExperimentService {
  public static async getAllExperiments() {
    return await Experiment.find().sort({ createdAt: -1 });
  }

  public static async createExperiment(name: string, description: string, algorithm: string) {
    const experiment = new Experiment({ name, description, algorithm });
    await experiment.save();
    return experiment;
  }

  public static async getExperimentById(id: string) {
    const experiment = await Experiment.findById(id);
    if (!experiment) return null;
    const runs = await ExperimentRun.find({ experimentId: id })
      .populate('datasetVersionId')
      .sort({ createdAt: -1 });
    return { experiment, runs };
  }

  public static async runExperiment(
    experimentId: string,
    datasetVersionId: string,
    parameters: {
      algorithm?: string;
      threshold?: number;
      graphDepth?: number;
      learningRate?: number;
      randomSeed?: number;
      simMode?: boolean;
      featuresUsed?: string[];
    } = {}
  ) {
    const experiment = await Experiment.findById(experimentId);
    if (!experiment) throw new Error('Experiment not found');

    const datasetVersion = await DatasetVersion.findById(datasetVersionId);
    const recordCount = datasetVersion?.recordCount || 1200;

    const runNumber = (experiment.runCount || 0) + 1;
    const runName = `${experiment.name} Run #${runNumber}`;

    // Calculate deterministic realistic demo evaluation metrics
    const threshold = parameters.threshold ?? 0.65;
    // Vary slightly based on threshold to demonstrate experiment tuning behavior
    const precision = Number(Math.min(0.98, Math.max(0.70, 0.90 + (threshold - 0.5) * 0.2)).toFixed(3));
    const recall = Number(Math.min(0.97, Math.max(0.65, 0.95 - (threshold - 0.5) * 0.25)).toFixed(3));
    const f1Score = Number(((2 * precision * recall) / (precision + recall)).toFixed(3));
    const falsePositiveRate = Number((0.08 - (threshold - 0.5) * 0.1).toFixed(3));
    const latencyMs = Number((8 + Math.random() * 5).toFixed(1));

    const run = new ExperimentRun({
      experimentId: experiment._id,
      runName,
      runNumber,
      datasetVersionId: datasetVersion ? datasetVersion._id : undefined,
      parameters: {
        algorithm: parameters.algorithm || experiment.algorithm || 'Graph-Neural-Network',
        threshold,
        graphDepth: parameters.graphDepth ?? 3,
        learningRate: parameters.learningRate ?? 0.001,
        randomSeed: parameters.randomSeed ?? 42,
        simMode: true,
        featuresUsed: parameters.featuresUsed || ['process_chain', 'parent_process', 'command_line', 'outbound_bytes']
      },
      metrics: {
        precision,
        recall,
        f1Score,
        falsePositiveRate,
        inferenceLatencyMs: latencyMs,
        recordCount,
        durationMs: Math.floor(1000 + Math.random() * 800)
      },
      isDemoData: true,
      notes: 'Executed in SIMULATED / DEMO MODE for MLOps hyperparameter analysis'
    });

    await run.save();

    experiment.runCount = runNumber;
    await experiment.save();

    return run;
  }

  public static async compareRuns(runIds: string[]) {
    return await ExperimentRun.find({ _id: { $in: runIds } })
      .populate('experimentId', 'name algorithm')
      .populate('datasetVersionId', 'version recordCount');
  }
}
