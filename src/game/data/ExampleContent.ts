// ============================================================
// 《覆幕重启》示例游戏内容配置
// 用于演示内容数据结构的具体用法
// ============================================================

import { 
    EchoFragment, BossDesign, Operator, WorldBlock,
    EchoType, BossPhase, OperatorRole, BlockType,
    GameContentConfig 
} from './ContentTypes';

// ==================== 示例残响配置 ====================

export const exampleEchoes: EchoFragment[] = [
    {
        id: "echo_chapter1_01",
        name: "初幕之影",
        description: "关于世界重启最初时刻的模糊记忆",
        type: "memory",
        chapter: 1,
        location: {
            blockId: "block_tutorial_01",
            x: 15,
            y: 8,
            hidden: false
        },
        content: {
            text: "「系统记录：第零次重启尝试」\n\n一切开始于那个决定性的瞬间。当最后的幕布落下，世界并未如预期般终结，反而陷入了一种奇异的停滞。时间仍在流逝，但意义已经消散。\n\n这是我们的起点，也是我们试图逃离的终点。",
            image: "assets/echoes/chapter1_01.png",
            audio: "audio/echoes/memory_whisper.mp3"
        },
        state: {
            collected: false,
            viewed: false
        },
        meta: {
            rarity: 1,
            difficulty: 1,
            relatedOperator: "op_observer"
        }
    },
    {
        id: "echo_chapter1_02", 
        name: "裂隙低语",
        description: "来自世界裂隙的诡异声音记录",
        type: "lore",
        chapter: 1,
        location: {
            blockId: "block_ruins_01",
            x: 22,
            y: 12,
            hidden: true
        },
        content: {
            text: "声音记录 #001\n\n「...幕布之后并非虚无，而是另一层幕布。我们所谓的重启，不过是撕开一层，发现下面还有另一层等待被撕开。这是无限的回廊，还是精心设计的牢笼？」\n\n- 未知的声音，来源：世界裂隙α",
            unlockAbility: "ability_echo_sense"
        },
        state: {
            collected: false,
            viewed: false
        },
        meta: {
            rarity: 2,
            difficulty: 3
        }
    }
];

// ==================== 示例Boss配置 ====================

export const exampleBosses: BossDesign[] = [
    {
        id: "boss_corrupted_guardian",
        name: "腐化守卫",
        description: "曾经保护某个重要设施的自动防御系统，如今被未知力量腐蚀",
        tier: 2,
        visual: {
            sprite: "assets/bosses/corrupted_guardian.png",
            size: { width: 128, height: 192 },
            animations: {
                idle: "guardian_idle",
                attack: "guardian_attack",
                damaged: "guardian_hurt",
                death: "guardian_death"
            }
        },
        stats: {
            health: 5000,
            armor: 100,
            attack: 150,
            speed: 60,
            resistances: {
                "物理": 0.3,
                "能量": -0.2, // 弱点
                "精神": 0.5
            }
        },
        phases: [
            {
                name: "phase1",
                healthThreshold: 100,
                statModifiers: {
                    attack: 1.0,
                    speed: 1.0
                },
                unlockedAbilities: ["basic_attack", "energy_pulse"]
            },
            {
                name: "phase2",
                healthThreshold: 60,
                statModifiers: {
                    attack: 1.3,
                    speed: 0.8
                },
                unlockedAbilities: ["summon_drones", "area_shockwave"]
            },
            {
                name: "enraged",
                healthThreshold: 30,
                statModifiers: {
                    attack: 1.8,
                    speed: 1.2
                },
                unlockedAbilities: ["frenzy_attack", "self_destruct_warning"]
            }
        ],
        abilities: [
            {
                name: "基础攻击",
                type: "direct_attack",
                phases: ["phase1", "phase2", "enraged"],
                trigger: {
                    cooldown: 3,
                    randomChance: 0.7
                },
                effect: {
                    damage: 120,
                    range: 100
                },
                telegraph: {
                    warningTime: 1.5,
                    visual: "line",
                    color: "#ff5555"
                }
            },
            {
                name: "能量脉冲",
                type: "aoe_attack",
                phases: ["phase1", "phase2"],
                trigger: {
                    cooldown: 8,
                    healthThreshold: 80
                },
                effect: {
                    damage: 200,
                    range: 150,
                    special: "击退效果"
                },
                telegraph: {
                    warningTime: 2.0,
                    visual: "circle",
                    color: "#55aaff"
                }
            },
            {
                name: "召唤无人机",
                type: "summon",
                phases: ["phase2", "enraged"],
                trigger: {
                    cooldown: 15,
                    timeTrigger: 30
                },
                effect: {
                    special: "召唤3架维修无人机"
                },
                telegraph: {
                    warningTime: 3.0,
                    visual: "area",
                    color: "#ffaa00"
                }
            }
        ],
        weakPoints: [
            {
                name: "能量核心",
                position: { x: 0, y: -40 },
                damageMultiplier: 2.0,
                breakEffect: "瘫痪10秒",
                health: 500,
                maxHealth: 500
            },
            {
                name: "左臂关节",
                position: { x: -30, y: 20 },
                damageMultiplier: 1.5,
                health: 300,
                maxHealth: 300
            }
        ],
        lootTable: [
            {
                itemId: "mat_energy_core",
                dropChance: 1.0,
                minQuantity: 1,
                maxQuantity: 2
            },
            {
                itemId: "eq_guardian_plating",
                dropChance: 0.6,
                minQuantity: 1,
                maxQuantity: 1,
                requiredPhase: "phase2"
            },
            {
                itemId: "echo_corrupted_memory",
                dropChance: 0.3,
                minQuantity: 1,
                maxQuantity: 1
            }
        ],
        story: {
            introduction: "巨大的机械守卫从废墟中升起，眼中闪烁着不祥的红光",
            background: "原本是用于保护重要研究设施的自动防御系统，在世界重启过程中被未知的腐蚀性能量感染",
            defeatStory: "随着最后一击，守卫的核心发出刺眼的光芒后熄灭，留下一地碎片和未解之谜",
            relatedEchoes: ["echo_chapter1_02", "echo_chapter1_03"]
        }
    }
];

