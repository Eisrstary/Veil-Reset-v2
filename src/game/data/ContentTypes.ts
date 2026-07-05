// ============================================================
// 《覆幕重启》游戏内容类型定义
// 包含: 残响系统、Boss战、干员数据、世界区块
// ============================================================

// ==================== 残响系统 (Echo System) ====================

export type EchoType = 'memory' | 'lore' | 'ability' | 'resource' | 'secret';

/** 残响碎片 - 玩家收集的记忆片段 */
export interface EchoFragment {
    /** 唯一标识符，如 "echo_chapter1_01" */
    id: string;
    
    /** 显示名称 */
    name: string;
    
    /** 描述文本 */
    description: string;
    
    /** 残响类型 */
    type: EchoType;
    
    /** 所属章节 (1-4) */
    chapter: number;
    
    /** 获取位置信息 */
    location: {
        /** 区块ID */
        blockId: string;
        /** 区块内X坐标 */
        x: number;
        /** 区块内Y坐标 */
        y: number;
        /** 是否隐藏需要探索 */
        hidden: boolean;
    };
    
    /** 实际内容 */
    content: {
        /** 文本内容 (支持Markdown) */
        text?: string;
        /** CG图像路径 */
        image?: string;
        /** 音频路径 */
        audio?: string;
        /** 解锁的能力ID */
        unlockAbility?: string;
    };
    
    /** 游戏状态 */
    state: {
        /** 是否已收集 */
        collected: boolean;
        /** 收集时间戳 */
        collectedAt?: string;
        /** 是否已查看 */
        viewed: boolean;
    };
    
    /** 元数据 */
    meta: {
        /** 稀有度 (1-5) */
        rarity: number;
        /** 收集难度 */
        difficulty: number;
        /** 关联的干员ID */
        relatedOperator?: string;
    };
}

/** 残响收集进度 */
export interface EchoProgress {
    /** 总残响数 */
    totalEchoes: number;
    /** 已收集数 */
    collectedEchoes: number;
    /** 按章节统计 */
    byChapter: Array<{
        chapter: number;
        chapterName: string;
        total: number;
        collected: number;
    }>;
    /** 按类型统计 */
    byType: Record<EchoType, { total: number; collected: number }>;
}

// ==================== Boss战设计 ====================

export type BossPhase = 'phase1' | 'phase2' | 'phase3' | 'enraged' | 'final';

export type AbilityType = 'direct_attack' | 'aoe_attack' | 'summon' | 'buff' | 'debuff' | 'phase_transition' | 'environment';

/** Boss能力 */
export interface BossAbility {
    /** 能力名称 */
    name: string;
    
    /** 能力类型 */
    type: AbilityType;
    
    /** 使用的阶段 */
    phases: BossPhase[];
    
    /** 触发条件 */
    trigger: {
        /** 冷却时间(秒) */
        cooldown: number;
        /** 血量百分比触发 */
        healthThreshold?: number;
        /** 时间触发(战斗开始后秒数) */
        timeTrigger?: number;
        /** 随机触发概率 */
        randomChance?: number;
    };
    
    /** 效果配置 */
    effect: {
        /** 伤害值 (如果有) */
        damage?: number;
        /** 影响范围 */
        range?: number;
        /** 持续时间 */
        duration?: number;
        /** 特殊效果 */
        special?: string;
    };
    
    /** 预警效果 */
    telegraph: {
        /** 预警时间(秒) */
        warningTime: number;
        /** 预警视觉效果 */
        visual: 'circle' | 'cone' | 'line' | 'area';
        /** 预警颜色 */
        color: string;
    };
}

/** Boss弱点 */
export interface BossWeakPoint {
    /** 部位名称 */
    name: string;
    /** 部位位置 (相对于Boss中心) */
    position: { x: number; y: number; z?: number };
    /** 伤害倍率 */
    damageMultiplier: number;
    /** 破坏后的效果 */
    breakEffect?: string;
    /** 当前血量 */
    health?: number;
    /** 最大血量 */
    maxHealth?: number;
}

/** Boss设计 */
export interface BossDesign {
    /** 唯一标识符 */
    id: string;
    
