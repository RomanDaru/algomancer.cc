import Link from "next/link";
import { CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Competition } from "@/app/lib/types/user";
import { COMPETITION_STATUS } from "@/app/lib/constants";

interface CompetitionCardProps {
  competition: Competition;
  variant?: "active" | "completed";
}

function getStatusColor(status: string) {
  switch (status) {
    case COMPETITION_STATUS.ACTIVE:
      return "text-green-400 bg-green-400/10 border-green-400/20";
    case COMPETITION_STATUS.VOTING:
      return "text-blue-400 bg-blue-400/10 border-blue-400/20";
    case COMPETITION_STATUS.COMPLETED:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
    case COMPETITION_STATUS.UPCOMING:
      return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    default:
      return "text-gray-400 bg-gray-400/10 border-gray-400/20";
  }
}

function getTypeIcon(type: string) {
  // Return empty string to remove icons
  return "";
}

export default function CompetitionCard({
  competition,
  variant = "active",
}: CompetitionCardProps) {
  const isCompleted = variant === "completed";
  const borderColor = isCompleted
    ? "border-gray-600/30"
    : "border-algomancy-purple/30";
  const hoverBorderColor = isCompleted
    ? "hover:border-gray-600/50"
    : "hover:border-algomancy-purple/50";

  return (
    <div
      className={`bg-algomancy-darker border ${borderColor} ${hoverBorderColor} rounded-lg p-6 transition-colors`}>
      <div className='flex items-start justify-between mb-4'>
        <div className='flex items-center'>
          <h3
            className={`${
              isCompleted ? "text-lg" : "text-xl"
            } font-semibold text-white`}>
            {competition.title}
          </h3>
        </div>
        <span
          className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(
            competition.status
          )}`}>
          {competition.status.charAt(0).toUpperCase() +
            competition.status.slice(1)}
        </span>
      </div>

      <p className={`text-gray-300 mb-4 ${isCompleted ? "text-sm" : ""}`}>
        {competition.description}
      </p>

      <div
        className={`flex items-center justify-between text-sm text-gray-400 mb-4`}>
        <div className='flex items-center'>
          <CalendarIcon className='w-4 h-4 mr-1' />
          {isCompleted
            ? `Completed ${competition.endDate.toLocaleDateString()}`
            : `Ends ${competition.endDate.toLocaleDateString()}`}
        </div>
        <div className='flex items-center'>
          <UsersIcon className='w-4 h-4 mr-1' />
          {competition.submissionCount} submissions
        </div>
      </div>

      <Link
        href={`/competitions/${competition._id}`}
        className={`inline-flex items-center px-4 py-2 rounded-md text-white font-medium transition-colors ${
          isCompleted
            ? "bg-gray-700 hover:bg-gray-600 text-sm"
            : "bg-algomancy-purple hover:bg-algomancy-purple-dark"
        }`}>
        {isCompleted ? "View Winners" : "View Details"}
      </Link>
    </div>
  );
}
