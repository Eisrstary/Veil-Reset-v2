/**
 * 《覆幕重启》AVG叙事系统 - 残响记忆系统
 */

import { Scene, GameObjects, Display } from 'phaser';
import { EchoMemory, GameProgress, VisualEffects } from './DialogueTypes';

export class EchoSystem {
  // Phaser场景引用
  private scene: Scene;
  
  // UI元素
  private echoContainer!: GameObjects.Container;
  private overlay!: GameObjects.Rectangle;
  private echoText!: GameObjects.Text;
  private titleText!: GameObjects.Text;
  private effectsLayer!: GameObjects.Layer;
  
  // 游戏进度引用
  private progress: GameProgress;
  
  // 配置
  private config = {
    width: 1400,
    height: 800,
    x: 260,  // 居中留白
    y: 140,
    padding: 60,
    titleStyle: {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: '36px',
      color: '#8ec4ff',
      stroke: '#091120',
      strokeThickness: 5,
      align: 'center'
    },
    textStyle: {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: '26px',
      color: '#c8e4ff',
      stroke: '#091120',
      strokeThickness: 3,
      wordWrap: { width: 1280, useAdvancedWrap: true },
      lineSpacing: 10
    }
  };
  
  // 状态
  private isShowing = false;
  private currentEcho: EchoMemory | null = null;
  private postFXPlugin?: any;
  
  // 回调函数
  private onEchoComplete?: () => void;
  
  constructor(scene: Scene, progress: GameProgress) {
    this.scene = scene;
    this.progress = progress;
    this.createUI();
  }
  
  /**
   * 创建UI元素
   */
  private createUI(): void {
    // 创建容器
    this.echoContainer = this.scene.add.container(0, 0);
    
    // 创建半透明覆盖层
    this.overlay = this.scene.add.rectangle(
      0, 0,
      1920, 1080,
      0x000000, 0.7
    );
    this.overlay.setOrigin(0, 0);
    this.overlay.setInteractive({ useHandCursor: true });
    this.overlay.on('pointerdown', () => this.completeEcho());
    
    // 创建残响窗口
    const windowBg = this.scene.add.graphics();
    windowBg.fillStyle(0x04070f, 0.9);
    windowBg.lineStyle(3, 0x2f5c76, 0.8);
    windowBg.fillRoundedRect(
      this.config.x, this.config.y,
      this.config.width, this.config.height,
      20
    );
    windowBg.strokeRoundedRect(
      this.config.x, this.config.y,
      this.config.width, this.config.height,
      20
    );
    
    // 创建标题文本
    this.titleText = this.scene.add.text(
      this.config.x + this.config.width / 2,
      this.config.y + this.config.padding,
      '',
      this.config.titleStyle
    );
    this.titleText.setOrigin(0.5, 0);
    
    // 创建残响文本
    this.echoText = this.scene.add.text(
      this.config.x + this.config.padding,
      this.config.y + this.config.padding + 60,
      '',
      this.config.textStyle
    );
    
    // 创建特效层
    this.effectsLayer = this.scene.add.layer();
    
    // 添加到容器
    this.echoContainer.add([
      this.overlay,
      windowBg,
      this.titleText,
      this.echoText,
      this.effectsLayer
    ]);
    
    // 设置深度
    this.echoContainer.setDepth(200);
    this.echoContainer.setVisible(false);
  }
  
  /**
   * 显示残响
   */
  showEcho(echo: EchoMemory, onComplete?: () => void): void {
    if (this.isShowing) {
      console.warn('残响系统正在显示中，忽略新的残响');
      return;
    }
    
    this.currentEcho = echo;
    this.onEchoComplete = onComplete;
    this.isShowing = true;
    
    // 更新UI内容
    this.titleText.setText(echo.title);
    this.echoText.setText(echo.content);
    
    // 应用视觉效果
    if (echo.visualEffects) {
      this.applyVisualEffects(echo.visualEffects);
    }
    
    // 播放音效
    if (echo.audio) {
      this.playAudio(echo.audio);
    }
    
    // 显示UI
    this.echoContainer.setVisible(true);
    
    // 应用游戏效果
    if (echo.gameplayEffect) {
      this.applyGameplayEffects(echo.gameplayEffect);
    }
    
    // 记录已收集残响
    if (!this.progress.collectedEchoes.includes(echo.id)) {
      this.progress.collectedEchoes.push(echo.id);
    }
    
    // 解锁CG
    if (echo.cgUnlock && !this.progress.collectedCGs.includes(echo.cgUnlock)) {
      this.progress.collectedCGs.push(echo.cgUnlock);
    }
  }
  