// ==================== 示例干员配置 ====================

export const exampleOperators: Operator[] = [
    {
        id: "op_observer",
        name: "观察者",
        codename: "守望者",
        role: "tactical",
        stats: {
            health: { base: 800, current: 800, max: 800 },
            attack: 65,
            defense: 45,
            speed: 85,
            accuracy: 90,
            criticalChance: 0.15,
            criticalDamage: 1.8
        },
        skills: [
            {
                id: "skill_observer_scan",
                name: "战术扫描",
                type: "active",
                description: "扫描战场，揭示敌人弱点和隐藏物品",
                requirements: {
                    level: 1,
                    energyCost: 30,
                    cooldown: 3
                },
                effects: [
                    {
                        type: "utility",
                        value: 1,
                        target: "area",
                        duration: 10
                    }
                ],
                icon: "assets/skills/scan.png"
            },
            {
                id: "skill_observer_analysis",
                name: "弱点分析",
                type: "passive",
                description: "提高队伍对敌人弱点的伤害",
                requirements: {
                    level: 3
                },
                effects: [
                    {
                        type: "buff",
                        value: 1.2,
                        target: "ally",
                        duration: 0
                    }
                ],
                icon: "assets/skills/analysis.png"
            }
        ],
        equipmentSlots: [
            { type: "weapon", unlocked: true },
            { type: "armor", unlocked: true },
            { type: "accessory", unlocked: false },
            { type: "special", unlocked: false }
        ],
        personality: {
            papsId: "paps_observer_001",
            tendencies: {
                "A008": 0.3,  // 低威胁感知
                "A009": 0.8,  // 高共情
                "B015": 0.7,  // 中等内疚
                "C036": 0.9   // 高诚实度
            },
            aiBehavior: "作为观察者，你倾向于收集和分析信息而非直接行动。你在决策前会仔细评估所有选项，优先考虑团队安全和信息完整性。",
            humanReadable: "冷静、分析型人格，偏好观察和计划而非冲动行动。对团队有强烈的责任感，但有时会因过度分析而犹豫。",
            rawJson: "{\"personality\": {\"traits\": [\"analytical\", \"cautious\", \"loyal\"]}}",
            traits: ["analytical", "cautious", "loyal", "observant"]
        },
        progression: {
            level: 1,
            experience: 0,
            experienceToNext: 100,
            unlockedAbilities: ["skill_observer_scan"],
            skillPoints: 1
        },
        relationships: {
            "op_vanguard": {
                value: 25,
                type: "trust",
                lastInteraction: "2026-07-05T10:00:00Z"
            }
        },
        visual: {
            portrait: "assets/operators/observer_portrait.png",
            battleSprite: "assets/operators/observer_battle.png",
            dialogueSprite: "assets/operators/observer_dialogue.png",
            colorTheme: "#4a86e8"
        },
        background: {
            introduction: "前哨站的数据分析师，在世界重启后失去了所有同事",
            joinReason: "相信通过分析重启模式可以找到拯救世界的线索",
            personalGoal: "解开世界重启的真相，找回失去的同伴",
            secrets: ["其实记得比表现出来的更多", "与某个重启现象有特殊连接"]
        },
        state: {
            available: true,
            inParty: true,
            status: "healthy"
        }
    }
];

