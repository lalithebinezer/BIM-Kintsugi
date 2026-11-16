export interface MetadataEndpointConfig {
  mode: "rest" | "graphql";
  baseUrl: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface RemoteElementMetadata {
  expressId: number;
  type?: string;
  name?: string;
  globalId?: string;
  storey?: string;
  psets?: Record<string, Record<string, unknown>>;
}

/**
 * Optional REST / GraphQL metadata adapter allowing BIM-Kintsugi to fetch IFC Psets
 * lazily from a remote BIM backend on element click instead of keeping full models in RAM.
 */
export class MetadataApiAdapter {
  private static instance: MetadataApiAdapter | null = null;
  private config: MetadataEndpointConfig | null = null;

  private constructor() {}

  public static getInstance(): MetadataApiAdapter {
    if (!MetadataApiAdapter.instance) {
      MetadataApiAdapter.instance = new MetadataApiAdapter();
    }
    return MetadataApiAdapter.instance;
  }

  public configure(config: MetadataEndpointConfig | null) {
    this.config = config;
  }

  public isConfigured(): boolean {
    return Boolean(this.config && this.config.baseUrl);
  }

  public async fetchElementMetadata(
    modelId: string,
    expressId: number
  ): Promise<RemoteElementMetadata | null> {
    if (!this.config || !this.config.baseUrl || typeof fetch === "undefined") {
      return null;
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutMs = this.config.timeoutMs ?? 5000;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    try {
      let response: Response;
      if (this.config.mode === "graphql") {
        const query = `query GetBimElement($modelId: String!, $expressId: Int!) {
          bimElement(modelId: $modelId, expressId: $expressId) {
            expressId
            type
            name
            globalId
            storey
            psets
          }
        }`;
        response = await fetch(this.config.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(this.config.headers || {}),
          },
          body: JSON.stringify({ query, variables: { modelId, expressId } }),
          signal: controller?.signal,
        });
        if (!response.ok) return null;
        const payload = await response.json();
        return payload?.data?.bimElement ?? null;
      }

      const url = `${this.config.baseUrl.replace(/\/$/, "")}/models/${encodeURIComponent(
        modelId
      )}/elements/${encodeURIComponent(String(expressId))}`;
      response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...(this.config.headers || {}),
        },
        signal: controller?.signal,
      });
      if (!response.ok) return null;
      return (await response.json()) as RemoteElementMetadata;
    } catch {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
