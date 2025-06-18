export default function CompetitionSkeleton() {
  return (
    <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-6 bg-gray-700 rounded w-20 ml-4"></div>
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gray-700 rounded w-full"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-700 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
        <div>
          <div className="h-3 bg-gray-700 rounded w-20 mb-1"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-700 rounded w-32"></div>
        <div className="h-8 bg-gray-700 rounded w-24"></div>
      </div>
    </div>
  );
}

export function CompetitionListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, i) => (
        <CompetitionSkeleton key={i} />
      ))}
    </div>
  );
}
