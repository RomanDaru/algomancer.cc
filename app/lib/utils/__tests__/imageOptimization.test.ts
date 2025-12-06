import {
  optimizeCloudinaryUrl,
  optimizeCardThumbnail,
  optimizeCardDetail,
  optimizeCardCompact,
} from '../imageOptimization';

describe('Image Optimization', () => {
  const sampleCloudinaryUrl = 'https://res.cloudinary.com/dyfj9qvc0/image/upload/v1747595000/algomancy/cards/algomancy_test-card.jpg';
  const nonCloudinaryUrl = 'https://example.com/image.jpg';

  describe('optimizeCloudinaryUrl', () => {
    it('should add auto format and quality to Cloudinary URLs', () => {
      const result = optimizeCloudinaryUrl(sampleCloudinaryUrl);
      expect(result).toContain('f_auto');
      expect(result).toContain('q_auto');
    });

    it('should add width parameter when specified', () => {
      const result = optimizeCloudinaryUrl(sampleCloudinaryUrl, { width: 300 });
      expect(result).toContain('w_300');
      expect(result).toContain('c_fill');
    });

    it('should return original URL for non-Cloudinary URLs', () => {
      const result = optimizeCloudinaryUrl(nonCloudinaryUrl);
      expect(result).toBe(nonCloudinaryUrl);
    });

    it('should handle empty or invalid URLs gracefully', () => {
      expect(optimizeCloudinaryUrl('')).toBe('');
      expect(optimizeCloudinaryUrl('invalid-url')).toBe('invalid-url');
    });

    it('should combine multiple parameters correctly', () => {
      const result = optimizeCloudinaryUrl(sampleCloudinaryUrl, {
        width: 400,
        height: 300,
        quality: 80,
        format: 'webp',
        dpr: 'auto'
      });
      expect(result).toContain('f_webp');
      expect(result).toContain('q_80');
      expect(result).toContain('w_400');
      expect(result).toContain('h_300');
      expect(result).toContain('c_fill');
      expect(result).toContain('dpr_auto');
    });
  });

  describe('Preset optimization functions', () => {
    it('optimizeCardThumbnail should set appropriate parameters', () => {
      const result = optimizeCardThumbnail(sampleCloudinaryUrl);
      expect(result).toContain('w_500');
      expect(result).toContain('f_auto');
      expect(result).toContain('q_auto');
      expect(result).toContain('c_fill');
      expect(result).toContain('dpr_auto');
    });

    it('optimizeCardDetail should set appropriate parameters', () => {
      const result = optimizeCardDetail(sampleCloudinaryUrl);
      expect(result).toContain('w_800');
      expect(result).toContain('f_auto');
      expect(result).toContain('q_auto');
      expect(result).toContain('c_fit');
      expect(result).toContain('dpr_auto');
    });

    it('optimizeCardCompact should set appropriate parameters', () => {
      const result = optimizeCardCompact(sampleCloudinaryUrl);
      expect(result).toContain('w_320');
      expect(result).toContain('f_auto');
      expect(result).toContain('q_auto');
      expect(result).toContain('c_fill');
      expect(result).toContain('dpr_auto');
    });
  });

  describe('URL structure preservation', () => {
    it('should preserve the original path and filename', () => {
      const result = optimizeCloudinaryUrl(sampleCloudinaryUrl);
      expect(result).toContain('algomancy/cards/algomancy_test-card.jpg');
      expect(result).toContain('v1747595000');
    });

    it('should maintain proper URL structure', () => {
      const result = optimizeCloudinaryUrl(sampleCloudinaryUrl, { width: 300 });
      const expectedPattern = /https:\/\/res\.cloudinary\.com\/dyfj9qvc0\/image\/upload\/[^\/]+\/v1747595000\/algomancy\/cards\/algomancy_test-card\.jpg/;
      expect(result).toMatch(expectedPattern);
    });
  });
});
