# 覆幕重启 - 战斗系统架构设计

## 1. 系统概述

### 1.1 设计目标
- **核心体验**：回合制战术战斗，强调位置策略和技能组合
- **技术特色**：集成PAPS WASM人格系统，影响干员行为和决策
- **视觉呈现**：2.5D等距视角，动态深度排序，流畅动画
- **游戏循环**：部署 → 玩家回合 → 敌人回合 → Boss战阶段 → 结算

### 1.2 核心机制
1. **行动点系统**：每回合3点行动点，移动、攻击、技能消耗不同点数
2. **网格移动**：基于等距网格的移动系统，考虑地形和障碍
3. **技能组合**：干员技能可组合产生协同效果
4. **人格影响**：PAPS参数影响干员行为倾向和技能效果
5. **环境互动**：可破坏地形、天气效果、时间变化

## 2. 系统架构

### 2.1 核心组件关系
```
┌─────────────────────────────────────────────┐
│              战斗场景 (BattleScene)           │
├─────────────────────────────────────────────┤
│  • 管理整体战斗流程                         │
│  • 协调各子系统                             │
│  • 处理用户输入                             │
└───────────────────┬─────────────────────────┘
                    │
    ┌───────────────┼───────────────┬───────────────┐
    │               │               │               │
┌───▼──────┐  ┌────▼─────┐  ┌─────▼────┐  ┌──────▼─────┐
│战场管理器  │  │干员系统  │  │敌人系统   │  │UI渲染系统  │
│Battle     │  │Operator  │  │Enemy     │  │UIRenderer │
│Manager    │  │System    │  │System    │  │           │
├───────────┤  ├──────────┤  ├──────────┤  ├───────────┤
│• 状态管理 │  │• 干员属性│  │• 敌人AI  │  │• 战斗UI   │
│• 回合控制 │  │• 技能管理│  │• 行为树   │  │• 状态显示 │
│• 胜负判定 │  │• 装备系统│  │• 波次生成 │  │• 特效管理 │
└───────────┘  └──────────┘  └──────────┘  └───────────┘
    │               │               │               │
    └───────────────┼───────────────┼───────────────┘
                    │               │
            ┌───────▼───────┐ ┌─────▼──────┐
            │  行动系统     │ │ 效果系统    │
            │  Action       │ │ Effect     │
            │  System       │ │ System     │
            ├───────────────┤ ├────────────┤
            │• 移动验证     │ │• 伤害计算   │
            │• 攻击执行     │ │• 状态效果   │
            │• 技能释放     │ │• Buff/Debuff│
            └───────────────┘ └────────────┘
                    │               │
            ┌───────▼───────────────▼───────┐
            │       网格系统                │
            │       Grid System             │
            ├───────────────────────────────┤
            │• 等距坐标转换                 │
            │• 路径查找(A*)                 │
            │• 视线计算                     │
            │• 地形效果                     │
            └───────────────────────────────┘
```

### 2.2 数据流设计
```
用户输入 → 输入处理器 → 行动验证 → 网格计算 → 效果应用
     ↓          ↓           ↓           ↓           ↓
  UI反馈    状态更新     动画播放     伤害计算     回合结束
     ↓          ↓           ↓           ↓           ↓
视觉反馈    数据持久     音效触发     经验结算     场景切换
```

## 3. 核心系统详细设计

