/**
 * 干员类
 * 整合职业、PAPS人格、记忆池和羁绊系统
 */
import { 
    PAPSCharacter, 
    PAPSProfile, 
    OperatorProfession, 
    ProfessionConfig,
    KEY_PAPSPARAMETERS
} from '../types/paps';
import { papsManager } from '../paps/PAPSManager';

// 职业配置映射
const PROFESSION_CONFIGS: Record<OperatorProfession, ProfessionConfig> = {
    guard: {
        type: 'guard',
        displayName: '近卫',
        color: 0xFF6B6B, // 红色
        description: '近战专家，平衡的攻击与防御',
        baseStats: {
            health: 120,
            attack: 35,
            defense: 20,
            speed: 5,
            range: 1
        }
    },
    sniper: {
        type: 'sniper',
        displayName: '狙击',
        color: 0x4ECDC4, // 青色
        description: '远程专家，高攻击低防御',
        baseStats: {
            health: 80,
            attack: 50,
            defense: 10,
            speed: 4,
            range: 5
        }
    },
    defender: {
        type: 'defender',
        displayName: '重装',
        color: 0x45B7D1, // 蓝色
        description: '防御专家，高生命高防御',
        baseStats: {
            health: 150,
            attack: 25,
            defense: 40,
            speed: 3,
            range: 1
        }
    },
    medic: {
        type: 'medic',
        displayName: '医疗',
        color: 0x96CEB4, // 绿色
        description: '治疗专家，支援队友',
        baseStats: {
            health: 90,
            attack: 15,
            defense: 15,
            speed: 4,
            range: 3
        }
    },
    caster: {
        type: 'caster',
        displayName: '术士',
        color: 0xFFEAA7, // 黄色
        description: '法术攻击，范围伤害',
        baseStats: {
            health: 70,
            attack: 45,
            defense: 15,
            speed: 4,
            range: 3
        }
    },
    supporter: {
        type: 'supporter',
        displayName: '辅助',
        color: 0xDDA0DD, // 紫色
        description: '支援控制，增强队友',
        baseStats: {
            health: 85,
            attack: 20,
            defense: 15,
            speed: 4,
            range: 3
        }
    },
    specialist: {
        type: 'specialist',
        displayName: '特种',
        color: 0xFFB347, // 橙色
        description: '特殊能力，灵活多变',
        baseStats: {
            health: 100,
            attack: 30,
            defense: 20,
            speed: 6,
            range: 2
        }
    }
};

// 预定义的干员名称库
const OPERATOR_NAMES = [
    '霜白', '炎烬', '夜影', '晨曦', '星尘',
    '辉月', '烈风', '寒露', '流云', '雷鸣',
    '暗蚀', '光烁', '岩坚', '海渊', '林幽'
];

export class Operator implements PAPSCharacter {
    id: string;
    name: string;
    profession: OperatorProfession;
    profile: PAPSProfile;
    memoryPool: string[] = [];
    bondLevel: number = 0;
    avatar?: string;
    biography?: string;
    dialogueBias: number = 0;
    
    private professionConfig: ProfessionConfig;
    
    /**
     * 创建新干员
     */
    constructor(
        name?: string,
        profession?: OperatorProfession,
        seed?: number
    ) {
        this.id = this.generateId();
        this.name = name || this.generateRandomName();
        this.profession = profession || this.generateRandomProfession();
        this.professionConfig = PROFESSION_CONFIGS[this.profession];
        
        // 生成PAPS人格
        this.profile = papsManager.generateProfileForProfession(this.profession);
        
        // 如果提供了种子，重新生成
        if (seed !== undefined) {
            this.profile = papsManager.generateRandomProfile(seed);
        }
        
        // 基于PAPS参数生成背景故事
        this.biography = this.generateBiography();
        
        // 基于PAPS参数计算对话倾向调整
        this.dialogueBias = this.calculateDialogueBias();
        
        console.log(`🎭 干员创建成功: ${this.name} (${this.professionConfig.displayName})`);
    }
    
