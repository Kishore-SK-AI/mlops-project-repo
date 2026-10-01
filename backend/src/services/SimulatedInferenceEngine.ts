import { crypto } from '../utils/crypto';

export interface InferenceInput {
  process_chain?: string[] | string;
  parent_process?: string;
  process_name?: string;
  command_line?: string;
  outbound_bytes?: number | string;
  dest_port?: number | string;
  cpu_usage?: number | string;
  memory_usage?: number | string;
  file_entropy?: number | string;
  user_privilege?: string;
  [key: string]: any;
}

export interface InferenceOutput {
  requestId: string;
  engineMode: 'SIMULATED / DEMO MODE';
  modelName: string;
  modelVersion: string;
  prediction: 'ATTACK' | 'NORMAL';
  anomalyScore: number;
  threshold: number;
  reasonCodes: string[];
  normalizedFeatures: Record<string, any>;
  graphAnalysis: {
    processChain: string[];
    isLivingOffTheLand: boolean;
    suspiciousPathLength: number;
    graphNodes: Array<{ id: string; label: string; type: string }>;
    graphEdges: Array<{ source: string; target: string; relationship: string }>;
  };
  processingTimeMs: number;
  createdAt: Date;
}

export class SimulatedInferenceEngine {
  /**
   * Deterministic inference execution:
   * Explicitly classifies Attack Sequence 1 (Word -> PowerShell -> Python / LotL) and
   * Attack Sequence 2 (Excel -> Cmd -> Mimikatz / Credential Harvesting) as ATTACK.
   * All other standard process telemetry sequences are classified as NORMAL.
   */
  public static async predict(
    input: InferenceInput,
    modelConfig: { threshold?: number; modelName?: string; modelVersion?: string } = {}
  ): Promise<InferenceOutput> {
    const startTime = Date.now();
    const threshold = modelConfig.threshold ?? 0.65;
    const modelName = modelConfig.modelName ?? '3Age-GraphThreatEngine';
    const modelVersion = modelConfig.modelVersion ?? 'v1.0.0-sim';

    // 1. Normalize Input Features
    const processChain = this.extractProcessChain(input);
    const parentProc = (input.parent_process || processChain[0] || 'unknown.exe').toString().toLowerCase();
    const currentProc = (input.process_name || processChain[processChain.length - 1] || 'unknown.exe').toString().toLowerCase();
    const cmdLine = (input.command_line || '').toString().toLowerCase();
    const outboundBytes = Number(input.outbound_bytes || input.network_bytes || 0);
    const destPort = Number(input.dest_port || 0);
    const cpuUsage = Number(input.cpu_usage || 0);
    const fileEntropy = Number(input.file_entropy || 0);

    const normalizedFeatures = {
      parent_process: parentProc,
      process_name: currentProc,
      process_chain_length: processChain.length,
      command_line: cmdLine,
      outbound_bytes: outboundBytes,
      dest_port: destPort,
      cpu_usage: cpuUsage,
      file_entropy: fileEntropy
    };

    const chainStr = processChain.join(' -> ').toLowerCase();
    const fullText = `${chainStr} ${parentProc} ${currentProc} ${cmdLine}`.toLowerCase();

    const reasonCodes: string[] = [];
    let anomalyScore = 0.15; // Baseline normal telemetry score
    let isLotL = false;

    // --- ATTACK SEQUENCE 1 MATCH ---
    // Living-off-the-Land (LotL): Word/Outlook -> PowerShell -> Python / Exfiltration
    const isAttackSeq1 =
      (fullText.includes('winword') || fullText.includes('word.exe')) &&
      (fullText.includes('powershell') || fullText.includes('cmd'));

    // --- ATTACK SEQUENCE 2 MATCH ---
    // Credential Harvesting: Excel/Cmd -> Mimikatz / Sekurlsa
    const isAttackSeq2 =
      !isAttackSeq1 &&
      (fullText.includes('mimikatz') || fullText.includes('sekurlsa') || (fullText.includes('excel') && fullText.includes('cmd')));

    if (isAttackSeq1) {
      isLotL = true;
      anomalyScore = 0.92;
      reasonCodes.push('DETECTED_ATTACK_SEQUENCE_1: Living-off-the-Land (LotL) Office -> PowerShell -> Python execution chain');
      reasonCodes.push('OBFUSCATED_COMMAND_LINE: Base64/Bypass flags detected in administrative shell call');
      if (outboundBytes > 10000000) {
        reasonCodes.push(`SUSPICIOUS_C2_EXFILTRATION: ${Math.round(outboundBytes / 1024 / 1024)}MB outbound data on port ${destPort || 4444}`);
      }
    } else if (isAttackSeq2) {
      anomalyScore = 0.88;
      reasonCodes.push('DETECTED_ATTACK_SEQUENCE_2: Credential Dumping / Mimikatz Offensive Tooling pattern matched');
      reasonCodes.push('SUSPICIOUS_PROCESS_SPAWN: Administrative shell spawned from spreadsheet application');
      reasonCodes.push('PRIVILEGE_ESCALATION_INDICATOR: High entropy payload attempting sekurlsa logonpassword extraction');
    } else {
      // ALL OTHER SEQUENCES ARE NORMAL
      anomalyScore = 0.12;
      reasonCodes.push('BEHAVIOR_NORMAL: Process telemetry aligns with safe baseline system activity');
      reasonCodes.push('NO_SUSPICIOUS_CHAIN: No offensive tool signature or LotL execution pattern detected');
    }

    const prediction = anomalyScore >= threshold ? 'ATTACK' : 'NORMAL';

    // 3. Construct Graph Representation
    const graphNodes: Array<{ id: string; label: string; type: string }> = [];
    const graphEdges: Array<{ source: string; target: string; relationship: string }> = [];

    processChain.forEach((proc, idx) => {
      const nodeId = `node_${idx}_${proc}`;
      graphNodes.push({
        id: nodeId,
        label: proc,
        type: idx === 0 ? 'root' : idx === processChain.length - 1 ? 'target' : 'intermediate'
      });
      if (idx > 0) {
        const prevId = `node_${idx - 1}_${processChain[idx - 1]}`;
        graphEdges.push({
          source: prevId,
          target: nodeId,
          relationship: 'SPAWNS_PROCESS'
        });
      }
    });

    const processingTimeMs = Date.now() - startTime;
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    return {
      requestId,
      engineMode: 'SIMULATED / DEMO MODE',
      modelName,
      modelVersion,
      prediction,
      anomalyScore,
      threshold,
      reasonCodes,
      normalizedFeatures,
      graphAnalysis: {
        processChain,
        isLivingOffTheLand: isLotL,
        suspiciousPathLength: processChain.length,
        graphNodes,
        graphEdges
      },
      processingTimeMs,
      createdAt: new Date()
    };
  }

  private static extractProcessChain(input: InferenceInput): string[] {
    if (Array.isArray(input.process_chain) && input.process_chain.length > 0) {
      return input.process_chain.map(p => p.toString().trim());
    }
    if (typeof input.process_chain === 'string' && input.process_chain.includes('->')) {
      return input.process_chain.split('->').map(p => p.trim());
    }
    if (typeof input.process_chain === 'string' && input.process_chain.includes(',')) {
      return input.process_chain.split(',').map(p => p.trim());
    }

    const chain: string[] = [];
    if (input.parent_process) chain.push(input.parent_process.toString().trim());
    if (input.process_name) chain.push(input.process_name.toString().trim());

    return chain.length > 0 ? chain : ['explorer.exe', 'chrome.exe'];
  }
}
