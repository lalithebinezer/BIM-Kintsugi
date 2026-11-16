import * as FRAGS from "@thatopen/fragments";
import { BimEngine } from "../core/BimEngine";

export interface SplitOutputFile {
  filename: string;
  content: string;
  itemCount: number;
}

/**
 * Browser-Side IFC Splitter & Extractor (Phase 5B).
 * Powered by `@thatopen/fragments` `FRAGS.IfcSplitter` using an in-memory
 * `ReadableStream` / `WritableStream` IO adapter with zero Node filesystem dependency.
 */
export class IfcSplitterModule {
  private static instance: IfcSplitterModule | null = null;
  private lastSplitOutputs: SplitOutputFile[] = [];

  private constructor() {}

  public static getInstance(): IfcSplitterModule {
    if (!IfcSplitterModule.instance) {
      IfcSplitterModule.instance = new IfcSplitterModule();
    }
    return IfcSplitterModule.instance;
  }

  public getLastOutputs(): SplitOutputFile[] {
    return this.lastSplitOutputs;
  }

  private createMemoryIO(inputBuffer: Uint8Array, inputKey: string) {
    const writtenChunks = new Map<string, string[]>();

    const io: FRAGS.IfcSplitterIO = {
      async readableStream(targetPath: string): Promise<ReadableStream<string>> {
        if (targetPath !== inputKey) {
          throw new Error(`Unknown input stream path: ${targetPath}`);
        }
        // IfcSplitter.forEachLine expects one STEP line per enqueued chunk
        return new ReadableStream<string>({
          start(controller) {
            const decoder = new TextDecoder("utf-8");
            const chunkSize = 64 * 1024;
            let tail = "";
            for (let offset = 0; offset < inputBuffer.byteLength; offset += chunkSize) {
              const slice = inputBuffer.subarray(
                offset,
                Math.min(offset + chunkSize, inputBuffer.byteLength)
              );
              const text = tail + decoder.decode(slice, { stream: offset + chunkSize < inputBuffer.byteLength });
              let lineStart = 0;
              let nlIdx = text.indexOf("\n", lineStart);
              while (nlIdx !== -1) {
                const lineEnd = nlIdx > lineStart && text.charCodeAt(nlIdx - 1) === 13 ? nlIdx - 1 : nlIdx;
                controller.enqueue(text.slice(lineStart, lineEnd));
                lineStart = nlIdx + 1;
                nlIdx = text.indexOf("\n", lineStart);
              }
              tail = text.slice(lineStart);
            }
            if (tail.length > 0) {
              controller.enqueue(tail.endsWith("\r") ? tail.slice(0, -1) : tail);
            }
            controller.close();
          },
        });
      },
      async writableStream(targetPath: string): Promise<WritableStream<string>> {
        const chunks: string[] = [];
        writtenChunks.set(targetPath, chunks);
        return new WritableStream<string>({
          write(chunk: string) {
            chunks.push(chunk);
          },
        });
      },
    };

    const collectOutput = (targetPath: string): string => {
      return (writtenChunks.get(targetPath) || []).join("");
    };

    return { io, collectOutput };
  }

  /**
   * Splits an `.ifc` file into `numGroups` self-contained IFC files preserving shared spatial
   * structure, geometry definitions, materials, and coupled wall/opening relationships.
   */
  public async splitBuffer(
    inputBuffer: Uint8Array,
    numGroups: number,
    baseName: string = "BIM_Split",
    onProgress?: (stage: string, ms: number) => void
  ): Promise<SplitOutputFile[]> {
    const safeGroups = Math.max(2, Math.min(32, Math.floor(numGroups)));
    const cleanBase = baseName.replace(/\.ifc$/i, "");
    const inputKey = `${cleanBase}.ifc`;
    const { io, collectOutput } = this.createMemoryIO(inputBuffer, inputKey);
    const splitter = new FRAGS.IfcSplitter(io);

    if (onProgress) {
      splitter.onProgress.add((ev) => onProgress(ev.stage, ev.timeElapsed));
    }

    const resultMap = await splitter.split(
      inputKey,
      safeGroups,
      (groupId: number) => `${cleanBase}_part_${groupId + 1}.ifc`
    );

    const outputs: SplitOutputFile[] = [];
    for (const [, info] of resultMap) {
      outputs.push({
        filename: info.path,
        content: collectOutput(info.path),
        itemCount: info.ids.size,
      });
    }

    this.lastSplitOutputs = outputs;
    return outputs;
  }

  /**
   * Extracts a specific set of EXPRESS element IDs (and all coupled openings/materials/spatial nodes)
   * into a standalone `.ifc` file.
   */
  public async extractIds(
    inputBuffer: Uint8Array,
    expressIds: number[],
    outputFilename: string = "BIM_Extract.ifc"
  ): Promise<SplitOutputFile> {
    if (expressIds.length === 0) {
      throw new Error("Select at least one element ID to extract");
    }
    const inputKey = "source.ifc";
    const { io, collectOutput } = this.createMemoryIO(inputBuffer, inputKey);
    const splitter = new FRAGS.IfcSplitter(io);
    const writtenIds = await splitter.extract(inputKey, expressIds, outputFilename);
    const file: SplitOutputFile = {
      filename: outputFilename,
      content: collectOutput(outputFilename),
      itemCount: writtenIds.size,
    };
    this.lastSplitOutputs = [file];
    return file;
  }

  /**
   * Extracts elements currently selected in the 3D viewport from the given source `.ifc` buffer.
   */
  public async extractSelectedFromScene(
    inputBuffer: Uint8Array,
    outputFilename: string = "BIM_Selection_Extract.ifc"
  ): Promise<SplitOutputFile> {
    const selection = BimEngine.getInstance().highlighter?.selection?.select || {};
    const ids = new Set<number>();
    for (const set of Object.values(selection)) {
      if (set) {
        for (const id of set as Iterable<number>) ids.add(id);
      }
    }
    return this.extractIds(inputBuffer, [...ids], outputFilename);
  }

  public downloadOutputs(outputs: SplitOutputFile[] = this.lastSplitOutputs) {
    outputs.forEach((out, idx) => {
      setTimeout(() => {
        const blob = new Blob([out.content], { type: "application/x-step" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = out.filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }, idx * 250);
    });
  }
}