    /**
     * 获取职业配置
     */
    public getProfessionConfig(): ProfessionConfig {
        return this.professionConfig;
    }
    
    /**
     * 获取当前属性（基于基础属性和羁绊等级）
     */
    public getCurrentStats() {
        const base = this.professionConfig.baseStats;
        const bondMultiplier = 1 + (this.bondLevel * 0.05); // 每级羁绊+5%
        
        // 基于PAPS参数调整
        const aggression = this.getParameterValue(KEY_PAPSPARAMETERS.AGGRESSION) || 0.5;
        const trust = this.getParameterValue(KEY_PAPSPARAMETERS.TRUST) || 0.5;
        const empathy = this.getParameterValue(KEY_PAPSPARAMETERS.EMPATHY) || 0.5;
        
        return {
            health: Math.floor(base.health * bondMultiplier * (0.9 + trust * 0.2)),
            attack: Math.floor(base.attack * bondMultiplier * (0.8 + aggression * 0.4)),
            defense: Math.floor(base.defense * bondMultiplier * (0.9 + empathy * 0.2)),
            speed: Math.floor(base.speed * bondMultiplier * (0.9 + (1 - aggression) * 0.2)),
            range: base.range
        };
    }
    
    /**
     * 增加羁绊经验
     */
    public addBondExperience(exp: number): boolean {
        const oldLevel = this.bondLevel;
        const maxLevel = 10;
        
        this.bondLevel = Math.min(this.bondLevel + (exp / 100), maxLevel);
        
        if (Math.floor(this.bondLevel) > Math.floor(oldLevel)) {
            console.log(`💖 ${this.name} 羁绊等级提升至 ${Math.floor(this.bondLevel)}`);
            return true;
        }
        
        return false;
    }
    
    /**
     * 获取指定参数值
     */
    public getParameterValue(paramId: string): number | undefined {
        return this.profile.rawParameters[paramId];
    }
    
    /**
     * 获取关键参数摘要
     */
    public getKeyParameters(): Record<string, number> {
        const keyParams: Record<string, number> = {};
        
        Object.entries(KEY_PAPSPARAMETERS).forEach(([key, paramId]) => {
            const value = this.getParameterValue(paramId);
            if (value !== undefined) {
                keyParams[key] = value;
            }
        });
        
        return keyParams;
    }
    
    /**
     * 添加记忆
     */
    public addMemory(memory: string): void {
        this.memoryPool.push(memory);
        
        // 限制记忆池大小
        if (this.memoryPool.length > 50) {
            this.memoryPool.shift();
        }
        
        // 记忆可能影响PAPS参数（可选）
        this.processMemoryInfluence(memory);
    }
    
    /**
     * 获取相关记忆
     */
    public getRelevantMemories(situation: string, limit: number = 3): string[] {
        // 简单的关键词匹配
        const relevantMemories: string[] = [];
        const keywords = situation.toLowerCase().split(/[\s,.!?]+/);
        
        for (const memory of this.memoryPool) {
            let relevance = 0;
            const memoryLower = memory.toLowerCase();
            
            for (const keyword of keywords) {
                if (keyword.length > 3 && memoryLower.includes(keyword)) {
                    relevance++;
                }
            }
            
            if (relevance > 0) {
                relevantMemories.push(memory);
                if (relevantMemories.length >= limit) break;
            }
        }
        
        return relevantMemories;
    }
    
    /**
     * 获取AI Prompt
     */
    public getAIPrompt(): string {
        // 在基础AI Prompt基础上添加职业和记忆信息
        let prompt = this.profile.aiPrompt;
        
        // 添加职业信息
        prompt += `\n\n# 职业背景\n`;
        prompt += `你是一名${this.professionConfig.displayName}，${this.professionConfig.description}\n`;
        
        if (this.biography) {
            prompt += `# 个人背景\n${this.biography}\n`;
        }
        
        // 添加最近的记忆
        if (this.memoryPool.length > 0) {
            const recentMemories = this.memoryPool.slice(-3).reverse();
            prompt += `\n# 近期记忆\n`;
            recentMemories.forEach((memory, index) => {
                prompt += `${index + 1}. ${memory}\n`;
            });
        }
        
        return prompt;
    }
    
