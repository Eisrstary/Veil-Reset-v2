# 《覆幕重启》UI组件系统设计文档

## 设计原则

1. **一致性**：所有UI元素遵循统一的视觉语言
2. **沉浸感**：UI与游戏世界观融合，不突兀
3. **可读性**：文字清晰易读，关键信息突出
4. **响应性**：支持鼠标/键盘/触控多种交互
5. **动画性**：适当使用动画增强体验

## 色彩系统

### 主色板
```typescript
const COLORS = {
  // 深色调 - 背景和容器
  DEEP_BLUE: 0x060612,    // #060612
  MIDNIGHT: 0x0e1028,     // #0e1028
  VEIL_PURPLE: 0x1c2448,  // #1c2448
  
  // 中间调 - 边框和装饰
  ENERGY_BLUE: 0x4470b8,  // #4470b8
  GLOW_BLUE: 0x6090d0,    // #6090d0
  
  // 高亮调 - 文字和强调
  BRIGHT_BLUE: 0x80b0f0,  // #80b0f0
  GOLD_ACCENT: 0xf4d88a,  // #f4d88a
  WARM_WHITE: 0xf6f9ff,   // #f6f9ff
  
  // 功能色
  SUCCESS: 0x8fd0ff,      // 成功/完成
  WARNING: 0xf4d88a,      // 警告
  DANGER: 0xff8a8a,       // 危险
  INFO: 0x95b9ff,         // 信息
};
```

### 透明度设置
```typescript
const ALPHA = {
  SOLID: 1.0,        // 实体
  PRIMARY: 0.95,     // 主容器
  SECONDARY: 0.85,   // 次容器
  TERTIARY: 0.7,     // 装饰
  TRANSLUCENT: 0.4,  // 半透明
  GHOST: 0.2,        // 幽灵效果
};
```

## 字体系统

### 字体设置
```typescript
const FONTS = {
  // 中文优先字体栈
  CHINESE: 'Microsoft YaHei, SimHei, sans-serif',
  
  // 字号系统
  SIZES: {
    TITLE: 86,      // 主标题
    HEADLINE: 64,   // 场景标题
    SUBHEAD: 32,    // 副标题
    BODY_LARGE: 26, // 大正文
    BODY: 22,       // 正文
    CAPTION: 18,    // 说明文字
    SMALL: 16,      // 小字
    TINY: 14,       // 极小字
  },
  
  // 字重
  WEIGHTS: {
    REGULAR: 'normal',
    BOLD: 'bold',
    LIGHT: 'lighter',
  },
};
```

## 基础组件

### 1. 按钮组件 (Button)
```typescript
interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: number;
  color?: number;
  alpha?: number;
  onClick: () => void;
  enabled?: boolean;
}
```

### 2. 卡片组件 (Card)
```typescript
interface CardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content?: string;
  rounded?: number;
  selectable?: boolean;
  selected?: boolean;
}
```

### 3. 面板组件 (Panel)
```typescript
interface PanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  headerHeight?: number;
  scrollable?: boolean;
}
```

### 4. 进度条组件 (ProgressBar)
```typescript
interface ProgressBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;      // 0-1
  maxValue: number;
  showText?: boolean;
  color?: number;
  glow?: boolean;
}
```

### 5. 列表组件 (List)
```typescript
interface ListConfig {
  x: number;
  y: number;
  width: number;
  itemHeight: number;
  items: ListItem[];
  scrollable?: boolean;
}

interface ListItem {
  id: string;
  label: string;
  icon?: string;
  selected?: boolean;
  disabled?: boolean;
}
```

## 高级组件

### 1. 干员管理界面 (OperatorPanel)
```typescript
interface OperatorPanelConfig {
  x: number;
  y: number;
  operator: PAPSProfile;
  showStats?: boolean;
  showSkills?: boolean;
  editable?: boolean;
}

interface PAPSProfile {
  name: string;
  personality: string;  // AI生成的人格描述
  trust: number;       // 0-100
  skills: Skill[];
  portrait?: string;
}
```

### 2. 对话UI系统 (DialogueUI)
```typescript
interface DialogueUIConfig {
  speaker: string;
  text: string;
  portrait?: string;
  choices?: DialogueChoice[];
  autoAdvance?: boolean;
  typingSpeed?: number;
}

interface DialogueChoice {
  text: string;
  effect?: string;     // 剧情分支标记
  condition?: () => boolean;
}
```

