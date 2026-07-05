# 《覆幕重启》AVG叙事系统技术设计文档 V1

## 概述

基于《覆幕重启》剧情主线与支线完整版文档，设计完整的AVG（视觉小说）叙事系统。系统需要支持：
1. **对话系统**：三层反馈机制（即时/延迟/终局）
2. **分支选择**：影响角色羁绊和剧情路径
3. **残响记忆**：特殊记忆碎片展示系统
4. **剧情推进**：区块解锁和时间线管理
5. **结局判定**：基于七年行为累积的多结局系统

## 系统架构

### 1. 数据层 (Data Layer)

#### 1.1 对话数据结构
```typescript
// 基础对话单元
interface DialogueUnit {
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
interface DialogueChoice {
  id: string;          // 选择支ID
  text: string;        // 选择文本
  immediateEffect: {   // 即时反馈
    bondChange?: { [operatorId: string]: number };  // 羁绊变化
    pathScore?: { [path: string]: number };         // 路径分数变化
    dialogue?: string; // 触发额外对话
  };
  delayedEffect: {     // 延迟反馈（3天/7天后）
    triggerDay: number; // 触发天数
    dialogueId: string; // 触发的对话ID
    condition?: string; // 触发条件
  };
  endingEffect?: {     // 终局反馈
    weight: number;    // 结局权重
    memory?: string;   // 触发记忆
  };
}
```

#### 1.2 残响数据结构
```typescript
interface EchoMemory {
  id: string;                  // 如 "echo_01"
  title: string;               // 残响标题
  content: string;            // 残响内容（支持HTML格式）
  type: 'main' | 'side';      // 主线/支线
  visualEffects: {            // 视觉效果
    blur?: number;            // 模糊度
    saturation?: number;      // 饱和度
    colorShift?: string;      // 颜色偏移
    textStyle?: string;       // 文本样式
  };
  audio?: string;             // 背景音频
  unlockCondition: string;    // 解锁条件
  cgUnlock?: string;          // 解锁的CG
  gameplayEffect?: {          // 游戏效果
    foodProduction?: number;  // 食物产量加成
    energyDrain?: number;     // 静默区识能流失减免
  };
}
```

#### 1.3 剧情区块结构
```typescript
interface StoryBlock {
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
```

#### 1.4 游戏进度结构
```typescript
interface GameProgress {
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
```

### 2. 核心系统 (Core Systems)

#### 2.1 对话系统 (DialogueSystem)
```typescript
class DialogueSystem {
  // 对话管理
  private currentDialogue: DialogueUnit | null;
  private dialogueQueue: DialogueUnit[];
  private history: DialogueUnit[];
  
  // 显示对话
  showDialogue(dialogueId: string): void;
  
  // 显示选择支
  showChoices(choices: DialogueChoice[]): Promise<string>;
  
  // 处理选择
  processChoice(choice: DialogueChoice): void;
  
  // 保存对话历史
  saveHistory(): void;
}
```

#### 2.2 残响系统 (EchoSystem)
```typescript
class EchoSystem {
  // 显示残响
  showEcho(echoId: string): void;
  
  // 应用残响效果
  applyEchoEffects(echo: EchoMemory): void;
  
  // 检查残响解锁条件
  checkEchoUnlock(echoId: string): boolean;
  
  // 残响视觉特效
  applyVisualEffects(effects: VisualEffects): void;
}
```

#### 2.3 剧情推进系统 (StoryProgression)
```typescript
class StoryProgression {
  // 检查事件触发
  checkDayEvents(day: number): StoryBlock[];
  
  // 区块解锁
  unlockBlock(blockId: string): void;
  
  // 区块完成
  completeBlock(blockId: string): void;
  
  // 检查结局条件
  checkEndingConditions(): string[]; // 返回可能的结局ID
}
```

