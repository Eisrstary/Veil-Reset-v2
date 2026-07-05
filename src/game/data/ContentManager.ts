// ============================================================
// 《覆幕重启》游戏内容管理器
// 负责加载、验证和管理游戏内容配置
// ============================================================

import { 
    GameContentConfig, EchoFragment, BossDesign, Operator, WorldBlock,
    ContentValidationResult, ContentGenerationOptions,
    exampleGameContent, validateGameContent
} from './ExampleContent';

// ==================== 内容管理器类 ====================

export class ContentManager {
    private content: GameContentConfig;
    private playerState: {
        collectedEchoes: Set<string>;
        defeatedBosses: Set<string>;
        unlockedBlocks: Set<string>;
        operatorRelationships: Map<string, Map<string, number>>;
    };

    constructor(initialContent?: GameContentConfig) {
        this.content = initialContent || exampleGameContent;
        this.playerState = {
            collectedEchoes: new Set(),
            defeatedBosses: new Set(),
            unlockedBlocks: new Set([this.content.initialConfig.startingBlock]),
            operatorRelationships: new Map()
        };
        
        // 初始化起始干员关系
        this.content.initialConfig.startingOperators.forEach(opId => {
            this.playerState.operatorRelationships.set(opId, new Map());
        });
    }

    // ==================== 内容验证 ====================