// ==================== 示例世界区块配置 ====================

export const exampleWorldBlocks: WorldBlock[] = [
    {
        id: "block_tutorial_01",
        name: "初幕废墟",
        description: "重启后世界的第一个可探索区域，充满了基础教学元素",
        type: "explore",
        tier: 1,
        generationType: "ruins",
        mapConfig: {
            width: 40,
            height: 30,
            seed: 12345,
            specialTerrain: ["light_cover", "broken_walls"]
        },
        content: {
            enemies: [
                {
                    enemyTypeId: "enemy_scavenger",
                    count: { min: 3, max: 5 },
                    area: { x: 25, y: 10, width: 10, height: 10 }
                }
            ],
            echoes: [
                {
                    echoId: "echo_chapter1_01",
                    position: { x: 15, y: 8 },
                    hidden: false,
                    unlockConditions: ["defeat_scavengers"]
                }
            ],
            resources: [
                {
                    type: "material",
                    resourceId: "mat_scrap_metal",
                    position: { x: 8, y: 5 },
                    quantity: { min: 2, max: 4 },
                    respawnTime: 300
                }
            ],
            interactions: [
                {
                    id: "intel_terminal",
                    position: { x: 20, y: 15 },
                    type: "dialogue",
                    data: {
                        dialogueId: "dialogue_tutorial_intro",
                        speaker: "system"
                    },
                    conditions: ["first_visit"],
                    effects: ["unlock_map", "give_compass"]
                }
            ],
            objectives: [
                {
                    id: "obj_explore_ruins",
                    type: "reach_location",
                    description: "探索废墟深处",
                    data: { targetX: 35, targetY: 25 },
                    completionCondition: "player_reaches_target",
                    rewards: ["exp_100", "echo_chapter1_01"]
                }
            ],
            environmentEffects: ["fog_light", "wind_sound"]
        },
        connections: {
            east: {
                blockId: "block_ruins_01",
                entrancePosition: { x: 0, y: 15 }
            }
        },
        entryConditions: {
            minLevel: 1
        },
        meta: {
            estimatedTime: 15,
            storyRelevance: 3,
            recommendedPartySize: 1,
            theme: "post_apocalyptic_tutorial",
            music: {
                bgm: "music/exploration_01.mp3",
                battle: "music/battle_basic.mp3"
            }
        },
        completionRewards: {
            experience: 150,
            currency: 500,
            items: [
                { id: "mat_scrap_metal", quantity: 5 },
                { id: "consum_health_pack", quantity: 2 }
            ],
            unlocks: ["block_ruins_01", "op_vanguard"]
        }
    },
    {
        id: "block_ruins_01",
        name: "腐蚀工厂",
        description: "废弃的工业设施，被腐蚀性能量污染",
        type: "combat",
        tier: 2,
        generationType: "rooms",
        mapConfig: {
            width: 50,
            height: 40,
            seed: 67890,
            specialTerrain: ["acid_pools", "broken_machinery"]
        },
        content: {
            enemies: [
                {
                    enemyTypeId: "enemy_corrupted_drone",
                    count: { min: 6, max: 8 }
                },
                {
                    enemyTypeId: "boss_corrupted_guardian",
                    count: 1,
                    area: { x: 40, y: 20, width: 8, height: 8 }
                }
            ],
            echoes: [
                {
                    echoId: "echo_chapter1_02",
                    position: { x: 22, y: 12 },
                    hidden: true,
                    unlockConditions: ["defeat_boss"]
                }
            ],
            resources: [
                {
                    type: "material",
                    resourceId: "mat_energy_core",
                    position: { x: 10, y: 35 },
                    quantity: { min: 1, max: 2 },
                    respawnTime: 600
                }
            ],
            interactions: [],
            objectives: [
                {
                    id: "obj_defeat_guardian",
                    type: "defeat_all",
                    description: "击败腐化守卫",
                    data: { enemyIds: ["boss_corrupted_guardian"] },
                    completionCondition: "all_enemies_defeated",
                    rewards: ["exp_500", "mat_energy_core", "unlock_factory"]
                }
            ],
            environmentEffects: ["corrosion_aura", "machinery_noise"]
        },
        connections: {
            west: {
                blockId: "block_tutorial_01",
                entrancePosition: { x: 49, y: 20 }
            }
        },
        entryConditions: {
            minLevel: 2,
            requiredBlocks: ["block_tutorial_01"]
        },
        meta: {
            estimatedTime: 30,
            storyRelevance: 5,
            recommendedPartySize: 2,
            theme: "industrial_corruption",
            music: {
                bgm: "music/factory_01.mp3",
                battle: "music/boss_battle_01.mp3",
                boss: "music/boss_guardian.mp3"
            }
        },
        completionRewards: {
            experience: 800,
            currency: 1500,
            items: [
                { id: "mat_energy_core", quantity: 3 },
                { id: "eq_guardian_plating", quantity: 1 }
            ],
            unlocks: ["block_research_lab", "ability_echo_sense"]
        }
    }
];

