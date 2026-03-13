import { exec } from "child_process";
import path from "path";
import fs from "node:fs";

interface AudioMetadata {
  character: string;
  actor: string;
  timecode: string;
  startTimeMs: number;
  startTimeSeconds: number;
}

interface ProcessingResult {
  status: "success" | "error";
  message?: string;
  output_path?: string;
  alignment?: {
    offset_ms: number;
    duration_ms: number;
  };
}

export class AudioProcessor {
  private scriptPath: string;
  private bounceScriptPath: string;

  constructor() {
    this.scriptPath = path.join(process.cwd(), "server", "scripts", "process_audio.py");
    this.bounceScriptPath = path.join(process.cwd(), "server", "scripts", "bounce_track.py");
  }

  parseMetadata(filename: string): AudioMetadata | null {
    const name = path.basename(filename, path.extname(filename));
    const timecodeMatch = Array.from(name.matchAll(/(\d{2}[:\-]\d{2}[:\-]\d{2}(?:\.\d+)?|\d{6}(?:\.\d+)?)/g)).at(-1);
    if (!timecodeMatch) return null;

    const rawTimecode = timecodeMatch[1];
    const timecode = this.normalizeTimecode(rawTimecode);
    if (!timecode) return null;

    const withoutTimecode = name
      .slice(0, timecodeMatch.index)
      .replace(/[-_ ]+$/g, "")
      .trim();

    const bracketTokens = Array.from(withoutTimecode.matchAll(/[\[\{\(]([^\]\}\)]+)[\]\}\)]/g))
      .map((match) => match[1]?.trim())
      .filter((value): value is string => Boolean(value));

    let character = "";
    let actor = "";

    if (bracketTokens.length >= 2) {
      [character, actor] = bracketTokens;
    } else {
      const plain = withoutTimecode.replace(/[\[\]\{\}\(\)]/g, " ").trim();
      const splitByDelimiter = plain.split(/[-_]+/).map(token => token.trim()).filter(Boolean);
      if (splitByDelimiter.length >= 2) {
        character = splitByDelimiter.slice(0, splitByDelimiter.length - 1).join(" ").trim();
        actor = splitByDelimiter[splitByDelimiter.length - 1]!.trim();
      } else {
        const splitBySpace = plain.split(/\s+/).map(token => token.trim()).filter(Boolean);
        character = splitBySpace.slice(0, Math.max(splitBySpace.length - 1, 1)).join(" ").trim();
        actor = splitBySpace.slice(Math.max(splitBySpace.length - 1, 0)).join(" ").trim();
      }
    }

    character = this.normalizeEntityName(character || "Unknown");
    actor = this.normalizeEntityName(actor || "Unknown");

    const startTimeSeconds = this.timecodeToSeconds(timecode);

    return {
      character,
      actor,
      timecode,
      startTimeMs: Math.round(startTimeSeconds * 1000),
      startTimeSeconds,
    };
  }

  private normalizeEntityName(value: string): string {
    return value
      .replace(/[_\-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/^\w/, (match) => match.toUpperCase());
  }

  private normalizeTimecode(raw: string): string | null {
    const normalized = raw.replace(/-/g, ":");
    if (/^\d{6}(\.\d+)?$/.test(normalized)) {
      const [base, decimal = ""] = normalized.split(".");
      if (!base) return null;
      const hh = base.slice(0, 2);
      const mm = base.slice(2, 4);
      const ss = base.slice(4, 6);
      return decimal ? `${hh}:${mm}:${ss}.${decimal}` : `${hh}:${mm}:${ss}`;
    }
    if (/^\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(normalized)) {
      return normalized;
    }
    return null;
  }

  timecodeToSeconds(tc: string): number {
    const [hRaw = "0", mRaw = "0", sRaw = "0"] = tc.split(":");
    const hours = Number(hRaw) || 0;
    const minutes = Number(mRaw) || 0;
    const seconds = Number(sRaw) || 0;
    return (hours * 3600) + (minutes * 60) + seconds;
  }

  timecodeToMs(tc: string): number {
    return Math.round(this.timecodeToSeconds(tc) * 1000);
  }

  buildTrackName(character: string, actor: string): string {
    return `${this.normalizeEntityName(character || "Unknown")} - ${this.normalizeEntityName(actor || "Unknown")}`;
  }

  extractWavDurationSeconds(filePathOrBuffer: string | Buffer): number | null {
    const sourceBuffer = Buffer.isBuffer(filePathOrBuffer)
      ? filePathOrBuffer
      : (fs.existsSync(filePathOrBuffer) ? fs.readFileSync(filePathOrBuffer) : null);

    if (!sourceBuffer || sourceBuffer.length < 44) return null;
    if (sourceBuffer.toString("ascii", 0, 4) !== "RIFF" || sourceBuffer.toString("ascii", 8, 12) !== "WAVE") return null;

    let cursor = 12;
    let byteRate = 0;
    let dataSize = 0;

    while (cursor + 8 <= sourceBuffer.length) {
      const chunkId = sourceBuffer.toString("ascii", cursor, cursor + 4);
      const chunkSize = sourceBuffer.readUInt32LE(cursor + 4);
      const chunkStart = cursor + 8;

      if (chunkId === "fmt " && chunkSize >= 16 && chunkStart + 8 <= sourceBuffer.length) {
        byteRate = sourceBuffer.readUInt32LE(chunkStart + 8);
      }

      if (chunkId === "data") {
        dataSize = chunkSize;
      }

      cursor = chunkStart + chunkSize + (chunkSize % 2);
    }

    if (!byteRate || !dataSize) return null;
    return dataSize / byteRate;
  }


  async processRetake(
    originalPath: string, 
    retakePath: string, 
    outputPath: string,
    startTimeMs?: number
  ): Promise<ProcessingResult> {
    return new Promise((resolve, reject) => {
      const pythonCmd = process.platform === "win32" ? "python" : "python3";
      
      const args = [
        this.scriptPath,
        `"${originalPath}"`,
        `"${retakePath}"`,
        `"${outputPath}"`,
        startTimeMs ? startTimeMs.toString() : "0"
      ];

      exec(`${pythonCmd} ${args.join(" ")}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`[AudioProcessor] Error: ${error.message}`);
          resolve({ status: "error", message: "Falha no processamento Python. Verifique logs." });
          return;
        }

        try {
          const lines = stdout.trim().split("\n");
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine) as ProcessingResult;
          resolve(result);
        } catch (e) {
          console.error(`[AudioProcessor] JSON Parse Error: ${stdout}`);
          resolve({ status: "error", message: "Saída inválida do processador de áudio" });
        }
      });
    });
  }
}

export const audioProcessor = new AudioProcessor();
