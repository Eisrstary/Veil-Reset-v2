/**
 * 《覆幕重启》AVG叙事系统 - 数据类型定义
 */

// 基础对话单元
export interface DialogueUnit {
  id: string;          // 唯一标识符，如 "block1_intro"
  speaker: string;     // 说话者（"主角"、"干员名"、"系统"等）
  content: string;     // 对话内容，支持HTML格式
  avatar?: string;     // 说话者头像资源路径
  bg?: string;         // 背景图资源路径
  cg?: string;         // CG图资源路径
  sfx?: string;        // 音效
  next?: string;       // 下一段对话ID
  choices?: DialogueChoice[];  // 选择支
}

// 对话选择支（三层反馈）
export interface DialogueChoice {
  id: string;          // 选择支ID
  text: string;        // 选择文本
  immediateEffect: {   // 即时反馈
    bondChange?: { [operatorId: string]: number };  // 羁绊变化
    pathScore?: { [path: string]: number };         // 路径分数变化
    dialogue?: string; // 触发额外对话
  };
  delayedEffect?: {     // 延迟反馈（3天/7天后）
    triggerDay: number; // 触发天数
    dialogueId: string; // 触发的对话ID
    condition?: string; // 触发条件
  };
  endingEffect?: {     // 终局反馈
    weight: number;    // 结局权重
    memory?: string;   // 触发记忆
  };
}

// 残响记忆
export interface EchoMemory {
  id: string;                  // 如 "echo_01"
  title: string;               // 残响标题
  content: string;            // 残响内容（支持HTML格式）
  type: 'main' | 'side';      // 主线/支线
  visualEffects?: {           // 视觉效果
    blur?: number;            // 模糊度 (0-1)
    saturation?: number;      // 饱和度 (0-1)
    colorShift?: string;      // 颜色偏移 (CSS颜色值)
    textStyle?: string;       // 文本样式
  };
  audio?: string;             // 背景音频
  unlockCondition?: string;   // 解锁条件
  cgUnlock?: string;          // 解锁的CG
  gameplayEffect?: {          // 游戏效果
    foodProduction?: number;  // 食物产量加成
    energyDrain?: number;     // 静默区识能流失减免
  };
}

// 剧情区块
export interface StoryBlock {
  id: string;                // 如 "block_1"
  name: string;              // 区块名称
  day: number;               // 触发天数
  type: 'combat' | 'explore' | 'story' | 'boss';
  prerequisites: string[];   // 前置条件
  dialogues: string[];       // 对话ID列表
  echoes: string[];          // 残响ID列表
  cgs: string[];             // CG ID列表
  choices: string[];         // 关键选择ID列表
  unlockBlocks: string[];    // 解锁的区块
  cleared: boolean;          // 是否完成
}

// 游戏进度
export interface GameProgress {
  // 基础信息
  currentDay: number;        // 当前天数（1-60）
  currentYear: number;       // 当前年份（873-880）
  
  // 路径分数（决定结局）
  pathScore: {
    submission: number;      // 顺服路径
    resistance: number;      // 抵抗路径
    transcendence: number;   // 超越路径
  };
  
  // 羁绊系统
  bonds: { [operatorId: string]: number };  // 干员羁绊值（1-4级）
  
  // 收集系统
  unlockedBlocks: string[];  // 已解锁区块
  clearedBlocks: string[];   // 已完成区块
  collectedEchoes: string[]; // 已收集残响
  collectedCGs: string[];    // 已收集CG
  
  // 记忆拼合
  memoryFragments: string[]; // 记忆碎片
  completedMemories: string[]; // 已拼合的记忆
  
  // 选择记录
  choiceHistory: {           // 选择历史记录
    [dialogueId: string]: string;  // 对话ID -> 选择的选项ID
  };
}

// 视觉效果参数
export interface VisualEffects {
  blur?: number;
  saturation?: number;
  colorShift?: string;
  textStyle?: string;
}

// 即时反馈效果
export interface ImmediateEffect {
  bondChange?: { [operatorId: string]: number };
  pathScore?: { [path: string]: number };
  dialogue?: string;
}

// 延迟反馈效果
export interface DelayedEffect {
  triggerDay: number;
  dialogueId: string;
  condition?: string;
}

// 结局权重
export interface EndingWeights {
  submission: number;
  resistance: number;
  transcendence: number;
}

// 干员数据
export interface OperatorData {
  id: string;
  name: string;
  personality: {
    C026?: number; // 意义寻求
    A008?: number; // 威胁放大
    B021?: number; // 情绪传染
    B015?: number; // 内疚
    E051?: number; // 使命感
    F061?: number; // 自主性
  };
}