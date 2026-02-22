/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Trophy, Play, Square, RotateCcw, FileUp, LogOut, ChevronLeft, 
  Eye, EyeOff, Users, Plus, LogIn, Trash2, Music, Volume2, VolumeX 
} from "lucide-react";
import { io, Socket } from "socket.io-client";

/* ─────────────────────────────────────────────────────────
   CONSTANTS & DATA
───────────────────────────────────────────────────────── */
const INITIAL_LETTERS = [
  'ض','ي','ص','أ','ش',
  'ج','ح','ب','خ','ط',
  'ه','د','ك','ل','ف',
  'غ','ع','ذ','ظ','م',
  'ق','ز','ت','س','ر',
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const FALLBACK_QUESTIONS: Record<string, { q: string; a: string }[]> = {
  'أ': [
    { q: 'ما هي عاصمة اليونان؟', a: 'أثينا' },
    { q: 'حيوان مفترس يلقب بملك الغابة؟', a: 'أسد' },
    { q: 'ما هي القارة التي تقع فيها دولة نيجيريا؟', a: 'أفريقيا' },
    { q: 'ما هو الغاز الذي يحتاجه الإنسان للتنفس؟', a: 'أكسجين' },
    { q: 'من هو أول البشر والأنبياء؟', a: 'آدم' },
    { q: 'حيوان بحري يمتلك ثمانية أذرع؟', a: 'أخطبوط' },
    { q: 'معدن خفيف الوزن يستخدم في صناعة الطائرات؟', a: 'ألمنيوم' },
    { q: 'ما هي عاصمة دولة إريتريا؟', a: 'أسمرة' },
    { q: 'نبات صحراوي يستخدم في علاج الحروق ومستحضرات التجميل؟', a: 'ألوفيرا' },
    { q: 'ما هي أكبر قارة في العالم؟', a: 'آسيا' }
  ],
  'ب': [
    { q: 'ما هي عاصمة البرازيل؟', a: 'برازيليا' },
    { q: 'طائر لا يطير ويعيش في المناطق القطبية؟', a: 'بطريق' },
    { q: 'فاكهة مشهورة غنية بفيتامين سي؟', a: 'برتقال' },
    { q: 'تجمع كبير للمياه المالحة أصغر من المحيط؟', a: 'بحر' },
    { q: 'نوع من الخضار يسبب الدموع عند تقطيعه؟', a: 'بصل' },
    { q: 'فاكهة صيفية كبيرة خضراء من الخارج وحمراء من الداخل؟', a: 'بطيخ' },
    { q: 'فتحة في قشرة الأرض تخرج منها الحمم والغازات؟', a: 'بركان' },
    { q: 'طائر يشتهر بصوته الجميل وتغريده؟', a: 'بلبل' },
    { q: 'طائر جارح ينشط في الليل وله عينان كبيرتان؟', a: 'بومة' },
    { q: 'ما هي عاصمة ألمانيا؟', a: 'برلين' }
  ],
  'ت': [
    { q: 'دولة عربية تقع في شمال أفريقيا وعاصمتها تحمل نفس اسمها؟', a: 'تونس' },
    { q: 'زاحف ضخم مفترس يعيش في الماء واليابسة؟', a: 'تمساح' },
    { q: 'فاكهة مشهورة بألوانها الأحمر والأخضر والأصفر؟', a: 'تفاح' },
    { q: 'غطاء مزخرف يضعه الملك على رأسه؟', a: 'تاج' },
    { q: 'فاكهة ذكرت في القرآن الكريم مع الزيتون؟', a: 'تين' },
    { q: 'فاكهة صغيرة تكون حمراء أو سوداء وتستخدم في العصائر؟', a: 'توت' },
    { q: 'جهاز إلكتروني يستخدم لمشاهدة البرامج والأخبار؟', a: 'تلفاز' },
    { q: 'العلم الذي يهتم بالتقنيات الحديثة وتطبيقاتها؟', a: 'تكنولوجيا' },
    { q: 'كائن أسطوري ضخم ينفث النار من فمه؟', a: 'تنين' },
    { q: 'المادة الناعمة التي تغطي سطح الأرض؟', a: 'تراب' }
  ],
  'ث': [
    { q: 'ما يلبسه الإنسان من قماش؟', a: 'ثوب' },
    { q: 'حيوان مكر يضرب به المثل في الذكاء؟', a: 'ثعلب' },
    { q: 'نبات له رائحة قوية يستخدم في الطبخ؟', a: 'ثوم' },
    { q: 'مجموعة من النجوم تظهر في السماء؟', a: 'ثريا' }
  ],
  'ج': [
    { q: 'دولة عربية تقع في القرن الأفريقي؟', a: 'جيبوتي' },
    { q: 'أداة تصدر صوتاً للتنبيه؟', a: 'جرس' },
    { q: 'تضريس أرضي مرتفع جداً؟', a: 'جبل' },
    { q: 'حيوان يسمى سفينة الصحراء؟', a: 'جمل' }
  ],
  'ح': [
    { q: 'مدينة سورية شهيرة؟', a: 'حلب' },
    { q: 'حيوان ثديي ضخم يعيش في المحيط؟', a: 'حوت' },
    { q: 'سائل أبيض نحصل عليه من الأبقار؟', a: 'حليب' },
    { q: 'حيوان يزحف وليس له أرجل؟', a: 'حية' }
  ],
  'خ': [
    { q: 'عاصمة السودان؟', a: 'خرطوم' },
    { q: 'حيوان يغطيه الصوف؟', a: 'خروف' },
    { q: 'مادة غذائية تصنع من الدقيق؟', a: 'خبز' }
  ],
  'د': [
    { q: 'ما هي عاصمة أيرلندا؟', a: 'دبلن' },
    { q: 'حيوان بحري ذكي وصديق للإنسان؟', a: 'دولفين' },
    { q: 'حيوان ضخم يعيش في الغابات؟', a: 'دب' }
  ],
  'ذ': [
    { q: 'ما هو الذكاء الاصطناعي؟', a: 'ذكاء' },
    { q: 'حيوان مفترس يشبه الكلب؟', a: 'ذئب' }
  ],
  'ر': [
    { q: 'عاصمة المغرب؟', a: 'رباط' },
    { q: 'جزء من جناح الطائر؟', a: 'ريشة' },
    { q: 'حبيبات صغيرة توجد على الشاطئ؟', a: 'رمل' },
    { q: 'عاصمة إيطاليا؟', a: 'روما' }
  ],
  'ز': [
    { q: 'ما هي عاصمة كرواتيا؟', a: 'زغرب' },
    { q: 'حيوان له رقبة طويلة؟', a: 'زرافة' }
  ],
  'س': [
    { q: 'ما هي عاصمة السويد؟', a: 'ستوكهولم' },
    { q: 'حيوان يعيش في الماء ويتنفس بالخياشيم؟', a: 'سمك' }
  ],
  'ش': [
    { q: 'النجم الذي يمدنا بالحرارة والضوء؟', a: 'شمس' },
    { q: 'ابن الأسد؟', a: 'شبل' }
  ],
  'ص': [
    { q: 'ما هي عاصمة اليمن؟', a: 'صنعاء' },
    { q: 'طائر جارح قوي البصر؟', a: 'صقر' }
  ],
  'ض': [
    { q: 'عكس الظلام؟', a: 'ضوء' },
    { q: 'حيوان برمائي يقفز؟', a: 'ضفدع' }
  ],
  'ط': [
    { q: 'ما هي عاصمة ليبيا؟', a: 'طرابلس' },
    { q: 'كائن يطير في السماء؟', a: 'طائر' }
  ],
  'ظ': [
    { q: 'ما ينتج عن حجب الضوء؟', a: 'ظل' },
    { q: 'حيوان له قرون طويلة؟', a: 'ظبي' }
  ],
  'ع': [
    { q: 'ما هي عاصمة الأردن؟', a: 'عمان' },
    { q: 'طائر يرمز للقوة؟', a: 'عقاب' }
  ],
  'غ': [
    { q: 'دولة في غرب أفريقيا؟', a: 'غانا' },
    { q: 'طائر أسود اللون؟', a: 'غراب' },
    { q: 'كتلة من البخار في السماء؟', a: 'غيمة' },
    { q: 'حيوان يشبه الغزال؟', a: 'غزال' }
  ],
  'ف': [
    { q: 'دولة عاصمتها باريس؟', a: 'فرنسا' },
    { q: 'حشرة جميلة ملونة؟', a: 'فراشة' },
    { q: 'نوع من الخضروات الجذرية؟', a: 'فجل' },
    { q: 'حيوان ضخم له خرطوم؟', a: 'فيل' }
  ],
  'ق': [
    { q: 'مدينة فلسطينية مقدسة؟', a: 'قدس' },
    { q: 'أداة تستخدم للكتابة؟', a: 'قلم' },
    { q: 'جرم سماوي يدور حول الأرض؟', a: 'قمر' },
    { q: 'عاصمة مصر؟', a: 'قاهرة' }
  ],
  'ك': [
    { q: 'عاصمة ماليزيا؟', a: 'كوالالمبور' },
    { q: 'مجموعة من الأوراق المكتوبة؟', a: 'كتاب' },
    { q: 'أداة للجلوس؟', a: 'كرسي' },
    { q: 'عاصمة الكويت؟', a: 'كويت' }
  ],
  'ل': [
    { q: 'عاصمة بريطانيا؟', a: 'لندن' },
    { q: 'فاكهة حامضة صفراء؟', a: 'ليمون' },
    { q: 'غذاء بروتيني من الحيوانات؟', a: 'لحم' },
    { q: 'حيوان مفترس يسمى ملك الغابة؟', a: 'ليث' }
  ],
  'م': [
    { q: 'ما هي عاصمة روسيا؟', a: 'موسكو' },
    { q: 'حيوان يعيش في الماء واليابسة؟', a: 'مساح' }
  ],
  'ن': [
    { q: 'دولة في أفريقيا عاصمتها أبوجا؟', a: 'نيجيريا' },
    { q: 'حشرة تنتج العسل؟', a: 'نحلة' },
    { q: 'عكس الظلام؟', a: 'نور' },
    { q: 'النهر الأطول في العالم؟', a: 'نيل' }
  ],
  'ه': [
    { q: 'دولة عاصمتها أمستردام؟', a: 'هولندا' },
    { q: 'طائر له عرف جميل؟', a: 'هدهد' },
    { q: 'شكل القمر في بداية الشهر؟', a: 'هلال' },
    { q: 'حيوان أليف يحبه الناس؟', a: 'هرة' }
  ],
  'و': [
    { q: 'ما هو الاسم الذي يطلق على الصغير؟', a: 'وليد' },
    { q: 'حيوان ضخم له قرن واحد؟', a: 'وحيد القرن' }
  ],
  'ي': [
    { q: 'دولة عاصمتها أثينا؟', a: 'يونان' },
    { q: 'طائر يشبه الحمامة؟', a: 'يمامة' },
    { q: 'نبات برتقالي كبير؟', a: 'يقطين' },
    { q: 'حجر كريم أحمر؟', a: 'ياقوت' }
  ]
};

const TILE_COLORS = {
  neutral: { fill: '#F8F6F0', stroke: '#D4CFC6', text: '#1A1A1A' },
  red: { fill: '#EF4444', stroke: '#991B1B', text: '#FFFFFF' },
  green: { fill: '#22C55E', stroke: '#166534', text: '#FFFFFF' },
};

const SOUNDS = {
  CLICK: 'https://mixkit.imgix.net/sfx/preview/mixkit-click-melodic-tone-1129.mp3',
  WIN: 'https://mixkit.imgix.net/sfx/preview/mixkit-winning-chimes-2015.mp3',
  TIMER: 'https://mixkit.imgix.net/sfx/preview/mixkit-clock-countdown-bleeps-916.mp3',
  MARK: 'https://mixkit.imgix.net/sfx/preview/mixkit-positive-interface-click-1112.mp3',
  NEW_GAME: 'https://mixkit.imgix.net/sfx/preview/mixkit-magical-sweep-transition-175.mp3',
  JOIN: 'https://mixkit.imgix.net/sfx/preview/mixkit-modern-technology-select-3124.mp3',
  LEAVE: 'https://mixkit.imgix.net/sfx/preview/mixkit-negative-answer-740.mp3',
  ERROR: 'https://mixkit.imgix.net/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
  SUCCESS: 'https://mixkit.imgix.net/sfx/preview/mixkit-success-bell-600.mp3',
  NEXT_Q: 'https://mixkit.imgix.net/sfx/preview/mixkit-fast-double-click-on-mouse-2751.mp3',
  SHOW_A: 'https://mixkit.imgix.net/sfx/preview/mixkit-interface-hint-notification-911.mp3',
  UPLOAD: 'https://mixkit.imgix.net/sfx/preview/mixkit-software-interface-start-2574.mp3',
  BG_MUSIC: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Subtle loop
};

const playSound = (url: string) => {
  const audio = new Audio(url);
  audio.volume = 0.3;
  audio.play().catch(() => {});
};

/* ─────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────── */
function parseTxt(text: string) {
  const res: Record<string, { q: string; a: string }[]> = {};
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  
  let curLetter: string | null = null;
  let pendingQ: string | null = null;
  
  for (const line of lines) {
    // Match "الحرف: أ" or just "أ"
    const letterMatch = line.match(/^(?:الحرف|حرف|Letter)\s*[:\-]?\s*([a-zA-Z\u0600-\u06FF])|^\s*([a-zA-Z\u0600-\u06FF])\s*[:\-]?$/i);
    if (letterMatch) {
      curLetter = letterMatch[1] || letterMatch[2];
      if (!res[curLetter]) res[curLetter] = [];
      pendingQ = null;
      continue;
    }
    
    if (!curLetter) continue;
    
    // Match "س: ..." or "سؤال: ..."
    const qMatch = line.match(/^(?:س|سؤال|السؤال|Q|Question)\s*[:\-]\s*(.*)$/i);
    if (qMatch) {
      pendingQ = qMatch[1].trim();
      continue;
    } 
    
    // Match "ج: ..." or "جواب: ..."
    const aMatch = line.match(/^(?:ج|جواب|إجابة|الإجابة|A|Answer)\s*[:\-]\s*(.*)$/i);
    if (aMatch && pendingQ) {
      res[curLetter].push({ q: pendingQ, a: aMatch[1].trim() });
      pendingQ = null;
      continue;
    }

    // Fallback: If line contains a question mark and we have a letter, treat as Q? A
    if ((line.includes('؟') || line.includes('?')) && !pendingQ) {
      const parts = line.split(/[؟?]/);
      if (parts.length >= 2 && parts[1].trim()) {
        res[curLetter].push({ q: parts[0].trim() + (line.includes('؟') ? '؟' : '?'), a: parts[1].trim() });
      }
    }
  }
  return res;
}

function parseJson(content: string) {
  try {
    const data = JSON.parse(content);
    const res: Record<string, { q: string; a: string }[]> = {};

    // Format A: { "أ": [{ "q": "...", "a": "..." }] }
    if (typeof data === 'object' && !Array.isArray(data)) {
      for (const key in data) {
        if (Array.isArray(data[key])) {
          res[key] = data[key].map((item: any) => ({
            q: item.q || item.question || item.سؤال || item.السؤال || '',
            a: item.a || item.answer || item.إجابة || item.الإجابة || ''
          })).filter((item: any) => item.q && item.a);
        }
      }
    }
    // Format B: [{ "letter": "أ", "q": "...", "a": "..." }]
    else if (Array.isArray(data)) {
      data.forEach((item: any) => {
        const letter = item.letter || item.حرف || '';
        const q = item.q || item.question || item.سؤال || item.السؤال || '';
        const a = item.a || item.answer || item.إجابة || item.الإجابة || '';
        if (letter && q && a) {
          if (!res[letter]) res[letter] = [];
          res[letter].push({ q, a });
        }
      });
    }
    return Object.keys(res).length > 0 ? res : null;
  } catch (e) {
    return null;
  }
}

function checkWin(tiles: string[], team: 'red' | 'green') {
  const R = 5, C = 5;
  const isStart = team === 'red' ? (_: number, c: number) => c === 0 : (r: number, _: number) => r === 0;
  const isEnd = team === 'red' ? (_: number, c: number) => c === C - 1 : (r: number, _: number) => r === R - 1;
  
  const starts: [number, number][] = [];
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      if (tiles[r * C + c] === team && isStart(r, c)) starts.push([r, c]);
    }
  }

  const vis = Array(R * C).fill(false);
  const q = [...starts];
  starts.forEach(([r, c]) => vis[r * C + c] = true);

  const nbrs = (r: number, c: number) => {
    const isEvenRow = r % 2 === 0;
    // Because of vC = 4 - c (RTL) and the row offset logic:
    // Even rows (offset 0) connect to c and c+1 in rows above/below.
    // Odd rows (offset 0.5) connect to c and c-1 in rows above/below.
    return [
      [r, c - 1], [r, c + 1],
      [r - 1, isEvenRow ? c : c - 1], [r - 1, isEvenRow ? c + 1 : c],
      [r + 1, isEvenRow ? c : c - 1], [r + 1, isEvenRow ? c + 1 : c]
    ].filter(([nr, nc]) => nr >= 0 && nr < R && nc >= 0 && nc < C);
  };

  while (q.length) {
    const [r, c] = q.shift()!;
    if (isEnd(r, c)) return true;
    for (const [nr, nc] of nbrs(r, c)) {
      const ni = nr * C + nc;
      if (!vis[ni] && tiles[ni] === team) {
        vis[ni] = true;
        q.push([nr, nc]);
      }
    }
  }
  return false;
}

