import { Scene, GameObjects, Input } from 'phaser';

/**
 * 《覆幕重启》UI组件工厂
 * 提供统一的UI组件创建和样式管理
 */

// 色彩系统
export const COLORS = {
  // 深色调 - 背景和容器
  DEEP_BLUE: 0x060612,    // #060612
  MIDNIGHT: 0x0e1028,     // #0e1028
  VEIL_PURPLE: 0x1c2448,  // #1c2448
  
  // 中间调 - 边框和装饰
  ENERGY_BLUE: 0x4470b8,  // #4470b8
  GLOW_BLUE: 0x6090d0,    // #6090d0
  
  // 高亮调 - 文字和强调
  BRIGHT_BLUE: 0x80b0f0,  // #80b0f0
  GOLD_ACCENT: 0xf4d88a,  // #f4d88a
  WARM_WHITE: 0xf6f9ff,   // #f6f9ff
  
  // 功能色
  SUCCESS: 0x8fd0ff,      // 成功/完成
  WARNING: 0xf4d88a,      // 警告
  DANGER: 0xff8a8a,       // 危险
  INFO: 0x95b9ff,         // 信息
};

// 透明度设置
export const ALPHA = {
  SOLID: 1.0,        // 实体
  PRIMARY: 0.95,     // 主容器
  SECONDARY: 0.85,   // 次容器
  TERTIARY: 0.7,     // 装饰
  TRANSLUCENT: 0.4,  // 半透明
  GHOST: 0.2,        // 幽灵效果
};

// 字体系统
export const FONTS = {
  // 中文优先字体栈
  CHINESE: 'Microsoft YaHei, SimHei, sans-serif',
  
  // 字号系统
  SIZES: {
    TITLE: 86,      // 主标题
    HEADLINE: 64,   // 场景标题
    SUBHEAD: 32,    // 副标题
    BODY_LARGE: 26, // 大正文
    BODY: 22,       // 正文
    CAPTION: 18,    // 说明文字
    SMALL: 16,      // 小字
    TINY: 14,       // 极小字
  },
  
  // 字重
  WEIGHTS: {
    REGULAR: 'normal',
    BOLD: 'bold',
    LIGHT: 'lighter',
  },
};

// 通用动画配置
export const ANIMATIONS = {
  // 进入动画
  FADE_IN: { alpha: 0, duration: 500, ease: 'Power2' },
  SLIDE_IN_UP: { y: '+50', alpha: 0, duration: 400, ease: 'Back.easeOut' },
  SLIDE_IN_DOWN: { y: '-50', alpha: 0, duration: 400, ease: 'Back.easeOut' },
  
  // 强调动画
  PULSE: { scale: 1.05, duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
  BREATHE: { alpha: 0.7, duration: 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 },
  
  // 交互反馈
  BUTTON_PRESS: { scale: 0.95, duration: 100, yoyo: true },
  HOVER_GLOW: { scale: 1.02, duration: 200 },
  
  // 退出动画
  FADE_OUT: { alpha: 0, duration: 300, ease: 'Power2' },
  SLIDE_OUT_UP: { y: '-50', alpha: 0, duration: 300, ease: 'Power2' },
};

/**
 * 按钮配置接口
 */
export interface ButtonConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: number;
  color?: number;
  alpha?: number;
  onClick: () => void;
  enabled?: boolean;
  useHandCursor?: boolean;
  depth?: number;
}

/**
 * 卡片配置接口
 */
export interface CardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  content?: string;
  rounded?: number;
  selectable?: boolean;
  selected?: boolean;
  depth?: number;
}

/**
 * 面板配置接口
 */
export interface PanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  title?: string;
  headerHeight?: number;
  scrollable?: boolean;
  depth?: number;
}

/**
 * 进度条配置接口
 */
export interface ProgressBarConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;      // 0-1
  maxValue: number;
  showText?: boolean;
  color?: number;
  glow?: boolean;
  depth?: number;
}

/**
 * UI组件工厂类
 */
export class UIFactory {
  private scene: Scene;
  
  constructor(scene: Scene) {
    this.scene = scene;
  }
  