### 3.1 战场管理器 (BattleManager)
```typescript
class BattleManager {
    // 状态管理
    private state: BattleState;
    private phaseManager: PhaseManager;
    
    // 实体管理
    private operatorSystem: OperatorSystem;
    private enemySystem: EnemySystem;
    
    // 系统组件
    private actionSystem: ActionSystem;
    private effectSystem: EffectSystem;
    private gridSystem: IsometricGridSystem;
    
    // 初始化战斗
    async initializeBattle(battleConfig: BattleConfig): Promise<void> {
        // 1. 加载战场数据
        await this.loadBattleData(battleConfig);
        
        // 2. 初始化网格系统
        this.gridSystem.initialize(battleConfig.mapWidth, battleConfig.mapHeight);
        
        // 3. 生成战场地形
        this.generateTerrain(battleConfig.terrainType);
        
        // 4. 部署初始单位
        await this.deployInitialUnits(battleConfig);
        
        // 5. 开始战斗流程
        this.startBattle();
    }
    
    // 战斗主循环
    private async startBattle(): Promise<void> {
        this.state.phase = 'deploy';
        
        // 部署阶段
        await this.deploymentPhase();
        
        // 战斗阶段循环
        while (this.state.phase !== 'victory' && this.state.phase !== 'defeat') {
            switch (this.state.phase) {
                case 'player_turn':
                    await this.playerTurnPhase();
                    break;
                    
                case 'enemy_turn':
                    await this.enemyTurnPhase();
                    break;
                    
                case 'boss_phase':
                    await this.bossPhase();
                    break;
            }
        }
        
        // 战斗结束
        await this.endBattle();
    }
    
    // 玩家回合阶段
    private async playerTurnPhase(): Promise<void> {
        this.state.currentTurn++;
        this.state.actionPoints = this.state.maxActionPoints;
        
        // 激活干员
        for (const operator of this.operatorSystem.getActiveOperators()) {
            this.state.activeOperatorId = operator.id;
            
            // 等待玩家操作
            await this.waitForPlayerAction(operator);
            
            // 检查行动点是否用完
            if (this.state.actionPoints <= 0) {
                break;
            }
        }
        
        // 切换到敌人回合
        this.state.phase = 'enemy_turn';
    }
    
    // 敌人回合阶段
    private async enemyTurnPhase(): Promise<void> {
        // 执行所有敌人行动
        for (const enemy of this.enemySystem.getActiveEnemies()) {
            await this.executeEnemyAI(enemy);
        }
        
        // 应用回合结束效果
        this.effectSystem.applyTurnEndEffects();
        
        // 检查是否触发Boss战
        if (this.shouldTriggerBossPhase()) {
            this.state.phase = 'boss_phase';
        } else {
            this.state.phase = 'player_turn';
        }
    }
}
```

### 3.2 干员系统 (OperatorSystem)
```typescript
class OperatorSystem {
    private operators: Map<string, BattleOperator> = new Map();
    private papsSystem: PAPSIntegration;
    
    // 创建战斗干员
    createBattleOperator(baseOperator: OperatorData): BattleOperator {
        const battleOperator: BattleOperator = {
            ...baseOperator,
            
            // 战斗属性
            currentHealth: baseOperator.maxHealth,
            currentSanity: baseOperator.maxSanity,
            actionPoints: 0,
            
            // 位置信息
            gridCol: null,
            gridRow: null,
            
            // 状态管理
            statusEffects: [],
            buffs: [],
            cooldowns: new Map(),
            
            // PAPS人格影响
            personalityInfluence: this.calculatePersonalityInfluence(baseOperator.personalityParams),
            
            // 技能系统
            skills: this.initializeSkills(baseOperator.skillIds),
            equipment: this.initializeEquipment(baseOperator.equipmentIds),
            
            // 战斗方法
            takeDamage: (amount: number, source?: string) => {
                this.handleDamage(battleOperator, amount, source);
            },
            
            heal: (amount: number) => {
                battleOperator.currentHealth = Math.min(
                    battleOperator.currentHealth + amount,
                    battleOperator.maxHealth
                );
            },
            
            // 更多方法...
        };
        
        this.operators.set(battleOperator.id, battleOperator);
        return battleOperator;
    }
    
    // 计算PAPS人格对战斗的影响
    private calculatePersonalityInfluence(params: PersonalityParams): PersonalityInfluence {
        return {
            // 威胁感知(A008)影响对敌人位置的敏感度
            threatAwareness: params.A008 * 0.1,
            
            // 共情能力(A009)影响治疗和支援技能效果
            empathyBonus: params.A009 * 0.15,
            
            // 负罪感(B015)影响防御时对队友的保护倾向
            guiltProtection: params.B015 * 0.2,
            
            // 更多人格影响...
        };
    }
    
    // 初始化技能
    private initializeSkills(skillIds: string[]): Map<string, BattleSkill> {
        const skills = new Map<string, BattleSkill>();
        
        for (const skillId of skillIds) {
            const skillData = this.loadSkillData(skillId);
            const battleSkill: BattleSkill = {
                ...skillData,
                currentCooldown: 0,
                charges: skillData.maxCharges || 1
            };
            
            skills.set(skillId, battleSkill);
        }
        
        return skills;
    }
    
    // 干员升级系统
    levelUpOperator(operatorId: string): LevelUpResult {
        const operator = this.operators.get(operatorId);
        if (!operator) throw new Error('干员不存在');
        
        operator.level++;
        
        // 属性成长
        const growthRates = operator.growthRates;
        operator.maxHealth += growthRates.health;
        operator.attackPower += growthRates.attack;
        operator.defensePower += growthRates.defense;
        operator.speed += growthRates.speed;
        
        // 学习新技能（每5级）
        if (operator.level % 5 === 0) {
            const newSkill = this.unlockNewSkill(operator);
            if (newSkill) {
                operator.skills.set(newSkill.id, newSkill);
            }
        }
        
        // 恢复生命值
        operator.currentHealth = operator.maxHealth;
        
        return {
            success: true,
            newLevel: operator.level,
            statIncreases: growthRates,
            newSkill: operator.level % 5 === 0 ? this.getUnlockedSkill(operator) : null
        };
    }
}
```