#### 2.4 选择反馈系统 (ChoiceFeedback)
```typescript
class ChoiceFeedback {
  // 处理即时反馈
  applyImmediateEffects(effects: ImmediateEffect): void;
  
  // 设置延迟反馈
  scheduleDelayedFeedback(effect: DelayedEffect): void;
  
  // 检查延迟反馈触发
  checkDelayedFeedbacks(day: number): void;
  
  // 计算结局权重
  calculateEndingWeights(): EndingWeights;
}
```

### 3. UI系统 (UI System)

#### 3.1 对话界面组件
```typescript
class DialogueUI {
  // 对话显示区域
  private textDisplay: Phaser.GameObjects.Text;
  private avatarDisplay: Phaser.GameObjects.Image;
  private bgDisplay: Phaser.GameObjects.Image;
  private nameDisplay: Phaser.GameObjects.Text;
  
  // 选择支显示
  private choiceContainer: Phaser.GameObjects.Container;
  
  // 渐入渐出效果
  fadeIn(): Promise<void>;
  fadeOut(): Promise<void>;
  
  // 打字机效果
  typewriterEffect(text: string): Promise<void>;
}
```

#### 3.2 残响界面组件
```typescript
class EchoUI {
  // 残响展示
  private echoContainer: Phaser.GameObjects.Container;
  private echoText: Phaser.GameObjects.Text;
  private effectsLayer: Phaser.GameObjects.Layer;
  
  // 视觉特效
  applyBlur(amount: number): void;
  applySaturation(amount: number): void;
  applyColorShift(color: string): void;
  
  // 残响渐入
  fadeInEcho(): Promise<void>;
}
```

#### 3.3 记忆拼合界面
```typescript
class MemoryPuzzleUI {
  // 记忆碎片显示
  private fragmentGrid: Phaser.GameObjects.Container;
  private completedMemories: Phaser.GameObjects.Container;
  
  // 拖拽拼合
  enableDragAndDrop(): void;
  
  // 拼合检查
  checkPuzzleComplete(): boolean;
}
```

### 4. 场景管理 (Scene Management)

#### 4.1 AVG场景基类
```typescript
class AVGScene extends Phaser.Scene {
  // 系统引用
  protected dialogueSystem: DialogueSystem;
  protected echoSystem: EchoSystem;
  protected storySystem: StoryProgression;
  
  // 状态管理
  protected currentState: 'dialogue' | 'choices' | 'echo' | 'memory';
  
  // 场景生命周期
  preload(): void;
  create(): void;
  update(): void;
  
  // 状态切换
  switchToDialogue(dialogueId: string): void;
  switchToChoices(choices: DialogueChoice[]): void;
  switchToEcho(echoId: string): void;
}
```

#### 4.2 区块场景实现
```typescript
// 区块1：灰烬哨站废墟
class Block1Scene extends AVGScene {
  create(): void {
    super.create();
    
    // 加载区块资源
    this.loadBackground('block1_bg');
    this.loadAvatar('operator_initial');
    
    // 开始区块剧情
    this.startBlockDialogue('block1_intro');
  }
  
  // 特殊战斗集成
  startCombat(): void {
    // 切换到战斗模式
  }
}
```

### 5. 数据存储与管理

#### 5.1 JSON数据格式
```
data/
├── dialogues/
│   ├── block1.json      # 区块1对话
│   ├── block2.json      # 区块2对话
│   └── block3.json      # 区块3对话
├── echoes/
│   ├── echo_01.json     # 残响1
│   ├── echo_02.json     # 残响2
│   └── echo_03.json     # 残响3
├── blocks/
│   ├── block_1.json     # 区块1配置
│   ├── block_2.json     # 区块2配置
│   └── block_3.json     # 区块3配置
└── operators/
    ├── operator_01.json # 干员1数据
    ├── operator_02.json # 干员2数据
    └── operator_03.json # 干员3数据
```

#### 5.2 进度保存
```typescript
class SaveSystem {
  // 自动保存
  autoSave(): void;
  
  // 手动保存
  manualSave(slot: number): void;
  
  // 加载存档
  loadSave(slot: number): GameProgress | null;
  
  // 种子码生成
  generateSeedCode(progress: GameProgress): string;
  
  // 种子码解析
  parseSeedCode(seed: string): GameProgress | null;
}
```