  /**
   * 创建标准按钮
   */
  createButton(config: ButtonConfig): {
    bg: GameObjects.Rectangle;
    text: GameObjects.Text;
    destroy: () => void;
  } {
    const {
      x, y, width, height, label,
      fontSize = FONTS.SIZES.BODY,
      color = COLORS.ENERGY_BLUE,
      alpha = ALPHA.PRIMARY,
      onClick,
      enabled = true,
      useHandCursor = true,
      depth = 10,
    } = config;
    
    // 创建背景矩形
    const bg = this.scene.add.rectangle(x, y, width, height, color, alpha);
    bg.setStrokeStyle(2, COLORS.BRIGHT_BLUE, 0.8);
    bg.setDepth(depth);
    bg.setOrigin(0.5);
    
    // 创建文字
    const text = this.scene.add.text(x, y, label, {
      fontFamily: FONTS.CHINESE,
      fontSize,
      color: '#eef7ff',
    });
    text.setOrigin(0.5);
    text.setDepth(depth + 1);
    
    // 交互设置
    if (enabled) {
      bg.setInteractive({
        useHandCursor,
        hitArea: new Input.Rectangle(-width/2, -height/2, width, height),
      });
      
      // 悬停效果
      bg.on('pointerover', () => {
        bg.setFillStyle(COLORS.GLOW_BLUE, alpha * 1.1);
        bg.setScale(1.02);
        this.scene.tweens.add({
          targets: bg,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 150,
          ease: 'Power2',
        });
      });
      
      bg.on('pointerout', () => {
        bg.setFillStyle(color, alpha);
        bg.setScale(1);
        this.scene.tweens.add({
          targets: bg,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2',
        });
      });
      
      // 点击效果
      bg.on('pointerdown', () => {
        this.scene.tweens.add({
          targets: bg,
          scaleX: 0.95,
          scaleY: 0.95,
          duration: 80,
          yoyo: true,
          onComplete: onClick,
        });
      });
    } else {
      // 禁用状态
      bg.setAlpha(alpha * 0.5);
      text.setAlpha(0.7);
    }
    
    return {
      bg,
      text,
      destroy: () => {
        bg.destroy();
        text.destroy();
      },
    };
  }
  
  /**
   * 创建卡片
   */
  createCard(config: CardConfig): {
    bg: GameObjects.Graphics;
    title?: GameObjects.Text;
    content?: GameObjects.Text;
    destroy: () => void;
  } {
    const {
      x, y, width, height, title, content,
      rounded = 16,
      selectable = false,
      selected = false,
      depth = 5,
    } = config;
    
    const bg = this.scene.add.graphics();
    bg.setDepth(depth);
    
    // 绘制卡片背景
    const fillColor = selected ? COLORS.VEIL_PURPLE : COLORS.DEEP_BLUE;
    const fillAlpha = selected ? ALPHA.SECONDARY : ALPHA.PRIMARY;
    const strokeColor = selected ? COLORS.BRIGHT_BLUE : COLORS.ENERGY_BLUE;
    const strokeAlpha = selected ? 0.9 : 0.6;
    
    bg.fillStyle(fillColor, fillAlpha);
    bg.fillRoundedRect(x - width/2, y - height/2, width, height, rounded);
    
    bg.lineStyle(2, strokeColor, strokeAlpha);
    bg.strokeRoundedRect(x - width/2, y - height/2, width, height, rounded);
    
    let titleText: GameObjects.Text | undefined;
    let contentText: GameObjects.Text | undefined;
    
    // 创建标题（如果有）
    if (title) {
      titleText = this.scene.add.text(x, y - height/2 + 30, title, {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.BODY_LARGE,
        color: selected ? '#fef3c7' : '#e9f7ff',
        align: 'center',
      });
      titleText.setOrigin(0.5, 0);
      titleText.setDepth(depth + 1);
    }
    
    // 创建内容（如果有）
    if (content) {
      const contentY = title ? y - height/2 + 70 : y;
      contentText = this.scene.add.text(x, contentY, content, {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.CAPTION,
        color: selected ? '#aee2ff' : '#7fb7ef',
        align: 'center',
        wordWrap: { width: width - 40 },
      });
      contentText.setOrigin(0.5, 0);
      contentText.setDepth(depth + 1);
    }
    
    // 可选卡片的交互
    if (selectable) {
      bg.setInteractive({
        useHandCursor: true,
        hitArea: new Input.Rectangle(x - width/2, y - height/2, width, height),
      });
    }
    
    return {
      bg,
      title: titleText,
      content: contentText,
      destroy: () => {
        bg.destroy();
        titleText?.destroy();
        contentText?.destroy();
      },
    };
  }
  