  /**
   * 应用视觉效果
   */
  private applyVisualEffects(effects: VisualEffects): void {
    // 清除现有特效
    this.effectsLayer.removeAll(true);
    
    // 应用模糊效果
    if (effects.blur !== undefined) {
      this.applyBlurEffect(effects.blur);
    }
    
    // 应用饱和度效果
    if (effects.saturation !== undefined) {
      this.applySaturationEffect(effects.saturation);
    }
    
    // 应用颜色偏移
    if (effects.colorShift) {
      this.applyColorShiftEffect(effects.colorShift);
    }
    
    // 应用文本样式
    if (effects.textStyle) {
      this.applyTextStyle(effects.textStyle);
    }
  }
  
  /**
   * 应用模糊效果
   */
  private applyBlurEffect(amount: number): void {
    // 使用Phaser的模糊滤镜
    const blurFilter = new Display.BlurFilter(amount * 10);
    this.effectsLayer.list.forEach((gameObject: any) => {
      if (gameObject.setFilter) {
        gameObject.setFilter(blurFilter);
      }
    });
  }
  
  /**
   * 应用饱和度效果
   */
  private applySaturationEffect(amount: number): void {
    // 创建饱和度调整
    const saturation = amount * 2; // 映射到合理范围
    
    // 使用颜色矩阵
    const colorMatrix = new Display.ColorMatrix();
    colorMatrix.saturate(saturation);
    
    this.effectsLayer.list.forEach((gameObject: any) => {
      if (gameObject.setColorMatrix) {
        gameObject.setColorMatrix(colorMatrix);
      }
    });
  }
  
  /**
   * 应用颜色偏移效果
   */
  private applyColorShiftEffect(color: string): void {
    // 将CSS颜色转换为RGB
    const rgb = this.hexToRgb(color);
    if (!rgb) return;
    
    // 使用颜色矩阵进行色调偏移
    const colorMatrix = new Display.ColorMatrix();
    colorMatrix.tint(rgb.r, rgb.g, rgb.b, 0.3); // 30%的色调混合
    
    this.effectsLayer.list.forEach((gameObject: any) => {
      if (gameObject.setColorMatrix) {
        gameObject.setColorMatrix(colorMatrix);
      }
    });
  }
  
  /**
   * 应用文本样式
   */
  private applyTextStyle(style: string): void {
    switch (style) {
      case 'glitch':
        // 添加故障效果
        this.addGlitchEffect();
        break;
      case 'old-film':
        // 添加老电影效果
        this.addOldFilmEffect();
        break;
      case 'static':
        // 添加静态噪点效果
        this.addStaticEffect();
        break;
    }
  }
  
  /**
   * 添加故障效果
   */
  private addGlitchEffect(): void {
    // 创建故障效果图形
    const glitchGraphics = this.scene.add.graphics();
    
    // 添加随机线条
    for (let i = 0; i < 10; i++) {
      const x = this.config.x + Math.random() * this.config.width;
      const width = 2 + Math.random() * 10;
      const height = 10 + Math.random() * 50;
      const y = this.config.y + Math.random() * this.config.height;
      
      glitchGraphics.fillStyle(0xffffff, 0.3);
      glitchGraphics.fillRect(x, y, width, height);
    }
    
    this.effectsLayer.add(glitchGraphics);
    
    // 添加动画
    this.scene.tweens.add({
      targets: glitchGraphics,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => glitchGraphics.destroy()
    });
  }
  
  /**
   * 添加老电影效果
   */
  private addOldFilmEffect(): void {
    // 创建扫描线效果
    const scanlineGraphics = this.scene.add.graphics();
    
    // 添加扫描线
    for (let i = 0; i < 20; i++) {
      const y = this.config.y + (i * 40);
      
      scanlineGraphics.fillStyle(0x000000, 0.1);
      scanlineGraphics.fillRect(
        this.config.x,
        y,
        this.config.width,
        1
      );
    }
    
    this.effectsLayer.add(scanlineGraphics);
  }
  
