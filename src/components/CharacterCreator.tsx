
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shirt, Glasses, Brain, Check, Crown, Smile } from 'lucide-react';
import { HamoodiCustomization } from '../gameData';
import HamoodiAvatar from './HamoodiAvatar';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customization: HamoodiCustomization;
  onUpdate: (newCustomization: HamoodiCustomization) => void;
}

const CharacterCreator: React.FC<Props> = ({ isOpen, onClose, customization, onUpdate }) => {
  const clothingOptions: HamoodiCustomization['clothing'][] = ['none', 'shirt', 'suit', 'jacket'];
  const accessoryOptions: HamoodiCustomization['accessory'][] = ['none', 'glasses'];
  const headwearOptions: HamoodiCustomization['headwear'][] = ['none', 'hat'];
  const personalityOptions: HamoodiCustomization['personality'][] = ['friendly', 'competitive', 'kind'];

  const handleOptionChange = (key: keyof HamoodiCustomization, value: string) => {
    onUpdate({ ...customization, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white border-4 border-[#1A1A1A] rounded-3xl shadow-[8px_8px_0_#1A1A1A] w-full max-w-2xl overflow-hidden flex flex-col md:flex-row"
        >
          {/* Left Side: Preview */}
          <div className="bg-yellow-50 p-8 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-[#1A1A1A] min-w-[250px]">
            <h2 className="text-2xl font-black mb-6 text-[#1A1A1A]">معاينة حمودي</h2>
            <div className="bg-white p-6 rounded-2xl border-4 border-[#1A1A1A] shadow-[4px_4px_0_#1A1A1A]">
              <HamoodiAvatar mood="happy" customization={customization} size={150} />
            </div>
            <p className="mt-6 text-center font-bold text-[#1A1A1A]/60">
              {customization.personality === 'friendly' && 'حمودي الودود'}
              {customization.personality === 'competitive' && 'حمودي المنافس'}
              {customization.personality === 'kind' && 'حمودي اللطيف'}
            </p>
          </div>

          {/* Right Side: Options */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[70vh] md:max-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-[#1A1A1A]">صانع الشخصية</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              {/* Clothing */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Shirt size={20} className="text-blue-500" />
                  <h3 className="font-black text-lg">الملابس</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {clothingOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionChange('clothing', opt)}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        customization.clothing === opt 
                        ? 'bg-blue-500 text-white border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]' 
                        : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1A1A1A]'
                      }`}
                    >
                      {opt === 'none' ? 'بدون' : opt === 'shirt' ? 'قميص' : opt === 'suit' ? 'بدلة' : 'جاكيت'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Headwear */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Crown size={20} className="text-yellow-600" />
                  <h3 className="font-black text-lg">غطاء الرأس</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {headwearOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionChange('headwear', opt)}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        customization.headwear === opt 
                        ? 'bg-yellow-500 text-white border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]' 
                        : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1A1A1A]'
                      }`}
                    >
                      {opt === 'none' ? 'بدون' : 'قبعة'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Accessories */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Glasses size={20} className="text-red-500" />
                  <h3 className="font-black text-lg">الإكسسوارات</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {accessoryOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionChange('accessory', opt)}
                      className={`p-3 rounded-xl border-2 font-bold transition-all ${
                        customization.accessory === opt 
                        ? 'bg-red-500 text-white border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]' 
                        : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1A1A1A]'
                      }`}
                    >
                      {opt === 'none' ? 'بدون' : 'نظارات'}
                    </button>
                  ))}
                </div>
              </section>

              {/* Personality */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Smile size={20} className="text-purple-500" />
                  <h3 className="font-black text-lg">الشخصية</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {personalityOptions.map(opt => (
                    <button
                      key={opt}
                      onClick={() => handleOptionChange('personality', opt)}
                      className={`p-4 rounded-xl border-2 font-bold text-right flex items-center justify-between transition-all ${
                        customization.personality === opt 
                        ? 'bg-purple-500 text-white border-[#1A1A1A] shadow-[2px_2px_0_#1A1A1A]' 
                        : 'bg-white text-[#1A1A1A] border-gray-200 hover:border-[#1A1A1A]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {customization.personality === opt && <Check size={18} />}
                        <span>
                          {opt === 'friendly' ? 'ودود (يساعدك في الأسئلة)' : opt === 'competitive' ? 'منافس (يزيد من حماس اللعب)' : 'لطيف (يشجعك دائماً)'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 bg-[#1A1A1A] text-white p-4 rounded-xl font-black text-xl hover:bg-gray-800 transition-colors shadow-[4px_4px_0_#666]"
            >
              حفظ التعديلات
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CharacterCreator;