  /**
   * 创建面板
   */
  createPanel(config: PanelConfig): {
    panel: GameObjects.Graphics;
    title?: GameObjects.Text;
    destroy: () => void;
  } {
    const {
      x, y, width, height, title,
      headerHeight = 60,
      depth = 5,
    } = config;
    
    const panel = this.scene.add.graphics();
    panel.setDepth(depth);
    
    // 绘制面板主体
    panel.fillStyle(COLORS.DEEP_BLUE, ALPHA.PRIMARY);
    panel.fillRoundedRect(x, y, width, height, 20);
    
    panel.lineStyle(2, COLORS.ENERGY_BLUE, 0.7);
    panel.strokeRoundedRect(x, y, width, height, 20);
    
    let titleText: GameObjects.Text | undefined;
    
    // 创建标题栏（如果有）
    if (title) {
      // 标题栏背景
      panel.fillStyle(COLORS.MIDNIGHT, ALPHA.SECONDARY);
      panel.fillRoundedRect(x, y, width, headerHeight, 20);
      
      // 标题栏底部边框
      panel.lineStyle(1, COLORS.GLOW_BLUE, 0.5);
      panel.lineBetween(x, y + headerHeight, x + width, y + headerHeight);
      
      // 标题文字
      titleText = this.scene.add.text(x + width/2, y + headerHeight/2, title, {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.SUBHEAD,
        color: '#8fd0ff',
        align: 'center',
      });
      titleText.setOrigin(0.5);
      titleText.setDepth(depth + 1);
    }
    
    return {
      panel,
      title: titleText,
      destroy: () => {
        panel.destroy();
        titleText?.destroy();
      },
    };
  }
  
  /**
   * 创建进度条
   */
  createProgressBar(config: ProgressBarConfig): {
    bg: GameObjects.Rectangle;
    fill: GameObjects.Rectangle;
    text?: GameObjects.Text;
    destroy: () => void;
  } {
    const {
      x, y, width, height, value, maxValue,
      showText = true,
      color = COLORS.ENERGY_BLUE,
      glow = true,
      depth = 10,
    } = config;
    
    // 背景条
    const bg = this.scene.add.rectangle(x, y, width, height, COLORS.MIDNIGHT, ALPHA.PRIMARY);
    bg.setStrokeStyle(1, COLORS.ENERGY_BLUE, 0.5);
    bg.setDepth(depth);
    bg.setOrigin(0.5);
    
    // 进度填充
    const fillWidth = Math.max(0, Math.min(1, value / maxValue)) * width;
    const fill = this.scene.add.rectangle(
      x - width/2,
      y,
      fillWidth,
      height,
      color,
      ALPHA.SECONDARY
    );
    fill.setOrigin(0, 0.5);
    fill.setDepth(depth + 1);
    
    // 发光效果
    if (glow) {
      this.scene.tweens.add({
        targets: fill,
        alpha: 0.7,
        duration: 1800,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
    
    let text: GameObjects.Text | undefined;
    
    // 进度文字
    if (showText) {
      const percent = Math.round((value / maxValue) * 100);
      text = this.scene.add.text(x, y + height/2 + 15, `${value} / ${maxValue} (${percent}%)`, {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.TINY,
        color: '#8ec5ff',
        align: 'center',
      });
      text.setOrigin(0.5, 0);
      text.setDepth(depth + 2);
    }
    
    return {
      bg,
      fill,
      text,
      destroy: () => {
        bg.destroy();
        fill.destroy();
        text?.destroy();
      },
    };
  }
  
  /**
   * 创建标准文字
   */
  createText(
    x: number,
    y: number,
    text: string,
    options: {
      fontSize?: number;
      color?: string;
      align?: 'left' | 'center' | 'right';
      originX?: number;
      originY?: number;
      wordWrap?: { width: number };
      depth?: number;
    } = {}
  ): GameObjects.Text {
    const {
      fontSize = FONTS.SIZES.BODY,
      color = '#eef7ff',
      align = 'left',
      originX = 0,
      originY = 0,
      wordWrap,
      depth = 10,
    } = options;
    
    const textObj = this.scene.add.text(x, y, text, {
      fontFamily: FONTS.CHINESE,
      fontSize,
      color,
      align,
      wordWrap,
    });
    
    textObj.setOrigin(originX, originY);
    textObj.setDepth(depth);
    
    return textObj;
  }
  
  /**
   * 应用进入动画
   */
  applyEnterAnimation(
    target: GameObjects.GameObject,
    animationType: keyof typeof ANIMATIONS = 'FADE_IN'
  ): Phaser.Tweens.Tween {
    const config = ANIMATIONS[animationType];
    return this.scene.tweens.add({
      targets: target,
      ...config,
    });
  }
  
  /**
   * 应用强调动画
   */
  applyEmphasisAnimation(
    target: GameObjects.GameObject,
    animationType: 'PULSE' | 'BREATHE' = 'PULSE'
  ): Phaser.Tweens.Tween {
    const config = ANIMATIONS[animationType];
    return this.scene.tweens.add({
      targets: target,
      ...config,
    });
  }
}