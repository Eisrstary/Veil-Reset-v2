/**
 * 《覆幕重启》AVG叙事系统 - 测试场景
 */

import { Scene } from 'phaser';
import { DialogueUI } from '../narrative/DialogueUI';
import { DialogueSystem } from '../narrative/DialogueSystem';
import { EchoSystem } from '../narrative/EchoSystem';
import { block1Dialogues, block1Echoes, block1Config, initialProgress } from '../narrative/data/block1';
import { DialogueUnit } from '../narrative/DialogueTypes';

export class AVGScene extends Scene {
  // 叙事系统
  private dialogueUI!: DialogueUI;
  private dialogueSystem!: DialogueSystem;
  private echoSystem!: EchoSystem;
  
  // 当前对话状态
  private currentDialogue: DialogueUnit | null = null;
  private isInDialogue = false;
  private isInEcho = false;
  
  // 测试数据
  private dialogues = block1Dialogues;
  private echoes = block1Echoes;
  
  constructor() {
    super('AVGScene');
  }
  
  preload(): void {
    // 预加载UI资源
    this.load.image('backgrounds/ruins', 'assets/backgrounds/ruins.png');
    this.load.image('backgrounds/base_interior', 'assets/backgrounds/base_interior.png');
    this.load.image('backgrounds/ash_outpost', 'assets/backgrounds/ash_outpost.png');
    this.load.image('backgrounds/combat_arena', 'assets/backgrounds/combat_arena.png');
    this.load.image('avatars/operator_default', 'assets/avatars/operator_default.png');
    this.load.image('avatars/operator_alert', 'assets/avatars/operator_alert.png');
    this.load.image('avatars/operator_curious', 'assets/avatars/operator_curious.png');
    this.load.image('avatars/operator_concerned', 'assets/avatars/operator_concerned.png');
    this.load.image('avatars/operator_warm', 'assets/avatars/operator_warm.png');
    this.load.image('avatars/operator_neutral', 'assets/avatars/operator_neutral.png');
    this.load.image('avatars/operator_hesitate', 'assets/avatars/operator_hesitate.png');
    this.load.image('avatars/operator_gentle', 'assets/avatars/operator_gentle.png');
    
    // 预加载音效
    this.load.audio('sfx/echo_rumble', 'assets/sfx/echo_rumble.mp3');
    this.load.audio('sfx/echo_whisper', 'assets/sfx/echo_whisper.mp3');
  }
  
  create(): void {
    // 设置背景
    this.cameras.main.fadeIn(900, 6, 6, 18);
    this.add.rectangle(0, 0, 1920, 1080, 0x04060f, 1).setOrigin(0, 0).setDepth(-1);
    
    // 创建标题
    this.add.text(120, 100, 'AVG叙事系统测试', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 64,
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 8,
    }).setDepth(10);
    
