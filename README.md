# 3Age — Graph Based Threat Engine (MLOps Platform)

**College Project Application — Machine Learning Operations (MLOps)**  
*Application Domain: Cybersecurity Behavioral Threat Detection & Endpoint Process Execution Graph Analysis*

---

## 1. Project Overview & Identity

**3Age: Graph Based Threat Engine** is a full-stack MLOps web application designed to demonstrate the end-to-end Machine Learning lifecycle applied to cybersecurity threat detection.

Modern cyber attacks increasingly utilize legitimate administrative tools (*Living off the Land / LotL*—such as `winword.exe` spawning `powershell.exe` which calls `python.exe` or `nc.exe`). Individual events appear normal in isolation, but their process parent-child execution graph and behavioral sequence are malicious.

This application provides complete operational management for dataset ingestion, schema validation, feature engineering, pipeline orchestration, experiment tracking, model registry stage management, active deployment lifecycle, real-time threat inference, data drift monitoring, and **DVC Data Versioning**.

---

## 2. Key MLOps Lifecycle Features

1. **Dataset Ingestion & DVC Data Versioning (`/datasets`)**
   - **Automated DVC (Data Version Control) Integration**: Every uploaded dataset and version is automatically tracked with DVC (`dvc add <filePath>`), generating `.dvc` spec manifests and MD5 content hashes.
   - **DVC Manifest Code Preview**: Interactive code card displaying `.dvc` manifest file contents (`outs: - md5: ...`).
   - **Bulk DVC Syncing**: Automatic startup verification (`ensureDvcTrackingForAllDatasets()`) and one-click **"DVC Sync All Datasets"** button to track 100% of dataset versions.
   - CSV upload, parsing, and record count metrics.
   - Automatic column data type inference (`string`, `number`, `boolean`).
   - Detection of missing fields, duplicate records, and content checksums.

2. **Pipeline Orchestration (`/pipelines`)**
   - Sequential 8-stage MLOps pipeline:
     1. Data Ingestion
     2. Data Validation
     3. Preprocessing & Normalization
     4. Feature Engineering
     5. Graph Feature Construction (Execution DAGs)
     6. Simulated Training
     7. Evaluation Metric Calculation
     8. Automatic Model Registration
   - Step-by-step progress tracking, live duration measurements, and execution terminal logs.

3. **Experiment Tracking (`/experiments`)**
   - Track reproducible runs with hyperparameters (anomaly decision threshold, process graph depth, random seed).
   - Side-by-side run metric comparison (Precision, Recall, F1-Score, False Positive Rate, Latency).
   - Clearly labeled `DEMO DATA` tags for simulated metrics.

4. **Model Registry & Lineage (`/models`)**
   - Versioned model artifacts (`v1.0.0`, `v1.1.0`).
   - Lifecycle stage promotion state machine: `Development` → `Staging` → `Production` → `Archived`.
   - Complete lineage mapping connecting **Model Version → Experiment Run → Dataset Version → Deployment**.

5. **Deployment Staging (`/deployments`)**
   - Manage active/inactive inference endpoints (`/api/inference/predict?deployment=name`).
   - Environment staging (`Staging` vs `Production`).
   - Real-time endpoint health diagnostics.

6. **Interactive Inference Playground (`/inference`)**
   - Test single telemetry payloads via interactive forms or raw JSON editor.
   - Built-in quick presets:
     - *Word → PowerShell LotL Attack* (`winword.exe` → `powershell.exe` → `python.exe`)
     - *Mimikatz Credential Dumping* (`excel.exe` → `cmd.exe` → `mimikatz.exe`)
     - *Safe Normal Browsing* (`explorer.exe` → `chrome.exe`)
   - **Reconstructed Process Execution Graph**: Visual tree diagram rendering parent-child process chains (`spawns`), PIDs, and attack badges.
   - Real-time anomaly score meter, decision threshold, and explainable rule reason codes.

