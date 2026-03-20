
export type HamoodiMood = 'neutral' | 'happy' | 'excited' | 'sleepy' | 'sad';

export interface HamoodiCustomization {
  clothing: 'none' | 'shirt' | 'suit' | 'jacket' | 'thobe' | 'superhero';
  accessory: 'none' | 'glasses' | 'mask' | 'medal';
  headwear: 'none' | 'hat' | 'ghutra' | 'crown';
  personality: 'friendly' | 'competitive' | 'kind';
}

export interface NarrativeChoice {
  text: string;
  nextId: string;
  mood?: HamoodiMood;
  bonus?: {
    type: 'points' | 'time' | 'streak';
    value: number;
  };
}

export interface NarrativeNode {
  id: string;
  text: string;
  choices: NarrativeChoice[];
}

export const NARRATIVE_STORY: Record<string, NarrativeNode> = {
  start: {
    id: 'start',
    text: 'أهلاً بك في مغامرة حروف مع حمودي! هل أنت مستعد للتحدي؟',
    choices: [
      { text: 'نعم، أنا مستعد تماماً!', nextId: 'ready', mood: 'excited' },
      { text: 'ربما، لنرى ما لديك.', nextId: 'hesitant', mood: 'neutral' }
    ]
  },
  ready: {
    id: 'ready',
    text: 'رائع! الحماس هو مفتاح الفوز. أي طريق تختار؟',
    choices: [
      { text: 'طريق المعرفة السريعة', nextId: 'fast_path', mood: 'happy' },
      { text: 'طريق التحدي الصعب', nextId: 'hard_path', mood: 'excited' }
    ]
  },
  hesitant: {
    id: 'hesitant',
    text: 'لا بأس، الثقة تأتي مع الإنجاز. هل نبدأ بأسئلة سهلة؟',
    choices: [
      { text: 'نعم، من فضلك.', nextId: 'easy_start', mood: 'happy' },
      { text: 'لا، أريد التحدي الحقيقي!', nextId: 'hard_path', mood: 'excited' }
    ]
  },
  fast_path: {
    id: 'fast_path',
    text: 'طريق السرعة! سأعطيك وقتاً إضافياً في البداية.',
    choices: [
      { text: 'شكراً حمودي!', nextId: 'game_start', bonus: { type: 'time', value: 10 } }
    ]
  },
  hard_path: {
    id: 'hard_path',
    text: 'التحدي الصعب! ستحصل على نقاط مضاعفة إذا أجبت بسرعة.',
    choices: [
      { text: 'هذا ما أريده!', nextId: 'game_start', bonus: { type: 'points', value: 50 } }
    ]
  },
  easy_start: {
    id: 'easy_start',
    text: 'بداية هادئة. سأبدأ معك بأبسط الحروف.',
    choices: [
      { text: 'هيا بنا!', nextId: 'game_start' }
    ]
  },
  game_start: {
    id: 'game_start',
    text: 'فلتبدأ المغامرة الآن! حظاً موفقاً.',
    choices: []
  }
};
