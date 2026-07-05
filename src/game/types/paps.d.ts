// PAPS WASM 类型定义
declare module 'paps-wasm' {
    export class PapsWasm {
        constructor();
        free(): void;
        [Symbol.dispose](): void;
        
        // 初始化
        init_random(): void;
        
        // 参数设置
        set_tendency(param_id: string, tendency: string): number;
        set_value(param_id: string, value: number): boolean;
        
        // 查询
        parameter_count(): number;
        get_value(param_id: string): number;
        get_all_values_json(): string;
        all_parameter_ids_json(): string;
        
        // 导出
        export_ai_md(): string;
        export_human_md(): string;
        export_raw_json(): string;
        
        // 分析
        analyze_couplings_json(): string;
        system_info_json(): string;
        epsilon_value(): number;
        
        // 版本
        version(): string;
        
        // 调试
        static setPanicHook(): void;
    }
}

// 人格参数类型定义
export interface PAPSParameters {
    [key: string]: number; // 参数ID -> 值 (0-1)
}

export interface PAPSProfile {
    aiPrompt: string;      // AI行为指令Markdown
    humanReadable: string; // 人类可读Markdown
    rawParameters: PAPSParameters; // 原始参数
    seed?: number;         // 生成种子
    timestamp: number;     // 生成时间戳
}

export interface PAPSCharacter {
    id: string;            // 角色ID
    name: string;          // 名称
    profession: OperatorProfession; // 职业
    profile: PAPSProfile;  // PAPS人格
    memoryPool: string[];  // 记忆池
    bondLevel: number;     // 羁绊等级 (0-10)
    avatar?: string;       // 头像/形象
    biography?: string;    // 背景故事
    dialogueBias?: number; // 对话倾向调整
}

// 干员职业类型
export type OperatorProfession = 'guard' | 'sniper' | 'defender' | 'medic' | 'caster' | 'supporter' | 'specialist';

// 职业配置
export interface ProfessionConfig {
    type: OperatorProfession;
    displayName: string;
    color: number;         // 颜色值
    description: string;
    baseStats: {
        health: number;
        attack: number;
        defense: number;
        speed: number;
        range: number;
    };
}

// 倾向值类型
export type PAPSTendency = 
    | 'very_low' | 'low' | 'medium' | 'high' | 'very_high' | 'any'
    | 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

// 关键参数映射
export const KEY_PAPSPARAMETERS = {
    // A组: 感知与认知
    THREAT_PERCEPTION: 'A008',      // 威胁感知
    EMPATHY: 'A009',                // 共情能力
    
    // B组: 情绪与动机
    GUILT: 'B015',                  // 内疚感
    ANGER_INWARD: 'B019',           // 愤怒内敛
    EMOTION_CONTAGION: 'B021',      // 情绪传染
    
    // C组: 社会与道德
    AVOIDANCE: 'C025',              // 回避倾向
    MEANING_SEEKING: 'C026',        // 意义寻求
    LYING: 'C036',                  // 说谎倾向
    
    // D组: 行为与行动
    AGGRESSION: 'D040',             // 攻击性
    
    // E组: 认知风格
    OPENNESS: 'E048',               // 开放性
    
    // F组: 人际与信任
    TRUST: 'F061',                  // 信任倾向
    
    // G组: 特殊
    MISSION_SENSE: 'G074',          // 使命感
} as const;

// 对话生成上下文
export interface DialogueContext {
    operator: PAPSCharacter;
    situation: string;
    playerChoice?: string;
    bondLevel: number;
    worldState: any;
    memoryRelevance: string[];
}