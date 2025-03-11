// src/components/ui/InfoButton.tsx
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import InfoModal from './InfoModal';

interface InfoButtonProps {
  title: string;
  content: string | React.ReactNode;
  className?: string;
}

const InfoButton: React.FC<InfoButtonProps> = ({ title, content, className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 inline-flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none ${className}`}
        title={`Info: ${title}`}
      >
        <Info size={16} />
      </button>
      <InfoModal
        title={title}
        content={content}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default InfoButton;