    this.add.text(120, 170, '测试区块1：灰烬哨站废墟的对话和残响系统', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 22,
      color: '#8ec4ff',
      wordWrap: { width: 580 },
    }).setDepth(10);
    
    // 创建返回按钮
    const returnBg = this.add.rectangle(180, 340, 220, 52, 0x0e1a2e, 0.9)
      .setStrokeStyle(1, 0x4f6aa8, 0.8)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    returnBg.on('pointerover', () => returnBg.setFillStyle(0x1a2e4e, 0.95));
    returnBg.on('pointerout', () => returnBg.setFillStyle(0x0e1a2e, 0.9));
    returnBg.on('pointerdown', () => this.scene.start('HomeScene'));
    
    this.add.text(180, 340, '返回主菜单', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 20,
      color: '#8ec4ff',
    }).setOrigin(0.5).setDepth(11);
    
    // 创建测试按钮
    this.createTestButtons();
    
    // 初始化叙事系统
    this.initializeNarrativeSystems();
  }
  
  /**
   * 创建测试按钮
   */
  private createTestButtons(): void {
    const buttonY = 420;
    const buttonSpacing = 70;
    
    // 开始测试对话按钮
    const startButton = this.add.rectangle(180, buttonY, 240, 52, 0x1a3a2e, 0.9)
      .setStrokeStyle(1, 0x4faa88, 0.8)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    startButton.on('pointerover', () => startButton.setFillStyle(0x2a5a3e, 0.95));
    startButton.on('pointerout', () => startButton.setFillStyle(0x1a3a2e, 0.9));
    startButton.on('pointerdown', () => this.startTestDialogue());
    
    this.add.text(180, buttonY, '开始测试对话', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 20,
      color: '#8effc4',
    }).setOrigin(0.5).setDepth(11);
    
    // 测试残响按钮
    const echoButton = this.add.rectangle(180, buttonY + buttonSpacing, 240, 52, 0x2e1a5a, 0.9)
      .setStrokeStyle(1, 0x884faa, 0.8)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    echoButton.on('pointerover', () => echoButton.setFillStyle(0x3e2a6a, 0.95));
    echoButton.on('pointerout', () => echoButton.setFillStyle(0x2e1a5a, 0.9));
    echoButton.on('pointerdown', () => this.testEchoSystem());
    
    this.add.text(180, buttonY + buttonSpacing, '测试残响系统', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 20,
      color: '#c48eff',
    }).setOrigin(0.5).setDepth(11);
    
    // 显示进度按钮
    const progressButton = this.add.rectangle(180, buttonY + buttonSpacing * 2, 240, 52, 0x2e5a1a, 0.9)
      .setStrokeStyle(1, 0x88aa4f, 0.8)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    progressButton.on('pointerover', () => progressButton.setFillStyle(0x3e6a2a, 0.95));
    progressButton.on('pointerout', () => progressButton.setFillStyle(0x2e5a1a, 0.9));
    progressButton.on('pointerdown', () => this.showProgress());
    
    this.add.text(180, buttonY + buttonSpacing * 2, '显示游戏进度', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 20,
      color: '#c4ff8e',
    }).setOrigin(0.5).setDepth(11);
  }
  
  /**
   * 初始化叙事系统
   */
  private initializeNarrativeSystems(): void {
    // 初始化对话系统
    this.dialogueSystem = new DialogueSystem(initialProgress);
    
    // 初始化对话UI
    this.dialogueUI = new DialogueUI(this);
    
    // 初始化残响系统
    this.echoSystem = new EchoSystem(this, initialProgress);
  }
  
  /**
   * 开始测试对话
   */
  private startTestDialogue(): void {
    if (this.isInDialogue || this.isInEcho) {
      return; // 正在显示对话或残响
    }
    
    this.isInDialogue = true;
    
    // 从区块1的开场对话开始
    this.currentDialogue = this.dialogueSystem.showDialogue('block1_opening', this.dialogues);
    
    if (this.currentDialogue) {
      // 显示对话
      this.dialogueUI.showDialogue(this.currentDialogue, () => {
        this.onDialogueComplete();
      });
      
      // 设置选择支回调
      this.dialogueUI.showChoices = (choices, onSelected) => {
        this.dialogueUI.showChoices(choices, (choiceId) => {
          this.onChoiceSelected(choiceId, this.currentDialogue!.id);
        });
      };
    }
  }
  
  /**
   * 处理选择支选择
   */
  private onChoiceSelected(choiceId: string, dialogueId: string): void {
    try {
      const result = this.dialogueSystem.processChoice(choiceId, dialogueId);
      
      // 应用即时效果后的处理
      if (result.nextDialogue) {
        // 继续下一段对话
        this.currentDialogue = this.dialogueSystem.showDialogue(result.nextDialogue, this.dialogues);
        if (this.currentDialogue) {
          this.dialogueUI.showDialogue(this.currentDialogue, () => {
            this.onDialogueComplete();
          });
        }
      } else {
        // 对话结束
        this.onDialogueComplete();
      }
      
      // 清除选择支显示
      this.dialogueUI.clearChoices();
      
    } catch (error) {
      console.error('处理选择支时出错:', error);
      this.onDialogueComplete();
    }
  }
  
  /**
   * 对话完成处理
   */
  private onDialogueComplete(): void {
    this.isInDialogue = false;
    this.currentDialogue = null;
    
    // 检查是否有残响需要显示
    if (block1Config.echoes.length > 0) {
      const echoId = block1Config.echoes[0];
      if (this.echoes[echoId]) {
        // 延迟显示残响
        this.time.delayedCall(1000, () => {
          this.testEchoSystem();
        });
      }
    }
  }
  
  /**
   * 测试残响系统
   */
  private testEchoSystem(): void {
    if (this.isInEcho || this.isInDialogue) {
      return;
    }
    
    this.isInEcho = true;
    
    const echoId = 'echo_01';
    const echo = this.echoes[echoId];
    
    if (echo) {
      this.echoSystem.showEcho(echo, () => {
        this.isInEcho = false;
        console.log('残响显示完成');
      });
    } else {
      console.error(`残响不存在: ${echoId}`);
      this.isInEcho = false;
    }
  }
  
  /**
   * 显示游戏进度
   */
  private showProgress(): void {
    const progress = this.dialogueSystem.getProgress();
    const bondLevel = this.dialogueSystem.getBondLevel('operator_01');
    const endingWeights = this.dialogueSystem.calculateEndingWeights();
    
    // 创建进度显示窗口
    const windowBg = this.add.graphics();
    windowBg.fillStyle(0x04070f, 0.95);
    windowBg.lineStyle(3, 0x2f5c76, 0.8);
    windowBg.fillRoundedRect(600, 200, 720, 680, 20);
    windowBg.strokeRoundedRect(600, 200, 720, 680, 20);
    windowBg.setDepth(50);
    
    // 标题
    this.add.text(960, 230, '游戏进度信息', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 32,
      color: '#8ec4ff',
      stroke: '#091120',
      strokeThickness: 4,
      align: 'center'
    }).setOrigin(0.5, 0).setDepth(51);
    
    // 进度信息
    const infoY = 300;
    const lineSpacing = 40;
    
    const infoLines = [
      `当前天数: 第 ${progress.currentDay} 天`,
      `当前年份: VA.${progress.currentYear}`,
      '',
      `=== 路径分数 ===`,
      `顺服路径: ${progress.pathScore.submission}`,
      `抵抗路径: ${progress.pathScore.resistance}`,
      `超越路径: ${progress.pathScore.transcendence}`,
      '',
      `=== 羁绊系统 ===`,
      `初始干员羁绊值: ${progress.bonds['operator_01'] || 0}`,
      `羁绊等级: ${bondLevel}级`,
      '',
      `=== 收集系统 ===`,
      `已解锁区块: ${progress.unlockedBlocks.length}`,
      `已收集残响: ${progress.collectedEchoes.length}`,
      `已收集CG: ${progress.collectedCGs.length}`,
      '',
      `=== 选择记录 ===`,
      `已做选择: ${Object.keys(progress.choiceHistory).length}个`
    ];
    
    infoLines.forEach((line, index) => {
      this.add.text(640, infoY + index * lineSpacing, line, {
        fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
        fontSize: 20,
        color: '#c8e4ff',
        stroke: '#091120',
        strokeThickness: 2
      }).setDepth(51);
    });
    
    // 关闭按钮
    const closeBg = this.add.rectangle(960, 850, 120, 40, 0x0e1a2e, 0.9)
      .setStrokeStyle(1, 0x4f6aa8, 0.8)
      .setDepth(51)
      .setInteractive({ useHandCursor: true });
    closeBg.on('pointerover', () => closeBg.setFillStyle(0x1a2e4e, 0.95));
    closeBg.on('pointerout', () => closeBg.setFillStyle(0x0e1a2e, 0.9));
    closeBg.on('pointerdown', () => {
      windowBg.destroy();
      this.children.list.forEach(child => {
        if ((child as any).depth === 51) {
          child.destroy();
        }
      });
    });
    
    this.add.text(960, 850, '关闭', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 18,
      color: '#8ec4ff',
    }).setOrigin(0.5).setDepth(52);
  }
  
  /**
   * 更新进度信息显示
   */
  private updateProgressDisplay(): void {
    // 更新右侧信息面板
    // 这里可以添加实时进度显示
  }
  
  update(): void {
    // 可以在这里添加更新逻辑
  }
  
  /**
   * 场景销毁
   */
  destroy(): void {
    if (this.dialogueUI) {
      this.dialogueUI.destroy();
    }
    
    if (this.echoSystem) {
      this.echoSystem.destroy();
    }
    
    super.destroy();
  }
}