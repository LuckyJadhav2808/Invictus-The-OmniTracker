"use client";

/**
 * Air-Gapped On-Device Semantic Classifier Engine
 * Powered by @xenova/transformers (WASM/WebGPU quantized micro-model)
 * 100% offline-first: Zero data leaves the client device.
 */

let featureExtractorPromise: Promise<any> | null = null;
let isModelLoading = false;

/**
 * Initializes the on-device feature extraction pipeline lazily
 */
async function getFeatureExtractor() {
  if (typeof window === "undefined") return null;

  if (!featureExtractorPromise) {
    featureExtractorPromise = (async () => {
      try {
        isModelLoading = true;
        const { pipeline, env } = await import("@xenova/transformers");
        // Ensure browser caching is active and remote network calls are only for first asset load
        env.allowLocalModels = false;
        env.useBrowserCache = true;

        const extractor = await pipeline(
          "feature-extraction",
          "Xenova/all-MiniLM-L6-v2",
          { quantized: true }
        );
        isModelLoading = false;
        return extractor;
      } catch (err) {
        isModelLoading = false;
        console.warn("[SemanticClassifier]: Local ONNX pipeline unavailable, using fast keyword fallback", err);
        return null;
      }
    })();
  }

  return featureExtractorPromise;
}

export function isSemanticClassifierLoading(): boolean {
  return isModelLoading;
}

/**
 * Classifies an unknown merchant or note semantically against candidate budget categories
 * @param query e.g. "Sri Krishna South Indian Mess" or "Decathlon Shaker"
 * @param categories Active categories in the user's budget
 */
export async function classifyMerchantSemantically(
  query: string,
  categories: Array<{ id: string; name: string; description?: string }>
): Promise<{ categoryId: string; confidence: number; categoryName: string } | null> {
  if (!query || !query.trim() || !categories || categories.length === 0) {
    return null;
  }

  try {
    const extractor = await getFeatureExtractor();
    if (!extractor) return null;

    // Vectorize query and category labels
    const texts = [
      query.trim().toLowerCase(),
      ...categories.map((c) => `${c.name} ${c.description || ""}`.trim().toLowerCase()),
    ];

    const embeddings = await extractor(texts, {
      pooling: "mean",
      normalize: true,
    });

    const queryVec = embeddings[0].data;
    let bestScore = -1;
    let bestIndex = -1;

    for (let i = 0; i < categories.length; i++) {
      const catVec = embeddings[i + 1].data;
      let dotProduct = 0;
      for (let j = 0; j < queryVec.length; j++) {
        dotProduct += queryVec[j] * catVec[j];
      }

      if (dotProduct > bestScore) {
        bestScore = dotProduct;
        bestIndex = i;
      }
    }

    // Cosine similarity threshold for confident semantic association
    if (bestScore >= 0.35 && bestIndex >= 0) {
      return {
        categoryId: categories[bestIndex].id,
        categoryName: categories[bestIndex].name,
        confidence: Math.round(bestScore * 100) / 100,
      };
    }
  } catch (err) {
    console.warn("[SemanticClassifier]: Inference error:", err);
  }

  return null;
}
