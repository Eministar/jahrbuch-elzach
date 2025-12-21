'use client';

import { MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

export default function PromptDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  placeholder = '',
  confirmText = 'Bestätigen',
  cancelText = 'Abbrechen'
}: PromptDialogProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      setValue('');
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
      onClose();
      setValue('');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-[#2a2520] to-[#1f1b17] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#e89a7a]/20 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-[#7a9b88]/20 to-[#6a8b78]/20 text-[#8faf9d] p-4 rounded-2xl backdrop-blur-sm border border-current/20 shadow-xl">
            <MessageSquare className="w-12 h-12 animate-in zoom-in duration-500" strokeWidth={2.5} />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-[#f5f1ed] mb-3">
            {title}
          </h3>
          <p className="text-[#b8aea5] leading-relaxed text-base">
            {message}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-5 py-4 rounded-xl border-2 border-[#3a3530] bg-[#1a1714]/80 text-[#f5f1ed] placeholder-[#b8aea5] focus:outline-none focus:ring-2 focus:ring-[#8faf9d] focus:border-transparent transition-all font-medium text-base"
              autoFocus
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3.5 rounded-xl bg-[#1a1714] text-[#f5f1ed] hover:bg-[#2a2520] transition-all font-semibold border-2 border-[#3a3530] hover:border-[#4a4540] active:scale-95"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="flex-1 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7a9b88] to-[#6a8b78] hover:from-[#6a8b78] hover:to-[#5a7b68] text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-[#7a9b88]/30 active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
