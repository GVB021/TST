import { exec } from "child_process";
import path from "path";
import fs from "fs";

interface AudioMetadata {
  character: string;
  actor: string;
  timecode: string;
  startTimeMs: number;
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

  /**
   * Extrai metadados do nome do arquivo.
   * Formato esperado: Personagem_Dublador_HH:MM:SS.wav
   */
  parseMetadata(filename: string): AudioMetadata | null {
    // Remover extensão
    const name = path.basename(filename, path.extname(filename));
    const parts = name.split("_");
    
    // Tenta encontrar o timecode (formato HH:MM:SS, HH-MM-SS ou HHMMSS)
    // Procura do fim para o começo, pois Personagem ou Dublador podem ter underline
    const timecodeIndex = parts.findIndex(p => 
      /^\d{2}[:\-]\d{2}[:\-]\d{2}$/.test(p) || /^\d{6}$/.test(p)
    );
    
    if (timecodeIndex === -1) {
        return null;
    }

    let timecode = parts[timecodeIndex];
    // Se for formato HHMMSS, converte para HH:MM:SS
    if (/^\d{6}$/.test(timecode)) {
      timecode = `${timecode.slice(0, 2)}:${timecode.slice(2, 4)}:${timecode.slice(4, 6)}`;
    } else {
      timecode = timecode.replace(/-/g, ":");
    }

    const actor = parts[timecodeIndex - 1] || "Unknown";
    const character = parts.slice(0, timecodeIndex - 1).join("_") || "Unknown";

    return {
      character,
      actor,
      timecode,
      startTimeMs: this.timecodeToMs(timecode)
    };
  }

  timecodeToMs(tc: string): number {
    const [h, m, s] = tc.split(":").map(Number);
    return ((h * 3600) + (m * 60) + s) * 1000;
  }


  async processRetake(
    originalPath: string, 
    retakePath: string, 
    outputPath: string,
    startTimeMs?: number
  ): Promise<ProcessingResult> {
    // ... (mesmo código do processRetake) ...
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
