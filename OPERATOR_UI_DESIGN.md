# 干员管理界面设计文档

## 概述

干员管理界面是《覆幕重启》游戏的核心UI之一，负责展示和管理玩家的干员队伍。每个干员都由PAPS WASM AI人格系统生成，具有独特的性格特征和行为模式。

## 功能需求

### 1. 干员列表视图
- 显示所有干员
- 按状态分组（可用/部署中/休息）
- 快速筛选和排序

### 2. 干员详情视图
- 干员基本信息（名称、职业、等级）
- PAPS人格参数可视化
- 技能和能力展示
- 信任度和羁绊值
- 当前状态和位置

### 3. 干员管理功能
- 部署干员到探索队伍
- 撤回干员到基地
- 升级和训练干员
- 装备管理
- 状态恢复（休息/治疗）

### 4. 队伍编成
- 创建和编辑探索队伍
- 队伍能力加成计算
- 队伍组合建议（基于人格兼容性）

### 5. 人格系统集成
- 实时生成PAPS人格
- 人格参数可视化
- 人格兼容性分析
- 对话行为预览

## 界面布局设计

### 主界面结构
```
┌─────────────────────────────────────────────────────────────────┐
│ 顶部导航栏                                                      │
│ [返回] [干员管理] [筛选: 全部/可用/部署] [排序: 等级/信任/姓名] │
├─────────────┬───────────────────────────────────────────────────┤
│             │                                                   │
│  干员列表   │                    干员详情                       │
│             │                                                   │
│  - 干员卡片 │  ┌─────────────────────────────────────────────┐  │
│  - 干员卡片 │  │ 头像 + 基本信息                              │  │
│  - 干员卡片 │  ├─────────────────────────────────────────────┤  │
│  - ...      │  │ PAPS人格雷达图                               │  │
│             │  ├─────────────────────────────────────────────┤  │
│             │  │ 技能列表                                    │  │
│             │  ├─────────────────────────────────────────────┤  │
│             │  │ 状态和位置                                  │  │
│             │  └─────────────────────────────────────────────┘  │
│             │                                                   │
│             │  [部署] [撤回] [训练] [装备]                    │  │
├─────────────┴───────────────────────────────────────────────────┤
│ 底部状态栏：当前队伍组成 / 可用干员数 / 总战力                 │
└─────────────────────────────────────────────────────────────────┘
```

## 数据模型

### 干员数据结构
```typescript
interface Operator {
  id: string;
  name: string;
  portrait?: string;        // 头像资源路径
  class: 'combat' | 'support' | 'scout' | 'specialist';
  level: number;
  experience: number;
  
  // PAPS人格数据
  papsProfile: PAPSProfile;
  
  // 游戏状态
  trust: number;           // 0-100，信任度
  bond: number;            // 0-100，羁绊值
  status: 'available' | 'deployed' | 'resting' | 'injured';
  location?: string;       // 当前位置（区块ID）
  
  // 属性和技能
  attributes: {
    combat: number;        // 战斗能力
    scouting: number;      // 侦察能力
    support: number;       // 支援能力
    intelligence: number;  // 智力
    endurance: number;     // 耐力
  };
  
  skills: Skill[];
  equipment: Equipment[];
  
  // 对话记录
  dialogueHistory: DialogueEntry[];
  
  // 生成信息
  seed: string;            // 生成种子
  createdAt: string;       // 创建时间
}

interface PAPSProfile {
  // 原始JSON数据
  rawJson: string;
  
  // 提取的关键参数
  keyTraits: {
    trustDefault: number;      // 初始信任度
    threatAwareness: number;   // 威胁感知
    empathy: number;           // 共情能力
    guilt: number;            // 内疚倾向
    aggression: number;       // 攻击性
    openness: number;         // 开放性
  };
  
  // AI行为指令
  aiInstructions: string;
  
  // 人类可读描述
  humanDescription: string;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  type: 'active' | 'passive' | 'ultimate';
  cooldown?: number;        // 冷却时间（回合）
  effect: string;          // 效果描述
  level: number;           // 技能等级
}

interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'tool' | 'consumable';
  stats: Record<string, number>; // 属性加成
  description: string;
}
```

