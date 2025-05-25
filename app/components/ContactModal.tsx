"use client";

import { useState } from "react";
import {
  XMarkIcon,
  BugAntIcon,
  LightBulbIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import emailjs from "@emailjs/browser";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [selectedType, setSelectedType] = useState<
    "bug" | "feature" | "general"
  >("bug");
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
    priority: "medium",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitStatus("idle");

    try {
      // EmailJS template parameters
      const templateParams = {
        to_email: "algomancercc@gmail.com", // Send to dedicated project email
        contact_type:
          selectedType.charAt(0).toUpperCase() + selectedType.slice(1),
        priority: selectedType === "bug" ? formData.priority : "N/A",
        from_email: formData.email || "Anonymous",
        subject: formData.subject,
        message: formData.message,
        type_label:
          selectedType === "bug"
            ? "Report"
            : selectedType === "feature"
            ? "Request"
            : "Inquiry",
      };

      // Send email using EmailJS
      await emailjs.send(
        "service_cxh2b2a", // EmailJS service ID
        "template_5o4anwm", // EmailJS template ID
        templateParams,
        "bwTGKiVLZWWg4QG2M" // EmailJS public key
      );

      setSubmitStatus("success");

      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          email: "",
          subject: "",
          message: "",
          priority: "medium",
        });
        setSubmitStatus("idle");
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Failed to send email:", error);
      setSubmitStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const contactTypes = [
    {
      id: "bug" as const,
      title: "Bug Report",
      description: "Report issues, errors, or broken functionality",
      icon: BugAntIcon,
      color: "text-red-400",
    },
    {
      id: "feature" as const,
      title: "Feature Request",
      description: "Suggest new features or improvements",
      icon: LightBulbIcon,
      color: "text-yellow-400",
    },
    {
      id: "general" as const,
      title: "General Inquiry",
      description: "Questions, feedback, or other topics",
      icon: ChatBubbleLeftRightIcon,
      color: "text-blue-400",
    },
  ];

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto custom-scrollbar'>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='flex min-h-full items-center justify-center p-4'>
        <div className='relative bg-algomancy-darker border border-algomancy-purple/30 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar'>
          {/* Header */}
          <div className='flex items-center justify-between p-6 border-b border-algomancy-purple/30'>
            <h2 className='text-xl font-semibold text-white'>
              Contact & Feedback
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white transition-colors'
              aria-label='Close contact form'>
              <XMarkIcon className='w-6 h-6' />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className='p-6 space-y-6'>
            {/* Contact Type Selection */}
            <div>
              <label className='block text-sm font-medium text-white mb-3'>
                What would you like to contact us about?
              </label>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                {contactTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type='button'
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 rounded-lg border-2 transition-all text-left cursor-pointer ${
                        selectedType === type.id
                          ? "border-algomancy-purple bg-algomancy-purple/20"
                          : "border-algomancy-purple/30 hover:border-algomancy-purple/50"
                      }`}>
                      <div className='flex items-center mb-2'>
                        <Icon className={`w-5 h-5 mr-2 ${type.color}`} />
                        <span className='font-medium text-white'>
                          {type.title}
                        </span>
                      </div>
                      <p className='text-xs text-gray-400'>
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-white mb-2'>
                Email Address (optional)
              </label>
              <input
                type='email'
                id='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className='w-full p-3 bg-algomancy-dark border border-algomancy-purple/30 rounded-lg text-white placeholder-gray-400 focus:border-algomancy-purple focus:outline-none'
                placeholder='your.email@example.com'
              />
              <p className='text-xs text-gray-400 mt-1'>
                Provide your email if you'd like a response
              </p>
            </div>

            {/* Priority (for bugs) */}
            {selectedType === "bug" && (
              <div>
                <label
                  htmlFor='priority'
                  className='block text-sm font-medium text-white mb-2'>
                  Priority Level
                </label>
                <select
                  id='priority'
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className='w-full p-3 bg-algomancy-dark border border-algomancy-purple/30 rounded-lg text-white focus:border-algomancy-purple focus:outline-none'>
                  <option value='low'>Low - Minor issue, cosmetic</option>
                  <option value='medium'>Medium - Affects functionality</option>
                  <option value='high'>High - Breaks important features</option>
                  <option value='critical'>Critical - Site unusable</option>
                </select>
              </div>
            )}

            {/* Subject */}
            <div>
              <label
                htmlFor='subject'
                className='block text-sm font-medium text-white mb-2'>
                Subject *
              </label>
              <input
                type='text'
                id='subject'
                required
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className='w-full p-3 bg-algomancy-dark border border-algomancy-purple/30 rounded-lg text-white placeholder-gray-400 focus:border-algomancy-purple focus:outline-none'
                placeholder={
                  selectedType === "bug"
                    ? "Brief description of the bug"
                    : selectedType === "feature"
                    ? "Feature you'd like to see"
                    : "What's on your mind?"
                }
              />
            </div>

            {/* Message */}
            <div>
              <label
                htmlFor='message'
                className='block text-sm font-medium text-white mb-2'>
                {selectedType === "bug" ? "Bug Details" : "Message"} *
              </label>
              <textarea
                id='message'
                required
                rows={6}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                className='w-full p-3 bg-algomancy-dark border border-algomancy-purple/30 rounded-lg text-white placeholder-gray-400 focus:border-algomancy-purple focus:outline-none resize-vertical'
                placeholder={
                  selectedType === "bug"
                    ? "Please describe:\n• What you were doing when the bug occurred\n• What you expected to happen\n• What actually happened\n• Your browser and device info (if relevant)"
                    : selectedType === "feature"
                    ? "Describe the feature you'd like to see:\n• What problem would it solve?\n• How would it work?\n• Why would it be useful?"
                    : "Your message..."
                }
              />
            </div>

            {/* Footer */}
            <div className='flex justify-between items-center pt-4 border-t border-algomancy-purple/30'>
              <div className='text-xs text-gray-400'>
                {submitStatus === "success" && (
                  <span className='text-green-400'>
                    ✓ Message sent successfully!
                  </span>
                )}
                {submitStatus === "error" && (
                  <span className='text-red-400'>
                    ✗ Failed to send. Please try again.
                  </span>
                )}
                {submitStatus === "idle" && (
                  <span>Your message will be sent directly to our team</span>
                )}
              </div>
              <div className='flex space-x-3'>
                <button
                  type='button'
                  onClick={onClose}
                  disabled={isLoading}
                  className='px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer'>
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isLoading || submitStatus === "success"}
                  className='px-6 py-2 bg-algomancy-purple hover:bg-algomancy-purple-dark text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center'>
                  {isLoading ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'>
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'></path>
                      </svg>
                      Sending...
                    </>
                  ) : submitStatus === "success" ? (
                    "Sent!"
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
