/**
 * Visualization Selector Dropdown Component
 * Provides a beautiful dropdown for selecting different visualization types
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles } from 'lucide-react';
import { VisualizationType, VisualizationSelectorProps, getAvailableVisualizations } from '../types/visualizations';

const VisualizationSelector: React.FC<VisualizationSelectorProps> = ({
  currentType,
  onTypeChange,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const availableVisualizations = getAvailableVisualizations();
  const currentConfig = availableVisualizations.find(v => v.type === currentType);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleTypeSelect = (type: VisualizationType) => {
    onTypeChange(type);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Main Button */}
      <motion.button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-14 h-14 flex items-center justify-center
          bg-white/90 text-gray-700 rounded-full shadow-lg
          transition-all duration-200 focus:outline-none focus:ring-4
          focus:ring-white/30 hover:bg-white hover:text-gray-900
          hover:shadow-xl active:scale-95
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
        title={currentConfig?.name || 'Select Visualization'}
      >
        {/* Icon */}
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeInOut"
          }}
        >
          <ChevronDown
            size={20}
            className="w-5 h-5 text-gray-700"
          />
        </motion.div>

        {/* Active visualization indicator */}
        {currentConfig && (
          <div
            className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{
              background: currentConfig.category === 'generative'
                ? 'linear-gradient(45deg, rgba(34, 197, 94, 0.3), rgba(168, 85, 247, 0.3))'
                : 'linear-gradient(45deg, rgba(59, 130, 246, 0.3), rgba(147, 51, 234, 0.3))'
            }}
          />
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`
              absolute top-full left-1/2 transform -translate-x-1/2 mt-2
              w-64 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl
              border border-white/40 rounded-2xl shadow-2xl
              z-[200] overflow-hidden
            `}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/20">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-purple-600" />
                <h3 className="text-sm font-semibold text-gray-800 font-montserrat">
                  Visualizations
                </h3>
              </div>
            </div>

            {/* Options List */}
            <div className="py-2 max-h-64 overflow-y-auto">
              {availableVisualizations.map((config) => {
                const isSelected = config.type === currentType;

                return (
                  <motion.button
                    key={config.type}
                    onClick={() => handleTypeSelect(config.type)}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3 text-left
                      transition-all duration-150
                      ${isSelected
                        ? 'bg-purple-100 text-purple-900'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Icon/Indicator */}
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center
                      ${isSelected
                        ? 'bg-purple-200'
                        : 'bg-gray-200'
                      }
                    `}>
                      <div
                        className={`
                          w-4 h-4 rounded-full
                          ${config.category === 'generative'
                            ? 'bg-green-500'
                            : 'bg-blue-500'
                          }
                        `}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm font-montserrat truncate">
                        {config.name}
                      </div>
                      <div className="text-xs opacity-70 truncate">
                        {config.description}
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-2 h-2 bg-purple-600 rounded-full"
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-white/20">
              <div className="text-xs text-gray-500 text-center font-montserrat">
                {availableVisualizations.length} visualization{availableVisualizations.length !== 1 ? 's' : ''} available
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background overlay */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[150] bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VisualizationSelector;