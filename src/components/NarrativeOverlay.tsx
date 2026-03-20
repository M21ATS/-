
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, SkipForward } from 'lucide-react';
import { NARRATIVE_STORY, NarrativeNode, NarrativeChoice } from '../gameData';
import HamoodiAvatar from './HamoodiAvatar';

interface Props {
  currentNodeId: string;
  onChoice: (choice: NarrativeChoice) => void;
  onExit: () => void;
  customization: any;
  isOpen: boolean;
}

const NarrativeOverlay: React.FC<Props> = ({ currentNodeId, onChoice, onExit, customization, isOpen }) => {
  const node = NARRATIVE_STORY[currentNodeId];

  if (!isOpen || !node) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-white border-8 border-[#1A1A1A] rounded-[40px] shadow-[12px_12px_0_#1A1A1A] w-full max-w-3xl p-10 flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Close Button */}
          <button 
            onClick={onExit}
            className="absolute top-6 right-6 p-2 bg-red-100 text-red-600 rounded-full border-4 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] hover:bg-red-200 transition-colors"
            title="خروج من اللعبة"
          >
            <X size={24} />
          </button>

          {/* Skip Button */}
          <button 
            onClick={() => onChoice({ text: 'تخطي', nextId: 'game_start' })}
            className="absolute top-6 left-6 p-2 bg-gray-100 text-gray-600 rounded-full border-4 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A] hover:bg-gray-200 transition-colors flex items-center gap-2 px-4"
            title="تخطي القصة"
          >
            <span className="font-black text-sm">تخطي</span>
            <SkipForward size={20} />
          </button>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-0 w-full h-2 bg-yellow-400" />
          <div className="absolute bottom-0 left-0 w-full h-2 bg-blue-400" />

          {/* Character Avatar */}
          <div className="mb-8 bg-yellow-50 p-6 rounded-full border-4 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A]">
            <HamoodiAvatar 
              mood={node.choices[0]?.mood || 'happy'} 
              customization={customization} 
              size={180} 
            />
          </div>

          {/* Narrative Text */}
          <motion.h2 
            key={node.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-black text-[#1A1A1A] mb-10 leading-tight"
          >
            {node.text}
          </motion.h2>

          {/* Choices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {node.choices.map((choice, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChoice(choice)}
                className="bg-white border-4 border-[#1A1A1A] p-6 rounded-2xl font-black text-2xl text-[#1A1A1A] hover:bg-yellow-100 transition-all shadow-[6px_6px_0_#1A1A1A] flex items-center justify-center gap-4"
              >
                <span className="bg-[#1A1A1A] text-white w-10 h-10 rounded-full flex items-center justify-center text-lg">
                  {idx + 1}
                </span>
                {choice.text}
              </motion.button>
            ))}
          </div>

          {/* Skip Button (Optional) */}
          {node.choices.length === 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChoice({ text: 'ابدأ اللعب', nextId: 'game_start' })}
              className="mt-10 bg-[#1A1A1A] text-white px-12 py-5 rounded-2xl font-black text-3xl hover:bg-gray-800 transition-all shadow-[8px_8px_0_#666]"
            >
              هيا بنا!
            </motion.button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default NarrativeOverlay;
