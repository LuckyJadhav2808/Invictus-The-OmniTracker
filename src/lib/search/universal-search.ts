import MiniSearch, { type SearchResult } from "minisearch";

export interface UniversalSearchOptions<T> {
  fields: (keyof T & string)[];
  storeFields?: (keyof T & string)[];
  fuzzy?: number;
  prefix?: boolean;
  boost?: Partial<Record<keyof T & string, number>>;
}

/**
 * Universal In-Memory Client Search Engine (MiniSearch)
 * Provides sub-2ms fuzzy search, prefix auto-completion, and typo tolerance for any dataset.
 */
export class UniversalSearchIndex<T extends { id: string }> {
  private index: MiniSearch<T>;
  private itemsMap: Map<string, T> = new Map();
  private options: UniversalSearchOptions<T>;

  constructor(items: T[], options: UniversalSearchOptions<T>) {
    this.options = options;
    this.index = new MiniSearch<T>({
      fields: options.fields,
      storeFields: options.storeFields || ["id"],
      searchOptions: {
        prefix: options.prefix ?? true,
        fuzzy: options.fuzzy ?? 0.2,
        boost: (options.boost as Record<string, number>) || {},
      },
    });

    this.setItems(items);
  }

  public setItems(items: T[]): void {
    this.index.removeAll();
    this.itemsMap.clear();

    for (const item of items) {
      this.itemsMap.set(item.id, item);
    }

    if (items.length > 0) {
      this.index.addAll(items);
    }
  }

  public search(query: string, limit: number = 25): T[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return Array.from(this.itemsMap.values()).slice(0, limit);
    }

    const results: SearchResult[] = this.index.search(trimmed);
    const matchedItems: T[] = [];

    for (const res of results.slice(0, limit)) {
      const item = this.itemsMap.get(res.id);
      if (item) {
        matchedItems.push(item);
      }
    }

    return matchedItems;
  }

  public get(id: string): T | undefined {
    return this.itemsMap.get(id);
  }

  public count(): number {
    return this.itemsMap.size;
  }
}

/**
 * Factory helper for quick one-off index creation
 */
export function createUniversalIndex<T extends { id: string }>(
  items: T[],
  options: UniversalSearchOptions<T>
): UniversalSearchIndex<T> {
  return new UniversalSearchIndex<T>(items, options);
}