/* ─────────────────────────────────────────────────────────
   COMPONENTS
───────────────────────────────────────────────────────── */

const Hexagon = ({ state, letter, isSelected, onClick, fontSize = 1, cellSize = 1 }: any) => {
  const baseW = 88, baseH = 99;
  const HW = baseW * cellSize, HH = baseH * cellSize;
  const pts = (() => {
    const cx = HW / 2, cy = HH / 2, p = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 180) * (60 * i - 30);
      p.push(`${cx + (HW / 2) * 0.93 * Math.cos(a)},${cy + (HH / 2) * 0.93 * Math.sin(a)}`);
    }
    return p.join(' ');
  })();

  const colors = TILE_COLORS[state as keyof typeof TILE_COLORS];

  return (
    <motion.g 
      layout
      onClick={() => { playSound(SOUNDS.CLICK); onClick(); }} 
      className="cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      animate={isSelected ? { scale: 1.15 } : { scale: 1 }}
    >
      <polygon points={pts} fill="rgba(0,0,0,0.12)" transform={`translate(${3 * cellSize},${4 * cellSize})`} />
      <polygon 
        points={pts} 
        fill={colors.fill} 
        stroke={isSelected ? '#1A1A1A' : colors.stroke} 
        strokeWidth={isSelected ? 5 * cellSize : 2.5 * cellSize} 
        className="transition-all duration-300"
      />
      {isSelected && (
        <polygon 
          points={pts} 
          fill="rgba(255,255,255,0.3)" 
          stroke="none"
          className="pointer-events-none"
        />
      )}
      <foreignObject x="0" y="0" width={HW} height={HH} className="pointer-events-none">
        <div className="w-full h-full flex items-center justify-center">
          <motion.div 
            className="relative"
            animate={{ 
              y: [0, -2 * cellSize, 0],
              rotate: [0, -1, 1, 0],
              scale: isSelected ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 3 + Math.random() * 2, 
              ease: "easeInOut" 
            }}
          >
            <span 
              className="font-bold select-none font-arabic"
              style={{ color: colors.text, fontSize: `${fontSize * 2 * cellSize}rem` }}
            >
              {letter}
            </span>
          </motion.div>
        </div>
      </foreignObject>
    </motion.g>
  );
};