### 6. 集成要点

#### 6.1 与PAPS人格系统集成
```typescript
// 根据干员人格调整对话
function adjustDialogueByPersonality(
  dialogue: DialogueUnit, 
  operator: OperatorData
): DialogueUnit {
  const adjusted = { ...dialogue };
  
  // 根据人格参数调整内容
  if (operator.personality.C026 > 70) { // 高意义寻求
    adjusted.content += " (若有所思地看着你)";
  }
  if (operator.personality.B021 > 70) { // 高情绪传染
    adjusted.content += " 他的声音里有一种不安的情绪。";
  }
  
  return adjusted;
}
```

#### 6.2 与战斗系统集成
```typescript
// 战斗后的AVG切换
function onCombatComplete(victory: boolean): void {
  if (victory) {
    // 显示胜利后对话
    dialogueSystem.showDialogue('post_combat_victory');
    
    // 解锁残响
    if (checkEchoUnlock('echo_combat')) {
      echoSystem.showEcho('echo_combat');
    }
  } else {
    // 显示失败后对话
    dialogueSystem.showDialogue('post_combat_defeat');
  }
}
```

#### 6.3 与沙盒系统集成
```typescript
// 日常对话触发
function triggerDailyDialogue(): void {
  const day = progress.currentDay;
  
  // 检查是否有当日特殊事件
  const events = storyProgression.checkDayEvents(day);
  
  // 如果没有特殊事件，触发日常对话
  if (events.length === 0) {
    const dailyDialogue = getRandomDailyDialogue();
    dialogueSystem.showDialogue(dailyDialogue);
  }
}
```

### 7. 实现优先级

#### Phase 1: 基础对话系统 (优先级高)
1. 对话UI组件实现
2. 基础对话数据结构
3. 简单的选择支系统
4. 对话历史记录

#### Phase 2: 残响记忆系统 (优先级中)
1. 残响UI组件
2. 视觉特效系统
3. 残响解锁逻辑
4. 记忆拼合界面

#### Phase 3: 剧情推进系统 (优先级中)
1. 区块管理系统
2. 时间线推进
3. 条件触发系统
4. 进度保存/加载

#### Phase 4: 高级功能 (优先级低)
1. 三层反馈系统（延迟/终局）
2. 与PAPS人格深度集成
3. 种子码系统
4. 多语言支持

### 8. 技术挑战

#### 8.1 性能优化
- **文本渲染**: 使用浏览器原生字体渲染，避免Phaser文本性能问题
- **资源管理**: 对话场景的预加载和懒加载
- **内存管理**: 清理未使用的对话和残响资源

#### 8.2 数据管理
- **JSON加载**: 使用Vite的静态资源加载
- **缓存策略**: 对话和残响数据的缓存
- **版本控制**: 数据格式的向后兼容

#### 8.3 用户体验
- **响应式设计**: 适配不同屏幕尺寸
- **可访问性**: 支持键盘控制和屏幕阅读器
- **本地化**: 支持多语言文本

### 9. 测试要点

#### 9.1 功能测试
- 对话显示正确性
- 选择支功能完整性
- 残响触发逻辑
- 剧情推进正确性

#### 9.2 集成测试
- 与战斗系统集成
- 与沙盒系统集成
- 与PAPS人格系统集成
- 进度保存/加载

#### 9.3 性能测试
- 对话加载速度
- 内存使用情况
- 长时间游戏稳定性

---

## 下一步行动

1. **创建对话系统原型**: 实现基础的对话显示和选择功能
2. **设计对话编辑器**: 方便剧情设计者创建和编辑对话
3. **集成到现有项目**: 将AVG系统集成到Phaser项目中
4. **创建示例剧情**: 实现区块1（灰烬哨站废墟）的完整对话

---

**文档状态**: 草案 V1.0  
**更新日期**: 2026-07-05  
**作者**: narrative-designer  
**审核**: 待core-engineer和gameplay-designer审核