## 视觉设计

### 色彩方案
- **干员卡片背景**：深蓝渐变 (#0e1028 → #1c2448)
- **选中状态**：紫色边框 (#1c2448)，金色高亮 (#f4d88a)
- **状态指示器**：
  - 可用：绿色 (#8fd0ff)
  - 部署中：蓝色 (#80b0f0)
  - 休息中：灰色 (#6b8db8)
  - 受伤：橙色 (#ff8a8a)

### 组件设计

#### 1. 干员卡片
```typescript
interface OperatorCardConfig {
  operator: Operator;
  width: number;        // 建议：300px
  height: number;       // 建议：120px
  showStatus?: boolean; // 显示状态指示器
  showLevel?: boolean;  // 显示等级
  onClick?: (operator: Operator) => void;
}
```

#### 2. PAPS人格雷达图
```typescript
interface PersonalityRadarConfig {
  traits: {
    trust: number;      // 信任度 0-100
    empathy: number;    // 共情 0-100
    awareness: number;  // 感知 0-100
    aggression: number; // 攻击性 0-100
    openness: number;   // 开放性 0-100
  };
  size: number;         // 图表大小
  showLabels?: boolean; // 显示标签
  animate?: boolean;    // 动画显示
}
```

#### 3. 技能列表
```typescript
interface SkillListConfig {
  skills: Skill[];
  columns?: number;     // 列数
  compact?: boolean;    // 紧凑模式
  onSkillClick?: (skill: Skill) => void;
}
```

#### 4. 状态指示器
```typescript
interface StatusIndicatorConfig {
  status: Operator['status'];
  showText?: boolean;   // 显示文字标签
  pulse?: boolean;      // 呼吸动画
}
```

## 交互流程

### 1. 干员选择流程
```
用户点击干员卡片
    ↓
显示干员详情面板
    ↓
用户选择操作（部署/撤回/训练等）
    ↓
执行操作并更新UI状态
    ↓
显示操作反馈（成功/失败）
```

### 2. 队伍编成流程
```
用户进入队伍编成模式
    ↓
从可用干员列表拖拽到队伍槽位
    ↓
实时计算队伍能力加成
    ↓
显示队伍兼容性评分
    ↓
用户确认编成或继续调整
```

### 3. 人格生成流程
```
用户点击"生成新干员"
    ↓
调用PAPS WASM生成人格数据
    ↓
解析人格数据并创建干员
    ↓
显示生成结果和人格分析
    ↓
用户命名并确认创建
```

## 技术实现

### 1. 组件架构
```typescript
// 主界面组件
class OperatorManagementScene extends Scene {
  private operatorList: OperatorListComponent;
  private operatorDetail: OperatorDetailComponent;
  private teamBuilder: TeamBuilderComponent;
  private papsGenerator: PAPSGeneratorComponent;
  
  create(): void {
    // 初始化组件
    this.operatorList = new OperatorListComponent(this);
    this.operatorDetail = new OperatorDetailComponent(this);
    this.teamBuilder = new TeamBuilderComponent(this);
    this.papsGenerator = new PAPSGeneratorComponent(this);
    
    // 加载干员数据
    this.loadOperators();
    
    // 设置事件监听
    this.setupEventListeners();
  }
}
```

### 2. 数据管理
```typescript
class OperatorManager {
  private operators: Map<string, Operator> = new Map();
  private currentTeam: string[] = []; // 干员ID数组
  
  // 从存储加载干员
  async loadOperators(): Promise<void> {
    const saved = localStorage.getItem('veil-operators');
    if (saved) {
      this.operators = new Map(JSON.parse(saved));
    }
  }
  
  // 保存干员数据
  async saveOperators(): Promise<void> {
    const data = JSON.stringify([...this.operators.entries()]);
    localStorage.setItem('veil-operators', data);
  }
  
  // 生成新干员
  async generateOperator(seed?: string): Promise<Operator> {
    // 调用PAPS WASM生成人格
    const papsProfile = await this.generatePAPSProfile(seed);
    
    // 创建干员对象
    const operator: Operator = {
      id: this.generateId(),
      name: `干员-${this.operators.size + 1}`,
      class: this.randomClass(),
      level: 1,
      experience: 0,
      papsProfile,
      trust: papsProfile.keyTraits.trustDefault,
      bond: 0,
      status: 'available',
      attributes: this.calcAttributes(papsProfile),
      skills: this.generateSkills(papsProfile),
      equipment: [],
      dialogueHistory: [],
      seed: seed || this.generateSeed(),
      createdAt: new Date().toISOString(),
    };
    
    // 添加到管理器
    this.operators.set(operator.id, operator);
    await this.saveOperators();
    
    return operator;
  }
}
```

### 3. PAPS集成
```typescript
class PAPSIntegration {
  private wasmModule: any;
  
  // 初始化WASM
  async init(): Promise<void> {
    // 加载WASM模块
    this.wasmModule = await import('../../personality_generator.js');
    await this.wasmModule.default();
  }
  
  // 生成人格配置文件
  async generateProfile(seed?: string): Promise<PAPSProfile> {
    const wasm = new this.wasmModule.PapsWasm();
    
    if (seed) {
      // 使用种子生成（确定性）
      wasm.init_with_seed(seed);
    } else {
      // 随机生成
      wasm.init_random();
    }
    
    // 导出数据
    const rawJson = wasm.export_raw_json();
    const aiInstructions = wasm.export_ai_md();
    const humanDescription = wasm.export_human_md();
    
    wasm.free();
    
    // 解析关键参数
    const data = JSON.parse(rawJson);
    const keyTraits = this.extractKeyTraits(data);
    
    return {
      rawJson,
      keyTraits,
      aiInstructions,
      humanDescription,
    };
  }
  
  // 提取关键参数
  private extractKeyTraits(data: any): PAPSProfile['keyTraits'] {
    return {
      trustDefault: data.parameters?.A001?.value || 0.5,
      threatAwareness: data.parameters?.A008?.value || 0.5,
      empathy: data.parameters?.A009?.value || 0.5,
      guilt: data.parameters?.B015?.value || 0.5,
      aggression: data.parameters?.D040?.value || 0.5,
      openness: data.parameters?.C031?.value || 0.5,
    };
  }
}
```

## 动画和效果

### 1. 干员卡片动画
- **悬停效果**：轻微上浮 + 边框发光
- **选中效果**：金色脉冲边框
- **状态变化**：颜色渐变过渡

### 2. 人格雷达图动画
- **数据加载**：从中心向外辐射动画
- **参数变化**：平滑过渡动画

### 3. 生成过程动画
- **WASM加载**：加载指示器
- **人格生成**：粒子汇聚效果
- **干员创建**：淡入+缩放动画

## 响应式设计

### 屏幕适配
```typescript
const LAYOUT = {
  // 桌面端（1920x1080）
  DESKTOP: {
    cardWidth: 300,
    cardHeight: 120,
    columns: 4,
    detailWidth: 800,
  },
  
  // 平板端（1280x720）
  TABLET: {
    cardWidth: 250,
    cardHeight: 100,
    columns: 3,
    detailWidth: 600,
  },
  
  // 移动端（720x1280）
  MOBILE: {
    cardWidth: 200,
    cardHeight: 80,
    columns: 2,
    detailWidth: 400,
    layout: 'vertical', // 垂直布局
  },
};
```

## 无障碍设计

### 键盘导航
- **Tab键**：在组件间导航
- **方向键**：在列表间导航
- **Enter键**：选择/确认
- **ESC键**：取消/返回

### 屏幕阅读器支持
- 所有按钮有清晰的标签
- 状态变化有语音反馈
- 复杂数据有文字描述

## 测试计划

### 功能测试
1. 干员列表显示和筛选
2. 干员详情信息展示
3. 干员管理操作（部署/撤回）
4. 队伍编成功能
5. PAPS人格生成集成

### 性能测试
1. 大量干员时的列表性能
2. WASM加载和生成性能
3. 动画流畅度测试
4. 内存使用监控

### 兼容性测试
1. 不同浏览器测试
2. 不同分辨率适配
3. 触摸设备支持
4. 屏幕阅读器兼容

---

*文档版本：1.0*
*更新日期：2026-07-05*
*作者：UI/UX设计团队*