    /**
     * 验证所有游戏内容的完整性
     */
    validateAllContent(): ContentValidationResult {
        const errors = validateGameContent(this.content);
        
        const warnings: string[] = [];
        
        // 检查内容平衡性警告
        if (this.content.echoes.length < 10) {
            warnings.push("残响数量较少，建议至少10个以上");
        }
        
        if (this.content.bosses.length < 3) {
            warnings.push("Boss数量较少，建议至少3个以上");
        }
        
        if (this.content.operators.length < 5) {
            warnings.push("干员数量较少，建议至少5个以上");
        }
        
        // 检查难度曲线
        const blockTiers = this.content.worldBlocks.map(b => b.tier);
        const uniqueTiers = new Set(blockTiers);
        if (uniqueTiers.size < 3) {
            warnings.push("世界区块难度层级较少，建议至少3个不同难度");
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    // ==================== 残响系统管理 ====================

    /**
     * 获取可收集的残响列表
     */
    getAvailableEchoes(blockId?: string): EchoFragment[] {
        return this.content.echoes.filter(echo => {
            // 未收集
            if (echo.state.collected) return false;
            
            // 如果指定了区块，只返回该区块的残响
            if (blockId && echo.location.blockId !== blockId) return false;
            
            // 检查解锁条件
            if (echo.content.unlockAbility && 
                !this.playerHasAbility(echo.content.unlockAbility)) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * 收集残响
     */
    collectEcho(echoId: string): boolean {
        const echo = this.content.echoes.find(e => e.id === echoId);
        if (!echo || echo.state.collected) {
            return false;
        }

        echo.state.collected = true;
        echo.state.collectedAt = new Date().toISOString();
        this.playerState.collectedEchoes.add(echoId);
        
        // 触发残响收集事件
        this.onEchoCollected(echo);
        
        return true;
    }

    /**
     * 获取残响收集进度
     */
    getEchoProgress() {
        const total = this.content.echoes.length;
        const collected = this.content.echoes.filter(e => e.state.collected).length;
        
        const byChapter = new Map<number, { total: number; collected: number }>();
        this.content.echoes.forEach(echo => {
            const chapter = echo.chapter;
            if (!byChapter.has(chapter)) {
                byChapter.set(chapter, { total: 0, collected: 0 });
            }
            const stats = byChapter.get(chapter)!;
            stats.total++;
            if (echo.state.collected) stats.collected++;
        });
        
        return {
            total,
            collected,
            byChapter: Array.from(byChapter.entries()).map(([chapter, stats]) => ({
                chapter,
                ...stats
            }))
        };
    }

    // ==================== Boss系统管理 ====================

    /**
     * 获取可挑战的Boss列表
     */
    getAvailableBosses(blockId?: string): BossDesign[] {
        return this.content.bosses.filter(boss => {
            // 如果已经击败，则不再显示为可挑战（除非有特殊机制）
            if (this.playerState.defeatedBosses.has(boss.id)) {
                return false;
            }
            
            // 如果指定了区块，检查Boss是否在该区块
            if (blockId) {
                const block = this.content.worldBlocks.find(b => b.id === blockId);
                if (!block) return false;
                
                // 检查区块中是否有这个Boss
                const hasBoss = block.content.enemies.some(
                    enemy => enemy.enemyTypeId === boss.id
                );
                if (!hasBoss) return false;
            }
            
            // 检查进入条件
            if (boss.tier > this.getPlayerLevel()) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * 击败Boss
     */
    defeatBoss(bossId: string): boolean {
        const boss = this.content.bosses.find(b => b.id === bossId);
        if (!boss || this.playerState.defeatedBosses.has(bossId)) {
            return false;
        }

        this.playerState.defeatedBosses.add(bossId);
        
        // 发放Boss掉落
        this.distributeBossLoot(boss);
        
        // 触发Boss击败事件
        this.onBossDefeated(boss);
        
        return true;
    }

    // ==================== 干员系统管理 ====================

    /**
     * 获取可用干员列表
     */
    getAvailableOperators(): Operator[] {
        return this.content.operators.filter(operator => {
            // 检查是否可用
            if (!operator.state.available) return false;
            
            // 检查解锁条件（如果有）
            // 这里可以添加更复杂的解锁逻辑
            
            return true;
        });
    }

    /**
     * 获取队伍中的干员
     */
    getPartyOperators(): Operator[] {
        return this.content.operators.filter(op => op.state.inParty);
    }

    /**
     * 添加干员到队伍
     */
    addToParty(operatorId: string): boolean {
        const operator = this.content.operators.find(op => op.id === operatorId);
        if (!operator || operator.state.inParty || !operator.state.available) {
            return false;
        }

        operator.state.inParty = true;
        
        // 初始化关系数据（如果还没有）
        if (!this.playerState.operatorRelationships.has(operatorId)) {
            this.playerState.operatorRelationships.set(operatorId, new Map());
        }
        
        return true;
    }

    /**
     * 从队伍移除干员
     */
    removeFromParty(operatorId: string): boolean {
        const operator = this.content.operators.find(op => op.id === operatorId);
        if (!operator || !operator.state.inParty) {
            return false;
        }

        operator.state.inParty = false;
        return true;
    }

    /**
     * 更新干员关系值
     */
    updateRelationship(operatorId: string, targetId: string, delta: number): void {
        if (!this.playerState.operatorRelationships.has(operatorId)) {
            this.playerState.operatorRelationships.set(operatorId, new Map());
        }
        
        const relationships = this.playerState.operatorRelationships.get(operatorId)!;
        const current = relationships.get(targetId) || 0;
        const newValue = Math.max(-100, Math.min(100, current + delta));
        relationships.set(targetId, newValue);
    }

    // ==================== 世界区块管理 ====================

    /**
     * 获取可进入的区块列表
     */
    getAccessibleBlocks(): WorldBlock[] {
        return this.content.worldBlocks.filter(block => {
            // 检查是否已解锁
            if (!this.playerState.unlockedBlocks.has(block.id)) {
                return false;
            }
            
            // 检查进入条件
            if (block.entryConditions.minLevel && 
                block.entryConditions.minLevel > this.getPlayerLevel()) {
                return false;
            }
            
            if (block.entryConditions.requiredBlocks) {
                const hasRequired = block.entryConditions.requiredBlocks.every(
                    reqBlock => this.playerState.unlockedBlocks.has(reqBlock)
                );
                if (!hasRequired) return false;
            }
            
            if (block.entryConditions.requiredEchoes) {
                const hasEchoes = block.entryConditions.requiredEchoes.every(
                    echoId => this.playerState.collectedEchoes.has(echoId)
                );
                if (!hasEchoes) return false;
            }
            
            if (block.entryConditions.requiredBosses) {
                const hasBosses = block.entryConditions.requiredBosses.every(
                    bossId => this.playerState.defeatedBosses.has(bossId)
                );
                if (!hasBosses) return false;
            }
            
            return true;
        });
    }

    /**
     * 解锁新区块
     */
    unlockBlock(blockId: string): boolean {
        const block = this.content.worldBlocks.find(b => b.id === blockId);
        if (!block || this.playerState.unlockedBlocks.has(blockId)) {
            return false;
        }

        this.playerState.unlockedBlocks.add(blockId);
        return true;
    }

    /**
     * 完成区块（发放奖励并解锁连接区块）
     */
    completeBlock(blockId: string): boolean {
        const block = this.content.worldBlocks.find(b => b.id === blockId);
        if (!block) return false;

        // 发放奖励
        this.distributeBlockRewards(block);
        
        // 解锁连接区块
        const connections = [
            block.connections.north,
            block.connections.south,
            block.connections.east,
            block.connections.west
        ];
        
        connections.forEach(conn => {
            if (conn) {
                this.unlockBlock(conn.blockId);
            }
        });
        
        return true;
    }

    // ==================== 游戏进度管理 ====================

    /**
     * 估算玩家等级（基于进度）
     */
    getPlayerLevel(): number {
        const baseLevel = 1;
        const echoBonus = Math.floor(this.playerState.collectedEchoes.size / 3);
        const bossBonus = this.playerState.defeatedBosses.size * 2;
        const blockBonus = Math.floor(this.playerState.unlockedBlocks.size / 2);
        
        return baseLevel + echoBonus + bossBonus + blockBonus;
    }

    /**
     * 检查玩家是否拥有特定能力
     */
    playerHasAbility(abilityId: string): boolean {
        // 这里可以根据实际游戏逻辑实现
        // 暂时返回true以简化示例
        return true;
    }

    // ==================== 事件处理 ====================

    private onEchoCollected(echo: EchoFragment): void {
        console.log(`残响收集: ${echo.name}`);
        
        // 这里可以触发游戏内事件，如：
        // - 播放收集动画
        // - 显示收集提示
        // - 更新UI
        // - 触发相关剧情
    }

    private onBossDefeated(boss: BossDesign): void {
        console.log(`Boss击败: ${boss.name}`);
        
        // 这里可以触发游戏内事件，如：
        // - 播放击败动画
        // - 显示奖励界面
        // - 解锁新内容
        // - 推进剧情
    }

    private distributeBossLoot(boss: BossDesign): void {
        console.log(`发放Boss掉落: ${boss.name}`);
        
        boss.lootTable.forEach(loot => {
            if (Math.random() < loot.dropChance) {
                const quantity = Math.floor(
                    Math.random() * (loot.maxQuantity - loot.minQuantity + 1)
                ) + loot.minQuantity;
                
                console.log(`  - 获得 ${loot.itemId} x${quantity}`);
            }
        });
    }

    private distributeBlockRewards(block: WorldBlock): void {
        console.log(`发放区块奖励: ${block.name}`);
        
        // 发放经验值
        console.log(`  - 经验值: +${block.completionRewards.experience}`);
        
        // 发放货币
        console.log(`  - 货币: +${block.completionRewards.currency}`);
        
        // 发放物品
        block.completionRewards.items.forEach(item => {
            console.log(`  - 物品: ${item.id} x${item.quantity}`);
        });
        
        // 解锁内容
        block.completionRewards.unlocks.forEach(unlock => {
            console.log(`  - 解锁: ${unlock}`);
        });
    }

    // ==================== 内容生成 ====================

    /**
     * 根据选项生成新的游戏内容
     */
    generateContent(options: ContentGenerationOptions): GameContentConfig {
        console.log(`生成游戏内容，种子: ${options.seed}, 难度: ${options.difficulty}`);
        
        // 这里可以实现程序化内容生成逻辑
        // 暂时返回示例内容
        return exampleGameContent;
    }

    // ==================== 数据持久化 ====================

    /**
     * 保存游戏状态到本地存储
     */
    saveGameState(slot: number = 1): boolean {
        try {
            const saveData = {
                content: this.content,
                playerState: {
                    collectedEchoes: Array.from(this.playerState.collectedEchoes),
                    defeatedBosses: Array.from(this.playerState.defeatedBosses),
                    unlockedBlocks: Array.from(this.playerState.unlockedBlocks),
                    operatorRelationships: Object.fromEntries(
                        Array.from(this.playerState.operatorRelationships.entries()).map(
                            ([opId, relationships]) => [opId, Object.fromEntries(relationships)]
                        )
                    )
                },
                timestamp: new Date().toISOString(),
                version: "1.0.0"
            };
            
            localStorage.setItem(`veil-reset-save-${slot}`, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error("保存游戏状态失败:", error);
            return false;
        }
    }

    /**
     * 从本地存储加载游戏状态
     */
    loadGameState(slot: number = 1): boolean {
        try {
            const saveData = localStorage.getItem(`veil-reset-save-${slot}`);
            if (!saveData) return false;
            
            const parsed = JSON.parse(saveData);
            
            // 验证保存数据版本
            if (parsed.version !== "1.0.0") {
                console.warn("保存数据版本不匹配");
                return false;
            }
            
            // 恢复内容状态
            this.content = parsed.content;
            
            // 恢复玩家状态
            this.playerState = {
                collectedEchoes: new Set(parsed.playerState.collectedEchoes),
                defeatedBosses: new Set(parsed.playerState.defeatedBosses),
                unlockedBlocks: new Set(parsed.playerState.unlockedBlocks),
                operatorRelationships: new Map(
                    Object.entries(parsed.playerState.operatorRelationships).map(
                        ([opId, relationships]) => [opId, new Map(Object.entries(relationships as Record<string, number>))]
                    )
                )
            };
            
            return true;
        } catch (error) {
            console.error("加载游戏状态失败:", error);
            return false;
        }
    }

    // ==================== 调试工具 ====================

    /**
     * 生成游戏状态报告
     */
    generateStateReport(): string {
        const playerLevel = this.getPlayerLevel();
        const echoProgress = this.getEchoProgress();
        const accessibleBlocks = this.getAccessibleBlocks();
        const availableBosses = this.getAvailableBosses();
        const partyOperators = this.getPartyOperators();
        
        return `
游戏状态报告
============

玩家进度:
- 等级: ${playerLevel}
- 残响收集: ${echoProgress.collected}/${echoProgress.total}
- 击败Boss: ${this.playerState.defeatedBosses.size}
- 解锁区块: ${this.playerState.unlockedBlocks.size}

当前队伍 (${partyOperators.length}人):
${partyOperators.map(op => `  - ${op.name} (Lv.${op.progression.level})`).join('\n')}

可进入区块 (${accessibleBlocks.length}个):
${accessibleBlocks.map(b => `  - ${b.name} (Tier ${b.tier})`).join('\n')}

可挑战Boss (${availableBosses.length}个):
${availableBosses.map(b => `  - ${b.name} (Tier ${b.tier})`).join('\n')}
        `.trim();
    }
}

// ==================== 全局内容管理器实例 ====================

let globalContentManager: ContentManager | null = null;

/**
 * 获取全局内容管理器实例
 */
export function getContentManager(): ContentManager {
    if (!globalContentManager) {
        globalContentManager = new ContentManager();
    }
    return globalContentManager;
}

/**
 * 初始化全局内容管理器
 */
export function initializeContentManager(content?: GameContentConfig): ContentManager {
    globalContentManager = new ContentManager(content);
    return globalContentManager;
}