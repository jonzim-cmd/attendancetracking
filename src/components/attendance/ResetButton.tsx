// src/components/attendance/ResetButton.tsx
import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ResetButtonProps {
  onReset: () => void;
  className?: string;
}

const ResetButton: React.FC<ResetButtonProps> = ({ 
  onReset,
  className = ""
}) => {
  return (
    <button
      onClick={onReset}
      className={`p-1.5 rounded-full bg-header-btn dark:bg-header-btn-dark hover:bg-header-btn-hover dark:hover:bg-header-btn-hover-dark text-chatGray-textLight dark:text-chatGray-textDark transition-colors ${className}`}
      title="Alle Filter und Einstellungen zurücksetzen (Zeitraum, Klassenfilter, Suchfilter, etc.)"
    >
      <RotateCcw className="w-4 h-4" />
    </button>
  );
};

export default ResetButton;