### 3.3 行动系统 (ActionSystem)
```typescript
class ActionSystem {
    private gridSystem: IsometricGridSystem;
    private effectSystem: EffectSystem;
    
    // 移动验证和执行
    async moveOperator(operator: BattleOperator, targetCol: number, targetRow: number): Promise<MoveResult> {
        // 1. 验证移动合法性
        const validation = this.validateMove(operator, targetCol, targetRow);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // 2. 计算移动路径
        const path = this.calculatePath(
            operator.gridCol!, operator.gridRow!,
            targetCol, targetRow,
            operator.movementRange
        );
        
        if (!path || path.length === 0) {
            return { success: false, reason: '无法到达目标位置' };
        }
        
        // 3. 消耗行动点
        const cost = this.calculateMoveCost(path, operator);
        if (cost > operator.actionPoints) {
            return { success: false, reason: '行动点不足' };
        }
        
        // 4. 执行移动
        operator.actionPoints -= cost;
        
        // 5. 播放移动动画
        await this.playMovementAnimation(operator, path);
        
        // 6. 更新位置
        operator.gridCol = targetCol;
        operator.gridRow = targetRow;
        
        // 7. 更新深度排序
        operator.updateDepth();
        
        // 8. 触发移动相关效果
        this.effectSystem.triggerOnMoveEffects(operator, path);
        
        return {
            success: true,
            path,
            cost,
            finalPosition: { col: targetCol, row: targetRow }
        };
    }
    
    // 攻击执行
    async executeAttack(attacker: BattleUnit, target: BattleUnit, skill: BattleSkill): Promise<AttackResult> {
        // 1. 验证攻击
        const validation = this.validateAttack(attacker, target, skill);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // 2. 消耗资源
        attacker.actionPoints -= skill.actionPointCost;
        skill.currentCooldown = skill.cooldown;
        if (skill.charges !== undefined) {
            skill.charges--;
        }
        
        // 3. 计算命中率
        const hitChance = this.calculateHitChance(attacker, target, skill);
        const isHit = Math.random() * 100 < hitChance;
        
        if (!isHit) {
            await this.playMissAnimation(attacker, target);
            return { success: false, reason: '未命中', hitChance };
        }
        
        // 4. 计算伤害
        const damageResult = this.effectSystem.calculateDamage(attacker, target, skill);
        
        // 5. 应用伤害
        target.takeDamage(damageResult.damage, attacker.id);
        
        // 6. 播放攻击动画
        await this.playAttackAnimation(attacker, target, skill, damageResult);
        
        // 7. 应用技能效果
        for (const effect of skill.effects) {
            await this.applySkillEffect(attacker, target, skill, effect, damageResult);
        }
        
        // 8. 处理反击（如果有）
        if (target.canCounterAttack && this.canCounterAttack(attacker, target)) {
            await this.executeCounterAttack(target, attacker);
        }
        
        return {
            success: true,
            damage: damageResult.damage,
            isCritical: damageResult.isCritical,
            effectsApplied: skill.effects.map(e => e.type),
            hitChance
        };
    }
    
    // 技能释放
    async useSkill(operator: BattleOperator, skill: BattleSkill, target?: BattleUnit | BattleTile): Promise<SkillResult> {
        // 1. 验证技能
        const validation = this.validateSkill(operator, skill, target);
        if (!validation.valid) {
            return { success: false, reason: validation.reason };
        }
        
        // 2. 消耗资源
        operator.actionPoints -= skill.actionPointCost;
        operator.currentSanity -= skill.sanityCost || 0;
        skill.currentCooldown = skill.cooldown;
        
        // 3. 执行技能逻辑
        switch (skill.targetType) {
            case 'enemy_single':
                return await this.executeSingleTargetSkill(operator, skill, target as BattleUnit);
                
            case 'enemy_area':
                return await this.executeAreaSkill(operator, skill, target as BattleTile);
                
            case 'ally_single':
                return await this.executeAllySkill(operator, skill, target as BattleUnit);
                
            case 'self':
                return await this.executeSelfSkill(operator, skill);
                
            case 'tile':
                return await this.executeTileSkill(operator, skill, target as BattleTile);
        }
    }
}
```

