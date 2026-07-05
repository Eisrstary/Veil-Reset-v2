/**
 * PAPS WASM 测试场景
 * 验证PAPS集成和Operator功能
 */
import { Scene } from 'phaser';
import { papsManager } from '../paps/PAPSManager';
import { Operator } from '../entities/Operator';
import { KEY_PAPSPARAMETERS } from '../types/paps';

export class PAPSTestScene extends Scene {
    private testResults: string[] = [];
    private currentTest = 0;
    private totalTests = 0;
    private outputText!: Phaser.GameObjects.Text;
    private progressBar!: Phaser.GameObjects.Rectangle;
    private progressFill!: Phaser.GameObjects.Rectangle;
    
    constructor() {
        super({ key: 'PAPSTestScene' });
    }
    
    preload() {
        // 预加载资源
    }
    
    async create() {
        this.cameras.main.fadeIn(900, 6, 6, 18);
        
        // 背景
        this.add.rectangle(0, 0, 1920, 1080, 0x04060f, 1).setOrigin(0, 0).setDepth(-1);
        
        // 标题
        this.add.text(960, 80, '🔬 PAPS WASM 集成测试', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 48,
            color: '#80b0f0',
            stroke: '#091120',
            strokeThickness: 6,
        }).setOrigin(0.5);
        
