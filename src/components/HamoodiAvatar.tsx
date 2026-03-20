
import React from 'react';
import { motion } from 'motion/react';
import { HamoodiMood, HamoodiCustomization } from '../gameData';

interface Props {
  mood: HamoodiMood;
  customization: HamoodiCustomization;
  size?: number;
}

const HamoodiAvatar: React.FC<Props> = ({ mood, customization, size = 100 }) => {
  const getMoodColors = () => {
    switch (mood) {
      case 'happy': return { face: '#FEF3C7', border: '#F59E0B', accent: '#F59E0B' };
      case 'excited': return { face: '#FEF3C7', border: '#F59E0B', accent: '#F59E0B' };
      case 'sleepy': return { face: '#DBEAFE', border: '#3B82F6', accent: '#3B82F6' };
      case 'sad': return { face: '#FEE2E2', border: '#EF4444', accent: '#EF4444' };
      default: return { face: '#F3F4F6', border: '#6B7280', accent: '#6B7280' };
    }
  };

  const colors = getMoodColors();

  const renderClothing = () => {
    switch (customization.clothing) {
      case 'shirt':
        return (
          <g clipPath="url(#faceClip)">
            {/* Shirt Base */}
            <rect x="15" y="70" width="70" height="30" fill="#FFFFFF" />
            {/* Buttons */}
            <circle cx="50" cy="80" r="1.5" fill="#1A1A1A" />
            <circle cx="50" cy="90" r="1.5" fill="#1A1A1A" />
            {/* Collar */}
            <path d="M35 70 L50 85 L65 70" fill="none" stroke="#1A1A1A" strokeWidth="2" />
          </g>
        );
      case 'suit':
        return (
          <g clipPath="url(#faceClip)">
            {/* Suit Jacket */}
            <rect x="15" y="70" width="70" height="30" fill="#1F2937" />
            {/* Shirt V-neck */}
            <path d="M35 70 L50 95 L65 70" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1" />
            {/* Lapels */}
            <path d="M35 70 L50 95 L40 70 Z" fill="#111827" stroke="#1A1A1A" strokeWidth="1" />
            <path d="M65 70 L50 95 L60 70 Z" fill="#111827" stroke="#1A1A1A" strokeWidth="1" />
          </g>
        );
      case 'jacket':
        return (
          <g clipPath="url(#faceClip)">
            {/* Jacket Base */}
            <rect x="15" y="70" width="70" height="30" fill="#4B5563" />
            {/* Zipper line */}
            <line x1="50" y1="70" x2="50" y2="100" stroke="#1A1A1A" strokeWidth="2" />
            {/* Pockets */}
            <rect x="25" y="82" width="10" height="8" fill="#374151" stroke="#1A1A1A" strokeWidth="1" rx="2" />
            <rect x="65" y="82" width="10" height="8" fill="#374151" stroke="#1A1A1A" strokeWidth="1" rx="2" />
          </g>
        );
      case 'thobe':
        return (
          <g clipPath="url(#faceClip)">
            {/* Thobe Base */}
            <rect x="15" y="70" width="70" height="30" fill="#FFFFFF" />
            {/* Collar Detail */}
            <path d="M40 70 L50 78 L60 70" fill="none" stroke="#E5E7EB" strokeWidth="1" />
            <circle cx="50" cy="85" r="1" fill="#E5E7EB" />
          </g>
        );
      case 'superhero':
        return (
          <g clipPath="url(#faceClip)">
            {/* Suit */}
            <rect x="15" y="70" width="70" height="30" fill="#EF4444" />
            {/* Logo */}
            <path d="M50 75 L58 83 L50 91 L42 83 Z" fill="#FACC15" stroke="#1A1A1A" strokeWidth="1" />
            <text x="50" y="85" fontSize="6" fontWeight="black" textAnchor="middle" fill="#1A1A1A" dy=".3em">H</text>
          </g>
        );
      default:
        return null;
    }
  };

  const renderHeadwear = () => {
    switch (customization.headwear) {
      case 'hat':
        return (
          <g>
            {/* Hat Brim */}
            <rect x="10" y="30" width="80" height="6" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="1" rx="3" />
            {/* Hat Top */}
            <path d="M25 30 L25 15 Q25 10 35 10 L65 10 Q75 10 75 15 L75 30" fill="#1A1A1A" stroke="#1A1A1A" strokeWidth="1" />
            {/* Hat Band */}
            <rect x="25" y="22" width="50" height="4" fill="#EF4444" />
          </g>
        );
      case 'ghutra':
        return (
          <g>
            {/* Ghutra Base */}
            <path d="M20 35 Q50 15 80 35 L85 70 Q50 80 15 70 Z" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
            {/* Igal */}
            <path d="M30 35 Q50 30 70 35" fill="none" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
            <path d="M32 38 Q50 33 68 38" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
          </g>
        );
      case 'crown':
        return (
          <g>
            <path d="M25 35 L20 15 L35 25 L50 10 L65 25 L80 15 L75 35 Z" fill="#FACC15" stroke="#1A1A1A" strokeWidth="2" />
            <circle cx="50" cy="25" r="2" fill="#EF4444" />
            <circle cx="35" cy="30" r="1.5" fill="#3B82F6" />
            <circle cx="65" cy="30" r="1.5" fill="#3B82F6" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderAccessory = () => {
    switch (customization.accessory) {
      case 'glasses':
        return (
          <g>
            {/* Frames with thickness */}
            <circle cx="40" cy="55" r="9" fill="rgba(255,255,255,0.2)" stroke="#1A1A1A" strokeWidth="3" />
            <circle cx="60" cy="55" r="9" fill="rgba(255,255,255,0.2)" stroke="#1A1A1A" strokeWidth="3" />
            {/* Bridge */}
            <path d="M49 55 Q50 52 51 55" fill="none" stroke="#1A1A1A" strokeWidth="3" />
            {/* Temples */}
            <line x1="15" y1="55" x2="31" y2="55" stroke="#1A1A1A" strokeWidth="2" />
            <line x1="69" y1="55" x2="85" y2="55" stroke="#1A1A1A" strokeWidth="2" />
            {/* Reflection */}
            <path d="M36 50 L40 46" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
            <path d="M56 50 L60 46" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
          </g>
        );
      case 'mask':
        return (
          <g>
            <path d="M25 45 Q50 40 75 45 L75 65 Q50 70 25 65 Z" fill="#1A1A1A" />
            <circle cx="40" cy="55" r="6" fill="white" />
            <circle cx="60" cy="55" r="6" fill="white" />
            <circle cx="40" cy="55" r="3" fill="#1A1A1A" />
            <circle cx="60" cy="55" r="3" fill="#1A1A1A" />
          </g>
        );
      case 'medal':
        return (
          <g>
            {/* Ribbon */}
            <path d="M45 70 L50 85 L55 70" fill="#3B82F6" stroke="#1A1A1A" strokeWidth="1" />
            {/* Medal */}
            <circle cx="50" cy="88" r="6" fill="#FACC15" stroke="#1A1A1A" strokeWidth="1.5" />
            <text x="50" y="88" fontSize="6" fontWeight="black" textAnchor="middle" fill="#1A1A1A" dy=".3em">1</text>
          </g>
        );
      default:
        return null;
    }
  };

  const renderFace = () => {
    const isSleepy = mood === 'sleepy';
    const isSad = mood === 'sad';
    const isExcited = mood === 'excited';

    return (
      <g>
        {/* Eyes */}
        {isSleepy ? (
          <g>
            <line x1="35" y1="55" x2="45" y2="55" stroke="#1A1A1A" strokeWidth="2" />
            <line x1="55" y1="55" x2="65" y2="55" stroke="#1A1A1A" strokeWidth="2" />
          </g>
        ) : (
          <g>
            <motion.circle 
              cx="40" cy="55" r={isExcited ? 4 : 3} fill="#1A1A1A" 
              animate={isExcited ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
            <motion.circle 
              cx="60" cy="55" r={isExcited ? 4 : 3} fill="#1A1A1A" 
              animate={isExcited ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          </g>
        )}
        {/* Mouth */}
        {isSad ? (
          <path d="M40 70 Q50 60 60 70" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        ) : isSleepy ? (
          <circle cx="50" cy="70" r="3" fill="none" stroke="#1A1A1A" strokeWidth="2" />
        ) : (
          <path d="M40 65 Q50 75 60 65" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        )}
      </g>
    );
  };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      animate={{
        y: mood === 'excited' ? [0, -5, 0] : [0, -2, 0],
        rotate: mood === 'happy' ? [0, 2, -2, 0] : 0
      }}
      transition={{ repeat: Infinity, duration: mood === 'excited' ? 0.5 : 2 }}
    >
      <defs>
        <clipPath id="faceClip">
          <circle cx="50" cy="55" r="35" />
        </clipPath>
      </defs>
      {/* Body/Face */}
      <circle cx="50" cy="55" r="35" fill={colors.face} stroke="#1A1A1A" strokeWidth="4" />
      
      {/* Clothing */}
      {renderClothing()}
      
      {/* Face Features */}
      {renderFace()}
      
      {/* Headwear */}
      {renderHeadwear()}
      
      {/* Accessory */}
      {renderAccessory()}
      
      {/* Rubber Hose Arms (Simple) */}
      <motion.path
        d="M15 60 Q5 70 15 80"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinecap="round"
        animate={mood === 'excited' ? { d: ["M15 60 Q5 70 15 80", "M15 60 Q0 60 15 50", "M15 60 Q5 70 15 80"] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
      <motion.path
        d="M85 60 Q95 70 85 80"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinecap="round"
        animate={mood === 'excited' ? { d: ["M85 60 Q95 70 85 80", "M85 60 Q100 60 85 50", "M85 60 Q95 70 85 80"] } : {}}
        transition={{ repeat: Infinity, duration: 0.5 }}
      />
    </motion.svg>
  );
};

export default HamoodiAvatar;
