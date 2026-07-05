// ============================================================
// 区块地图数据类型定义
// ============================================================

/** 地块类型枚举 */
export enum TileType {
    FLOOR = 'floor',      // 可通行地面
    WALL = 'wall',        // 墙壁（不可通行）
    COVER = 'cover',      // 掩体（提供防御加成）
    OBSTACLE = 'obstacle',// 障碍物（阻挡视线和移动）
    WATER = 'water',      // 水域（移动惩罚）
    HAZARD = 'hazard',    // 危险区域（持续伤害）
    DOOR = 'door',        // 门（可开关）
}

/** 地块变体（0-3用于纹理变化） */
export type TileVariant = 0 | 1 | 2 | 3;

/** 单个地块数据 */
export interface BlockTile {
    type: TileType;
    variant: TileVariant;
    height: number;       // 高度值（用于等距渲染）
}

/** 生成点类型 */
export type SpawnType = 
    | 'player_deploy'    // 玩家部署点
    | 'enemy'            // 敌人生成点
    | 'echo_fragment'    // 残响碎片
    | 'item'             // 物品生成点
    | 'objective';       // 任务目标点

/** 生成点数据 */
export interface SpawnPoint {
    x: number;
    y: number;
    type: SpawnType;
    data?: {
        tier?: number;          // 敌人等级
        echoId?: string;        // 残响ID
        itemId?: string;        // 物品ID
        objectiveId?: string;   // 目标ID
    };
}

/** 区块生成配置 */
export interface BlockConfig {
    id: string;                 // 区块唯一标识
    name: string;               // 区块显示名称
    type: 'combat' | 'explore' | 'story' | 'boss';  // 区块类型
    tier: number;               // 难度等级（0-3）
    generationType: 'rooms' | 'open_field' | 'ruins'; // 生成算法
    mapWidth: number;          // 地图宽度（格子数）
    mapHeight: number;         // 地图高度（格子数）
    // 可选参数
    seed?: number;             // 随机种子
    theme?: string;            // 主题（工厂、废墟、荒原等）
    specialRules?: string[];   // 特殊规则
}

/** 完整区块地图数据 */
export interface BlockMapData {
    width: number;
    height: number;
    tiles: BlockTile[][];      // 二维数组 [y][x]
    spawns: SpawnPoint[];
    blockId: string;
    blockName: string;
    seed: number;
    // 渲染相关
    tileSize?: { width: number; height: number }; // 格子像素尺寸
}

/** 等距渲染参数 */
export interface IsometricRenderConfig {
    tileWidth: number;         // 格子宽度（像素）
    tileHeight: number;        // 格子高度（像素）
    tileDepth: number;         // 格子深度（用于3D效果）
    cameraAngle: number;       // 相机角度（弧度）
    cameraHeight: number;      // 相机高度
    // 图层设置
    backgroundLayer: string;
    terrainLayer: string;
    objectLayer: string;
    characterLayer: string;
    uiLayer: string;
}

/** 战斗相关类型 */
export interface CombatStats {
    health: number;           // 生命值
    maxHealth: number;        // 最大生命值
    attack: number;           // 攻击力
    defense: number;          // 防御力
    speed: number;            // 速度（影响行动顺序）
    range: number;            // 攻击范围
    // 特殊属性
    cognitiveEnergy: number;  // 识能（技能消耗）
    armor?: number;           // 护甲值
    dodge?: number;           // 闪避率
    crit?: number;            // 暴击率
}

/** 干员状态效果 */
export interface StatusEffect {
    type: 'buff' | 'debuff' | 'dot' | 'hot' | 'control';
    id: string;
    duration: number;         // 持续回合数
    value: number;            // 效果值
    source: string;           // 来源（技能ID或干员ID）
    // 描述
    name: string;
    description: string;
    icon?: string;            // 图标资源
}

/** 行动类型 */
export type ActionType = 
    | 'move'          // 移动
    | 'attack'        // 攻击
    | 'skill'         // 技能
    | 'item'          // 使用物品
    | 'wait'          // 等待
    | 'interact';     // 交互

/** 单次行动数据 */
export interface BattleAction {
    type: ActionType;
    source: string;           // 行动者ID
    target?: string | { x: number; y: number }; // 目标ID或坐标
    data?: any;               // 行动数据
    cost: number;             // 行动点消耗
}

/** 战斗回合状态 */
export interface BattleTurn {
    turnNumber: number;       // 当前回合数
    phase: 'player' | 'enemy' | 'boss'; // 阶段
    activeCharacter: string | null; // 当前行动角色
    remainingActions: number; // 剩余行动点
    // 时间相关
    day?: number;             // 游戏内天数
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}