  /**
   * 添加静态噪点效果
   */
  private addStaticEffect(): void {
    // 创建噪点纹理
    const noiseTexture = this.scene.textures.createCanvas('echo-noise', 1920, 1080);
    const ctx = noiseTexture.getContext();
    
    // 生成噪点
    const imageData = ctx.createImageData(1920, 1080);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;     // R
      data[i + 1] = value; // G
      data[i + 2] = value; // B
      data[i + 3] = 30;    // A (低透明度)
    }
    
    ctx.putImageData(imageData, 0, 0);
    noiseTexture.refresh();
    
    // 创建噪点精灵
    const noiseSprite = this.scene.add.image(960, 540, 'echo-noise');
    noiseSprite.setAlpha(0.2);
    noiseSprite.setBlendMode(Phaser.BlendModes.ADD);
    
    this.effectsLayer.add(noiseSprite);
    
    // 添加动画
    this.scene.tweens.add({
      targets: noiseSprite,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      delay: 1000,
      onComplete: () => {
        noiseSprite.destroy();
        this.scene.textures.remove('echo-noise');
      }
    });
  }
  
  /**
   * 播放音频
   */
  private playAudio(audioKey: string): void {
    // 检查音频是否存在
    if (this.scene.sound.get(audioKey)) {
      this.scene.sound.play(audioKey, {
        volume: 0.5,
        loop: false
      });
    } else {
      console.warn(`音频未找到: ${audioKey}`);
    }
  }
  
  /**
   * 应用游戏效果
   */
  private applyGameplayEffects(effects: EchoMemory['gameplayEffect']): void {
    // TODO: 集成到游戏系统中
    console.log('应用游戏效果:', effects);
    
    // 这里应该更新游戏状态
    // 例如: gameState.foodProduction += effects.foodProduction
  }
  
  /**
   * 完成残响显示
   */
  completeEcho(): void {
    if (!this.isShowing) return;
    
    // 清除特效
    this.effectsLayer.removeAll(true);
    
    // 隐藏UI
    this.echoContainer.setVisible(false);
    this.isShowing = false;
    
    // 调用完成回调
    this.onEchoComplete?.();
    this.onEchoComplete = undefined;
    
    this.currentEcho = null;
  }
  
  /**
   * 检查残响解锁条件
   */
  checkEchoUnlock(echo: EchoMemory): boolean {
    if (!echo.unlockCondition) {
      return true; // 没有解锁条件，默认解锁
    }
    
    // 解析解锁条件
    const conditions = echo.unlockCondition.split(';');
    
    for (const condition of conditions) {
      const [type, value] = condition.trim().split(':');
      
      switch (type) {
        case 'block':
          // 需要完成特定区块
          if (!this.progress.clearedBlocks.includes(value)) {
            return false;
          }
          break;
          
        case 'echo':
          // 需要收集特定残响
          if (!this.progress.collectedEchoes.includes(value)) {
            return false;
          }
          break;
          
        case 'day':
          // 需要达到特定天数
          if (this.progress.currentDay < parseInt(value)) {
            return false;
          }
          break;
          
        case 'bond':
          // 需要达到特定羁绊等级
          const [operatorId, level] = value.split('>');
          const bondLevel = Math.floor((this.progress.bonds[operatorId] || 0) / 25) + 1;
          if (bondLevel < parseInt(level)) {
            return false;
          }
          break;
      }
    }
    
    return true;
  }
  
  /**
   * 获取已收集残响数量
   */
  getCollectedEchoCount(): number {
    return this.progress.collectedEchoes.length;
  }
  
  /**
   * 获取残响收集比例
   */
  getEchoCollectionRatio(): number {
    // TODO: 需要知道总残响数
    const totalEchoes = 15; // 根据剧情文档
    return this.getCollectedEchoCount() / totalEchoes;
  }
  
  /**
   * 转换十六进制颜色为RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  
  /**
   * 更新游戏进度引用
   */
  updateProgress(newProgress: GameProgress): void {
    this.progress = newProgress;
  }
  
  /**
   * 销毁系统
   */
  destroy(): void {
    this.echoContainer.destroy();
  }
}