### 3. 资源面板 (ResourcePanel)
```typescript
interface ResourcePanelConfig {
  x: number;
  y: number;
  resources: Resource[];
  compact?: boolean;
}

interface Resource {
  type: 'food' | 'energy' | 'materials' | 'echo' | 'memory';
  current: number;
  max: number;
  rate?: number;      // 每小时产量
}
```

### 4. 设置界面 (SettingsPanel)
```typescript
interface SettingsPanelConfig {
  x: number;
  y: number;
  categories: SettingsCategory[];
}

interface SettingsCategory {
  name: string;
  icon: string;
  settings: SettingItem[];
}

interface SettingItem {
  type: 'slider' | 'toggle' | 'dropdown' | 'button';
  label: string;
  key: string;
  value: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}
```

### 5. 识网深潜可视化 (NetworkDiveVisualization)
```typescript
interface NetworkDiveConfig {
  depth: number;      // 1-10层
  echoes: Echo[];
  landmarks: Landmark[];
  playerPosition: { x: number; y: number };
}

interface Echo {
  id: string;
  name: string;
  type: 'memory' | 'knowledge' | 'artifact';
  strength: number;   // 0-1
  position: { x: number; y: number };
}
```

## 动画系统

### 通用动画
```typescript
const ANIMATIONS = {
  // 进入动画
  FADE_IN: { alpha: 0, duration: 500, ease: 'Power2' },
  SLIDE_IN_UP: { y: '+50', alpha: 0, duration: 400, ease: 'Back' },
  SLIDE_IN_DOWN: { y: '-50', alpha: 0, duration: 400, ease: 'Back' },
  
  // 强调动画
  PULSE: { scale: 1.05, duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
  BREATHE: { alpha: 0.7, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
  
  // 交互反馈
  BUTTON_PRESS: { scale: 0.95, duration: 100, yoyo: true },
  HOVER_GLOW: { scale: 1.02, duration: 200 },
  
  // 退出动画
  FADE_OUT: { alpha: 0, duration: 300, ease: 'Power2' },
  SLIDE_OUT_UP: { y: '-50', alpha: 0, duration: 300, ease: 'Power2' },
};
```

## 响应式设计

### 屏幕适配
```typescript
const SCREEN = {
  BASE_WIDTH: 1920,
  BASE_HEIGHT: 1080,
  
  // 响应式断点
  BREAKPOINTS: {
    SMALL: 1280,
    MEDIUM: 1600,
    LARGE: 1920,
  },
  
  // 缩放策略
  SCALE_MODE: {
    FIT: Scale.FIT,
    ENVELOP: Scale.ENVELOP,
    NONE: Scale.NONE,
  },
};
```

### 响应式布局工具
```typescript
class ResponsiveLayout {
  static scaleX(x: number): number {
    return x * (game.scale.width / SCREEN.BASE_WIDTH);
  }
  
  static scaleY(y: number): number {
    return y * (game.scale.height / SCREEN.BASE_HEIGHT);
  }
  
  static scaleFont(size: number): number {
    const scale = Math.min(
      game.scale.width / SCREEN.BASE_WIDTH,
      game.scale.height / SCREEN.BASE_HEIGHT
    );
    return Math.round(size * scale);
  }
}
```

## 实现计划

### 阶段1：基础组件库 (1-2天)
1. 创建UI工厂类 (UIFactory.ts)
2. 实现基础组件：Button, Card, Panel
3. 实现进度条和列表组件
4. 创建样式常量文件

### 阶段2：高级界面 (2-3天)
1. 干员管理界面 (集成PAPS WASM)
2. 对话UI系统 (AVG叙事)
3. 资源面板和HUD
4. 设置界面

### 阶段3：特殊界面 (2-3天)
1. 识网深潜可视化
2. 记忆拼合界面
3. 结局路径选择界面
4. 种子生成界面

### 阶段4：优化和整合 (1-2天)
1. 动画优化
2. 性能调优
3. 响应式适配
4. 文档完善

## 技术实现要点

1. **组件化架构**：每个UI组件独立，可复用
2. **事件系统**：统一的事件处理机制
3. **状态管理**：UI状态与游戏状态分离
4. **资源管理**：预加载UI资源，避免运行时卡顿
5. **性能优化**：对象池、脏检查、批量渲染

## 测试计划

1. **视觉测试**：颜色、字体、对齐、间距
2. **交互测试**：点击、悬停、键盘导航、触控
3. **性能测试**：帧率、内存使用、加载时间
4. **兼容性测试**：不同分辨率、不同设备
5. **无障碍测试**：颜色对比度、键盘导航、屏幕阅读器

---

*文档版本：1.0*
*更新日期：2026-07-05*
*作者：UI/UX设计团队*