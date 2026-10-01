import fs from 'fs';
import path from 'path';
import { Dataset, IDataset } from '../models/Dataset';
import { DatasetVersion, IDatasetVersion } from '../models/DatasetVersion';
import { ValidationService, ValidationResult } from './ValidationService';
import { DvcService } from './DvcService';

export class DatasetService {
  public static async getAllDatasets() {
    return await Dataset.find().sort({ createdAt: -1 });
  }

  public static async getDatasetById(id: string) {
    const dataset = await Dataset.findById(id);
    if (!dataset) return null;
    const versions = await DatasetVersion.find({ datasetId: id }).sort({ createdAt: -1 });
    return { dataset, versions };
  }

  public static async createDatasetWithVersion(
    name: string,
    description: string,
    filePath: string,
    fileSize: number,
    tags: string[] = []
  ) {
    const validation: ValidationResult = await ValidationService.parseAndValidateCSV(filePath);
    const dvcMeta = DvcService.trackDataset(filePath);

    const dataset = new Dataset({
      name,
      description,
      currentVersion: 'v1.0',
      totalRecords: validation.recordCount,
      totalFeatures: validation.featureCount,
      fileSize,
      filePath,
      tags
    });
    await dataset.save();

    const version = new DatasetVersion({
      datasetId: dataset._id,
      version: 'v1.0',
      recordCount: validation.recordCount,
      featureCount: validation.featureCount,
      schemaDetails: validation.schemaDetails,
      validationStatus: validation.validationStatus,
      validationSummary: validation.validationSummary,
      checksum: validation.checksum,
      dvcTracked: dvcMeta.dvcTracked,
      dvcHash: dvcMeta.dvcHash,
      dvcFile: dvcMeta.dvcFile,
      dvcContent: dvcMeta.dvcContent,
      fileSize,
      filePath
    });
    await version.save();

    return { dataset, version, sampleRows: validation.sampleRows, dvcMeta };
  }

  public static async createNewVersion(
    datasetId: string,
    filePath: string,
    fileSize: number
  ) {
    const dataset = await Dataset.findById(datasetId);
    if (!dataset) throw new Error('Dataset not found');

    const existingVersions = await DatasetVersion.find({ datasetId }).sort({ createdAt: -1 });
    const nextVerNum = existingVersions.length + 1;
    const nextVersionStr = `v${nextVerNum}.0`;

    const validation = await ValidationService.parseAndValidateCSV(filePath);
    const dvcMeta = DvcService.trackDataset(filePath);

    const version = new DatasetVersion({
      datasetId: dataset._id,
      version: nextVersionStr,
      recordCount: validation.recordCount,
      featureCount: validation.featureCount,
      schemaDetails: validation.schemaDetails,
      validationStatus: validation.validationStatus,
      validationSummary: validation.validationSummary,
      checksum: validation.checksum,
      dvcTracked: dvcMeta.dvcTracked,
      dvcHash: dvcMeta.dvcHash,
      dvcFile: dvcMeta.dvcFile,
      dvcContent: dvcMeta.dvcContent,
      fileSize,
      filePath
    });
    await version.save();

    dataset.currentVersion = nextVersionStr;
    dataset.totalRecords = validation.recordCount;
    dataset.totalFeatures = validation.featureCount;
    dataset.fileSize = fileSize;
    dataset.filePath = filePath;
    await dataset.save();

    return { dataset, version, sampleRows: validation.sampleRows, dvcMeta };
  }

  public static async getDatasetPreview(versionId: string) {
    const version = await DatasetVersion.findById(versionId);
    if (!version) throw new Error('Dataset version not found');

    const validation = await ValidationService.parseAndValidateCSV(version.filePath);
    return {
      version,
      sampleRows: validation.sampleRows
    };
  }

  public static async validateDatasetVersion(versionId: string) {
    const version = await DatasetVersion.findById(versionId);
    if (!version) throw new Error('Dataset version not found');

    const validation = await ValidationService.parseAndValidateCSV(version.filePath);
    version.validationStatus = validation.validationStatus;
    version.validationSummary = validation.validationSummary;
    version.schemaDetails = validation.schemaDetails;
    await version.save();

    return version;
  }
}
