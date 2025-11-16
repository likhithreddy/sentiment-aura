/**
 * Response Cache Manager for Sentiment Analysis
 * Provides intelligent caching with TTL, LRU eviction, and cache warming
 */

import { SentimentData } from '../types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTtl: number; // Default TTL in milliseconds
  cleanupInterval: number; // Cleanup interval in milliseconds
  enableStats: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  evictions: number;
  totalRequests: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    evictions: 0,
    totalRequests: 0
  };

  constructor(private config: CacheConfig) {
    // Start cleanup interval
    if (config.cleanupInterval > 0) {
      setInterval(() => {
        this.cleanup();
      }, config.cleanupInterval);
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    this.stats.totalRequests++;

    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access tracking
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.updateAccessOrder(key);

    this.stats.hits++;
    this.updateHitRate();

    return entry.data;
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict if cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.config.defaultTtl,
      accessCount: 1,
      lastAccessed: now
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.stats.size = this.cache.size;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.stats.size = this.cache.size;
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
    }

    this.stats.size = this.cache.size;
  }

  /**
   * Check if entry has expired
   */
  private isExpired(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Update access order (LRU tracking)
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    if (this.accessOrder.length > 0) {
      const lruKey = this.accessOrder[0];
      this.cache.delete(lruKey);
      this.accessOrder.shift();
      this.stats.evictions++;
    }
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    this.stats.hitRate = this.stats.totalRequests > 0
      ? (this.stats.hits / this.stats.totalRequests) * 100
      : 0;
  }
}

// Enhanced cache manager for sentiment analysis
export class SentimentCacheManager {
  private cache: LRUCache<SentimentData>;
  private similarityThreshold = 0.8; // Similarity threshold for fuzzy matching

  constructor(config?: Partial<CacheConfig>) {
    const defaultConfig: CacheConfig = {
      maxSize: 100,
      defaultTtl: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableStats: true
    };

    this.cache = new LRUCache<SentimentData>({ ...defaultConfig, ...config });
  }

  /**
   * Get cached sentiment data
   */
  get(text: string): SentimentData | null {
    // Try exact match first
    const exactKey = this.createExactKey(text);
    let result = this.cache.get(exactKey);
    if (result) {
      return result;
    }

    // Try fuzzy match for similar texts
    const fuzzyKey = this.createFuzzyKey(text);
    result = this.cache.get(fuzzyKey);
    if (result) {
      return result;
    }

    // Try finding similar entries
    return this.findSimilarEntry(text);
  }

  /**
   * Set sentiment data in cache
   */
  set(text: string, data: SentimentData, ttl?: number): void {
    const exactKey = this.createExactKey(text);
    const fuzzyKey = this.createFuzzyKey(text);

    // Store with both exact and fuzzy keys
    this.cache.set(exactKey, data, ttl);
    this.cache.set(fuzzyKey, data, ttl);
  }

  /**
   * Check if text is cached
   */
  has(text: string): boolean {
    const exactKey = this.createExactKey(text);
    const fuzzyKey = this.createFuzzyKey(text);

    return this.cache.has(exactKey) || this.cache.has(fuzzyKey);
  }

  /**
   * Delete entries for text
   */
  delete(text: string): void {
    const exactKey = this.createExactKey(text);
    const fuzzyKey = this.createFuzzyKey(text);

    this.cache.delete(exactKey);
    this.cache.delete(fuzzyKey);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return this.cache.getStats();
  }

  /**
   * Pre-populate cache with common phrases
   */
  async warmCache(phrases: string[]): Promise<void> {
    // This would be implemented with API calls to pre-warm cache
    // For now, just log that warming would happen
    console.log(`Cache warming requested for ${phrases.length} phrases`);
  }

  /**
   * Create exact cache key
   */
  private createExactKey(text: string): string {
    return `exact:${this.normalizeText(text)}`;
  }

  /**
   * Create fuzzy cache key (for similar texts)
   */
  private createFuzzyKey(text: string): string {
    const normalized = this.normalizeText(text);
    const words = normalized.split(' ').slice(0, 5); // First 5 words
    return `fuzzy:${words.join('_')}`;
  }

  /**
   * Normalize text for caching
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Find similar entry using text similarity
   */
  private findSimilarEntry(text: string): SentimentData | null {
    const normalizedText = this.normalizeText(text);
    const textWords = normalizedText.split(' ');

    const keys = this.cache.keys();
    for (const key of keys) {
      if (key.startsWith('exact:')) {
        const cachedText = key.substring(6); // Remove 'exact:' prefix
        const similarity = this.calculateSimilarity(normalizedText, cachedText);

        if (similarity >= this.similarityThreshold) {
          const entry = this.cache.get(key);
          if (entry) {
            return entry;
          }
        }
      }
    }

    return null;
  }

  /**
   * Calculate text similarity using Jaccard similarity
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(' '));
    const words2 = new Set(text2.split(' '));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }
}

// Global cache instance
export const sentimentCache = new SentimentCacheManager({
  maxSize: 50,
  defaultTtl: 10 * 60 * 1000, // 10 minutes
  cleanupInterval: 30 * 1000, // 30 seconds
  enableStats: true
});

// Common phrases for cache warming
export const COMMON_PHRASES = [
  'hello',
  'how are you',
  'good morning',
  'thank you',
  'yes',
  'no',
  'I agree',
  'I disagree',
  'that\'s interesting',
  'what do you think',
  'can you help me',
  'I don\'t understand',
  'that makes sense',
  'tell me more',
  'that\'s great'
];

// Export utility functions
export const getCacheKey = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_');
};

export const isCacheHit = (text: string): boolean => {
  return sentimentCache.has(text);
};

export const getCacheStats = (): CacheStats => {
  return sentimentCache.getStats();
};