### 3.4 效果系统 (EffectSystem)
```typescript
class EffectSystem {
    // 伤害计算
    calculateDamage(attacker: BattleUnit, target: BattleUnit, skill: BattleSkill): DamageResult {
        let baseDamage = skill.baseDamage;
        
        // 1. 攻击者加成
        baseDamage += attacker.attackPower * skill.attackScaling;
        
        // 2. 技能倍率
        baseDamage *= skill.damageMultiplier;
        
        // 3. 属性克制
        const typeMultiplier = this.calculateTypeMultiplier(skill.element, target.element);
        baseDamage *= typeMultiplier;
        
        // 4. 防御减免
        const defenseReduction = target.defensePower * 0.5;
        baseDamage = Math.max(1, baseDamage - defenseReduction);
        
        // 5. 暴击计算
        let isCritical = false;
        const critChance = attacker.criticalChance + (skill.criticalChance || 0);
        if (Math.random() * 100 < critChance) {
            isCritical = true;
            baseDamage *= attacker.criticalDamage;
        }
        
        // 6. 随机波动（±10%）
        const variance = 0.9 + Math.random() * 0.2;
        baseDamage = Math.floor(baseDamage * variance);
        
        // 7. 护盾/伤害减免效果
        baseDamage = this.applyDefensiveEffects(target, baseDamage);
        
        return {
            damage: baseDamage,
            isCritical,
            typeMultiplier,
            wasBlocked: false // 简化版
        };
    }
    
    // 状态效果管理
    class StatusEffectManager {
        private effects: Map<string, ActiveStatusEffect> = new Map();
        
        // 应用状态效果
        applyStatusEffect(target: BattleUnit, effect: StatusEffect, source: string): void {
            const existingEffect = this.effects.get(`${target.id}_${effect.type}`);
            
            if (existingEffect) {
                // 刷新持续时间或叠加层数
                if (effect.stackable) {
                    existingEffect.stacks = Math.min(
                        existingEffect.maxStacks || 3,
                        existingEffect.stacks + 1
                    );
                    existingEffect.duration = effect.duration;
                } else {
                    existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
                }
            } else {
                // 创建新效果
                const activeEffect: ActiveStatusEffect = {
                    id: `${target.id}_${effect.type}_${Date.now()}`,
                    type: effect.type,
                    targetId: target.id,
                    sourceId: source,
                    duration: effect.duration,
                    stacks: 1,
                    maxStacks: effect.maxStacks,
                    data: effect.data || {}
                };
                
                this.effects.set(activeEffect.id, activeEffect);
                
                // 应用效果初始逻辑
                this.applyEffectLogic(target, activeEffect);
            }
        }
        
        // 每回合处理效果
        processTurnEffects(): void {
            for (const [effectId, effect] of this.effects) {
                // 减少持续时间
                effect.duration--;
                
                // 执行每回合效果（如燃烧伤害）
                this.processEffectPerTurn(effect);
                
                // 检查是否结束
                if (effect.duration <= 0) {
                    this.removeEffect(effectId);
                }
            }
        }
        
        // 处理燃烧效果
        private processBurnEffect(effect: ActiveStatusEffect): void {
            const target = this.getUnitById(effect.targetId);
            if (!target) return;
            
            // 每回合造成伤害
            const damage = effect.data.damagePerTurn || 10;
            const stacks = effect.stacks || 1;
            
            target.takeDamage(damage * stacks, effect.sourceId);
            
            // 播放燃烧特效
            this.playEffectAnimation('burn', target);
        }
        
        // 处理眩晕效果
        private processStunEffect(effect: ActiveStatusEffect): void {
            const target = this.getUnitById(effect.targetId);
            if (!target) return;
            
            // 眩晕单位无法行动
            target.canAct = false;
            
            // 播放眩晕特效
            this.playEffectAnimation('stun', target);
        }
    }
}
```

