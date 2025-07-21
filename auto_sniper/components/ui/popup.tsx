import React from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/language-context";

// Helper function to render text with clickable links
function renderMessageWithLinks(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export type PopupType = "success" | "error" | "warning" | "info";

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  type: PopupType;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  onConfirm?: () => void;
}

const popupConfig = {
  success: {
    icon: CheckCircle,
    iconColor: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    titleColor: "text-green-800",
    messageColor: "text-green-700",
    buttonColor: "bg-green-600 hover:bg-green-700",
  },
  error: {
    icon: AlertCircle,
    iconColor: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    titleColor: "text-red-800",
    messageColor: "text-red-700",
    buttonColor: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    titleColor: "text-yellow-800",
    messageColor: "text-yellow-700",
    buttonColor: "bg-yellow-600 hover:bg-yellow-700",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    titleColor: "text-blue-800",
    messageColor: "text-blue-700",
    buttonColor: "bg-blue-600 hover:bg-blue-700",
  },
};

export function Popup({ isOpen, onClose, type, title, message, details, confirmText, onConfirm }: PopupProps) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const config = popupConfig[type];
  const Icon = config.icon;

  // Use translated confirmText if not provided
  const finalConfirmText = confirmText || t.popupOk;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Popup */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="p-6 pt-8">
          {/* Icon and Title */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-full ${config.bgColor} ${config.borderColor} border-2`}>
              <Icon className={`h-8 w-8 ${config.iconColor}`} />
            </div>
            <h3 className={`text-xl font-bold ${config.titleColor}`}>{title}</h3>
          </div>

          {/* Message */}
          <div className={`mb-6 ${config.messageColor}`}>
            <p className="text-base leading-relaxed whitespace-pre-line">{renderMessageWithLinks(message)}</p>
            {details && (
              <div className={`mt-4 p-4 rounded-lg ${config.bgColor} ${config.borderColor} border`}>
                <p className="text-sm font-mono whitespace-pre-line">{renderMessageWithLinks(details)}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="px-6 hover:bg-gray-50">
              {t.popupClose}
            </Button>
            <Button onClick={handleConfirm} className={`px-6 text-white ${config.buttonColor}`}>
              {finalConfirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easier popup management
export function usePopup() {
  const [popup, setPopup] = React.useState<{
    isOpen: boolean;
    type: PopupType;
    title: string;
    message: string;
    details?: string;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const showPopup = ({
    type,
    title,
    message,
    details,
    confirmText,
    onConfirm,
  }: Omit<PopupProps, "isOpen" | "onClose">) => {
    setPopup({
      isOpen: true,
      type,
      title,
      message,
      details,
      confirmText,
      onConfirm,
    });
  };

  const hidePopup = () => {
    setPopup(prev => ({ ...prev, isOpen: false }));
  };

  const PopupComponent = () => (
    <Popup
      isOpen={popup.isOpen}
      onClose={hidePopup}
      type={popup.type}
      title={popup.title}
      message={popup.message}
      details={popup.details}
      confirmText={popup.confirmText}
      onConfirm={popup.onConfirm}
    />
  );

  return {
    showPopup,
    hidePopup,
    PopupComponent,
  };
}