// ==================== 完整游戏配置 ====================

export const exampleGameContent: GameContentConfig = {
    echoes: exampleEchoes,
    bosses: exampleBosses,
    operators: exampleOperators,
    worldBlocks: exampleWorldBlocks,
    initialConfig: {
        startingOperators: ["op_observer"],
        startingBlock: "block_tutorial_01",
        initialResources: {
            "currency": 1000,
            "mat_scrap_metal": 10,
            "consum_health_pack": 5
        },
        tutorial: {
            enabled: true,
            steps: [
                "movement_tutorial",
                "combat_tutorial", 
                "echo_collection_tutorial",
                "party_management_tutorial"
            ]
        }
    }
};

// ==================== 内容验证工具 ====================

/**
 * 验证游戏内容配置的完整性
 */
export function validateGameContent(content: GameContentConfig): string[] {
    const errors: string[] = [];
    
    // 验证残响
    content.echoes.forEach(echo => {
        if (!echo.id) errors.push(`残响缺少ID`);
        if (!content.worldBlocks.find(b => b.id === echo.location.blockId)) {
            errors.push(`残响 ${echo.id} 引用了不存在的区块 ${echo.location.blockId}`);
        }
    });
    
    // 验证干员
    content.operators.forEach(operator => {
        if (!operator.id) errors.push(`干员缺少ID`);
        if (operator.progression.level < 1) errors.push(`干员 ${operator.id} 等级无效`);
    });
    
    // 验证区块连接
    content.worldBlocks.forEach(block => {
        const connections = [block.connections.north, block.connections.south, 
                           block.connections.east, block.connections.west];
        
        connections.forEach(conn => {
            if (conn && !content.worldBlocks.find(b => b.id === conn.blockId)) {
                errors.push(`区块 ${block.id} 连接到不存在的区块 ${conn.blockId}`);
            }
        });
    });
    
    // 验证初始配置
    if (content.initialConfig.startingOperators.length === 0) {
        errors.push("初始配置：没有指定起始干员");
    }
    
    content.initialConfig.startingOperators.forEach(opId => {
        if (!content.operators.find(o => o.id === opId)) {
            errors.push(`初始配置：干员 ${opId} 不存在`);
        }
    });
    
    if (!content.worldBlocks.find(b => b.id === content.initialConfig.startingBlock)) {
        errors.push(`初始配置：起始区块 ${content.initialConfig.startingBlock} 不存在`);
    }
    
    return errors;
}

/**
 * 生成游戏内容摘要报告
 */
export function generateContentReport(content: GameContentConfig): string {
    const totalEchoes = content.echoes.length;
    const collectedEchoes = content.echoes.filter(e => e.state.collected).length;
    const totalBosses = content.bosses.length;
    const totalOperators = content.operators.length;
    const totalBlocks = content.worldBlocks.length;
    
    return `
《覆幕重启》游戏内容报告
============================

内容统计:
- 残响碎片: ${collectedEchoes}/${totalEchoes} (${(collectedEchoes/totalEchoes*100).toFixed(1)}%)
- Boss数量: ${totalBosses}
- 干员数量: ${totalOperators}
- 世界区块: ${totalBlocks}

内容分布:
${content.worldBlocks.map(b => `  - ${b.name} (${b.type}, Tier ${b.tier})`).join('\n')}

初始配置:
- 起始干员: ${content.initialConfig.startingOperators.length} 名
- 起始区块: ${content.initialConfig.startingBlock}
- 教程: ${content.initialConfig.tutorial?.enabled ? '启用' : '禁用'}
    `.trim();
}