### 3.5 敌人AI系统
```typescript
class EnemyAISystem {
    private behaviorTrees: Map<string, BehaviorTree> = new Map();
    
    // 执行敌人AI
    async executeEnemyAI(enemy: BattleEnemy): Promise<void> {
        const behaviorTree = this.getBehaviorTree(enemy.aiType);
        
        // 执行行为树
        const result = await behaviorTree.execute(enemy, this.getAIContext(enemy));
        
        if (result.action) {
            await this.executeAIAction(enemy, result.action);
        }
    }
    
    // 获取AI决策上下文
    private getAIContext(enemy: BattleEnemy): AIContext {
        return {
            enemy,
            playerOperators: this.getPlayerOperators(),
            battleState: this.getBattleState(),
            gridSystem: this.gridSystem,
            
            // 评估函数
            evaluateThreat: (operator: BattleOperator) => this.evaluateThreat(enemy, operator),
            findBestTarget: () => this.findBestTarget(enemy),
            calculateOptimalPosition: () => this.calculateOptimalPosition(enemy),
            
            // 更多上下文信息...
        };
    }
    
    // 行为树定义
    private createAggressiveBehaviorTree(): BehaviorTree {
        return new BehaviorTree(
            new Selector([
                // 优先级1：低生命值时撤退
                new Sequence([
                    new Condition(() => this.isHealthLow()),
                    new Action('retreat_to_safe_position')
                ]),
                
                // 优先级2：使用强力技能
                new Sequence([
                    new Condition(() => this.hasPowerfulSkillAvailable()),
                    new Condition(() => this.hasValidTargetForSkill()),
                    new Action('use_powerful_skill')
                ]),
                
                // 优先级3：攻击最近的目标
                new Sequence([
                    new Condition(() => this.hasAttackTarget()),
                    new Action('attack_nearest_target')
                ]),
                
                // 优先级4：移动到有利位置
                new Action('move_to_advantageous_position')
            ])
        );
    }
    
    // Boss AI特殊逻辑
    private createBossBehaviorTree(boss: BossEnemy): BehaviorTree {
        return new BehaviorTree(
            new PhaseSelector([
                // 阶段1：常规攻击
                new Phase('phase1', 70, // 血量阈值70%
                    new Selector([
                        new Sequence([
                            new Condition(() => boss.phase1SkillsAvailable()),
                            new Action('use_phase1_signature_skill')
                        ]),
                        new Action('phase1_default_attack')
                    ])
                ),
                
                // 阶段2：增强攻击
                new Phase('phase2', 40, // 血量阈值40%
                    new Selector([
                        new Sequence([
                            new Condition(() => boss.canTransform()),
                            new Action('transform_to_phase2')
                        ]),
                        new Sequence([
                            new Condition(() => boss.phase2SkillsAvailable()),
                            new Action('use_phase2_aoe_skill')
                        ]),
                        new Action('phase2_enhanced_attack')
                    ])
                ),
                
                // 阶段3：绝望阶段
                new Phase('phase3', 20, // 血量阈值20%
                    new Selector([
                        new Sequence([
                            new Condition(() => boss.canEnrage()),
                            new Action('enrage_and_attack_all')
                        ]),
                        new Action('phase3_frenzy_attack')
                    ])
                )
            ])
        );
    }
}
```

## 4. PAPS人格系统集成