    /** 显示名称 */
    name: string;
    
    /** 描述 */
    description: string;
    
    /** 难度等级 (1-5) */
    tier: number;
    
    /** Boss模型/图像 */
    visual: {
        /** 图像路径 */
        sprite: string;
        /** 尺寸 */
        size: { width: number; height: number };
        /** 动画配置 */
        animations?: Record<string, string>;
    };
    
    /** 属性 */
    stats: {
        /** 基础血量 */
        health: number;
        /** 护甲值 */
        armor: number;
        /** 攻击力 */
        attack: number;
        /** 移动速度 */
        speed: number;
        /** 特殊抗性 */
        resistances: Record<string, number>;
    };
    
    /** 战斗阶段 */
    phases: Array<{
        /** 阶段名称 */
        name: BossPhase;
        /** 触发血量百分比 */
        healthThreshold: number;
        /** 阶段特有属性加成 */
        statModifiers?: Record<string, number>;
        /** 解锁的能力 */
        unlockedAbilities: string[];
    }>;
    
    /** 能力列表 */
    abilities: BossAbility[];
    
    /** 弱点部位 */
    weakPoints: BossWeakPoint[];
    
    /** 掉落表 */
    lootTable: Array<{
        /** 物品ID */
        itemId: string;
        /** 掉落概率 (0-1) */
        dropChance: number;
        /** 最小数量 */
        minQuantity: number;
        /** 最大数量 */
        maxQuantity: number;
        /** 阶段要求 */
        requiredPhase?: BossPhase;
    }>;
    
    /** 剧情信息 */
    story: {
        /** 登场剧情 */
        introduction: string;
        /** 背景故事 */
        background: string;
        /** 击败后剧情 */
        defeatStory: string;
        /** 关联的残响ID */
        relatedEchoes: string[];
    };
}

// ==================== 干员系统 ====================

export type OperatorRole = 'assault' | 'support' | 'tactical' | 'specialist' | 'leader';
export type SkillType = 'active' | 'passive' | 'ultimate';

/** 干员技能 */
export interface OperatorSkill {
    /** 技能ID */
    id: string;
    
    /** 技能名称 */
    name: string;
    
    /** 技能类型 */
    type: SkillType;
    
    /** 技能描述 */
    description: string;
    
    /** 使用条件 */
    requirements: {
        /** 解锁等级 */
        level: number;
        /** 能量消耗 */
        energyCost?: number;
        /** 冷却时间 */
        cooldown?: number;
        /** 使用次数限制 */
        usesPerBattle?: number;
    };
    
    /** 技能效果 */
    effects: Array<{
        /** 效果类型 */
        type: 'damage' | 'heal' | 'buff' | 'debuff' | 'summon' | 'utility';
        /** 数值 */
        value: number;
        /** 目标类型 */
        target: 'self' | 'ally' | 'enemy' | 'area';
        /** 持续时间 */
        duration?: number;
    }>;
    
    /** 技能图标 */
    icon: string;
}

/** 装备槽位 */
export interface EquipmentSlot {
    /** 槽位类型 */
    type: 'weapon' | 'armor' | 'accessory' | 'special';
    /** 是否已解锁 */
    unlocked: boolean;
    /** 当前装备ID */
    equippedItem?: string;
}

/** WASM人格数据 */
export interface PersonalityData {
    /** WASM生成的人格ID */
    papsId: string;
    
    /** 人格参数值映射 */
    tendencies: Record<string, number>;
    
    /** AI行为指令 (Markdown格式) */
    aiBehavior: string;
    
    /** 人类可读描述 */
    humanReadable: string;
    
    /** 生成的原始JSON */
    rawJson: string;
    
    /** 人格特征标签 */
    traits: string[];
}

/** 干员数据 */
export interface Operator {
    /** 唯一标识符 */
    id: string;
    
    /** 显示名称 */
    name: string;
    
    /** 称号/代号 */
    codename?: string;
    
    /** 角色类型 */
    role: OperatorRole;
    
