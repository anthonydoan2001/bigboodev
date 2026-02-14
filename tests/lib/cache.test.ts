import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCache, setCache, invalidateCache, clearCache, CACHE_KEYS } from '@/lib/cache';

describe('cache', () => {
  beforeEach(() => {
    clearCache();
  });

  describe('getCache / setCache', () => {
    it('returns null for missing key', () => {
      expect(getCache('nonexistent')).toBeNull();
    });

    it('stores and retrieves data', () => {
      setCache('key1', { name: 'test' });
      expect(getCache('key1')).toEqual({ name: 'test' });
    });

    it('supports different data types', () => {
      setCache('string', 'hello');
      setCache('number', 42);
      setCache('array', [1, 2, 3]);
      expect(getCache('string')).toBe('hello');
      expect(getCache('number')).toBe(42);
      expect(getCache('array')).toEqual([1, 2, 3]);
    });

    it('overwrites existing key', () => {
      setCache('key', 'old');
      setCache('key', 'new');
      expect(getCache('key')).toBe('new');
    });
  });

  describe('TTL expiry', () => {
    it('returns data before TTL expires', () => {
      vi.useFakeTimers();
      setCache('ttl-test', 'value', 5000);
      vi.advanceTimersByTime(4999);
      expect(getCache('ttl-test')).toBe('value');
      vi.useRealTimers();
    });

    it('returns null after TTL expires', () => {
      vi.useFakeTimers();
      setCache('ttl-test', 'value', 5000);
      vi.advanceTimersByTime(5001);
      expect(getCache('ttl-test')).toBeNull();
      vi.useRealTimers();
    });

    it('uses default 60s TTL', () => {
      vi.useFakeTimers();
      setCache('default-ttl', 'value');
      vi.advanceTimersByTime(59999);
      expect(getCache('default-ttl')).toBe('value');
      vi.advanceTimersByTime(2);
      expect(getCache('default-ttl')).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('invalidateCache', () => {
    it('removes exact key match', () => {
      setCache('folders', 'data');
      invalidateCache('folders');
      expect(getCache('folders')).toBeNull();
    });

    it('removes prefix-matched keys', () => {
      setCache('folders', 'root');
      setCache('folders:123', 'child');
      setCache('folders:456', 'child2');
      setCache('tags', 'keep');
      invalidateCache('folders');
      expect(getCache('folders')).toBeNull();
      expect(getCache('folders:123')).toBeNull();
      expect(getCache('folders:456')).toBeNull();
      expect(getCache('tags')).toBe('keep');
    });
  });

  describe('clearCache', () => {
    it('removes all entries', () => {
      setCache('a', 1);
      setCache('b', 2);
      clearCache();
      expect(getCache('a')).toBeNull();
      expect(getCache('b')).toBeNull();
    });
  });

  describe('CACHE_KEYS', () => {
    it('exports expected keys', () => {
      expect(CACHE_KEYS.FOLDERS).toBe('folders');
      expect(CACHE_KEYS.TAGS).toBe('tags');
    });
  });
});