### 4.1 人格参数影响战斗
```typescript
class PAPSCombatIntegration {
    private papsSystem: PAPSWebAssembly;
    
    // 初始化PAPS系统
    async initialize(): Promise<void> {
        this.papsSystem = await PAPSWebAssembly.initialize();
    }
    
    // 人格影响干员决策
    calculateOperatorDecision(operator: BattleOperator, availableActions: Action[]): Action {
        // 获取人格参数
        const personality = operator.personalityParams;
        
        // 计算每个行动的"人格适配度"
        const scoredActions = availableActions.map(action => {
            let score = 0;
            
            // 威胁感知(A008)影响攻击性选择
            if (action.type === 'attack') {
                score += personality.A008 * 0.2;
            }
            
            // 共情能力(A009)影响支援选择
            if (action.type === 'support' || action.type === 'heal') {
                score += personality.A009 * 0.3;
            }
            
            // 负罪感(B015)影响保护队友的选择
            if (action.type === 'protect' || action.type === 'defend') {
                score += personality.B015 * 0.25;
            }
            
            // 谨慎性(C004)影响风险规避
            if (action.isRisky) {
                score -= personality.C004 * 0.15;
            }
            
            // 更多人格影响计算...
            
            return { action, score };
        });
        
        // 选择最高分的行动
        scoredActions.sort((a, b) => b.score - a.score);
        return scoredActions[0].action;
    }
    
    // 人格影响技能效果
    applyPersonalityToSkill(skill: BattleSkill, operator: BattleOperator): ModifiedSkill {
        const personality = operator.personalityParams;
        
        const modifiedSkill = { ...skill };
        
        // 外向性(A001)影响范围技能
        if (skill.targetType === 'enemy_area') {
            modifiedSkill.areaRadius += personality.A001 * 0.1;
        }
        
        // 神经质(A007)影响暴击率但不稳定性
        if (skill.canCritical) {
            modifiedSkill.criticalChance += personality.A007 * 0.05;
            modifiedSkill.damageVariance += personality.A007 * 0.1; // 增加不稳定性
        }
        
        // 宜人性(A010)影响治疗和支援效果
        if (skill.effects.some(e => e.type === 'heal' || e.type === 'buff')) {
            for (const effect of modifiedSkill.effects) {
                if (effect.value) {
                    effect.value *= (1 + personality.A010 * 0.05);
                }
            }
        }
        
        return modifiedSkill;
    }
    
    // 压力系统与人格
    calculateStressImpact(operator: BattleOperator, stressEvent: StressEvent): StressImpact {
        const personality = operator.personalityParams;
        
        let stressAmount = stressEvent.baseStress;
        
        // 神经质(A007)高的干员更容易受压力影响
        stressAmount *= (1 + personality.A007 * 0.1);
        
        // 情绪稳定性(A006)高的干员更能抵抗压力
        stressAmount *= (1 - personality.A006 * 0.08);
        
        // 应用压力效果
        operator.currentSanity -= stressAmount;
        
        // 检查是否触发精神崩溃
        if (operator.currentSanity <= 0) {
            return this.triggerMentalBreakdown(operator, personality);
        }
        
        return {
            stressAmount,
            sanityRemaining: operator.currentSanity,
            effects: this.getStressEffects(stressAmount, personality)
        };
    }
}
```

## 5. 性能优化策略

### 5.1 渲染优化
```typescript
class BattleRenderingOptimizer {
    // 精灵批处理
    private spriteBatches: Map<string, SpriteBatch> = new Map();
    
    // 视锥体剔除
    cullOutsideViewport(sprites: Phaser.GameObjects.Sprite[]): Phaser.GameObjects.Sprite[] {
        const camera = this.scene.cameras.main;
        const viewport = camera.getBounds();
        
        return sprites.filter(sprite => {
            const bounds = sprite.getBounds();
            return Phaser.Geom.Rectangle.Overlaps(bounds, viewport);
        });
    }
    
    // LOD系统
    setupLODSystem(): void {
        // 根据距离设置不同细节层次
        this.scene.events.on('preupdate', () => {
            const cameraCenter = this.scene.cameras.main.getCenter();
            
            for (const sprite of this.getAllSprites()) {
                const distance = Phaser.Math.Distance.Between(
                    sprite.x, sprite.y,
                    cameraCenter.x, cameraCenter.y
                );
                
                if (distance > 800) {
                    sprite.setTexture(sprite.texture.key + '_low');
                } else if (distance > 400) {
                    sprite.setTexture(sprite.texture.key + '_medium');
                } else {
                    sprite.setTexture(sprite.texture.key + '_high');
                }
            }
        });
    }
    
    // 对象池
    private operatorPool: ObjectPool<BattleOperatorSprite>;
    
    getOperatorSprite(operatorId: string): BattleOperatorSprite {
        let sprite = this.operatorPool.get();
        
        if (!sprite) {
            sprite = this.createOperatorSprite(operatorId);
            this.operatorPool.add(sprite);
        }
        
        sprite.revive(operatorId);
        return sprite;
    }
    
    returnOperatorSprite(sprite: BattleOperatorSprite): void {
        sprite.sleep();
        this.operatorPool.return(sprite);
    }
}
```

