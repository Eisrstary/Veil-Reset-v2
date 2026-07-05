# 《覆幕重启》游戏内容需求研究

## 项目概述
- 游戏名称: 覆幕重启 (Veil Reset)
- 技术栈: Phaser 4 + TypeScript + Vite + WASM (PAPS AI)
- 当前状态: 基础UI框架完成，核心玩法待实现

## 1. 残响系统 (Echo System) 分析

### 现有代码引用
从 `HomeScene.ts` 发现:
- 残响收集进度: 2/15 (第138行)
- 章节分类: 残响收集、章回档案、科考记录、终章遗响 (第118行)
- 残响碎片作为探索奖励 (BlockMapGenerator.ts 第325-336行)

### 系统设计建议
```
EchoFragment {
  id: string           // 唯一标识符，如 "echo_chapter1_01"
  name: string         // 显示名称
  description: string  // 描述文本
  type: 'memory' | 'lore' | 'ability' | 'resource'
  chapter: number      // 所属章节
  location: {          // 获取位置
    blockId: string
    x: number
    y: number
  }
  content: string      // 实际内容(文本/CG路径等)
  unlocked: boolean    // 是否已解锁
}
```

### 功能需求
1. **收集机制**: 在关卡中探索发现
2. **进度追踪**: 总进度显示 (2/15)
3. **内容展示**: 专门的残响阅览界面
4. **奖励系统**: 收集特定数量解锁新内容/能力

## 2. Boss战设计 (Boss Battle Design)

### 设计要求分析
从任务描述看需集成到2.5D等距战斗系统

### Boss设计要素
```
BossDesign {
  id: string
  name: string
  tier: number (1-5)      // 难度等级
  phaseCount: number      // 阶段数量
  abilities: BossAbility[]
  weakPoints: WeakPoint[] // 弱点部位
  lootTable: LootItem[]   // 掉落物品
  storySignificance: string // 剧情重要性
}

BossAbility {
  name: string
  type: 'attack' | 'defense' | 'summon' | 'phase_change'
  pattern: AbilityPattern // 攻击模式
  cooldown: number
  telegraph: TelegraphedEffect // 预警效果
}
```

### 战斗机制建议
1. **多阶段战斗**: 血量阈值触发阶段转换
2. **模式识别**: 可学习的攻击模式
3. **环境互动**: 利用场景元素对抗Boss
4. **团队协作**: 干员技能配合机制

## 3. 干员数据结构和初始配置

### 与WASM AI集成分析
从 `API.md` 和 `test_paps.js` 了解到:
- PAPS系统有84个人格参数
- 支持倾向设置 (very_low → very_high)
- 可导出AI行为指令Markdown

### 干员数据结构设计
```
Operator {
  id: string
  name: string
  role: 'assault' | 'support' | 'tactical' | 'specialist'
  stats: {
    health: number
    attack: number  
    defense: number
    speed: number
    accuracy: number
  }
  skills: OperatorSkill[]
  equipmentSlots: EquipmentSlot[]
  
  // WASM AI 人格数据
  personality: {
    papsId: string      // WASM生成的人格ID
    tendencies: Map<string, number> // 人格参数值
    aiBehavior: string  // AI行为指令(Markdown格式)
    humanReadable: string // 人类可读描述
  }
  
  // 游戏进度数据
  level: number
  experience: number
  unlockedAbilities: string[]
  relationship: Map<string, number> // 与其他干员的关系值
}
```

### 初始配置需求
1. **预设干员**: 游戏开始时的可用角色
2. **人格生成**: 使用WASM随机生成或预设人格
3. **平衡调整**: 确保初始队伍可行性
4. **成长系统**: 等级提升和能力解锁

## 4. 世界区块的内容设计

### 现有系统分析
从 `BlockMapGenerator.ts` 发现:
- 三种生成类型: rooms, open_field, ruins
- 区块类型: combat, explore, story
- 层级系统 (tier): 影响难度和内容

### 区块内容架构
```
WorldBlock {
  id: string
  name: string
  type: 'combat' | 'explore' | 'story' | 'boss' | 'safe'
  tier: number (1-5)
  generationType: 'rooms' | 'open_field' | 'ruins'
  
  // 地图配置
  mapConfig: {
    width: number
    height: number
    seed: number
  }
  
  // 内容配置
  content: {
    enemies: EnemySpawnConfig[]
    echoes: EchoSpawnConfig[]
    resources: ResourceSpawnConfig[]
    interactions: InteractionPoint[]
    objectives: Objective[]
  }
  
  // 连接性
  connections: {
    north?: string  // 连接的区块ID
    south?: string
    east?: string
    west?: string
  }
  
  // 元数据
  difficulty: number
  estimatedTime: number // 预计完成时间(分钟)
  storyRelevance: string // 剧情相关性
}
```

### 内容生成策略
1. **程序化生成**: 使用种子确保可重复性
2. **手调内容**: 关键剧情区块手动设计
3. **难度曲线**: 随进度递增的挑战
4. **资源分布**: 平衡的资源获取机会

## 实现优先级建议

### 第一阶段 (核心框架)
1. 干员基础数据结构和WASM集成
2. 简单区块内容生成
3. 基础残响收集系统

### 第二阶段 (玩法完善)  
1. Boss战基础实现
2. 区块间连接和世界地图
3. 残响内容展示界面

### 第三阶段 (内容丰富)
1. 多种Boss设计和战斗机制
2. 复杂区块内容设计
3. 干员成长和关系系统

## 技术挑战识别

1. **WASM集成**: 确保AI人格系统与游戏逻辑无缝结合
2. **2.5D渲染**: 等距视角下的战斗表现
3. **内容平衡**: 程序生成与手调内容的平衡
4. **性能优化**: 复杂AI和地图生成的性能考虑

## 下一步行动建议

1. 创建干员数据类型的TypeScript定义
2. 设计残响系统的数据结构和UI
3. 规划Boss战的原型实现
4. 制定世界区块的内容配置格式