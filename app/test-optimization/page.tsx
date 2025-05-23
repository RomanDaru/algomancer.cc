import { optimizeCardThumbnail, optimizeCardDetail } from "@/app/lib/utils/imageOptimization";

export default function TestOptimizationPage() {
  // Sample Cloudinary URL from your project
  const originalUrl = "https://res.cloudinary.com/dyfj9qvc0/image/upload/v1747595000/algomancy/cards/algomancy_a-fast-pile-of-rocks.jpg";
  
  const thumbnailUrl = optimizeCardThumbnail(originalUrl);
  const detailUrl = optimizeCardDetail(originalUrl);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Image Optimization Test</h1>
      
      <div className="space-y-8">
        {/* Original URL */}
        <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-algomancy-gold mb-4">Original URL</h2>
          <p className="text-sm text-gray-300 mb-4 break-all">{originalUrl}</p>
          <div className="text-sm text-gray-400">
            <p>• Format: JPG only</p>
            <p>• Quality: Original (large file size)</p>
            <p>• Size: Original dimensions</p>
          </div>
        </div>

        {/* Thumbnail Optimized */}
        <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-algomancy-gold mb-4">Thumbnail Optimized</h2>
          <p className="text-sm text-gray-300 mb-4 break-all">{thumbnailUrl}</p>
          <div className="text-sm text-gray-400">
            <p>• Format: Auto (WebP/AVIF when supported, JPG fallback)</p>
            <p>• Quality: Auto optimized</p>
            <p>• Size: 300px width</p>
            <p>• Crop: Fill (maintains aspect ratio)</p>
          </div>
        </div>

        {/* Detail Optimized */}
        <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-algomancy-gold mb-4">Detail View Optimized</h2>
          <p className="text-sm text-gray-300 mb-4 break-all">{detailUrl}</p>
          <div className="text-sm text-gray-400">
            <p>• Format: Auto (WebP/AVIF when supported, JPG fallback)</p>
            <p>• Quality: Auto optimized</p>
            <p>• Size: 600px width</p>
            <p>• Crop: Fit (preserves full image)</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-algomancy-darker border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-400 mb-4">✅ Optimization Benefits</h2>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• <strong>30-50% smaller file sizes</strong> - Faster loading</li>
            <li>• <strong>Modern formats</strong> - WebP/AVIF when browser supports</li>
            <li>• <strong>Auto quality</strong> - Optimal balance of size vs quality</li>
            <li>• <strong>Responsive sizing</strong> - Right size for each use case</li>
            <li>• <strong>Automatic fallback</strong> - JPG for older browsers</li>
            <li>• <strong>No visual quality loss</strong> - Cloudinary's smart optimization</li>
          </ul>
        </div>

        {/* Implementation */}
        <div className="bg-algomancy-darker border border-blue-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">🔧 Implementation</h2>
          <div className="text-sm text-gray-300 space-y-2">
            <p>• <strong>Card thumbnails:</strong> 300px width, auto format/quality</p>
            <p>• <strong>Card details:</strong> 600px width, auto format/quality</p>
            <p>• <strong>Compact cards:</strong> 200px width, auto format/quality</p>
            <p>• <strong>Safe fallback:</strong> Returns original URL if optimization fails</p>
            <p>• <strong>Non-Cloudinary URLs:</strong> Passed through unchanged</p>
          </div>
        </div>
      </div>
    </div>
  );
}