### 5.2 内存管理
```typescript
class BattleMemoryManager {
    // 资源预加载策略
    async preloadBattleResources(battleId: string): Promise<void> {
        const battleConfig = await this.loadBattleConfig(battleId);
        
        // 预加载精灵表
        await this.preloadSpritesheets(battleConfig.requiredSprites);
        
        // 预加载音效
        await this.preloadAudio(battleConfig.requiredAudio);
        
        // 预加载特效
        await this.preloadEffects(battleConfig.requiredEffects);
        
        // 预加载WASM模块（如果需要）
        if (battleConfig.requiresPAPS) {
            await this.preloadPAPSModule();
        }
    }
    
    // 动态加载/卸载
    manageDynamicResources(): void {
        // 监控内存使用
        const memoryUsage = this.getMemoryUsage();
        
        if (memoryUsage > 0.8) { // 超过80%
            this.unloadUnusedResources();
        }
        
        // 预测性加载
        if (this.isBossBattleApproaching()) {
            this.preloadBossResources();
        }
    }
}
```

## 6. 测试与调试

### 6.1 单元测试策略
```typescript
describe('战斗系统单元测试', () => {
    describe('伤害计算', () => {
        test('基础伤害计算', () => {
            const attacker = createMockAttacker({ attackPower: 50 });
            const target = createMockTarget({ defensePower: 30 });
            const skill = createMockSkill({ baseDamage: 100, damageMultiplier: 1.0 });
            
            const result = effectSystem.calculateDamage(attacker, target, skill);
            
            expect(result.damage).toBeGreaterThan(0);
            expect(result.damage).toBeLessThanOrEqual(120); // 考虑随机波动
        });
        
        test('属性克制系统', () => {
            const fireSkill = createMockSkill({ element: 'fire' });
            const natureTarget = createMockTarget({ element: 'nature' });
            
            const result = effectSystem.calculateTypeMultiplier('fire', 'nature');
            
            expect(result).toBe(1.5); // 火克自然
        });
    });
    
    describe('AI系统', () => {
        test('敌人选择目标逻辑', () => {
            const enemy = createMockEnemy({ aiType: 'aggressive' });
            const weakOperator = createMockOperator({ currentHealth: 10 });
            const strongOperator = createMockOperator({ currentHealth: 100 });
            
            const target = aiSystem.findBestTarget(enemy, [weakOperator, strongOperator]);
            
            expect(target.id).toBe(weakOperator.id); // 应选择生命值低的
        });
        
        test('Boss阶段转换', () => {
            const boss = createMockBoss({ currentHealth: 100, maxHealth: 100 });
            
            // 第一次攻击，血量降到69%
            boss.takeDamage(31);
            expect(boss.currentPhase).toBe('phase1');
            
            // 第二次攻击，血量降到39%
            boss.takeDamage(30);
            expect(boss.currentPhase).toBe('phase2');
            
            // 第三次攻击，血量降到19%
            boss.takeDamage(20);
            expect(boss.currentPhase).toBe('phase3');
        });
    });
});
```