        // 进度条背景
        this.progressBar = this.add.rectangle(960, 150, 800, 20, 0x0e1a2e, 0.9)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x3b5a8c, 0.5);
        
        // 进度条填充
        this.progressFill = this.add.rectangle(960 - 400, 150, 0, 20, 0x4470b8, 0.85)
            .setOrigin(0, 0.5);
        
        // 输出区域
        const outputBg = this.add.rectangle(960, 600, 1400, 700, 0x060d1a, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0x2f5c76, 0.6);
        
        this.outputText = this.add.text(260, 260, '正在准备测试...', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 20,
            color: '#e0e8ff',
            wordWrap: { width: 1400 }
        }).setOrigin(0, 0);
        
        // 按钮
        this.createButton(960, 1000, '开始测试', () => this.runAllTests());
        this.createButton(760, 1000, '返回主幕', () => this.scene.start('HomeScene'));
        this.createButton(1160, 1000, '快速测试', () => this.runQuickTest());
        
        // 初始化日志
        this.log('📝 PAPS WASM 集成测试场景已加载');
        this.log('请点击"开始测试"运行完整测试套件');
    }
    
    /**
     * 创建按钮
     */
    private createButton(x: number, y: number, label: string, callback: () => void) {
        const button = this.add.rectangle(x, y, 180, 52, 0x1d324e, 0.94)
            .setStrokeStyle(2, 0x84b4ff, 0.9)
            .setInteractive({ useHandCursor: true });
        
        button.on('pointerdown', callback);
        button.on('pointerover', () => button.setFillStyle(0x243a65, 0.98));
        button.on('pointerout', () => button.setFillStyle(0x1d324e, 0.94));
        
        this.add.text(x, y, label, {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 22,
            color: '#eef7ff'
        }).setOrigin(0.5);
    }
    
    /**
     * 运行所有测试
     */
    private async runAllTests() {
        this.testResults = [];
        this.currentTest = 0;
        this.totalTests = 7;
        
        this.log('🚀 开始运行完整测试套件...\n');
        
        // 测试1: PAPS初始化
        await this.testPAPSInitialization();
        
        // 测试2: 基础功能
        await this.testBasicFunctionality();
        
        // 测试3: 参数操作
        await this.testParameterOperations();
        
        // 测试4: 角色生成
        await this.testCharacterGeneration();
        
        // 测试5: 批量生成
        await this.testBatchGeneration();
        
        // 测试6: 职业系统
        await this.testProfessionSystem();
        
        // 测试7: 记忆与羁绊
        await this.testMemoryAndBond();
        
        this.log('\n🎉 所有测试完成！');
        this.log(`✅ 通过: ${this.testResults.filter(r => r.includes('✅')).length}`);
        this.log(`⚠️ 警告: ${this.testResults.filter(r => r.includes('⚠️')).length}`);
        this.log(`❌ 失败: ${this.testResults.filter(r => r.includes('❌')).length}`);
    }
    
    /**
     * 运行快速测试
     */
    private async runQuickTest() {
        this.testResults = [];
        this.currentTest = 0;
        this.totalTests = 3;
        
        this.log('⚡ 运行快速测试...\n');
        
        // 测试1: PAPS初始化
        await this.testPAPSInitialization();
        
        // 测试2: 角色生成
        await this.testCharacterGeneration();
        
        // 测试3: 职业系统
        await this.testProfessionSystem();
        
        this.log('\n🎯 快速测试完成！');
    }
    
    /**
     * 更新进度条
     */
    private updateProgress() {
        this.currentTest++;
        const progress = this.currentTest / this.totalTests;
        this.progressFill.width = 800 * progress;
        
        // 进度条动画
        this.tweens.add({
            targets: this.progressFill,
            width: 800 * progress,
            duration: 300,
            ease: 'Power2'
        });
    }
    
    /**
     * 记录日志
     */
    private log(message: string) {
        console.log(message);
        this.outputText.text += '\n' + message;
        
        // 滚动到最新消息
        const lines = this.outputText.text.split('\n');
        if (lines.length > 30) {
            this.outputText.text = lines.slice(-30).join('\n');
        }
    }
    
    /**
     * 测试1: PAPS初始化
     */
    private async testPAPSInitialization(): Promise<void> {
        this.log('\n🔧 测试1: PAPS WASM 初始化');
        
        try {
            const startTime = Date.now();
            const success = await papsManager.initialize();
            const duration = Date.now() - startTime;
            
            if (success) {
                this.log(`✅ PAPS初始化成功 (${duration}ms)`);
                this.testResults.push('✅ PAPS初始化成功');
                
                // 显示系统信息
                const info = papsManager.getSystemInfo();
                this.log(`  版本: ${info.version || '未知'}`);
                this.log(`  参数数量: ${info.parameter_count || '未知'}`);
            } else {
                this.log(`❌ PAPS初始化失败`);
                this.testResults.push('❌ PAPS初始化失败');
            }
        } catch (error) {
            this.log(`❌ PAPS初始化异常: ${error}`);
            this.testResults.push('❌ PAPS初始化异常');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试2: 基础功能
     */
    private async testBasicFunctionality(): Promise<void> {
        this.log('\n⚙️ 测试2: 基础功能');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 基础功能跳过');
            this.updateProgress();
            return;
        }
        
        try {
            // 生成随机人格
            const profile = papsManager.generateRandomProfile();
            
            this.log(`✅ 随机人格生成成功`);
            this.log(`  AI Prompt长度: ${profile.aiPrompt.length} 字符`);
            this.log(`  人类可读长度: ${profile.humanReadable.length} 字符`);
            this.log(`  参数数量: ${Object.keys(profile.rawParameters).length}`);
            
            // 验证参数范围
            const params = Object.values(profile.rawParameters);
            const validParams = params.filter(v => v >= 0 && v <= 1);
            
            if (validParams.length === params.length) {
                this.log(`✅ 所有参数值在有效范围内 (0-1)`);
            } else {
                this.log(`⚠️ ${params.length - validParams.length} 个参数值超出范围`);
            }
            
            this.testResults.push('✅ 基础功能正常');
            
        } catch (error) {
            this.log(`❌ 基础功能测试失败: ${error}`);
            this.testResults.push('❌ 基础功能测试失败');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试3: 参数操作
     */
    private async testParameterOperations(): Promise<void> {
        this.log('\n🎛️ 测试3: 参数操作');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 参数操作跳过');
            this.updateProgress();
            return;
        }
        
        try {
            // 测试指定倾向生成
            const tendencies = {
                [KEY_PAPSPARAMETERS.THREAT_PERCEPTION]: 'very_low',
                [KEY_PAPSPARAMETERS.EMPATHY]: 'very_high',
                [KEY_PAPSPARAMETERS.TRUST]: 'medium'
            };
            
            const profile = papsManager.generateProfileWithTendencies(tendencies);
            
            this.log(`✅ 指定倾向人格生成成功`);
            
            // 检查参数值
            const threatValue = profile.rawParameters[KEY_PAPSPARAMETERS.THREAT_PERCEPTION];
            const empathyValue = profile.rawParameters[KEY_PAPSPARAMETERS.EMPATHY];
            const trustValue = profile.rawParameters[KEY_PAPSPARAMETERS.TRUST];
            
            this.log(`  威胁感知(A008): ${threatValue?.toFixed(3)} (应为较低值)`);
            this.log(`  共情能力(A009): ${empathyValue?.toFixed(3)} (应为较高值)`);
            this.log(`  信任倾向(F061): ${trustValue?.toFixed(3)} (应为中等值)`);
            
            if (threatValue < 0.3 && empathyValue > 0.7) {
                this.log(`✅ 倾向设置生效`);
                this.testResults.push('✅ 参数操作正常');
            } else {
                this.log(`⚠️ 倾向设置可能未完全生效`);
                this.testResults.push('⚠️ 参数操作部分生效');
            }
            
        } catch (error) {
            this.log(`❌ 参数操作测试失败: ${error}`);
            this.testResults.push('❌ 参数操作测试失败');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试4: 角色生成
     */
    private async testCharacterGeneration(): Promise<void> {
        this.log('\n🎭 测试4: 角色生成');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 角色生成跳过');
            this.updateProgress();
            return;
        }
        
        try {
            // 创建干员
            const operator = new Operator('霜白', 'sniper');
            
            this.log(`✅ 干员创建成功: ${operator.name}`);
            this.log(`  职业: ${operator.getProfessionConfig().displayName}`);
            this.log(`  羁绊等级: ${operator.bondLevel}`);
            this.log(`  记忆池大小: ${operator.memoryPool.length}`);
            
            // 检查关键参数
            const keyParams = operator.getKeyParameters();
            this.log(`  关键参数数量: ${Object.keys(keyParams).length}`);
            
            // 显示部分关键参数
            const sampleParams = Object.entries(keyParams).slice(0, 5);
            sampleParams.forEach(([key, value]) => {
                this.log(`  ${key}: ${value.toFixed(3)}`);
            });
            
            // 测试属性计算
            const stats = operator.getCurrentStats();
            this.log(`  当前属性: HP=${stats.health}, ATK=${stats.attack}, DEF=${stats.defense}`);
            
            this.testResults.push('✅ 角色生成正常');
            
        } catch (error) {
            this.log(`❌ 角色生成测试失败: ${error}`);
            this.testResults.push('❌ 角色生成测试失败');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试5: 批量生成
     */
    private async testBatchGeneration(): Promise<void> {
        this.log('\n📊 测试5: 批量生成');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 批量生成跳过');
            this.updateProgress();
            return;
        }
        
        try {
            const count = 3;
            const profiles = papsManager.generateBatchProfiles(count);
            
            this.log(`✅ 批量生成 ${profiles.length} 个人格成功`);
            
            // 检查每个生成的人格
            profiles.forEach((profile, index) => {
                const aiLength = profile.aiPrompt.length;
                const paramCount = Object.keys(profile.rawParameters).length;
                this.log(`  #${index + 1}: AI长度=${aiLength}, 参数=${paramCount}`);
            });
            
            // 检查是否各不相同
            const aiHashes = profiles.map(p => p.aiPrompt.substring(0, 100));
            const uniqueHashes = new Set(aiHashes);
            
            if (uniqueHashes.size === profiles.length) {
                this.log(`✅ 每个人格都独一无二`);
                this.testResults.push('✅ 批量生成正常');
            } else {
                this.log(`⚠️ 部分人格可能相似`);
                this.testResults.push('⚠️ 批量生成有重复');
            }
            
        } catch (error) {
            this.log(`❌ 批量生成测试失败: ${error}`);
            this.testResults.push('❌ 批量生成测试失败');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试6: 职业系统
     */
    private async testProfessionSystem(): Promise<void> {
        this.log('\n⚔️ 测试6: 职业系统');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 职业系统跳过');
            this.updateProgress();
            return;
        }
        
        try {
            const professions: Array<'guard' | 'sniper' | 'defender' | 'medic'> = ['guard', 'sniper', 'defender', 'medic'];
            
            this.log(`测试不同职业的干员:`);
            
            professions.forEach(profession => {
                const operator = new Operator(undefined, profession);
                const config = operator.getProfessionConfig();
                const stats = operator.getCurrentStats();
                
                this.log(`  ${config.displayName}: HP=${stats.health}, ATK=${stats.attack}, DEF=${stats.defense}`);
                
                // 检查职业特定的倾向
                const keyParams = operator.getKeyParameters();
                const empathy = keyParams.EMPATHY || 0.5;
                
                if (profession === 'medic' && empathy > 0.6) {
                    this.log(`    ✅ 医疗干员共情较高 (${empathy.toFixed(3)})`);
                } else if (profession === 'sniper' && empathy < 0.5) {
                    this.log(`    ✅ 狙击干员共情适中 (${empathy.toFixed(3)})`);
                }
            });
            
            this.log(`✅ 职业系统测试完成`);
            this.testResults.push('✅ 职业系统正常');
            
        } catch (error) {
            this.log(`❌ 职业系统测试失败: ${error}`);
            this.testResults.push('❌ 职业系统测试失败');
        }
        
        this.updateProgress();
    }
    
    /**
     * 测试7: 记忆与羁绊
     */
    private async testMemoryAndBond(): Promise<void> {
        this.log('\n💖 测试7: 记忆与羁绊系统');
        
        if (!papsManager.isReady()) {
            this.log('⚠️ 跳过测试: PAPS未初始化');
            this.testResults.push('⚠️ 记忆与羁绊跳过');
            this.updateProgress();
            return;
        }
        
        try {
            // 创建干员
            const operator = new Operator('夜影', 'guard');
            
            // 测试记忆添加
            const memories = [
                '昨天和指挥官一起探索了废墟',
                '在战斗中保护了医疗干员',
                '发现了前文明留下的装置',
                '在篝火旁分享了故事'
            ];
            
            memories.forEach(memory => operator.addMemory(memory));
            
            this.log(`✅ 添加了 ${memories.length} 条记忆`);
            this.log(`  当前记忆数量: ${operator.memoryPool.length}`);
            
            // 测试记忆检索
            const relevantMemories = operator.getRelevantMemories('战斗 废墟', 2);
            this.log(`  相关记忆检索: ${relevantMemories.length} 条`);
            
            // 测试羁绊提升
            const levelUp = operator.addBondExperience(150);
            this.log(`  羁绊等级: ${operator.bondLevel.toFixed(2)}`);
            if (levelUp) {
                this.log(`  💖 羁绊等级提升了！`);
            }
            
            // 检查属性变化
            const stats = operator.getCurrentStats();
            this.log(`  提升后属性: HP=${stats.health}, ATK=${stats.attack}`);
            
            // 测试AI Prompt生成
            const aiPrompt = operator.getAIPrompt();
            this.log(`  AI Prompt长度: ${aiPrompt.length} 字符`);
            this.log(`  包含职业信息: ${aiPrompt.includes('职业背景') ? '✅' : '❌'}`);
            this.log(`  包含记忆信息: ${aiPrompt.includes('近期记忆') ? '✅' : '❌'}`);
            
            this.testResults.push('✅ 记忆与羁绊正常');
            
        } catch (error) {
            this.log(`❌ 记忆与羁绊测试失败: ${error}`);
            this.testResults.push('❌ 记忆与羁绊测试失败');
        }
        
        this.updateProgress();
    }
}