"use client";

import { useState, useEffect } from "react";
import { TrophyIcon, StarIcon } from "@heroicons/react/24/outline";
import Badge from "@/app/components/Badge";

export default function HallOfFamePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center">
          <StarIcon className="w-10 h-10 mr-3 text-algomancy-gold" />
          Hall of Fame
        </h1>
        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Celebrating the greatest champions and deck builders in Algomancy history. 
          These legendary players have earned their place among the elite through exceptional skill and dedication.
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="bg-algomancy-darker border border-algomancy-gold/30 rounded-lg p-12 text-center">
        <TrophyIcon className="w-16 h-16 text-algomancy-gold mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Coming Soon</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          The Hall of Fame will showcase the most accomplished players in Algomancy, including:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-algomancy-dark border border-algomancy-purple/20 rounded-lg p-6">
            <div className="text-3xl mb-3">🏗️</div>
            <h3 className="text-lg font-semibold text-algomancy-gold mb-2">
              Best Constructed Champions
            </h3>
            <p className="text-gray-400 text-sm">
              Monthly winners of constructed deck competitions
            </p>
          </div>
          
          <div className="bg-algomancy-dark border border-algomancy-blue/20 rounded-lg p-6">
            <div className="text-3xl mb-3">🎲</div>
            <h3 className="text-lg font-semibold text-algomancy-blue mb-2">
              Best Draft Masters
            </h3>
            <p className="text-gray-400 text-sm">
              Monthly winners of draft competitions
            </p>
          </div>
          
          <div className="bg-algomancy-dark border border-algomancy-gold/20 rounded-lg p-6">
            <div className="text-3xl mb-3">👑</div>
            <h3 className="text-lg font-semibold text-algomancy-gold mb-2">
              Legendary Players
            </h3>
            <p className="text-gray-400 text-sm">
              Players with exceptional achievements and contributions
            </p>
          </div>
        </div>

        {/* Sample Badges */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Achievement Badges</h3>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge 
              badge={{
                _id: "sample1" as any,
                type: "best_constructed_monthly",
                title: "Best Constructed January 2024",
                description: "Winner of the best constructed deck competition in January 2024",
                icon: "🏗️",
                color: "#F59E0B",
                month: "2024-01",
                awardedAt: new Date(),
                createdAt: new Date(),
              }}
              size="medium"
            />
            <Badge 
              badge={{
                _id: "sample2" as any,
                type: "best_draft_monthly", 
                title: "Best Draft February 2024",
                description: "Winner of the best draft deck competition in February 2024",
                icon: "🎲",
                color: "#3B82F6",
                month: "2024-02",
                awardedAt: new Date(),
                createdAt: new Date(),
              }}
              size="medium"
            />
            <Badge 
              badge={{
                _id: "sample3" as any,
                type: "hall_of_fame",
                title: "Hall of Fame",
                description: "Inducted into the Algomancy Hall of Fame for exceptional achievements",
                icon: "👑",
                color: "#EF4444",
                awardedAt: new Date(),
                createdAt: new Date(),
              }}
              size="medium"
            />
          </div>
        </div>

        <p className="text-gray-400">
          Start competing in tournaments to earn your place in history!
        </p>
      </div>
    </div>
  );
}
