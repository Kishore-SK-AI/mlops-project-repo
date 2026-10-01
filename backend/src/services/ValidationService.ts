import fs from 'fs';
import csvParser from 'csv-parser';
import { IColumnSchema } from '../models/DatasetVersion';
import { crypto } from '../utils/crypto';

export interface ValidationResult {
  recordCount: number;
  featureCount: number;
  schemaDetails: IColumnSchema[];
  validationStatus: 'VALID' | 'WARNING' | 'FAILED';
  validationSummary: {
    missingValues: number;
    duplicateRows: number;
    schemaIssues: string[];
  };
  checksum: string;
  sampleRows: Record<string, any>[];
}

export class ValidationService {
  public static async parseAndValidateCSV(filePath: string): Promise<ValidationResult> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, any>[] = [];
      const rowHashes = new Set<string>();
      let missingValuesCount = 0;
      let duplicateRowsCount = 0;

      if (!fs.existsSync(filePath)) {
        return reject(new Error(`CSV File not found at path: ${filePath}`));
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const checksum = crypto.sha256(fileContent);

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          rows.push(data);
          const str = JSON.stringify(data);
          if (rowHashes.has(str)) {
            duplicateRowsCount++;
          } else {
            rowHashes.add(str);
          }

          // Count empty values
          Object.values(data).forEach((val) => {
            if (val === null || val === undefined || val === '' || val === 'NaN' || val === 'null') {
              missingValuesCount++;
            }
          });
        })
        .on('end', () => {
          if (rows.length === 0) {
            return resolve({
              recordCount: 0,
              featureCount: 0,
              schemaDetails: [],
              validationStatus: 'FAILED',
              validationSummary: {
                missingValues: 0,
                duplicateRows: 0,
                schemaIssues: ['CSV file is empty or corrupted.']
              },
              checksum,
              sampleRows: []
            });
          }

          const headers = Object.keys(rows[0]);
          const schemaDetails: IColumnSchema[] = headers.map((col) => {
            let nullCount = 0;
            let sampleVal: any = null;

            for (let i = 0; i < Math.min(100, rows.length); i++) {
              const v = rows[i][col];
              if (v === null || v === undefined || v === '' || v === 'NaN') {
                nullCount++;
              } else if (sampleVal === null) {
                sampleVal = v;
              }
            }

            // Infer type
            let inferredType = 'string';
            if (sampleVal !== null) {
              if (!isNaN(Number(sampleVal))) inferredType = 'number';
              else if (sampleVal === 'true' || sampleVal === 'false') inferredType = 'boolean';
            }

            return {
              name: col,
              type: inferredType,
              sampleValue: sampleVal,
              nullCount
            };
          });

          const schemaIssues: string[] = [];
          if (duplicateRowsCount > 0) {
            schemaIssues.push(`Detected ${duplicateRowsCount} duplicate record rows.`);
          }
          if (missingValuesCount > 0) {
            schemaIssues.push(`Detected ${missingValuesCount} missing/null value fields across dataset.`);
          }

          const validationStatus =
            schemaIssues.length === 0 ? 'VALID' : missingValuesCount > rows.length * 2 ? 'FAILED' : 'WARNING';

          resolve({
            recordCount: rows.length,
            featureCount: headers.length,
            schemaDetails,
            validationStatus,
            validationSummary: {
              missingValues: missingValuesCount,
              duplicateRows: duplicateRowsCount,
              schemaIssues
            },
            checksum,
            sampleRows: rows.slice(0, 15)
          });
        })
        .on('error', (err) => reject(err));
    });
  }
}
