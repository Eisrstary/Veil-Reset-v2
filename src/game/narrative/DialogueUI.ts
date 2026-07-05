/**
 * 《覆幕重启》AVG叙事系统 - 对话UI组件
 */

import { Scene, GameObjects } from 'phaser';
import { DialogueUnit, DialogueChoice } from './DialogueTypes';

export class DialogueUI {
  // Phaser场景引用
  private scene: Scene;
  
  // UI元素
  private dialogueContainer!: GameObjects.Container;
  private background!: GameObjects.Rectangle;
  private textDisplay!: GameObjects.Text;
  private speakerDisplay!: GameObjects.Text;
  private avatarDisplay?: GameObjects.Image;
  private choiceContainer!: GameObjects.Container;
  
  // 配置
  private config = {
    width: 1600,
    height: 300,
    x: 160,          // 左侧留白
    y: 1080 - 320,   // 底部留白
    padding: 40,
    textStyle: {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: '24px',
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 3,
      wordWrap: { width: 1400, useAdvancedWrap: true }
    },
    speakerStyle: {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: '28px',
      color: '#8ec4ff',
      stroke: '#091120',
      strokeThickness: 3
    },
    choiceStyle: {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: '22px',
      color: '#c8e4ff',
      stroke: '#091120',
      strokeThickness: 2,
      wordWrap: { width: 1200, useAdvancedWrap: true }
    }
  };
  
  // 状态
  private isVisible = false;
  private typewriterSpeed = 30; // 字符/秒
  private typewriterTimer?: Phaser.Time.TimerEvent;
  private currentText = '';
  private fullText = '';
  
  // 回调函数
  private onChoiceSelected?: (choiceId: string) => void;
  private onDialogueComplete?: () => void;
  
  constructor(scene: Scene) {
    this.scene = scene;
    this.createUI();
    this.hide();
  }
  
  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 创建容器
    this.dialogueContainer = this.scene.add.container(this.config.x, this.config.y);
    
    // 创建背景
    this.background = this.scene.add.rectangle(
      0, 0,
      this.config.width, this.config.height,
      0x04070f, 0.86
    );
    this.background.setStrokeStyle(2, 0x2f5c76, 0.6);
    this.background.setOrigin(0, 0);
    
    // 创建说话者显示
    this.speakerDisplay = this.scene.add.text(
      this.config.padding,
      this.config.padding,
      '',
      this.config.speakerStyle
    );
    
    // 创建文本显示
    this.textDisplay = this.scene.add.text(
      this.config.padding,
      this.config.padding + 50,
      '',
      this.config.textStyle
    );
    
    // 创建选择支容器
    this.choiceContainer = this.scene.add.container(0, 0);
    this.choiceContainer.setVisible(false);
    
    // 添加到容器
    this.dialogueContainer.add([
      this.background,
      this.speakerDisplay,
      this.textDisplay,
      this.choiceContainer
    ]);
    