    /** 基础属性 */
    stats: {
        /** 生命值 */
        health: { base: number; current: number; max: number };
        /** 攻击力 */
        attack: number;
        /** 防御力 */
        defense: number;
        /** 速度 (影响行动顺序) */
        speed: number;
        /** 命中率 */
        accuracy: number;
        /** 暴击率 */
        criticalChance: number;
        /** 暴击伤害 */
        criticalDamage: number;
    };
    
    /** 技能列表 */
    skills: OperatorSkill[];
    
    /** 装备槽位 */
    equipmentSlots: EquipmentSlot[];
    
    /** WASM AI人格数据 */
    personality: PersonalityData;
    
    /** 成长数据 */
    progression: {
        /** 等级 */
        level: number;
        /** 当前经验值 */
        experience: number;
        /** 升级所需经验 */
        experienceToNext: number;
        /** 已解锁的能力ID列表 */
        unlockedAbilities: string[];
        /** 可用的技能点 */
        skillPoints: number;
    };
    
    /** 关系系统 */
    relationships: Record<string, {
        /** 关系值 (-100 到 100) */
        value: number;
        /** 关系类型 */
        type: 'friendship' | 'rivalry' | 'trust' | 'fear';
        /** 最近交互时间 */
        lastInteraction: string;
    }>;
    
    /** 视觉资源 */
    visual: {
        /** 头像路径 */
        portrait: string;
        /** 战斗立绘 */
        battleSprite: string;
        /** 对话立绘 */
        dialogueSprite: string;
        /** 颜色主题 */
        colorTheme: string;
    };
    
    /** 背景故事 */
    background: {
        /** 简介 */
        introduction: string;
        /** 加入原因 */
        joinReason: string;
        /** 个人目标 */
        personalGoal: string;
        /** 秘密/隐藏信息 */
        secrets?: string[];
    };
    
    /** 游戏状态 */
    state: {
        /** 是否可用 */
        available: boolean;
        /** 是否在队伍中 */
        inParty: boolean;
        /** 当前状态 */
        status: 'healthy' | 'injured' | 'exhausted' | 'dead';
        /** 状态恢复时间 */
        recoveryTime?: number;
    };
}

// ==================== 世界区块系统 ====================

export type BlockType = 'combat' | 'explore' | 'story' | 'boss' | 'safe' | 'resource';
export type GenerationType = 'rooms' | 'open_field' | 'ruins' | 'handcrafted';

/** 敌人生成配置 */
export interface EnemySpawnConfig {
    /** 敌人类型ID */
    enemyTypeId: string;
    /** 生成数量 */
    count: number | { min: number; max: number };
    /** 生成区域限制 */
    area?: { x: number; y: number; width: number; height: number };
    /** 生成条件 */
    conditions?: {
        /** 难度要求 */
        tier?: number;
        /** 前置条件 */
        prerequisites?: string[];
    };
}

/** 残响生成配置 */
export interface EchoSpawnConfig {
    /** 残响ID */
    echoId: string;
    /** 生成位置 */
    position: { x: number; y: number };
    /** 是否隐藏 */
    hidden: boolean;
    /** 解锁条件 */
    unlockConditions?: string[];
}

/** 资源生成配置 */
export interface ResourceSpawnConfig {
    /** 资源类型 */
    type: 'material' | 'currency' | 'equipment' | 'consumable';
    /** 资源ID */
    resourceId: string;
    /** 生成位置 */
    position: { x: number; y: number };
    /** 数量 */
    quantity: number | { min: number; max: number };
    /** 重生时间(秒，0表示不重生) */
    respawnTime: number;
}

/** 交互点 */
export interface InteractionPoint {
    /** 交互点ID */
    id: string;
    /** 位置 */
    position: { x: number; y: number };
    /** 交互类型 */
    type: 'dialogue' | 'puzzle' | 'container' | 'mechanism' | 'rest';
    /** 交互数据 */
    data: Record<string, any>;
    /** 交互条件 */
    conditions?: string[];
    /** 交互后效果 */
    effects?: string[];
}

