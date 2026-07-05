# PAPS WASM AI人格系统集成文档

## 概述

本文档详细说明了《覆幕重启》项目中PAPS WASM AI人格系统的集成实现。PAPS（Personality Assessment and Prediction System）是一个基于WASM的人格生成系统，能够生成84个维度的个性化人格参数。

## 技术架构

### 文件结构
```
src/game/
├── types/paps.d.ts          # 类型定义
├── paps/PAPSManager.ts      # PAPS核心管理器
├── entities/Operator.ts     # 干员类（整合人格、职业、记忆、羁绊）
└── scenes/PAPSTestScene.ts  # 测试场景
```

### 核心组件

#### 1. PAPSManager (`src/game/paps/PAPSManager.ts`)
- **功能**: 管理PAPS WASM模块的加载、初始化和人格生成
- **特性**:
  - 单例模式确保全局唯一实例
  - 异步初始化WASM模块
  - 提供多种人格生成方式（随机、指定倾向、职业相关）
  - 批量生成支持
  - 参数查询和分析功能

#### 2. Operator类 (`src/game/entities/Operator.ts`)
- **功能**: 整合PAPS人格、职业系统、记忆池和羁绊系统
- **特性**:
  - 基于PAPS参数生成个性化背景故事
  - 职业系统（近卫、狙击、重装、医疗等）
  - 记忆池管理（最多50条记忆）
  - 羁绊等级系统（影响属性）
  - 动态属性计算（基于PAPS参数和羁绊等级）
  - AI Prompt生成（整合人格、职业、记忆）

#### 3. 类型定义 (`src/game/types/paps.d.ts`)
- **功能**: 提供完整的TypeScript类型定义
- **包含**:
  - PAPS参数类型
  - 职业配置类型
  - 倾向值类型
  - 关键参数映射
  - 对话上下文类型

#### 4. 测试场景 (`src/game/scenes/PAPSTestScene.ts`)
- **功能**: 完整的PAPS集成测试套件
- **测试项目**:
  - PAPS WASM初始化
  - 基础功能测试
  - 参数操作测试
  - 角色生成测试
  - 批量生成测试
  - 职业系统测试
  - 记忆与羁绊测试

## API使用方法

### 1. 初始化PAPS
```typescript
import { papsManager } from './src/game/paps/PAPSManager';

// 初始化PAPS WASM
await papsManager.initialize();

// 检查是否就绪
if (papsManager.isReady()) {
    console.log('PAPS已就绪');
}
```

### 2. 生成人格
```typescript
// 随机生成
const randomProfile = papsManager.generateRandomProfile(seed);

// 指定倾向生成
const tendencies = {
    'A008': 'very_low',   // 低威胁感知
    'A009': 'very_high',  // 高共情
    'F061': 'medium'      // 中等信任
};
const customProfile = papsManager.generateProfileWithTendencies(tendencies);

// 职业相关生成
const medicProfile = papsManager.generateProfileForProfession('medic');
```

### 3. 创建干员
```typescript
import { Operator } from './src/game/entities/Operator';

// 创建干员
const operator = new Operator('霜白', 'sniper', seed);

// 获取属性
const stats = operator.getCurrentStats();
console.log(`HP: ${stats.health}, ATK: ${stats.attack}, DEF: ${stats.defense}`);

// 添加记忆
operator.addMemory('在废墟中发现前文明遗物');

// 增加羁绊
operator.addBondExperience(100);

// 获取AI Prompt
const aiPrompt = operator.getAIPrompt();
```

### 4. 关键参数访问
```typescript
import { KEY_PAPSPARAMETERS } from './src/game/types/paps';

// 获取关键参数值
const threatPerception = operator.getParameterValue(KEY_PAPSPARAMETERS.THREAT_PERCEPTION);
const empathy = operator.getParameterValue(KEY_PAPSPARAMETERS.EMPATHY);
const trust = operator.getParameterValue(KEY_PAPSPARAMETERS.TRUST);
```

## 关键参数说明

### A组: 感知与认知
- **A008 (威胁感知)**: 对危险和威胁的敏感度
- **A009 (共情能力)**: 理解和感受他人情感的能力

### B组: 情绪与动机
- **B015 (内疚感)**: 容易产生内疚情绪的倾向
- **B019 (愤怒内敛)**: 压抑愤怒情绪的倾向
- **B021 (情绪传染)**: 容易受到他人情绪影响

