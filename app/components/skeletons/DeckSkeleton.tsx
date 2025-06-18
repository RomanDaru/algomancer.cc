export default function DeckSkeleton() {
  return (
    <div className="bg-algomancy-darker border border-algomancy-purple/30 rounded-lg p-4 animate-pulse">
      {/* Deck Image/Icon */}
      <div className="h-32 bg-gray-700 rounded-lg mb-4"></div>
      
      {/* Deck Title */}
      <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
      
      {/* Deck Description */}
      <div className="space-y-1 mb-3">
        <div className="h-3 bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-700 rounded w-2/3"></div>
      </div>
      
      {/* Elements */}
      <div className="flex items-center space-x-2 mb-3">
        <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
        <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
        <div className="h-4 w-4 bg-gray-700 rounded-full"></div>
      </div>
      
      {/* Stats */}
      <div className="flex items-center justify-between text-sm">
        <div className="h-4 bg-gray-700 rounded w-16"></div>
        <div className="h-4 bg-gray-700 rounded w-12"></div>
      </div>
    </div>
  );
}

export function DeckGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <DeckSkeleton key={i} />
      ))}
    </div>
  );
}