    /**
     * 生成随机名称
     */
    private generateRandomName(): string {
        return OPERATOR_NAMES[Math.floor(Math.random() * OPERATOR_NAMES.length)];
    }
    
    /**
     * 生成随机职业
     */
    private generateRandomProfession(): OperatorProfession {
        const professions: OperatorProfession[] = ['guard', 'sniper', 'defender', 'medic'];
        return professions[Math.floor(Math.random() * professions.length)];
    }
    
    /**
     * 生成ID
     */
    private generateId(): string {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * 生成背景故事
     */
    private generateBiography(): string {
        const params = this.getKeyParameters();
        
        let biography = `曾是一名${this.professionConfig.displayName}。`;
        
        // 基于关键参数添加特征
        if (params.EMPATHY > 0.7) {
            biography += ` 高度共情，常常能理解他人的痛苦。`;
        } else if (params.EMPATHY < 0.3) {
            biography += ` 情感较为内敛，专注于任务本身。`;
        }
        
        if (params.GUILT > 0.7) {
            biography += ` 内心充满愧疚，总是认为自己能做得更好。`;
        }
        
        if (params.TRUST < 0.3) {
            biography += ` 对他人保持警惕，很难完全信任。`;
        } else if (params.TRUST > 0.7) {
            biography += ` 愿意给予信任，相信团队的力量。`;
        }
        
        if (params.MEANING_SEEKING > 0.7) {
            biography += ` 不断追寻行动的意义和目的。`;
        }
        
        // 添加职业相关背景
        switch (this.profession) {
            case 'guard':
                biography += ` 在多次近距离作战中积累了丰富经验。`;
                break;
            case 'sniper':
                biography += ` 擅长远距离精确打击，需要极度的专注。`;
                break;
            case 'defender':
                biography += ` 习惯站在前线保护队友。`;
                break;
            case 'medic':
                biography += ` 见证过太多生死，深知生命的脆弱。`;
                break;
        }
        
        return biography;
    }
    
    /**
     * 计算对话倾向调整
     */
    private calculateDialogueBias(): number {
        const params = this.getKeyParameters();
        
        // 基于多个参数计算整体倾向
        let bias = 0;
        
        // 共情和信任增加正向倾向
        if (params.EMPATHY) bias += (params.EMPATHY - 0.5) * 0.3;
        if (params.TRUST) bias += (params.TRUST - 0.5) * 0.2;
        
        // 内疚感可能增加谨慎倾向
        if (params.GUILT) bias -= (params.GUILT - 0.5) * 0.1;
        
        // 意义寻求可能增加哲理性
        if (params.MEANING_SEEKING) bias += (params.MEANING_SEEKING - 0.5) * 0.2;
        
        return Math.max(-1, Math.min(1, bias));
    }
    
    /**
     * 处理记忆影响
     */
    private processMemoryInfluence(memory: string): void {
        // 这里可以实现记忆对PAPS参数的动态调整
        // 例如：某些类型的记忆可能增加信任或改变倾向
        // 目前留空，后续根据游戏需求实现
    }
    
    /**
     * 导出为JSON
     */
    public toJSON(): any {
        return {
            id: this.id,
            name: this.name,
            profession: this.profession,
            profile: this.profile,
            memoryPool: this.memoryPool,
            bondLevel: this.bondLevel,
            biography: this.biography,
            dialogueBias: this.dialogueBias,
            stats: this.getCurrentStats(),
            keyParameters: this.getKeyParameters()
        };
    }
    
    /**
     * 从JSON创建
     */
    public static fromJSON(data: any): Operator {
        const operator = new Operator();
        Object.assign(operator, data);
        
        // 恢复职业配置
        if (PROFESSION_CONFIGS[operator.profession]) {
            operator.professionConfig = PROFESSION_CONFIGS[operator.profession];
        }
        
        return operator;
    }
}