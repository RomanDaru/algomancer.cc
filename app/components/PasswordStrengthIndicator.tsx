"use client";

import { validatePassword, getPasswordStrengthColor, getPasswordStrengthBgColor } from '@/app/lib/utils/validation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showStrength?: boolean;
  showToggle?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  autoComplete?: string;
}

export default function PasswordStrengthIndicator({
  password,
  showStrength = true,
  showToggle = true,
  value,
  onChange,
  placeholder = "Enter your password",
  className = "",
  label = "Password",
  required = true,
  autoComplete
}: PasswordStrengthIndicatorProps) {
  const [showPassword, setShowPassword] = useState(false);
  const validation = validatePassword(password);

  const getStrengthWidth = () => {
    return `${(validation.score / 4) * 100}%`;
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="block w-full px-3 py-2 pr-10 bg-algomancy-dark border border-algomancy-purple/30 rounded-md text-white focus:outline-none focus:ring-algomancy-purple focus:border-algomancy-purple"
        />
        
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {showStrength && password && (
        <div className="mt-2 space-y-2">
          {/* Strength Bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthBgColor(validation.strength)}`}
              style={{ width: getStrengthWidth() }}
            />
          </div>

          {/* Strength Text */}
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${getPasswordStrengthColor(validation.strength)}`}>
              Password strength: {validation.strength}
            </span>
            <span className="text-xs text-gray-400">
              {validation.score}/4
            </span>
          </div>

          {/* Feedback Messages */}
          {validation.feedback.length > 0 && (
            <div className="space-y-1">
              {validation.feedback.map((message, index) => (
                <p key={index} className="text-xs text-red-400 flex items-center">
                  <span className="w-1 h-1 bg-red-400 rounded-full mr-2 flex-shrink-0"></span>
                  {message}
                </p>
              ))}
            </div>
          )}

          {/* Success Message */}
          {validation.isValid && (
            <p className="text-xs text-green-400 flex items-center">
              <span className="w-1 h-1 bg-green-400 rounded-full mr-2 flex-shrink-0"></span>
              Password meets all requirements
            </p>
          )}
        </div>
      )}
    </div>
  );
}