### 6.2 性能测试
```typescript
describe('性能测试', () => {
    test('大规模单位渲染性能', async () => {
        // 创建100个单位
        const units = Array.from({ length: 100 }, (_, i) => 
            createBattleOperator(`operator_${i}`)
        );
        
        const startTime = performance.now();
        
        // 渲染所有单位
        await renderer.renderBattleUnits(units);
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // 确保渲染时间在可接受范围内
        expect(renderTime).toBeLessThan(100); // 100毫秒内渲染100个单位
    });
    
    test('路径查找性能', () => {
        const gridSystem = new IsometricGridSystem(20, 15);
        
        const startTime = performance.now();
        
        // 执行1000次路径查找
        for (let i = 0; i < 1000; i++) {
            gridSystem.findPath(
                { col: 0, row: 0 },
                { col: 19, row: 14 },
                { avoidEnemies: true, maxCost: 20 }
            );
        }
        
        const endTime = performance.now();
        const averageTime = (endTime - startTime) / 1000;
        
        expect(averageTime).toBeLessThan(1); // 平均每次路径查找小于1毫秒
    });
});
```

## 7. 实施计划

### 7.1 第一阶段：核心框架（2周）
1. **基础架构搭建**
   - 创建等距网格系统
   - 实现基础精灵渲染和深度排序
   - 建立场景管理和状态机

2. **基本战斗循环**
   - 实现回合制系统
   - 创建移动和基础攻击
   - 添加简单UI反馈

### 7.2 第二阶段：系统完善（3周）
1. **技能系统**
   - 实现技能数据结构和效果系统
   - 添加技能冷却和资源消耗
   - 创建技能动画和特效

2. **AI系统**
   - 实现基础敌人AI
   - 添加行为树系统
   - 创建Boss战特殊逻辑

3. **PAPS集成**
   - 集成WASM人格系统
   - 实现人格影响战斗逻辑
   - 添加压力和精神状态系统

### 7.3 第三阶段：内容填充（2周）
1. **干员系统**
   - 实现干员成长和装备
   - 添加多种技能类型
   - 创建角色动画和配音

2. **环境互动**
   - 添加可破坏地形
   - 实现天气和时间系统
   - 创建环境特效

3. **平衡调整**
   - 数值平衡测试
   - 难度曲线调整
   - 玩家反馈收集

### 7.4 第四阶段：优化发布（1周）
1. **性能优化**
   - 渲染性能优化
   - 内存使用优化
   - 加载时间优化

2. **测试验证**
   - 全功能测试
   - 跨平台兼容性测试
   - 用户验收测试

3. **发布准备**
   - 文档整理
   - 教程创建
   - 错误修复和最后调整

## 8. 风险评估与缓解

### 8.1 技术风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 等距渲染性能问题 | 中 | 高 | 提前进行性能测试，实现LOD和批处理 |
| WASM集成复杂性 | 高 | 中 | 分阶段集成，提供降级方案 |
| 内存泄漏 | 中 | 高 | 严格的内存管理，使用对象池 |
| 跨平台兼容性 | 低 | 中 | 早期测试不同平台，使用标准API |

### 8.2 设计风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 战斗节奏太慢 | 中 | 高 | 玩家测试，添加加速选项 |
| 技能平衡困难 | 高 | 高 | 数据驱动平衡，A/B测试 |
| 学习曲线过陡 | 中 | 中 | 渐进式教程，难度分级 |
| 叙事与玩法脱节 | 低 | 中 | 早期融合设计，定期评审 |

### 8.3 项目管理风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 开发时间不足 | 中 | 高 | 优先核心功能，模块化开发 |
| 团队沟通问题 | 低 | 中 | 定期同步，明确接口定义 |
| 需求变更频繁 | 高 | 中 | 灵活架构，版本控制 |
| 测试覆盖不足 | 中 | 高 | 自动化测试，持续集成 |

## 9. 成功标准

### 9.1 技术标准
- **性能**：60FPS稳定运行，加载时间<3秒
- **稳定性**：崩溃率<0.1%，无内存泄漏
- **兼容性**：支持主流浏览器和分辨率
- **可维护性**：模块化设计，文档齐全

### 9.2 设计标准
- **可玩性**：平均游戏时长>20小时，复玩价值高
- **平衡性**：各干员和技能都有使用场景
- **易用性**：新玩家30分钟内掌握基本操作
- **沉浸感**：叙事与玩法紧密结合，情绪投入

### 9.3 商业标准
- **完成度**：实现设计文档90%以上功能
- **质量**：Bug数量<50，严重Bug为0
- **时间**：按计划8周内完成
- **成本**：控制在预算范围内

---
*文档版本：1.0*
*最后更新：2026-07-05*
*负责人：gameplay-designer*