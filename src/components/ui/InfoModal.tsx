// src/components/ui/InfoModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  title: string;
  content: string | React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ title, content, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Wandelt String-Content mit Zeilenumbrüchen in HTML um
  const formatContent = (content: string | React.ReactNode) => {
    if (typeof content === 'string') {
      // Teilt den Text bei doppelten Zeilenumbrüchen (für Absätze)
      const paragraphs = content.split('\n\n');
      
      return (
        <>
          {paragraphs.map((paragraph, index) => {
            // Prüfen, ob es sich um eine Aufzählungsliste handelt
            if (paragraph.includes('• ')) {
              const listItems = paragraph.split('• ').filter(item => item.trim());
              return (
                <ul key={index} className="list-disc pl-5 mb-4">
                  {listItems.map((item, i) => (
                    <li key={i} className="mb-1">{item.trim()}</li>
                  ))}
                </ul>
              );
            }
            // Normaler Absatz
            return <p key={index} className="mb-4">{paragraph}</p>;
          })}
        </>
      );
    }
    // Falls es bereits ein React-Element ist, direkt zurückgeben
    return content;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative overflow-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>
        <div className="text-gray-700 dark:text-gray-300">
          {formatContent(content)}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;