/** 任务目标 */
export interface Objective {
    /** 目标ID */
    id: string;
    /** 目标类型 */
    type: 'defeat_all' | 'collect_item' | 'reach_location' | 'survive_time' | 'protect_target';
    /** 目标描述 */
    description: string;
    /** 目标数据 */
    data: Record<string, any>;
    /** 完成条件 */
    completionCondition: string;
    /** 奖励 */
    rewards: string[];
}

/** 世界区块设计 */
export interface WorldBlock {
    /** 唯一标识符 */
    id: string;
    
    /** 显示名称 */
    name: string;
    
    /** 区块描述 */
    description: string;
    
    /** 区块类型 */
    type: BlockType;
    
    /** 难度层级 */
    tier: number;
    
    /** 地图生成类型 */
    generationType: GenerationType;
    
    /** 地图配置 */
    mapConfig: {
        /** 地图宽度 (格子数) */
        width: number;
        /** 地图高度 (格子数) */
        height: number;
        /** 生成种子 */
        seed: number;
        /** 特殊地形标志 */
        specialTerrain?: string[];
    };
    
    /** 区块内容 */
    content: {
        /** 敌人配置 */
        enemies: EnemySpawnConfig[];
        /** 残响配置 */
        echoes: EchoSpawnConfig[];
        /** 资源配置 */
        resources: ResourceSpawnConfig[];
        /** 交互点 */
        interactions: InteractionPoint[];
        /** 任务目标 */
        objectives: Objective[];
        /** 环境效果 */
        environmentEffects?: string[];
    };
    
    /** 区块连接 */
    connections: {
        /** 北向连接 */
        north?: { blockId: string; entrancePosition: { x: number; y: number } };
        /** 南向连接 */
        south?: { blockId: string; entrancePosition: { x: number; y: number } };
        /** 东向连接 */
        east?: { blockId: string; entrancePosition: { x: number; y: number } };
        /** 西向连接 */
        west?: { blockId: string; entrancePosition: { x: number; y: number } };
    };
    
    /** 进入条件 */
    entryConditions: {
        /** 最低玩家等级 */
        minLevel?: number;
        /** 需要完成的前置区块 */
        requiredBlocks?: string[];
        /** 需要收集的残响 */
        requiredEchoes?: string[];
        /** 需要击败的Boss */
        requiredBosses?: string[];
    };
    
    /** 元数据 */
    meta: {
        /** 预估完成时间(分钟) */
        estimatedTime: number;
        /** 剧情重要性 (1-10) */
        storyRelevance: number;
        /** 推荐队伍规模 */
        recommendedPartySize: number;
        /** 区块主题 */
        theme: string;
        /** 音乐配置 */
        music?: {
            bgm: string;
            battle: string;
            boss?: string;
        };
    };
    
    /** 完成奖励 */
    completionRewards: {
        /** 经验值 */
        experience: number;
        /** 货币奖励 */
        currency: number;
        /** 物品奖励 */
        items: Array<{ id: string; quantity: number }>;
        /** 解锁内容 */
        unlocks: string[];
    };
}

// ==================== 游戏配置类型 ====================

/** 游戏内容配置集合 */
export interface GameContentConfig {
    /** 残响配置 */
    echoes: EchoFragment[];
    /** Boss配置 */
    bosses: BossDesign[];
    /** 干员配置 */
    operators: Operator[];
    /** 世界区块配置 */
    worldBlocks: WorldBlock[];
    /** 初始游戏配置 */
    initialConfig: {
        /** 起始干员ID列表 */
        startingOperators: string[];
        /** 起始区块ID */
        startingBlock: string;
        /** 初始资源 */
        initialResources: Record<string, number>;
        /** 教程配置 */
        tutorial?: {
            enabled: boolean;
            steps: string[];
        };
    };
}

// ==================== 工具函数类型 ====================

/** 内容验证结果 */
export interface ContentValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

/** 内容生成选项 */
export interface ContentGenerationOptions {
    /** 是否使用WASM生成人格 */
    useWasmForPersonality: boolean;
    /** 内容随机种子 */
    seed: number;
    /** 难度等级 */
    difficulty: number;
    /** 玩家进度 */
    playerProgress: {
        level: number;
        collectedEchoes: string[];
        defeatedBosses: string[];
        unlockedBlocks: string[];
    };
}