    // 设置深度
    this.dialogueContainer.setDepth(100);
  }
  
  /**
   * 显示对话
   */
  showDialogue(dialogue: DialogueUnit, onComplete?: () => void): void {
    this.isVisible = true;
    this.dialogueContainer.setVisible(true);
    
    // 设置回调
    this.onDialogueComplete = onComplete;
    
    // 更新说话者
    this.speakerDisplay.setText(dialogue.speaker);
    
    // 设置头像
    if (dialogue.avatar && this.avatarDisplay) {
      this.avatarDisplay.setTexture(dialogue.avatar);
      this.avatarDisplay.setVisible(true);
    }
    
    // 隐藏选择支
    this.choiceContainer.setVisible(false);
    
    // 开始打字机效果
    this.startTypewriter(dialogue.content);
    
    // 设置点击继续
    this.background.removeInteractive();
    this.background.setInteractive({ useHandCursor: true });
    this.background.once('pointerdown', () => {
      if (this.typewriterTimer) {
        // 如果打字机还在运行，直接显示完整文本
        this.completeTypewriter();
      } else if (dialogue.choices && dialogue.choices.length > 0) {
        // 显示选择支
        this.showChoices(dialogue.choices);
      } else {
        // 对话结束
        this.onDialogueComplete?.();
      }
    });
  }
  
  /**
   * 开始打字机效果
   */
  private startTypewriter(text: string): void {
    this.fullText = text;
    this.currentText = '';
    this.textDisplay.setText('');
    
    // 清除之前的计时器
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    
    // 创建新的计时器
    const charsPerSecond = this.typewriterSpeed;
    const interval = 1000 / charsPerSecond;
    
    this.typewriterTimer = this.scene.time.addEvent({
      delay: interval,
      callback: () => {
        if (this.currentText.length < this.fullText.length) {
          this.currentText = this.fullText.substring(0, this.currentText.length + 1);
          this.textDisplay.setText(this.currentText);
        } else {
          this.completeTypewriter();
        }
      },
      callbackScope: this,
      loop: true
    });
  }
  
  /**
   * 完成打字机效果
   */
  private completeTypewriter(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = undefined;
    }
    
    this.textDisplay.setText(this.fullText);
    this.currentText = this.fullText;
  }
  
  /**
   * 显示选择支
   */
  showChoices(choices: DialogueChoice[], onSelected?: (choiceId: string) => void): void {
    this.onChoiceSelected = onSelected;
    
    // 清除现有选择支
    this.choiceContainer.removeAll(true);
    
    // 创建选择支按钮
    const choiceSpacing = 60;
    const startY = this.config.height + 20;
    
    choices.forEach((choice, index) => {
      const choiceY = startY + index * choiceSpacing;
      
      // 创建选择支背景
      const choiceBg = this.scene.add.rectangle(
        this.config.padding,
        choiceY,
        this.config.width - this.config.padding * 2,
        50,
        0x0e1a2e, 0.9
      );
      choiceBg.setStrokeStyle(1, 0x4f6aa8, 0.8);
      choiceBg.setOrigin(0, 0);
      
      // 创建选择文本
      const choiceText = this.scene.add.text(
        this.config.padding + 20,
        choiceY + 10,
        `${index + 1}. ${choice.text}`,
        this.config.choiceStyle
      );
      
      // 设置交互
      choiceBg.setInteractive({ useHandCursor: true });
      choiceBg.on('pointerover', () => {
        choiceBg.setFillStyle(0x1a2e4e, 0.95);
        choiceText.setColor('#ffffff');
      });
      choiceBg.on('pointerout', () => {
        choiceBg.setFillStyle(0x0e1a2e, 0.9);
        choiceText.setColor('#c8e4ff');
      });
      choiceBg.on('pointerdown', () => {
        this.onChoiceSelected?.(choice.id);
      });
      
      // 添加到容器
      this.choiceContainer.add([choiceBg, choiceText]);
    });
    
    // 显示选择支
    this.choiceContainer.setVisible(true);
    
    // 调整容器高度以容纳选择支
    const totalHeight = this.config.height + 20 + choices.length * choiceSpacing;
    this.background.setSize(this.config.width, totalHeight);
  }
  
  /**
   * 隐藏UI
   */
  hide(): void {
    this.isVisible = false;
    this.dialogueContainer.setVisible(false);
    this.choiceContainer.setVisible(false);
    
    // 清除回调
    this.onChoiceSelected = undefined;
    this.onDialogueComplete = undefined;
    
    // 清除打字机计时器
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
      this.typewriterTimer = undefined;
    }
  }
  
  /**
   * 显示/隐藏切换
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.dialogueContainer.setVisible(true);
      this.isVisible = true;
    }
  }
  
  /**
   * 是否可见
   */
  isUIVisible(): boolean {
    return this.isVisible;
  }
  
  /**
   * 设置头像显示
   */
  setAvatarDisplay(avatar: GameObjects.Image): void {
    this.avatarDisplay = avatar;
    
    // 定位到头像位置（左侧）
    avatar.setPosition(
      -avatar.displayWidth / 2 - 20,
      this.config.height / 2
    );
    avatar.setOrigin(0.5, 0.5);
    avatar.setDepth(101); // 比对话框高一层
    
    this.dialogueContainer.add(avatar);
  }
  
  /**
   * 设置背景图
   */
  setBackgroundImage(bg: GameObjects.Image): void {
    // 设置背景图在对话框下方
    bg.setDepth(99);
    bg.setPosition(
      this.config.x + this.config.width / 2,
      this.config.y - 540 // 居中显示
    );
    bg.setOrigin(0.5, 0.5);
    
    this.dialogueContainer.add(bg);
  }
  
  /**
   * 设置打字机速度
   */
  setTypewriterSpeed(charsPerSecond: number): void {
    this.typewriterSpeed = charsPerSecond;
  }
  
  /**
   * 清除选择支
   */
  clearChoices(): void {
    this.choiceContainer.removeAll(true);
    this.choiceContainer.setVisible(false);
    
    // 恢复对话框原始高度
    this.background.setSize(this.config.width, this.config.height);
  }
  
  /**
   * 淡入效果
   */
  fadeIn(duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      this.dialogueContainer.setAlpha(0);
      this.dialogueContainer.setVisible(true);
      
      this.scene.tweens.add({
        targets: this.dialogueContainer,
        alpha: 1,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this.isVisible = true;
          resolve();
        }
      });
    });
  }
  
  /**
   * 淡出效果
   */
  fadeOut(duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.dialogueContainer,
        alpha: 0,
        duration,
        ease: 'Power2',
        onComplete: () => {
          this.hide();
          this.dialogueContainer.setAlpha(1);
          resolve();
        }
      });
    });
  }
  
  /**
   * 销毁UI
   */
  destroy(): void {
    if (this.typewriterTimer) {
      this.typewriterTimer.destroy();
    }
    
    this.dialogueContainer.destroy();
  }
}