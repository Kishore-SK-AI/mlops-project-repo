import request from 'supertest';
import mongoose from 'mongoose';
import app from '../src/app';
import { connectDB, disconnectDB } from '../src/config/database';
import { SimulatedInferenceEngine } from '../src/services/SimulatedInferenceEngine';
import path from 'path';

describe('3Age MLOps Backend Suite', () => {
  beforeAll(async () => {
    jest.setTimeout(30000);
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Health API', () => {
    it('should return UP status and DEMO MODE indicator', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.demoMode).toBe('SIMULATED / DEMO MODE');
    });
  });

  describe('2. SimulatedInferenceEngine', () => {
    it('should classify Attack Sequence 1 (Living-off-the-Land) as ATTACK deterministically', async () => {
      const input = {
        process_chain: ['winword.exe', 'powershell.exe', 'python.exe'],
        parent_process: 'winword.exe',
        process_name: 'powershell.exe',
        command_line: 'powershell.exe -ExecutionPolicy Bypass -enc AAAA1234',
        outbound_bytes: 45000000,
        dest_port: 4444
      };

      const result = await SimulatedInferenceEngine.predict(input, { threshold: 0.65 });
      expect(result.prediction).toBe('ATTACK');
      expect(result.anomalyScore).toBeGreaterThanOrEqual(0.75);
      expect(result.reasonCodes.some(r => r.includes('DETECTED_ATTACK_SEQUENCE_1'))).toBe(true);
      expect(result.engineMode).toBe('SIMULATED / DEMO MODE');
    });

    it('should classify Attack Sequence 2 (Mimikatz Credential Harvesting) as ATTACK deterministically', async () => {
      const input = {
        process_chain: ['excel.exe', 'cmd.exe', 'mimikatz.exe'],
        parent_process: 'excel.exe',
        process_name: 'cmd.exe',
        command_line: 'cmd.exe /c mimikatz.exe sekurlsa::logonpasswords',
        outbound_bytes: 12000000,
        dest_port: 1337
      };

      const result = await SimulatedInferenceEngine.predict(input, { threshold: 0.65 });
      expect(result.prediction).toBe('ATTACK');
      expect(result.anomalyScore).toBeGreaterThanOrEqual(0.75);
      expect(result.reasonCodes.some(r => r.includes('DETECTED_ATTACK_SEQUENCE_2'))).toBe(true);
    });

    it('should classify normal telemetry as NORMAL deterministically', async () => {
      const input = {
        process_chain: ['explorer.exe', 'chrome.exe'],
        parent_process: 'explorer.exe',
        process_name: 'chrome.exe',
        command_line: 'chrome.exe --no-sandbox',
        outbound_bytes: 142050,
        dest_port: 443
      };

      const result = await SimulatedInferenceEngine.predict(input, { threshold: 0.65 });
      expect(result.prediction).toBe('NORMAL');
      expect(result.anomalyScore).toBeLessThan(0.65);
      expect(result.reasonCodes.some(r => r.includes('BEHAVIOR_NORMAL'))).toBe(true);
    });
  });

  describe('3. Inference API Endpoints', () => {
    it('should accept valid prediction payload and persist request history', async () => {
      const payload = {
        process_chain: ['excel.exe', 'cmd.exe', 'mimikatz.exe'],
        command_line: 'cmd.exe /c mimikatz.exe sekurlsa::logonpasswords',
        outbound_bytes: 12000000
      };

      const res = await request(app)
        .post('/api/inference/predict')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.prediction).toBe('ATTACK');

      // Check history
      const histRes = await request(app).get('/api/inference/history');
      expect(histRes.status).toBe(200);
      expect(histRes.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('4. Datasets API & CSV Ingestion', () => {
    it('should upload sample dataset and parse schema', async () => {
      const csvFilePath = path.join(__dirname, '../data/graph_threat_dataset.csv');
      const uniqueName = `Test Graph Telemetry ${Date.now()}`;

      const res = await request(app)
        .post('/api/datasets')
        .attach('file', csvFilePath)
        .field('name', uniqueName)
        .field('description', 'Test upload description');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.dataset.name).toBe(uniqueName);
      expect(res.body.data.version.recordCount).toBe(10);
      expect(res.body.data.version.featureCount).toBe(11);
    }, 30000);
  });

  describe('5. Monitoring API', () => {
    it('should return monitoring metrics overview and drift summary', async () => {
      const res = await request(app).get('/api/monitoring/overview');
      expect(res.status).toBe(200);
      expect(res.body.data.totalRequests).toBeGreaterThanOrEqual(1);

      const driftRes = await request(app).get('/api/monitoring/drift');
      expect(driftRes.status).toBe(200);
      expect(driftRes.body.data.distribution.length).toBe(3);
    });
  });
});