7. **Monitoring & Observability (`/monitoring`)**
   - Operational metrics: total inference volume, request failure rate, average latency (ms).
   - Anomaly score risk distribution & simulated data drift indicators.
   - Security and operational event logs.

8. **Settings & Transparency (`/settings`)**
   - Configurable default anomaly thresholds and dataset upload size limits.
   - Explicit `SIMULATED / DEMO MODE` transparency notices.

---

## 3. Technology Stack

### Frontend (`frontend/`)
- **React** (v18) + **Vite** (v6) + **TypeScript**
- **Tailwind CSS** for visual layout
- **Lucide React** for UI icons
- **Recharts** for metric visualization
- **React Router DOM** (v6)
- **TanStack React Query**

### Backend (`backend/`)
- **Node.js** + **Express.js** + **TypeScript**
- **DVC (Data Version Control)** v3.67 CLI Integration
- **MongoDB** with **Mongoose** (includes automatic MongoDB Memory Server fallback for easy local execution without needing MongoDB service pre-installed)
- **Multer** & **csv-parser** for dataset ingestion
- **Jest** & **Supertest** for unit and integration testing

---

## 4. Setup & Execution Instructions (Windows / Local)

### Prerequisites
- Node.js (v18+ recommended)
- NPM (v9+)
- Git & DVC (installed and available on system PATH)

### Step 1: Install Dependencies

```powershell
# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
```

### Step 2: Run Backend Server

```powershell
cd backend
npm run dev
```
*Backend runs on `http://localhost:5000` (Health Check: `http://localhost:5000/api/health`)*

### Step 3: Run Frontend Application

```powershell
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`*

### Step 4: Run Automated Tests

```powershell
cd backend
npm test
```
*Executes all unit and integration test suites including DVC data tracking verification.*

---

## 5. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check & engine mode status |
| `GET` | `/api/datasets` | List all registered datasets |
| `POST` | `/api/datasets` | Upload CSV dataset file (automatically runs DVC track) |
| `GET` | `/api/datasets/:id` | Get dataset details & versions |
| `GET` | `/api/datasets/preview/:versionId` | Preview sample CSV rows |
| `POST` | `/api/datasets/:versionId/dvc-sync` | Re-sync DVC manifest for a specific dataset version |
| `POST` | `/api/datasets/dvc-sync-all` | Bulk DVC sync across all dataset versions |
| `POST` | `/api/pipelines/run` | Execute stage-by-stage MLOps pipeline |
| `GET` | `/api/pipelines/runs` | List pipeline execution runs |
| `GET` | `/api/experiments` | List experiments |
| `POST` | `/api/experiments` | Create experiment track |
| `POST` | `/api/experiments/:id/run` | Execute experiment run |
| `GET` | `/api/experiments/compare?ids=...` | Compare multiple experiment runs |
| `GET` | `/api/models` | List registered model versions |
| `POST` | `/api/models/register` | Register new model version |
| `PATCH` | `/api/models/:id/status` | Update lifecycle stage (Staging, Production) |
| `GET` | `/api/models/:id/lineage` | Fetch end-to-end model lineage |
| `GET` | `/api/deployments` | List active & staged deployments |
| `POST` | `/api/deployments` | Activate new deployment endpoint |
| `PATCH` | `/api/deployments/:id/status` | Toggle deployment status (ACTIVE/INACTIVE) |
| `GET` | `/api/deployments/:id/health` | Diagnostic health check |
| `POST` | `/api/inference/predict` | Submit telemetry for threat classification |
| `GET` | `/api/inference/history` | Fetch persistent inference history |
| `GET` | `/api/monitoring/overview` | Fetch operational metrics summary |
| `GET` | `/api/monitoring/drift` | Fetch score distribution & drift indicators |
| `GET` | `/api/settings` | Get platform settings |
| `PATCH` | `/api/settings` | Update platform settings |

---

## 6. License & Acknowledgments

Developed for academic presentation at **Chennai Institute of Technology**  
*Project Team: Kishore S (24AD0141), Mac Kenzie Cambel B (24AD0157)*
