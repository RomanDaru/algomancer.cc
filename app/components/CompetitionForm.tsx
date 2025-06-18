"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  validateTitle, 
  validateDescription, 
  validateDates,
  FieldValidationResult 
} from "@/app/lib/utils/competitionValidation";
import { COMPETITION_TYPE } from "@/app/lib/constants";
import { Competition } from "@/app/lib/types/user";

interface CompetitionFormProps {
  initialData?: Partial<Competition>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  submitLabel: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  dates?: string;
  type?: string;
  general?: string;
}

export default function CompetitionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel,
}: CompetitionFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    type: initialData?.type || COMPETITION_TYPE.CONSTRUCTED,
    startDate: initialData?.startDate 
      ? new Date(initialData.startDate).toISOString().split("T")[0] 
      : "",
    endDate: initialData?.endDate 
      ? new Date(initialData.endDate).toISOString().split("T")[0] 
      : "",
    votingEndDate: initialData?.votingEndDate 
      ? new Date(initialData.votingEndDate).toISOString().split("T")[0] 
      : "",
    discordChannelId: initialData?.discordChannelId || "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isValid, setIsValid] = useState(false);

  // Real-time validation
  useEffect(() => {
    const newErrors: FormErrors = {};

    // Validate title
    if (touched.title) {
      const titleValidation = validateTitle(formData.title);
      if (!titleValidation.isValid) {
        newErrors.title = titleValidation.error;
      }
    }

    // Validate description
    if (touched.description) {
      const descriptionValidation = validateDescription(formData.description);
      if (!descriptionValidation.isValid) {
        newErrors.description = descriptionValidation.error;
      }
    }

    // Validate dates
    if (touched.startDate || touched.endDate || touched.votingEndDate) {
      if (formData.startDate && formData.endDate && formData.votingEndDate) {
        const datesValidation = validateDates(
          formData.startDate,
          formData.endDate,
          formData.votingEndDate,
          !initialData?._id // isNewCompetition
        );
        if (!datesValidation.isValid) {
          newErrors.dates = datesValidation.error;
        }
      } else if (touched.startDate || touched.endDate || touched.votingEndDate) {
        newErrors.dates = "All dates are required";
      }
    }

    setErrors(newErrors);

    // Check if form is valid
    const hasRequiredFields = formData.title && formData.description && 
                             formData.startDate && formData.endDate && 
                             formData.votingEndDate;
    const hasNoErrors = Object.keys(newErrors).length === 0;
    setIsValid(hasRequiredFields && hasNoErrors);

  }, [formData, touched, initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({
      title: true,
      description: true,
      startDate: true,
      endDate: true,
      votingEndDate: true,
    });

    // Final validation
    if (!isValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors(prev => ({ 
        ...prev, 
        general: error instanceof Error ? error.message : "Failed to submit form" 
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Error */}
      {errors.general && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-300 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-white mb-2">
          Competition Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          onBlur={() => handleBlur('title')}
          className={`w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
            errors.title 
              ? 'border-red-500 focus:ring-red-500/50' 
              : 'border-algomancy-purple/30 focus:ring-algomancy-purple/50'
          }`}
          placeholder="e.g., Winter Constructed Championship"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-400">{errors.title}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {formData.title.length}/100 characters
        </p>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          onBlur={() => handleBlur('description')}
          rows={4}
          className={`w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors resize-vertical ${
            errors.description 
              ? 'border-red-500 focus:ring-red-500/50' 
              : 'border-algomancy-purple/30 focus:ring-algomancy-purple/50'
          }`}
          placeholder="Describe the competition rules, prizes, and any special requirements..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-400">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {formData.description.length}/1000 characters
        </p>
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-white mb-2">
          Competition Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50"
        >
          <option value={COMPETITION_TYPE.CONSTRUCTED}>Constructed</option>
          <option value={COMPETITION_TYPE.DRAFT}>Draft</option>
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-white mb-2">
            Start Date *
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            onBlur={() => handleBlur('startDate')}
            className={`w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-2 transition-colors ${
              errors.dates 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-algomancy-purple/30 focus:ring-algomancy-purple/50'
            }`}
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-white mb-2">
            End Date *
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            onBlur={() => handleBlur('endDate')}
            className={`w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-2 transition-colors ${
              errors.dates 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-algomancy-purple/30 focus:ring-algomancy-purple/50'
            }`}
          />
        </div>

        <div>
          <label htmlFor="votingEndDate" className="block text-sm font-medium text-white mb-2">
            Voting End Date *
          </label>
          <input
            type="date"
            id="votingEndDate"
            name="votingEndDate"
            value={formData.votingEndDate}
            onChange={handleInputChange}
            onBlur={() => handleBlur('votingEndDate')}
            className={`w-full px-3 py-2 bg-algomancy-dark border rounded-md text-white focus:outline-none focus:ring-2 transition-colors ${
              errors.dates 
                ? 'border-red-500 focus:ring-red-500/50' 
                : 'border-algomancy-purple/30 focus:ring-algomancy-purple/50'
            }`}
          />
        </div>
      </div>
      
      {errors.dates && (
        <p className="text-sm text-red-400">{errors.dates}</p>
      )}

      {/* Discord Channel ID (Optional) */}
      <div>
        <label htmlFor="discordChannelId" className="block text-sm font-medium text-white mb-2">
          Discord Channel ID (Optional)
        </label>
        <input
          type="text"
          id="discordChannelId"
          name="discordChannelId"
          value={formData.discordChannelId}
          onChange={handleInputChange}
          className="w-full px-3 py-2 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-algomancy-purple/50"
          placeholder="e.g., 123456789012345678"
        />
        <p className="mt-1 text-xs text-gray-400">
          Optional: Discord channel where submissions will be posted
        </p>
      </div>

      {/* Submit Buttons */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-algomancy-purple/20">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !isValid}
          className="px-6 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-md text-white font-medium transition-colors"
        >
          {isSubmitting ? "Submitting..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
