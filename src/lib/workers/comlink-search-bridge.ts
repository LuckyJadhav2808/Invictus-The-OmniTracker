import * as Comlink from "comlink";
import MiniSearch from "minisearch";

export interface SearchWorkerService {
  indexItems: (items: Array<{ id: string; title: string; category?: string }>) => Promise<number>;
  search: (query: string, limit?: number) => Promise<string[]>;
}

/**
 * Universal Search Service class designed to be exposed via Comlink in Web Workers,
 * or executed directly in synchronous/SSR/Node fallback environments.
 */
export class UniversalSearchWorkerEndpoint implements SearchWorkerService {
  private miniSearch = new MiniSearch<{ id: string; title: string; category?: string }>({
    fields: ["title", "category"],
    storeFields: ["id"],
    searchOptions: {
      fuzzy: 0.2,
      prefix: true,
    },
  });

  public async indexItems(items: Array<{ id: string; title: string; category?: string }>): Promise<number> {
    this.miniSearch.removeAll();
    if (items.length > 0) {
      this.miniSearch.addAll(items);
    }
    return this.miniSearch.documentCount;
  }

  public async search(query: string, limit: number = 20): Promise<string[]> {
    if (!query.trim()) return [];
    const results = this.miniSearch.search(query.trim());
    return results.slice(0, limit).map((r) => r.id);
  }
}

/**
 * Factory that creates a Comlink-wrapped worker proxy in browser environments,
 * or returns an in-process endpoint in Node / SSR / Test environments.
 */
export function createSearchWorkerClient(): SearchWorkerService {
  const endpoint = new UniversalSearchWorkerEndpoint();

  // If we are in a Web Worker or MessageChannel environment, Comlink can expose/wrap endpoints
  if (typeof MessageChannel !== "undefined") {
    const channel = new MessageChannel();
    Comlink.expose(endpoint, channel.port1);
    return Comlink.wrap<SearchWorkerService>(channel.port2);
  }

  return endpoint;
}