### C组: 社会与道德
- **C025 (回避倾向)**: 回避冲突和困难情境
- **C026 (意义寻求)**: 追求行动的意义和目的
- **C036 (说谎倾向)**: 说谎的倾向性

### D组: 行为与行动
- **D040 (攻击性)**: 攻击和对抗的倾向

### F组: 人际与信任
- **F061 (信任倾向)**: 信任他人的基本倾向

## 职业系统

### 职业类型
1. **近卫 (Guard)**: 近战专家，平衡的攻击与防御
2. **狙击 (Sniper)**: 远程专家，高攻击低防御
3. **重装 (Defender)**: 防御专家，高生命高防御
4. **医疗 (Medic)**: 治疗专家，支援队友
5. **术士 (Caster)**: 法术攻击，范围伤害
6. **辅助 (Supporter)**: 支援控制，增强队友
7. **特种 (Specialist)**: 特殊能力，灵活多变

### 职业倾向映射
每个职业有预设的PAPS参数倾向：
- **医疗**: 高共情、高内疚感、高意义寻求
- **狙击**: 高威胁感知、低共情、中等回避倾向
- **近卫**: 高威胁感知、中等攻击性、中等信任
- **重装**: 高共情、高内疚感、高信任

## 记忆与羁绊系统

### 记忆池
- **容量**: 最多50条记忆
- **功能**: 影响对话生成和行为决策
- **检索**: 基于情境关键词检索相关记忆

### 羁绊系统
- **等级**: 0-10级
- **影响**: 每级提升5%基础属性
- **提升**: 通过交互和事件获得羁绊经验

## 对话生成

### AI Prompt结构
```
# 人格指令
[基于PAPS生成的84参数人格指令]

# 职业背景
你是近卫，近战专家，平衡的攻击与防御

# 个人背景
曾是一名近卫。情感较为内敛，专注于任务本身...

# 近期记忆
1. 昨天和指挥官一起探索了废墟
2. 在战斗中保护了医疗干员
```

### 对话倾向调整
基于PAPS参数计算对话倾向偏差：
- **正向偏差**: 更积极、合作的对话
- **负向偏差**: 更谨慎、怀疑的对话

## 测试验证

### 测试方法
1. 访问主菜单
2. 点击"AI人格测试"按钮（右上角）
3. 运行完整测试套件

### 测试项目
1. ✅ PAPS WASM初始化
2. ✅ 基础功能测试
3. ✅ 参数操作测试
4. ✅ 角色生成测试
5. ✅ 批量生成测试
6. ✅ 职业系统测试
7. ✅ 记忆与羁绊测试

## 性能考虑

### WASM加载
- **大小**: WASM文件~391KB + JS胶水代码18KB
- **加载时间**: 首次加载约1-2秒
- **缓存**: 浏览器会自动缓存WASM模块

### 内存管理
- **实例化**: 每个PapsWasm实例独立管理内存
- **清理**: 必须调用`free()`方法释放内存
- **最佳实践**: 使用try-finally确保内存释放

### 批量生成
- **限制**: 不建议同时生成大量实例
- **优化**: 使用`generateBatchProfiles`进行批量操作

## 降级策略

### 备选方案
如果WASM不可用：
```typescript
// 使用预生成的JSON数据
const fallbackProfiles = require('./fallback_profiles.json');
```

### 错误处理
- **初始化失败**: 提供友好的错误提示
- **参数错误**: 使用默认值或跳过
- **内存错误**: 自动清理并重试

## 后续开发

### 短期计划
1. **对话系统集成**: 将PAPS人格整合到AVG对话系统
2. **行为影响**: 基于PAPS参数影响战斗行为
3. **UI展示**: 在游戏UI中展示人格参数

### 长期计划
1. **动态调整**: 记忆和经历动态调整PAPS参数
2. **AI对话**: 整合CodeBuddy AI进行实时对话生成
3. **社交系统**: 基于人格参数的干员间互动

## 参考资料

1. **PAPS API文档**: `API.md`
2. **游戏设计文档**: `temp/完整可行方案_覆幕重启_V5.md`
3. **WASM官方文档**: https://webassembly.org/

## 联系方式

如有问题，请联系：
- **团队**: Veil
- **成员**: ai-wasm-system
- **状态**: 集成完成，等待进一步开发和测试