const Confetti = () => {
  const particles = Array.from({ length: 50 });
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((_, i) => (
        <div 
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            backgroundColor: ['#EF4444', '#22C55E', '#FBBF24', '#3B82F6', '#EC4899'][i % 5],
            '--dur': `${Math.random() * 2 + 2}s`,
            '--delay': `${Math.random() * 3}s`,
          } as any}
        />
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────────────────── */

export default function App() {
  const [screen, setScreen] = useState<'login' | 'lobby' | 'bank-selection' | 'game'>('login');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [playerList, setPlayerList] = useState<{ id: string; name: string }[]>([]);
  
  const [tiles, setTiles] = useState<string[]>(Array(25).fill('neutral'));
  const [letters, setLetters] = useState<string[]>(INITIAL_LETTERS);
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  const [questions, setQuestions] = useState(FALLBACK_QUESTIONS);
  const [winner, setWinner] = useState<'red' | 'green' | null>(null);
  const [scores, setScores] = useState({ red: 0, green: 0 });
  const [winCondition, setWinCondition] = useState(3);
  const [gameWinner, setGameWinner] = useState<'red' | 'green' | null>(null);
  const [hideQuestionsFromGuest, setHideQuestionsFromGuest] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [cellSize, setCellSize] = useState(1);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [isResizing, setIsResizing] = useState(false);
  const [bgMusicEnabled, setBgMusicEnabled] = useState(false);
  const [bgMusicAudio] = useState(() => {
    const audio = new Audio(SOUNDS.BG_MUSIC);
    audio.loop = true;
    audio.volume = 0.1;
    return audio;
  });
  
  // Banks Management
  const [banks, setBanks] = useState<Record<string, Record<string, { q: string; a: string }[]>>>({
    "الأسئلة الافتراضية": FALLBACK_QUESTIONS
  });
  const [selectedBankName, setSelectedBankName] = useState("الأسئلة الافتراضية");

  // Timer state
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerDuration, setTimerDuration] = useState(30);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Question state
  const [qIdx, setQIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [uploadSummary, setUploadSummary] = useState<{ count: number; letters: string[] } | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState<{ id: number; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });
  const [editingLetter, setEditingLetter] = useState<string | null>(null);
  const [newQ, setNewQ] = useState("");
  const [newA, setNewA] = useState("");

  const [bulkText, setBulkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAuth = async () => {
    if (!authForm.username || !authForm.password) return alert("يرجى ملء جميع الحقول");
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser({ id: data.userId, username: authForm.username });
        setIsAuthOpen(false);
        playSound(SOUNDS.SUCCESS);
        // Load user banks
        const banksRes = await fetch(`/api/banks/${data.userId}`);
        const banksData = await banksRes.json();
        if (banksData.success) {
          setBanks(prev => ({ ...prev, ...banksData.banks }));
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert("حدث خطأ في الاتصال بالسيرفر");
    }
  };

  const deleteBank = async (name: string) => {
    if (!confirm(`هل أنت متأكد من حذف بنك (${name})؟`)) return;
    const updated = { ...banks };
    delete updated[name];
    setBanks(updated);
    if (selectedBankName === name) {
      setSelectedBankName('الأسئلة الافتراضية');
      setQuestions(FALLBACK_QUESTIONS);
    }
    if (user) {
      await fetch(`/api/banks/${user.id}/${name}`, { method: 'DELETE' });
    }
    playSound(SOUNDS.CLICK);
  };
  const handleBulkAdd = () => {
    if (!editingLetter || !bulkText) return;
    const lines = bulkText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    const newQuestions: { q: string; a: string }[] = [];
    let currentQ: string | null = null;

    for (const line of lines) {
      const qMatch = line.match(/^(?:س|سؤال|السؤال|Q|Question)\s*[:\-]\s*(.*)$/i);
      if (qMatch) {
        currentQ = qMatch[1].trim();
        continue;
      }
      const aMatch = line.match(/^(?:ج|جواب|إجابة|الإجابة|A|Answer)\s*[:\-]\s*(.*)$/i);
      if (aMatch && currentQ) {
        newQuestions.push({ q: currentQ, a: aMatch[1].trim() });
        currentQ = null;
        continue;
      }
      // Fallback: if line has ? it's a question, next line is answer
      if (line.includes('؟') || line.includes('?')) {
        currentQ = line;
      } else if (currentQ) {
        newQuestions.push({ q: currentQ, a: line });
        currentQ = null;
      }
    }

    if (newQuestions.length > 0) {
      const updated = { ...questions };
      if (!updated[editingLetter]) updated[editingLetter] = [];
      updated[editingLetter] = [...updated[editingLetter], ...newQuestions];
      setQuestions(updated);
      broadcastState({ questions: updated });
      setBulkText("");
      playSound(SOUNDS.SUCCESS);
    }
  };

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on("room-state", (state) => {
      setTiles(state.tiles);
      if (state.letters && state.letters.length > 0) setLetters(state.letters);
      setSelectedIdx(state.selectedIdx);
      setTimeLeft(state.timeLeft);
      setTimerRunning(state.timerRunning);
      if (state.hideQuestionsFromGuest !== undefined) setHideQuestionsFromGuest(state.hideQuestionsFromGuest);
      if (state.questions) setQuestions(state.questions);
      if (state.scores) setScores(state.scores);
      if (state.winCondition) setWinCondition(state.winCondition);
      if (state.gameWinner !== undefined) setGameWinner(state.gameWinner);
      if (state.cellSize) setCellSize(state.cellSize);
      if (state.screen) setScreen(state.screen);
    });

    newSocket.on("player-list", (players) => {
      if (players.length > playerList.length && playerList.length > 0) {
        playSound(SOUNDS.JOIN);
      } else if (players.length < playerList.length) {
        playSound(SOUNDS.LEAVE);
      }
      setPlayerList(players);
    });

    newSocket.on("new-host", (hostId) => {
      if (newSocket.id === hostId) {
        setIsHost(true);
        alert("لقد أصبحت أنت المضيف الآن!");
      }
    });

    newSocket.on("error", (msg) => {
      playSound(SOUNDS.ERROR);
      alert(msg);
      setScreen('lobby');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const broadcastState = useCallback((newState: any) => {
    if (socket && roomCode) {
      socket.emit("update-state", { roomCode, state: newState });
    }
  }, [socket, roomCode]);

  useEffect(() => {
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          const next = t - 1;
          if (isHost) broadcastState({ timeLeft: next });
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeLeft === 0) setTimerRunning(false);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning, timeLeft, isHost, broadcastState]);

  const handleTileClick = (idx: number) => {
    if (!isHost) return;
    const nextIdx = idx === selectedIdx ? -1 : idx;
    setSelectedIdx(nextIdx);
    setQIdx(0);
    setShowAnswer(false);
    broadcastState({ selectedIdx: nextIdx });
    
    // Auto-select letter in editor if host opens it
    if (nextIdx !== -1) {
      setEditingLetter(letters[nextIdx]);
    }
    playSound(SOUNDS.CLICK);
  };

  useEffect(() => {
    if (bgMusicEnabled) {
      bgMusicAudio.play().catch(() => {});
    } else {
      bgMusicAudio.pause();
    }
  }, [bgMusicEnabled, bgMusicAudio]);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      // In RTL (dir="rtl"):
      // Host Sidebar is on the RIGHT (order-1). Width = window.innerWidth - e.clientX
      // Guest Sidebar is on the LEFT (order-2). Width = e.clientX
      const newWidth = isHost ? (window.innerWidth - e.clientX) : e.clientX;
      if (newWidth > 200 && newWidth < 800) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing, isHost]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const markTile = (state: string) => {
    if (selectedIdx === -1 || !isHost || gameWinner) return;
    if (state === 'neutral') {
      playSound(SOUNDS.ERROR);
    } else {
      playSound(SOUNDS.SUCCESS);
    }
    playSound(SOUNDS.MARK);
    const newTiles = [...tiles];
    newTiles[selectedIdx] = state;
    setTiles(newTiles);
    broadcastState({ tiles: newTiles });
    
    const checkTeamWin = (team: 'red' | 'green') => {
      if (checkWin(newTiles, team)) {
        setWinner(team);
        const newScores = { ...scores, [team]: scores[team] + 1 };
        setScores(newScores);
        
        // First to winCondition wins
        if (newScores[team] >= winCondition) {
          setGameWinner(team);
          broadcastState({ winner: team, scores: newScores, gameWinner: team });
        } else {
          broadcastState({ winner: team, scores: newScores });
        }
        playSound(SOUNDS.WIN);
        return true;
      }
      return false;
    };

    if (state === 'red') checkTeamWin('red');
    if (state === 'green') checkTeamWin('green');
  };

  const nextRound = () => {
    if (!isHost) return;
    const newState = {
      tiles: Array(25).fill('neutral'),
      letters: shuffleArray(INITIAL_LETTERS),
      winner: null,
      selectedIdx: -1,
      timeLeft: timerDuration,
      timerRunning: false,
    };
    setTiles(newState.tiles);
    setLetters(newState.letters);
    setWinner(null);
    setSelectedIdx(-1);
    setTimeLeft(timerDuration);
    setTimerRunning(false);
    broadcastState(newState);
  };

  const resetGame = () => {
    if (!isHost) return;
    playSound(SOUNDS.NEW_GAME);
    const shuffled = shuffleArray(INITIAL_LETTERS);
    const newState = {
      tiles: Array(25).fill('neutral'),
      letters: shuffled,
      winner: null,
      selectedIdx: -1,
      timeLeft: timerDuration,
      timerRunning: false,
      scores: { red: 0, green: 0 },
      gameWinner: null,
    };
    setTiles(newState.tiles);
    setLetters(newState.letters);
    setWinner(null);
    setScores(newState.scores);
    setGameWinner(null);
    setSelectedIdx(-1);
    setTimeLeft(timerDuration);
    setTimerRunning(false);
    broadcastState(newState);
  };

  const createRoom = () => {
    if (!playerName) return alert("يرجى إدخال اسمك أولاً");
    const code = Math.floor(100 + Math.random() * 900).toString();
    setRoomCode(code);
    setIsHost(true);
    socket?.emit("create-room", { roomCode: code, playerName });
    playSound(SOUNDS.SUCCESS);
    setScreen('bank-selection');
  };

  const joinRoom = () => {
    if (!roomCode) return alert("يرجى إدخال كود الغرفة");
    if (!playerName) return alert("يرجى إدخال اسمك أولاً");
    setIsHost(false);
    socket?.emit("join-room", { roomCode, playerName });
    // Screen will change on room-state event
  };

  const startGame = () => {
    if (!isHost) return;
    const shuffled = shuffleArray(INITIAL_LETTERS);
    setLetters(shuffled);
    broadcastState({ 
      letters: shuffled, 
      screen: 'game',
      questions: questions
    });
    setScreen('game');
    playSound(SOUNDS.NEW_GAME);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = ev.target?.result as string;
      if (!content) return;

      // Try JSON first, then fallback to TXT
      let parsed = parseJson(content) || parseTxt(content);

      const count = Object.values(parsed).reduce((acc, curr) => acc + curr.length, 0);
      if (count > 0) {
        const bankName = file.name.split('.')[0] || `بنك ${Object.keys(banks).length + 1}`;
        setBanks(prev => ({ ...prev, [bankName]: parsed }));
        setSelectedBankName(bankName);
        setQuestions(parsed);
        setUploadSummary({ count, letters: Object.keys(parsed) });
        broadcastState({ questions: parsed });
        playSound(SOUNDS.SUCCESS);

        // Auto-save to cloud if logged in
        if (user) {
          try {
            await fetch('/api/banks/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: user.id, name: bankName, data: parsed })
            });
          } catch (err) {
            console.error("Failed to save bank to cloud", err);
          }
        }
      } else {
        playSound(SOUNDS.ERROR);
        alert("لم يتم العثور على أي أسئلة صالحة في الملف. تأكد من التنسيق (الحرف، س، ج)");
      }
    };
    
    reader.onerror = () => alert('حدث خطأ أثناء قراءة الملف.');
    reader.readAsText(file, 'UTF-8');
    
    // Clear input so the same file can be uploaded again if needed
    e.target.value = '';
  };

  if (screen === 'bank-selection') {
    return (
      <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center p-6 font-arabic overflow-hidden relative">
        <div className="absolute top-6 right-6 z-20">
          {user ? (
            <div className="flex items-center gap-4 bg-white border-4 border-[#1A1A1A] rounded-2xl px-4 py-2 shadow-[4px_4px_0_#1A1A1A]">
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Logged in as</p>
                <p className="font-black text-[#1A1A1A]">{user.username}</p>
              </div>
              <button 
                onClick={() => { setUser(null); playSound(SOUNDS.CLICK); }}
                className="text-red-500 hover:scale-110 transition-transform"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="bg-white border-4 border-[#1A1A1A] rounded-2xl px-6 py-3 font-black shadow-[4px_4px_0_#1A1A1A] hover:translate-y-[-2px] active:translate-y-[2px] transition-all flex items-center gap-2"
            >
              <LogIn size={20} />
              تسجيل الدخول لحفظ الأسئلة
            </button>
          )}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl bg-white border-8 border-[#1A1A1A] rounded-[40px] p-8 lg:p-12 shadow-[16px_16px_0_#1A1A1A] relative z-10 flex flex-col gap-8"
        >
          <div className="text-center">
            <h1 className="text-4xl lg:text-6xl font-black text-[#1A1A1A] mb-2">اختيار بنك الأسئلة</h1>
            <p className="text-gray-500 font-bold">اختر مجموعة الأسئلة التي تريد اللعب بها أو أضف مجموعتك الخاصة</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black flex items-center gap-2"><Users size={24} /> المجموعات المتاحة</h2>
              <div className="flex-1 overflow-y-auto max-h-[300px] border-4 border-[#1A1A1A] rounded-2xl p-4 flex flex-col gap-2 bg-gray-50">
                {Object.keys(banks).map(name => (
                  <div key={name} className="relative group">
                    <button 
                      onClick={() => {
                        setSelectedBankName(name);
                        setQuestions(banks[name]);
                        broadcastState({ questions: banks[name] });
                        playSound(SOUNDS.CLICK);
                      }}
                      className={`w-full p-4 rounded-xl border-4 border-[#1A1A1A] font-black text-right transition-all flex justify-between items-center ${selectedBankName === name ? 'bg-[#1A1A1A] text-white shadow-[4px_4px_0_#22C55E]' : 'bg-white text-[#1A1A1A] hover:bg-gray-100'}`}
                    >
                      <span>{name}</span>
                      <span className="text-xs opacity-60">{(Object.values(banks[name]) as any[]).reduce((a, b) => a + b.length, 0)} سؤال</span>
                    </button>
                    {name !== 'الأسئلة الافتراضية' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); deleteBank(name); }}
                        className="absolute -top-2 -left-2 bg-red-500 text-white border-2 border-[#1A1A1A] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-black flex items-center gap-2"><Plus size={24} /> إضافة مجموعة جديدة</h2>
              <div className="bg-gray-50 border-4 border-[#1A1A1A] rounded-2xl p-6 flex flex-col gap-4">
                <button 
                  onClick={() => { playSound(SOUNDS.CLICK); fileInputRef.current?.click(); }}
                  className="w-full bg-white border-4 border-[#1A1A1A] rounded-xl py-4 font-black shadow-[4px_4px_0_#1A1A1A] hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
                >
                  <FileUp size={32} />
                  <span>رفع ملف (TXT / JSON)</span>
                </button>
                <button 
                  onClick={() => { playSound(SOUNDS.CLICK); setIsEditorOpen(true); }}
                  className="w-full bg-[#3B82F6] text-white border-4 border-[#1A1A1A] rounded-xl py-4 font-black shadow-[4px_4px_0_#1A1A1A] hover:scale-105 active:scale-95 flex flex-col items-center gap-2"
                >
                  <Plus size={32} />
                  <span>إنشاء مجموعة يدوياً</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.json" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 mt-4">
            <button 
              onClick={startGame}
              className="flex-1 bg-[#22C55E] text-white border-8 border-[#1A1A1A] rounded-3xl py-6 text-3xl font-black shadow-[8px_8px_0_#1A1A1A] hover:scale-105 active:scale-95 transition-transform"
            >
              ابدأ اللعب الآن 🎮
            </button>
            <button 
              onClick={() => setScreen('lobby')}
              className="lg:w-48 bg-white text-[#1A1A1A] border-8 border-[#1A1A1A] rounded-3xl py-6 text-xl font-black shadow-[8px_8px_0_#1A1A1A] hover:scale-105 active:scale-95 transition-transform"
            >
              رجوع
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (screen === 'login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 lg:gap-8 bg-[#F0F4E8] p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 lg:p-10 text-center shadow-[8px_8px_0_#1A1A1A] w-full max-w-[400px]"
        >
          <h1 className="text-[clamp(1.5rem,5vw,2.5rem)] font-black text-[#1A1A1A] mb-2 tracking-tight">Hroof With Hamoodi</h1>
          <p className="text-[clamp(1.2rem,4vw,2rem)] font-bold text-[#1A1A1A] font-arabic">حروف مع حمودي</p>
        </motion.div>

        <div className="flex flex-col gap-4 w-full max-w-[300px]">
          <input 
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="ادخل اسمك يا بطل"
            className="border-4 border-[#1A1A1A] rounded-2xl px-6 py-4 text-center text-[clamp(1rem,3vw,1.25rem)] font-bold bg-white shadow-[4px_4px_0_#1A1A1A] outline-none font-arabic w-full"
            onKeyDown={(e) => e.key === 'Enter' && playerName.trim() && setScreen('lobby')}
          />
          <button 
            onClick={() => { if(playerName.trim()) { playSound(SOUNDS.CLICK); setScreen('lobby'); } }}
            className="bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] rounded-2xl py-4 text-[clamp(1.1rem,3vw,1.5rem)] font-black shadow-[4px_4px_0_#555] hover:translate-y-[-2px] active:translate-y-[2px] transition-transform font-arabic w-full"
          >
            دخول
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'lobby') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 lg:gap-8 bg-[#F0F4E8] p-4">
        <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-6 lg:p-10 text-center shadow-[8px_8px_0_#1A1A1A] w-full max-w-[400px]">
          <h2 className="text-[clamp(1.2rem,4vw,1.75rem)] font-black mb-6">مرحباً {playerName}</h2>
          
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { playSound(SOUNDS.NEW_GAME); createRoom(); }}
              className="bg-[#22C55E] text-white border-4 border-[#1A1A1A] rounded-2xl py-4 text-[clamp(1rem,3vw,1.25rem)] font-black shadow-[4px_4px_0_#166534] flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[2px] transition-transform font-arabic"
            >
              <Plus size={24} /> إنشاء غرفة جديدة
            </button>
            
            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t-2 border-[#1A1A1A]/10"></div>
              <span className="flex-shrink mx-4 text-gray-400 font-bold">أو</span>
              <div className="flex-grow border-t-2 border-[#1A1A1A]/10"></div>
            </div>

            <div className="flex flex-col gap-2">
              <input 
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="رمز الغرفة"
                className="border-4 border-[#1A1A1A] rounded-2xl px-6 py-4 text-center text-[clamp(1rem,3vw,1.25rem)] font-bold bg-white shadow-[4px_4px_0_#1A1A1A] outline-none"
              />
              <button 
                onClick={() => { playSound(SOUNDS.CLICK); joinRoom(); }}
                className="bg-[#3B82F6] text-white border-4 border-[#1A1A1A] rounded-2xl py-4 text-[clamp(1rem,3vw,1.25rem)] font-black shadow-[4px_4px_0_#1E40AF] flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[2px] transition-transform font-arabic"
              >
                <LogIn size={24} /> انضمام للغرفة
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentLetter = selectedIdx !== -1 ? letters[selectedIdx] : null;
  const currentQuestions = currentLetter ? (questions[currentLetter] || []) : [];
  const currentQ = currentQuestions[qIdx];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F0F4E8] font-arabic relative overflow-x-hidden" dir="rtl">
      {/* Logo */}
      <div className="w-full lg:absolute lg:top-4 lg:left-1/2 lg:-translate-x-1/2 z-30 pointer-events-none flex justify-center p-4 lg:p-0">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white border-4 border-[#1A1A1A] rounded-2xl px-4 lg:px-6 py-2 lg:py-3 shadow-[4px_4px_0_#1A1A1A]"
        >
          <h1 className="text-[clamp(1rem,4vw,1.5rem)] font-black text-[#1A1A1A] tracking-tight whitespace-nowrap">Hroof With Hamoodi</h1>
        </motion.div>
      </div>

      {/* Conditional Layout */}
      {isHost ? (
        <>
          {/* Host: Questions on Left (End in RTL) */}
          <AnimatePresence>
            {selectedIdx !== -1 && (
              <div className="relative flex-shrink-0 z-20 order-3 lg:order-1 flex">
                <motion.aside 
                  initial={{ width: 0, opacity: 0, x: -50 }}
                  animate={{ width: sidebarWidth, opacity: 1, x: 0 }}
                  exit={{ width: 0, opacity: 0, x: -50 }}
                  className="h-full flex flex-col p-4 lg:p-6 gap-4 border-b-4 lg:border-b-0 lg:border-l-4 border-[#1A1A1A]/10 bg-[#F0F4E8] overflow-y-auto max-h-[50vh] lg:max-h-screen"
                  style={{ width: sidebarWidth }}
                >
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-4 lg:p-6 text-center shadow-[4px_4px_0_#1A1A1A]">
                      <h3 className="text-[clamp(2rem,8vw,4rem)] font-black text-[#1A1A1A] mb-1">{currentLetter}</h3>
                      <p className={`text-[clamp(0.6rem,2vw,0.8rem)] font-bold uppercase tracking-widest ${tiles[selectedIdx] === 'red' ? 'text-red-600' : tiles[selectedIdx] === 'green' ? 'text-green-600' : 'text-gray-400'}`}>
                        {tiles[selectedIdx] === 'red' ? 'فريق أحمر' : tiles[selectedIdx] === 'green' ? 'فريق أخضر' : 'محايدة'}
                      </p>
                    </div>

                    {currentQuestions.length > 0 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[clamp(0.7rem,2vw,0.9rem)] font-bold text-gray-500">{qIdx + 1} / {currentQuestions.length}</span>
                          <button 
                            onClick={() => { playSound(SOUNDS.NEXT_Q); setQIdx((qIdx + 1) % currentQuestions.length); setShowAnswer(false); }}
                            className="bg-gray-100 border-2 border-[#1A1A1A] rounded-lg px-3 py-1 text-[clamp(0.6rem,1.5vw,0.75rem)] font-bold hover:bg-gray-200 transition-transform active:scale-95"
                          >
                            السؤال التالي 🔄
                          </button>
                        </div>

                        <motion.div 
                          key={qIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white border-4 border-[#1A1A1A] rounded-2xl p-4 lg:p-6 shadow-[4px_4px_0_#1A1A1A] min-h-[120px] max-h-[250px] overflow-y-auto flex items-center justify-center text-center font-bold leading-relaxed break-words whitespace-normal scrollbar-thin scrollbar-thumb-gray-300 ${
                            currentQ.q.length > 150 ? 'text-base lg:text-lg' : 'text-lg lg:text-xl'
                          }`}
                        >
                          {currentQ.q}
                        </motion.div>

                        <button 
                          onClick={() => { playSound(SOUNDS.SHOW_A); setShowAnswer(!showAnswer); }}
                          className={`w-full border-4 border-[#1A1A1A] rounded-2xl py-3 lg:py-4 font-bold shadow-[4px_4px_0_#1A1A1A] transition-all flex items-center justify-center gap-2 active:scale-95 text-[clamp(0.8rem,2vw,1rem)] ${showAnswer ? 'bg-green-50 border-green-600 text-green-800' : 'bg-white text-gray-400'}`}
                        >
                          {showAnswer ? <><EyeOff size={18} /> {currentQ.a}</> : <><Eye size={18} /> كشف الإجابة</>}
                        </button>
                      </>
                    ) : (
                      <div className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-6 text-center text-gray-400 font-bold italic text-sm">
                        لا توجد أسئلة لهذا الحرف
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-2 lg:gap-3 mt-2 lg:mt-4 pt-4 border-t-2 border-dashed border-gray-300">
                      <button 
                        onClick={() => markTile('red')}
                        className="bg-[#EF4444] text-white border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-black shadow-[4px_4px_0_#991B1B] hover:translate-y-[-2px] active:translate-y-[2px] transition-transform text-[clamp(0.8rem,2vw,1rem)]"
                      >
                        🔴 فريق أحمر
                      </button>
                      <button 
                        onClick={() => markTile('green')}
                        className="bg-[#22C55E] text-white border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-black shadow-[4px_4px_0_#166534] hover:translate-y-[-2px] active:translate-y-[2px] transition-transform text-[clamp(0.8rem,2vw,1rem)]"
                      >
                        🟢 فريق أخضر
                      </button>
                      <button 
                        onClick={() => markTile('neutral')}
                        className="bg-gray-500 text-white border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-black shadow-[4px_4px_0_#374151] hover:translate-y-[-2px] active:translate-y-[2px] transition-transform text-[clamp(0.8rem,2vw,1rem)]"
                      >
                        ↺ محايد
                      </button>
                    </div>
                  </motion.div>
                </motion.aside>
                {/* Resize Handle */}
                <div 
                  onMouseDown={startResizing}
                  className="hidden lg:block w-1.5 h-full cursor-col-resize bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/20 transition-colors"
                />
              </div>
            )}
          </AnimatePresence>

          {/* Main Board */}
          <motion.main 
            layout
            className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 relative order-2 min-h-[300px] lg:min-h-0"
            animate={{ scale: selectedIdx !== -1 ? 0.95 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="mb-8 flex items-center gap-12 bg-white border-8 border-[#1A1A1A] rounded-[30px] px-10 py-4 shadow-[8px_8px_0_#1A1A1A] relative z-20">
              <div className="text-center">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Red Team</p>
                <div className="flex gap-1.5 justify-center">
                  {[...Array(winCondition)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={scores.red > i ? { scale: [1, 1.3, 1], backgroundColor: '#EF4444' } : {}}
                      className={`w-5 h-5 rounded-full border-2 border-[#1A1A1A] ${scores.red > i ? 'bg-red-500' : 'bg-gray-100'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="text-4xl font-black text-[#1A1A1A] flex flex-col items-center">
                <span className="text-[10px] opacity-30 mb-[-4px]">SCORE</span>
                <div className="flex items-center gap-4">
                  <motion.span key={`red-score-${scores.red}`} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{scores.red}</motion.span>
                  <span className="opacity-20">-</span>
                  <motion.span key={`green-score-${scores.green}`} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{scores.green}</motion.span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Green Team</p>
                <div className="flex gap-1.5 justify-center">
                  {[...Array(winCondition)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      animate={scores.green > i ? { scale: [1, 1.3, 1], backgroundColor: '#22C55E' } : {}}
                      className={`w-5 h-5 rounded-full border-2 border-[#1A1A1A] ${scores.green > i ? 'bg-green-500' : 'bg-gray-100'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Team Goal Indicators */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 lg:h-8 bg-green-500/10 border-b-2 lg:border-b-4 border-green-500/30 flex items-center justify-center">
                <span className="text-green-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Green Team Goal</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-6 lg:h-8 bg-green-500/10 border-t-2 lg:border-t-4 border-green-500/30 flex items-center justify-center">
                <span className="text-green-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Green Team Goal</span>
              </div>
              <div className="absolute top-0 right-0 h-full w-6 lg:w-8 bg-red-500/10 border-l-2 lg:border-l-4 border-red-500/30 flex items-center justify-center [writing-mode:vertical-rl]">
                <span className="text-red-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Red Team Goal</span>
              </div>
              <div className="absolute top-0 left-0 h-full w-6 lg:w-8 bg-red-500/10 border-r-2 lg:border-r-4 border-red-500/30 flex items-center justify-center [writing-mode:vertical-rl]">
                <span className="text-red-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Red Team Goal</span>
              </div>
            </div>

            <svg 
              viewBox={`0 0 ${550 * cellSize} ${500 * cellSize}`} 
              className="w-full max-w-[600px] drop-shadow-2xl overflow-visible relative z-10"
              style={{ maxWidth: `${600 * cellSize}px` }}
            >
              {Array.from({ length: 25 }).map((_, idx) => {
                const r = Math.floor(idx / 5);
                const c = idx % 5;
                const baseW = 88, baseH = 99, baseGX = 5, baseGY = 3;
                const HW = baseW * cellSize, HH = baseH * cellSize;
                const gX = baseGX * cellSize, gY = baseGY * cellSize;
                const cS = HW + gX, rS = HH * 0.765 + gY;
                const vC = 4 - c; // RTL
                const x = (20 * cellSize) + vC * cS + (r % 2 === 0 ? 0 : cS / 2);
                const y = (20 * cellSize) + r * rS;
                return (
                  <g key={idx} transform={`translate(${x},${y})`}>
                    <Hexagon 
                      state={tiles[idx]} 
                      letter={letters[idx]} 
                      isSelected={selectedIdx === idx}
                      onClick={() => handleTileClick(idx)}
                      fontSize={fontSize}
                      cellSize={cellSize}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.main>

          {/* Host: Controls on Right (Start in RTL) */}
          <aside className="w-full lg:w-72 flex flex-col p-4 lg:p-6 gap-4 border-t-4 lg:border-t-0 lg:border-r-4 border-[#1A1A1A]/10 bg-[#F0F4E8] z-20 order-1 lg:order-3 overflow-y-auto">
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-4 shadow-[4px_4px_0_#1A1A1A]"
            >
              <div className="flex justify-between items-center mb-4 border-b-2 border-gray-100 pb-2">
                <h2 className="text-[clamp(0.6rem,1.5vw,0.75rem)] font-black text-[#1A1A1A] tracking-widest uppercase">Room Info</h2>
                <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                  <Users size={14} />
                  <span className="text-xs font-black">{playerList.length}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-[clamp(0.6rem,1.5vw,0.75rem)] font-bold text-[#1A1A1A]">TIMER</span>
                <motion.span key={timeLeft} animate={timeLeft <= 5 ? { scale: [1, 1.2, 1], color: '#EF4444' } : {}} className="text-[clamp(0.8rem,2vw,1rem)] font-black text-[#1A1A1A]">{timeLeft}s</motion.span>
              </div>
              <div className="h-3 lg:h-4 bg-gray-200 border-2 border-[#1A1A1A] rounded-full overflow-hidden mb-3">
                <motion.div className="h-full" initial={false} animate={{ width: `${(timeLeft / timerDuration) * 100}%`, backgroundColor: timeLeft > 15 ? '#22C55E' : timeLeft > 5 ? '#FBBF24' : '#EF4444' }} />
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between p-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-xl">
                  <span className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold">حجم الخط</span>
                  <div className="flex gap-2">
                    <button onClick={() => setFontSize(f => Math.max(0.5, f - 0.1))} className="w-8 h-8 bg-white border-2 border-[#1A1A1A] rounded-lg font-bold">-</button>
                    <button onClick={() => setFontSize(f => Math.min(2, f + 0.1))} className="w-8 h-8 bg-white border-2 border-[#1A1A1A] rounded-lg font-bold">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-xl">
                  <span className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold">حجم الخلية</span>
                  <div className="flex gap-2">
                    <button onClick={() => { const next = Math.max(0.5, cellSize - 0.1); setCellSize(next); broadcastState({ cellSize: next }); }} className="w-8 h-8 bg-white border-2 border-[#1A1A1A] rounded-lg font-bold">-</button>
                    <button onClick={() => { const next = Math.min(2, cellSize + 0.1); setCellSize(next); broadcastState({ cellSize: next }); }} className="w-8 h-8 bg-white border-2 border-[#1A1A1A] rounded-lg font-bold">+</button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-xl">
                  <span className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold">نظام الفوز</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(w => (
                      <button 
                        key={w}
                        onClick={() => { setWinCondition(w); broadcastState({ winCondition: w }); playSound(SOUNDS.CLICK); }}
                        className={`w-7 h-7 border-2 border-[#1A1A1A] rounded-lg font-black text-[9px] transition-colors ${winCondition === w ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'}`}
                      >
                        {w === 1 ? '1' : w*2-1}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-xl">
                  <span className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold">الموسيقى</span>
                  <button onClick={() => { playSound(SOUNDS.CLICK); setBgMusicEnabled(!bgMusicEnabled); }} className={`w-8 lg:w-10 h-5 lg:h-6 rounded-full border-2 border-[#1A1A1A] transition-colors relative ${bgMusicEnabled ? 'bg-[#22C55E]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-3 lg:w-4 h-3 lg:h-4 rounded-full bg-white border-2 border-[#1A1A1A] transition-transform flex items-center justify-center ${bgMusicEnabled ? 'right-0.5' : 'left-0.5'}`}>
                      {bgMusicEnabled ? <Volume2 size={8} /> : <VolumeX size={8} />}
                    </div>
                  </button>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 border-2 border-[#1A1A1A] rounded-xl">
                  <span className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold">إخفاء الأسئلة</span>
                  <button onClick={() => { playSound(SOUNDS.CLICK); const next = !hideQuestionsFromGuest; setHideQuestionsFromGuest(next); broadcastState({ hideQuestionsFromGuest: next }); }} className={`w-8 lg:w-10 h-5 lg:h-6 rounded-full border-2 border-[#1A1A1A] transition-colors relative ${hideQuestionsFromGuest ? 'bg-[#22C55E]' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-3 lg:w-4 h-3 lg:h-4 rounded-full bg-white border-2 border-[#1A1A1A] transition-transform ${hideQuestionsFromGuest ? 'right-0.5' : 'left-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1 lg:gap-2 mb-3">
                {[5, 10, 30].map(d => (
                  <button key={d} onClick={() => { playSound(SOUNDS.CLICK); setTimerDuration(d); setTimeLeft(d); setTimerRunning(false); broadcastState({ timeLeft: d, timerDuration: d, timerRunning: false }); }} className={`text-[clamp(0.5rem,1.2vw,0.65rem)] font-bold py-1 rounded-lg border-2 border-[#1A1A1A] transition-colors hover:scale-105 active:scale-95 ${timerDuration === d ? 'bg-[#1A1A1A] text-white' : 'bg-gray-100 text-[#1A1A1A]'}`}>{d}s</button>
                ))}
              </div>
              <div className="flex gap-1 lg:gap-2">
                <button onClick={() => { playSound(SOUNDS.TIMER); setTimerRunning(true); broadcastState({ timerRunning: true }); }} className="flex-1 bg-[#22C55E] text-white border-2 border-[#1A1A1A] rounded-lg py-1 text-[clamp(0.5rem,1.2vw,0.65rem)] font-black shadow-[2px_2px_0_#1A1A1A] hover:scale-105 active:scale-95"><Play size={10} className="inline ml-1" /> START</button>
                <button onClick={() => { playSound(SOUNDS.CLICK); setTimerRunning(false); broadcastState({ timerRunning: false }); }} className="flex-1 bg-[#EF4444] text-white border-2 border-[#1A1A1A] rounded-lg py-1 text-[clamp(0.5rem,1.2vw,0.65rem)] font-black shadow-[2px_2px_0_#1A1A1A] hover:scale-105 active:scale-95"><Square size={10} className="inline ml-1" /> STOP</button>
              </div>
            </motion.div>

            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-3 shadow-[4px_4px_0_#1A1A1A] text-center">
              <p className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-black text-gray-400 uppercase tracking-widest mb-1">Room Code</p>
              <p className="text-[clamp(1rem,3vw,1.5rem)] font-black tracking-widest">{roomCode}</p>
            </motion.div>

            <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="flex flex-col gap-2 lg:gap-4">
              <button onClick={resetGame} className="w-full bg-[#EF4444] text-white border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-black shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"><RotateCcw size={16} /> لعبة جديدة</button>
              <button 
                onClick={() => { playSound(SOUNDS.CLICK); setIsEditorOpen(true); }} 
                className="w-full bg-[#3B82F6] text-white border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-bold shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"
              >
                <Plus size={16} /> تعديل الأسئلة يدوياً
              </button>
              <button onClick={() => { playSound(SOUNDS.CLICK); setScreen('bank-selection'); }} className="w-full bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-bold shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"><Users size={16} /> اختيار بنك آخر</button>
              <button 
                onClick={() => { 
                  if(confirm('هل تريد العودة للأسئلة الافتراضية؟')) {
                    setQuestions(FALLBACK_QUESTIONS);
                    broadcastState({ questions: FALLBACK_QUESTIONS });
                    playSound(SOUNDS.CLICK);
                  }
                }} 
                className="w-full bg-gray-100 text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-bold shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"
              >
                <RotateCcw size={16} /> استعادة الافتراضي
              </button>
            </motion.div>
            
            <div className="mt-auto pt-4 border-t-2 border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-[10px] font-black text-gray-400 uppercase">Questions List</h3>
                <button 
                  onClick={() => setIsEditorOpen(true)}
                  className="text-[10px] font-bold text-blue-500 hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="bg-white border-2 border-[#1A1A1A] rounded-xl p-2 max-h-32 overflow-y-auto text-[10px] font-bold">
                {selectedIdx !== -1 ? (
                  (questions[letters[selectedIdx]] || []).map((q, i) => (
                    <div key={i} className="mb-2 border-b border-gray-100 pb-1 last:border-0">
                      <p className="text-gray-500">س: {q.q}</p>
                      <p className="text-green-600">ج: {q.a}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-center">اختر حرفاً لعرض أسئلته</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-100">
              <h3 className="text-[10px] font-black text-gray-400 uppercase mb-2">Players Online</h3>
              <div className="flex flex-wrap gap-1">
                {playerList.map(p => (
                  <span key={p.id} className="text-[10px] font-bold bg-white border-2 border-[#1A1A1A] px-2 py-0.5 rounded-full">{p.name}</span>
                ))}
              </div>
            </div>

            <motion.button initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => { playSound(SOUNDS.CLICK); setScreen('lobby'); socket?.disconnect(); setSocket(io()); }} className="w-full bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-bold shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 mt-4 hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"><LogOut size={16} /> خروج</motion.button>
          </aside>
        </>
      ) : (
        <>
          {/* Guest: Main Board on Left/Center (End in RTL) */}
          <motion.main 
            layout
            className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 relative order-2 lg:order-1 min-h-[300px] lg:min-h-0"
            animate={{ scale: selectedIdx !== -1 ? 0.95 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Score Counter */}
            <div className="mb-8 flex items-center gap-12 bg-white border-8 border-[#1A1A1A] rounded-[30px] px-10 py-4 shadow-[8px_8px_0_#1A1A1A] relative z-20">
              <div className="text-center">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Red Team</p>
                <div className="flex gap-1.5 justify-center">
                  {[...Array(winCondition)].map((_, i) => (
                    <motion.div 
                      key={`guest-red-dot-${i}`} 
                      animate={scores.red > i ? { scale: [1, 1.3, 1], backgroundColor: '#EF4444' } : {}}
                      className={`w-5 h-5 rounded-full border-2 border-[#1A1A1A] ${scores.red > i ? 'bg-red-500' : 'bg-gray-100'}`} 
                    />
                  ))}
                </div>
              </div>
              <div className="text-4xl font-black text-[#1A1A1A] flex flex-col items-center">
                <span className="text-[10px] opacity-30 mb-[-4px]">SCORE</span>
                <div className="flex items-center gap-4">
                  <motion.span key={`guest-red-score-${scores.red}`} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{scores.red}</motion.span>
                  <span className="opacity-20">-</span>
                  <motion.span key={`guest-green-score-${scores.green}`} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{scores.green}</motion.span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Green Team</p>
                <div className="flex gap-1.5 justify-center">
                  {[...Array(winCondition)].map((_, i) => (
                    <motion.div 
                      key={`guest-green-dot-${i}`} 
                      animate={scores.green > i ? { scale: [1, 1.3, 1], backgroundColor: '#22C55E' } : {}}
                      className={`w-5 h-5 rounded-full border-2 border-[#1A1A1A] ${scores.green > i ? 'bg-green-500' : 'bg-gray-100'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Team Goal Indicators */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-6 lg:h-8 bg-green-500/10 border-b-2 lg:border-b-4 border-green-500/30 flex items-center justify-center">
                <span className="text-green-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Green Team Goal</span>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-6 lg:h-8 bg-green-500/10 border-t-2 lg:border-t-4 border-green-500/30 flex items-center justify-center">
                <span className="text-green-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Green Team Goal</span>
              </div>
              <div className="absolute top-0 right-0 h-full w-6 lg:w-8 bg-red-500/10 border-l-2 lg:border-l-4 border-red-500/30 flex items-center justify-center [writing-mode:vertical-rl]">
                <span className="text-red-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Red Team Goal</span>
              </div>
              <div className="absolute top-0 left-0 h-full w-6 lg:w-8 bg-red-500/10 border-r-2 lg:border-r-4 border-red-500/30 flex items-center justify-center [writing-mode:vertical-rl]">
                <span className="text-red-600 font-black text-[8px] lg:text-xs tracking-[0.3em] lg:tracking-[0.5em] uppercase">Red Team Goal</span>
              </div>
            </div>

            <svg 
              viewBox={`0 0 ${550 * cellSize} ${500 * cellSize}`} 
              className="w-full max-w-[700px] drop-shadow-2xl overflow-visible relative z-10"
              style={{ maxWidth: `${700 * cellSize}px` }}
            >
              {Array.from({ length: 25 }).map((_, idx) => {
                const r = Math.floor(idx / 5);
                const c = idx % 5;
                const baseW = 88, baseH = 99, baseGX = 5, baseGY = 3;
                const HW = baseW * cellSize, HH = baseH * cellSize;
                const gX = baseGX * cellSize, gY = baseGY * cellSize;
                const cS = HW + gX, rS = HH * 0.765 + gY;
                const vC = 4 - c; // RTL
                const x = (20 * cellSize) + vC * cS + (r % 2 === 0 ? 0 : cS / 2);
                const y = (20 * cellSize) + r * rS;
                return (
                  <g key={idx} transform={`translate(${x},${y})`}>
                    <Hexagon 
                      state={tiles[idx]} 
                      letter={letters[idx]} 
                      isSelected={selectedIdx === idx}
                      onClick={() => handleTileClick(idx)}
                      fontSize={fontSize}
                      cellSize={cellSize}
                    />
                  </g>
                );
              })}
            </svg>
          </motion.main>

          {/* Guest: Everything else on Right (Start in RTL) */}
          <div className="relative flex-shrink-0 z-20 order-1 lg:order-2 flex">
            {/* Resize Handle */}
            <div 
              onMouseDown={startResizing}
              className="hidden lg:block w-1.5 h-full cursor-col-resize bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/20 transition-colors"
            />
            <aside 
              className="h-full flex flex-col p-4 lg:p-6 gap-4 border-t-4 lg:border-t-0 lg:border-r-4 border-[#1A1A1A]/10 bg-[#F0F4E8] overflow-y-auto"
              style={{ width: sidebarWidth }}
            >
              <div className="flex items-center justify-between bg-white border-4 border-[#1A1A1A] rounded-xl p-2 shadow-[4px_4px_0_#1A1A1A]">
                <span className="text-xs font-black">حجم الخط</span>
                <div className="flex gap-2">
                  <button onClick={() => setFontSize(f => Math.max(0.5, f - 0.1))} className="w-8 h-8 bg-gray-100 border-2 border-[#1A1A1A] rounded-lg font-bold">-</button>
                  <button onClick={() => setFontSize(f => Math.min(2, f + 0.1))} className="w-8 h-8 bg-gray-100 border-2 border-[#1A1A1A] rounded-lg font-bold">+</button>
                </div>
              </div>

              <AnimatePresence>
                {selectedIdx !== -1 && !hideQuestionsFromGuest && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="bg-white border-4 border-[#1A1A1A] rounded-3xl p-4 lg:p-6 text-center shadow-[4px_4px_0_#1A1A1A]">
                      <h3 className="text-[clamp(2rem,8vw,4rem)] font-black text-[#1A1A1A] mb-1">{currentLetter}</h3>
                      <p className={`text-[clamp(0.6rem,2vw,0.8rem)] font-bold uppercase tracking-widest ${tiles[selectedIdx] === 'red' ? 'text-red-600' : tiles[selectedIdx] === 'green' ? 'text-green-600' : 'text-gray-400'}`}>
                        {tiles[selectedIdx] === 'red' ? 'فريق أحمر' : tiles[selectedIdx] === 'green' ? 'فريق أخضر' : 'محايدة'}
                      </p>
                    </div>
                      {currentQuestions.length > 0 && (
                        <motion.div 
                          key={qIdx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`bg-white border-4 border-[#1A1A1A] rounded-2xl p-4 lg:p-6 shadow-[4px_4px_0_#1A1A1A] min-h-[120px] max-h-[250px] overflow-y-auto flex items-center justify-center text-center font-bold leading-relaxed break-words whitespace-normal scrollbar-thin scrollbar-thumb-gray-300 ${
                            currentQ.q.length > 150 ? 'text-base lg:text-lg' : 'text-lg lg:text-xl'
                          }`}
                        >
                          {currentQ.q}
                        </motion.div>
                      )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-4 shadow-[4px_4px_0_#1A1A1A]">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[clamp(0.6rem,1.5vw,0.75rem)] font-bold text-[#1A1A1A]">TIMER</span>
                  <motion.span key={timeLeft} animate={timeLeft <= 5 ? { scale: [1, 1.2, 1], color: '#EF4444' } : {}} className="text-[clamp(0.8rem,2vw,1rem)] font-black text-[#1A1A1A]">{timeLeft}s</motion.span>
                </div>
                <div className="h-3 lg:h-4 bg-gray-200 border-2 border-[#1A1A1A] rounded-full overflow-hidden mb-4">
                  <motion.div className="h-full" initial={false} animate={{ width: `${(timeLeft / timerDuration) * 100}%`, backgroundColor: timeLeft > 15 ? '#22C55E' : timeLeft > 5 ? '#FBBF24' : '#EF4444' }} />
                </div>
              </motion.div>

              <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-3 shadow-[4px_4px_0_#1A1A1A] text-center">
                <p className="text-[clamp(0.5rem,1.2vw,0.65rem)] font-black text-gray-400 uppercase tracking-widest mb-1">Room Code</p>
                <p className="text-[clamp(1rem,3vw,1.5rem)] font-black tracking-widest">{roomCode}</p>
              </motion.div>

              <motion.button initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} onClick={() => { playSound(SOUNDS.CLICK); setScreen('lobby'); socket?.disconnect(); setSocket(io()); }} className="w-full bg-white text-[#1A1A1A] border-4 border-[#1A1A1A] rounded-2xl py-2 lg:py-3 font-bold shadow-[4px_4px_0_#1A1A1A] flex items-center justify-center gap-2 mt-auto hover:scale-105 active:scale-95 text-[clamp(0.7rem,1.8vw,0.9rem)]"><LogOut size={16} /> خروج</motion.button>
            </aside>
          </div>
        </>
      )}

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-8 border-[#1A1A1A] rounded-[40px] p-10 shadow-[12px_12px_0_#1A1A1A] max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-black">{authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
                <button onClick={() => setIsAuthOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={32} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex border-4 border-[#1A1A1A] rounded-2xl overflow-hidden mb-4">
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={`flex-1 py-3 font-black ${authMode === 'login' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'}`}
                  >
                    دخول
                  </button>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={`flex-1 py-3 font-black ${authMode === 'signup' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-[#1A1A1A]'}`}
                  >
                    تسجيل
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">Username</label>
                  <input 
                    type="text" 
                    placeholder="اسم المستخدم"
                    value={authForm.username}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full border-4 border-[#1A1A1A] rounded-2xl px-4 py-3 outline-none focus:bg-gray-50 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase">Password</label>
                  <input 
                    type="password" 
                    placeholder="كلمة المرور"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full border-4 border-[#1A1A1A] rounded-2xl px-4 py-3 outline-none focus:bg-gray-50 transition-colors"
                  />
                </div>

                <button 
                  onClick={handleAuth}
                  className="bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] rounded-2xl py-4 text-xl font-black shadow-[4px_4px_0_#555] mt-4 hover:scale-105 active:scale-95 transition-transform"
                >
                  {authMode === 'login' ? 'دخول 🔓' : 'إنشاء حساب ✨'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Summary Modal */}
      <AnimatePresence>
        {uploadSummary && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onViewportEnter={() => playSound(SOUNDS.UPLOAD)}
            className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-white border-8 border-[#1A1A1A] rounded-[40px] p-10 text-center shadow-[12px_12px_0_#1A1A1A] max-w-md w-full">
              <h2 className="text-3xl font-black mb-6">ملخص استخراج الأسئلة</h2>
              <div className="bg-gray-50 border-4 border-[#1A1A1A] rounded-2xl p-6 mb-8 text-right" dir="rtl">
                <p className="text-lg font-bold mb-2">تم استخراج <span className="text-green-600">{uploadSummary.count}</span> سؤال.</p>
                <p className="text-sm text-gray-500 mb-4">الحروف المتوفرة:</p>
                <div className="flex flex-wrap gap-2">
                  {uploadSummary.letters.map(l => (
                    <span key={l} className="bg-white border-2 border-[#1A1A1A] rounded-lg px-2 py-1 text-xs font-bold">{l}</span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setUploadSummary(null)}
                className="w-full bg-[#1A1A1A] text-white border-4 border-[#1A1A1A] rounded-2xl py-4 text-xl font-black shadow-[4px_4px_0_#555]"
              >
                حسناً، ابدأ اللعب
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Win Overlay */}
      <AnimatePresence>
        {winner && !gameWinner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <Confetti />
            <motion.div 
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white border-8 border-[#1A1A1A] rounded-[40px] p-12 text-center shadow-[12px_12px_0_#1A1A1A] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" />
              <div className="text-8xl mb-6">🏁</div>
              <h2 className={`text-5xl font-black mb-4 ${winner === 'red' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                الفريق {winner === 'red' ? 'الأحمر' : 'الأخضر'} فاز بالجولة!
              </h2>
              <div className="flex justify-center gap-8 mb-10">
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase">Red</p>
                  <p className="text-4xl font-black text-[#EF4444]">{scores.red}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs font-black text-gray-400 uppercase">Green</p>
                  <p className="text-4xl font-black text-[#22C55E]">{scores.green}</p>
                </div>
              </div>
              {isHost && (
                <button 
                  onClick={nextRound}
                  className={`w-full border-4 border-[#1A1A1A] rounded-2xl py-5 text-2xl font-black text-white shadow-[6px_6px_0_#1A1A1A] transition-transform hover:scale-105 active:scale-95 ${winner === 'red' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
                >
                  الجولة التالية ⏭️
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Win Overlay */}
      <AnimatePresence>
        {gameWinner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <Confetti />
            <motion.div 
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-8 border-[#1A1A1A] rounded-[40px] p-12 text-center shadow-[12px_12px_0_#1A1A1A] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 animate-pulse" />
              <div className="text-9xl mb-6">🏆</div>
              <h2 className={`text-6xl font-black mb-4 ${gameWinner === 'red' ? 'text-[#EF4444]' : 'text-[#22C55E]'}`}>
                الفريق {gameWinner === 'red' ? 'الأحمر' : 'الأخضر'} بطل اللعبة!
              </h2>
              <p className="text-gray-500 font-bold mb-10 text-xl">
                النتيجة النهائية: {scores.red} - {scores.green}
              </p>
              {isHost && (
                <button 
                  onClick={resetGame}
                  className={`w-full border-4 border-[#1A1A1A] rounded-2xl py-6 text-3xl font-black text-white shadow-[8px_8px_0_#1A1A1A] transition-transform hover:scale-105 active:scale-95 ${gameWinner === 'red' ? 'bg-[#EF4444]' : 'bg-[#22C55E]'}`}
                >
                  🎮 العودة للبداية
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Question Editor Modal */}
      <AnimatePresence>
        {isEditorOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white border-8 border-[#1A1A1A] rounded-[40px] p-6 lg:p-10 shadow-[12px_12px_0_#1A1A1A] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black">تعديل الأسئلة يدوياً</h2>
                  {user && (
                    <button 
                      onClick={async () => {
                        try {
                          await fetch('/api/banks/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, name: selectedBankName, data: questions })
                          });
                          alert("تم الحفظ في السحابة بنجاح! ✨");
                          playSound(SOUNDS.SUCCESS);
                        } catch (err) {
                          alert("فشل الحفظ في السحابة");
                        }
                      }}
                      className="bg-blue-500 text-white px-4 py-1 rounded-full text-xs font-black shadow-[2px_2px_0_#1A1A1A] hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      <FileUp size={14} /> حفظ في السحابة
                    </button>
                  )}
                </div>
                <button onClick={() => setIsEditorOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <LogOut size={32} />
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                {/* Letters List */}
                <div className="w-full lg:w-48 overflow-y-auto border-4 border-[#1A1A1A] rounded-2xl p-2 flex lg:flex-col gap-2 bg-gray-50">
                  {INITIAL_LETTERS.sort().map(l => (
                    <button 
                      key={l} 
                      onClick={() => setEditingLetter(l)}
                      className={`px-4 py-2 rounded-xl border-2 border-[#1A1A1A] font-black transition-all ${editingLetter === l ? 'bg-[#1A1A1A] text-white shadow-[2px_2px_0_#22C55E]' : 'bg-white text-[#1A1A1A] hover:bg-gray-100 shadow-[2px_2px_0_#1A1A1A]'}`}
                    >
                      {l} ({questions[l]?.length || 0})
                    </button>
                  ))}
                </div>

                {/* Questions List & Form */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                  {editingLetter ? (
                    <div className="flex flex-col gap-4 h-full">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="bg-gray-50 border-4 border-[#1A1A1A] rounded-2xl p-4 flex flex-col gap-3">
                          <h3 className="font-black text-lg flex items-center gap-2"><Plus size={18}/> إضافة سؤال واحد ({editingLetter})</h3>
                          <input 
                            type="text" 
                            placeholder="السؤال..." 
                            value={newQ}
                            onChange={(e) => setNewQ(e.target.value)}
                            className="border-2 border-[#1A1A1A] rounded-xl px-4 py-2 outline-none text-sm"
                          />
                          <input 
                            type="text" 
                            placeholder="الإجابة..." 
                            value={newA}
                            onChange={(e) => setNewA(e.target.value)}
                            className="border-2 border-[#1A1A1A] rounded-xl px-4 py-2 outline-none text-sm"
                          />
                          <button 
                            onClick={() => {
                              if (newQ && newA) {
                                const updated = { ...questions };
                                if (!updated[editingLetter]) updated[editingLetter] = [];
                                updated[editingLetter].push({ q: newQ, a: newA });
                                setQuestions(updated);
                                broadcastState({ questions: updated });
                                setNewQ(""); setNewA("");
                                playSound(SOUNDS.SUCCESS);
                              }
                            }}
                            className="bg-[#22C55E] text-white border-4 border-[#1A1A1A] rounded-xl py-2 font-black shadow-[2px_2px_0_#1A1A1A] hover:scale-105 active:scale-95 transition-transform text-sm"
                          >
                            إضافة ✅
                          </button>
                        </div>

                        <div className="bg-gray-50 border-4 border-[#1A1A1A] rounded-2xl p-4 flex flex-col gap-3">
                          <h3 className="font-black text-lg flex items-center gap-2"><FileUp size={18}/> لصق مجموعة أسئلة ({editingLetter})</h3>
                          <textarea 
                            placeholder="س: السؤال الأول؟&#10;ج: الجواب الأول&#10;س: السؤال الثاني؟&#10;ج: الجواب الثاني"
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            className="border-2 border-[#1A1A1A] rounded-xl px-4 py-2 outline-none text-xs h-24 resize-none"
                          />
                          <button 
                            onClick={handleBulkAdd}
                            className="bg-[#3B82F6] text-white border-4 border-[#1A1A1A] rounded-xl py-2 font-black shadow-[2px_2px_0_#1A1A1A] hover:scale-105 active:scale-95 transition-transform text-sm"
                          >
                            إضافة الكل 🚀
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2 border-t-4 border-[#1A1A1A]/10 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-black text-gray-400 uppercase text-xs tracking-widest">الأسئلة الحالية ({editingLetter})</h3>
                          {(questions[editingLetter] || []).length > 0 && (
                            <button 
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من حذف جميع أسئلة حرف (${editingLetter})؟`)) {
                                  const updated = { ...questions };
                                  updated[editingLetter] = [];
                                  setQuestions(updated);
                                  broadcastState({ questions: updated });
                                  playSound(SOUNDS.CLICK);
                                }
                              }}
                              className="text-xs font-black text-red-500 hover:underline"
                            >
                              حذف الكل 🗑️
                            </button>
                          )}
                        </div>
                        {(questions[editingLetter] || []).length === 0 && (
                          <div className="text-center py-10 text-gray-400 font-bold italic">لا توجد أسئلة لهذا الحرف بعد...</div>
                        )}
                        {(questions[editingLetter] || []).map((q, i) => (
                          <div key={i} className="bg-white border-4 border-[#1A1A1A] rounded-2xl p-4 shadow-[4px_4px_0_#1A1A1A] flex justify-between items-center gap-4 group">
                            <div className="flex-1">
                              <p className="font-bold text-sm text-gray-600">س: {q.q}</p>
                              <p className="font-black text-green-600">ج: {q.a}</p>
                            </div>
                            <button 
                              onClick={() => {
                                const updated = { ...questions };
                                updated[editingLetter].splice(i, 1);
                                setQuestions(updated);
                                broadcastState({ questions: updated });
                                playSound(SOUNDS.CLICK);
                              }}
                              className="text-red-500 hover:scale-110 transition-transform p-2"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 font-bold text-xl italic bg-gray-50 border-4 border-dashed border-[#1A1A1A]/10 rounded-3xl">
                      اختر حرفاً من القائمة للبدء بالتعديل...
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
