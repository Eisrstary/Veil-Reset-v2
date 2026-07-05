import { Scene, GameObjects, Input } from 'phaser';
import { UIFactory, COLORS, FONTS, ALPHA } from '../UIFactory';

/**
 * 干员卡片配置
 */
export interface OperatorCardConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  operator: OperatorData;
  onClick?: (operator: OperatorData) => void;
  selected?: boolean;
  showStatus?: boolean;
  showLevel?: boolean;
  depth?: number;
}

/**
 * 干员数据接口（简化版）
 */
export interface OperatorData {
  id: string;
  name: string;
  class: 'combat' | 'support' | 'scout' | 'specialist';
  level: number;
  trust: number;           // 0-100
  bond: number;            // 0-100
  status: 'available' | 'deployed' | 'resting' | 'injured';
  portrait?: string;       // 头像资源名称
}

/**
 * 干员卡片组件
 */
export class OperatorCard {
  private scene: Scene;
  private uiFactory: UIFactory;
  private config: OperatorCardConfig;
  
  // 图形对象
  private bg: GameObjects.Graphics;
  private portraitBg?: GameObjects.Rectangle;
  private portrait?: GameObjects.Image;
  private nameText: GameObjects.Text;
  private levelText?: GameObjects.Text;
  private trustBar?: GameObjects.Graphics;
  private statusIndicator?: GameObjects.Graphics;
  private glowOverlay?: GameObjects.Graphics;
  
  // 状态
  private isHovered = false;
  private isSelected = false;
  
  constructor(scene: Scene, config: OperatorCardConfig) {
    this.scene = scene;
    this.uiFactory = new UIFactory(scene);
    this.config = { ...config };
    this.isSelected = config.selected || false;
    
    // 创建卡片
    this.bg = this.createBackground();
    this.nameText = this.createNameText();
    
    if (config.showLevel) {
      this.levelText = this.createLevelText();
    }
    
    if (config.operator.portrait) {
      this.portraitBg = this.createPortraitBackground();
      this.portrait = this.createPortrait();
    }
    
    if (config.showStatus) {
      this.trustBar = this.createTrustBar();
      this.statusIndicator = this.createStatusIndicator();
    }
    
    this.setupInteractivity();
    
    if (this.isSelected) {
      this.applySelectedStyle();
    }
  }
  
  /**
   * 创建卡片背景
   */
  private createBackground(): GameObjects.Graphics {
    const { x, y, width, height } = this.config;
    const bg = this.scene.add.graphics();
    bg.setDepth(this.config.depth || 10);
    
    // 渐变背景
    const gradient = this.scene.textures.createCanvas('cardGradient', width, height);
    const ctx = gradient.getContext();
    
    // 创建线性渐变
    const grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, `rgba(14, 16, 40, ${ALPHA.PRIMARY})`);
    grd.addColorStop(1, `rgba(28, 36, 72, ${ALPHA.PRIMARY})`);
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    
    gradient.refresh();
    
    // 使用纹理填充
    bg.fillStyle(0xffffff);
    bg.fillRect(x - width/2, y - height/2, width, height);
    bg.setTexture('cardGradient');
    
    // 边框
    const borderColor = this.isSelected ? COLORS.BRIGHT_BLUE : COLORS.ENERGY_BLUE;
    const borderAlpha = this.isSelected ? 0.9 : 0.6;
    
    bg.lineStyle(2, borderColor, borderAlpha);
    bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
    
    return bg;
  }
  
  /**
   * 创建头像背景
   */
  private createPortraitBackground(): GameObjects.Rectangle {
    const { x, y, width, height } = this.config;
    const portraitSize = height * 0.7;
    
    const portraitBg = this.scene.add.rectangle(
      x - width/2 + 25,
      y,
      portraitSize,
      portraitSize,
      COLORS.DEEP_BLUE,
      ALPHA.SECONDARY
    );
    portraitBg.setOrigin(0, 0.5);
    portraitBg.setDepth(this.config.depth || 11);
    portraitBg.setStrokeStyle(1, COLORS.GLOW_BLUE, 0.5);
    
    return portraitBg;
  }
  
  /**
   * 创建头像
   */
  private createPortrait(): GameObjects.Image {
    const { x, y, width, height } = this.config;
    const portraitSize = height * 0.6;
    
    let portrait: GameObjects.Image;
    
    // 尝试加载头像
    try {
      portrait = this.scene.add.image(
        x - width/2 + 25 + portraitSize/2,
        y,
        this.config.operator.portrait!
      );
      portrait.setDisplaySize(portraitSize, portraitSize);
      portrait.setOrigin(0.5);
      portrait.setDepth(this.config.depth || 12);
      
      // 添加圆形遮罩效果
      const mask = this.scene.add.graphics();
      mask.fillStyle(0xffffff);
      mask.fillCircle(
        x - width/2 + 25 + portraitSize/2,
        y,
        portraitSize/2
      );
      portrait.setMask(mask.createGeometryMask());
    } catch {
      // 如果头像加载失败，使用占位符
      const placeholder = this.scene.add.graphics();
      placeholder.fillStyle(COLORS.MIDNIGHT, ALPHA.PRIMARY);
      placeholder.fillCircle(
        x - width/2 + 25 + portraitSize/2,
        y,
        portraitSize/2
      );
      placeholder.lineStyle(2, COLORS.GLOW_BLUE, 0.7);
      placeholder.strokeCircle(
        x - width/2 + 25 + portraitSize/2,
        y,
        portraitSize/2
      );
      
      // 显示职业图标
      const classIcon = this.getClassIcon();
      const iconText = this.scene.add.text(
        x - width/2 + 25 + portraitSize/2,
        y,
        classIcon,
        {
          fontFamily: FONTS.CHINESE,
          fontSize: portraitSize * 0.5,
          color: '#8fd0ff',
        }
      );
      iconText.setOrigin(0.5);
      iconText.setDepth(this.config.depth || 13);
      
      // 返回占位符图形
      portrait = placeholder as unknown as GameObjects.Image;
    }
    
    return portrait;
  }
  
  /**
   * 获取职业图标
   */
  private getClassIcon(): string {
    const { class: opClass } = this.config.operator;
    
    switch (opClass) {
      case 'combat': return '⚔️';
      case 'support': return '🛡️';
      case 'scout': return '👁️';
      case 'specialist': return '🔧';
      default: return '❓';
    }
  }
  
  /**
   * 创建名字文字
   */
  private createNameText(): GameObjects.Text {
    const { x, y, width, height, operator } = this.config;
    
    const textX = operator.portrait ? x - width/2 + 25 + height * 0.7 + 20 : x - width/2 + 20;
    const textY = y - height * 0.2;
    
    const nameText = this.scene.add.text(textX, textY, operator.name, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.BODY,
      color: this.isSelected ? '#fef3c7' : '#e9f7ff',
    });
    nameText.setOrigin(0, 0);
    nameText.setDepth(this.config.depth || 11);
    
    // 添加阴影效果
    nameText.setStroke('#091120', 2);
    
    return nameText;
  }
  
  /**
   * 创建等级文字
   */
  private createLevelText(): GameObjects.Text {
    const { x, y, width, height, operator } = this.config;
    
    const textX = operator.portrait ? x - width/2 + 25 + height * 0.7 + 20 : x - width/2 + 20;
    const textY = y + height * 0.1;
    
    const levelText = this.scene.add.text(textX, textY, `Lv.${operator.level}`, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.SMALL,
      color: '#8fd0ff',
    });
    levelText.setOrigin(0, 0);
    levelText.setDepth(this.config.depth || 11);
    
    return levelText;
  }
  
  /**
   * 创建信任度条
   */
  private createTrustBar(): GameObjects.Graphics {
    const { x, y, width, height, operator } = this.config;
    
    const trustBar = this.scene.add.graphics();
    trustBar.setDepth(this.config.depth || 11);
    
    // 背景条
    const barWidth = width * 0.4;
    const barHeight = 8;
    const barX = operator.portrait ? x - width/2 + 25 + height * 0.7 + 20 : x - width/2 + 20;
    const barY = y + height * 0.3;
    
    trustBar.fillStyle(COLORS.MIDNIGHT, ALPHA.PRIMARY);
    trustBar.fillRect(barX, barY, barWidth, barHeight);
    trustBar.lineStyle(1, COLORS.ENERGY_BLUE, 0.5);
    trustBar.strokeRect(barX, barY, barWidth, barHeight);
    
    // 填充条（信任度）
    const fillWidth = (operator.trust / 100) * barWidth;
    const fillColor = this.getTrustColor(operator.trust);
    
    trustBar.fillStyle(fillColor, ALPHA.SECONDARY);
    trustBar.fillRect(barX, barY, fillWidth, barHeight);
    
    // 信任度文字
    const trustText = this.scene.add.text(
      barX + barWidth + 10,
      barY,
      `${operator.trust}%`,
      {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.TINY,
        color: '#8ec5ff',
      }
    );
    trustText.setOrigin(0, 0);
    trustText.setDepth(this.config.depth || 12);
    
    // 保存文字引用
    (trustBar as any).trustText = trustText;
    
    return trustBar;
  }
  
  /**
   * 根据信任度获取颜色
   */
  private getTrustColor(trust: number): number {
    if (trust >= 80) return COLORS.SUCCESS;      // 高信任：亮蓝色
    if (trust >= 50) return COLORS.INFO;        // 中等信任：蓝色
    if (trust >= 30) return COLORS.WARNING;     // 低信任：金色
    return COLORS.DANGER;                      // 极低信任：红色
  }
  
  /**
   * 创建状态指示器
   */
  private createStatusIndicator(): GameObjects.Graphics {
    const { x, y, width, height, operator } = this.config;
    
    const indicator = this.scene.add.graphics();
    indicator.setDepth(this.config.depth || 11);
    
    const size = 10;
    const indicatorX = x + width/2 - 15;
    const indicatorY = y - height/2 + 15;
    
    const { color, alpha } = this.getStatusColor(operator.status);
    
    indicator.fillStyle(color, alpha);
    indicator.fillCircle(indicatorX, indicatorY, size);
    
    indicator.lineStyle(1, COLORS.WARM_WHITE, 0.8);
    indicator.strokeCircle(indicatorX, indicatorY, size);
    
    // 如果状态是"部署中"，添加脉冲动画
    if (operator.status === 'deployed') {
      this.scene.tweens.add({
        targets: indicator,
        alpha: 0.5,
        duration: 1200,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });
    }
    
    return indicator;
  }
  
  /**
   * 获取状态颜色
   */
  private getStatusColor(status: OperatorData['status']): { color: number; alpha: number } {
    switch (status) {
      case 'available':
        return { color: COLORS.SUCCESS, alpha: 0.9 };      // 可用：绿色
      case 'deployed':
        return { color: COLORS.BRIGHT_BLUE, alpha: 0.9 };   // 部署中：亮蓝色
      case 'resting':
        return { color: COLORS.GLOW_BLUE, alpha: 0.7 };     // 休息中：蓝色
      case 'injured':
        return { color: COLORS.DANGER, alpha: 0.9 };        // 受伤：红色
      default:
        return { color: COLORS.INFO, alpha: 0.7 };          // 默认：信息蓝
    }
  }
  
  /**
   * 设置交互性
   */
  private setupInteractivity(): void {
    if (!this.config.onClick) return;
    
    const { x, y, width, height } = this.config;
    
    this.bg.setInteractive({
      useHandCursor: true,
      hitArea: new Input.Rectangle(-width/2, -height/2, width, height),
      hitAreaCallback: Input.Rectangle.Contains,
    });
    
    // 悬停效果
    this.bg.on('pointerover', () => {
      this.isHovered = true;
      this.applyHoverStyle();
    });
    
    this.bg.on('pointerout', () => {
      this.isHovered = false;
      if (this.isSelected) {
        this.applySelectedStyle();
      } else {
        this.applyNormalStyle();
      }
    });
    
    // 点击效果
    this.bg.on('pointerdown', () => {
      if (this.config.onClick) {
        // 点击动画
        this.scene.tweens.add({
          targets: this.bg,
          scaleX: 0.98,
          scaleY: 0.98,
          duration: 80,
          yoyo: true,
          onComplete: () => {
            this.config.onClick!(this.config.operator);
          },
        });
      }
    });
  }
  
  /**
   * 应用悬停样式
   */
  private applyHoverStyle(): void {
    if (this.isSelected) return;
    
    // 创建发光覆盖层
    if (!this.glowOverlay) {
      const { x, y, width, height } = this.config;
      this.glowOverlay = this.scene.add.graphics();
      this.glowOverlay.setDepth(this.config.depth || 9);
      
      this.glowOverlay.lineStyle(3, COLORS.BRIGHT_BLUE, 0.3);
      this.glowOverlay.strokeRoundedRect(
        x - width/2 - 2,
        y - height/2 - 2,
        width + 4,
        height + 4,
        14
      );
    }
    
    // 卡片轻微上浮
    this.scene.tweens.add({
      targets: this.bg,
      y: this.config.y - 5,
      duration: 150,
      ease: 'Power2',
    });
    
    // 边框亮度增加
    this.bg.clear();
    this.redrawBackground(COLORS.BRIGHT_BLUE, 0.8);
  }
  
  /**
   * 应用选中样式
   */
  applySelectedStyle(): void {
    this.isSelected = true;
    
    // 移除发光覆盖层
    if (this.glowOverlay) {
      this.glowOverlay.destroy();
      this.glowOverlay = undefined;
    }
    
    // 绘制选中边框
    this.bg.clear();
    this.redrawBackground(COLORS.BRIGHT_BLUE, 0.9);
    
    // 金色高亮边框
    const { x, y, width, height } = this.config;
    const highlight = this.scene.add.graphics();
    highlight.setDepth(this.config.depth || 9);
    
    highlight.lineStyle(2, COLORS.GOLD_ACCENT, 0.8);
    highlight.strokeRoundedRect(
      x - width/2 - 1,
      y - height/2 - 1,
      width + 2,
      height + 2,
      13
    );
    
    // 脉冲动画
    this.scene.tweens.add({
      targets: highlight,
      alpha: 0.5,
      duration: 800,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    
    // 保存引用
    (this.bg as any).highlight = highlight;
    
    // 更新名字颜色
    this.nameText.setColor('#fef3c7');
  }
  
  /**
   * 应用普通样式
   */
  private applyNormalStyle(): void {
    this.isSelected = false;
    
    // 移除发光覆盖层
    if (this.glowOverlay) {
      this.glowOverlay.destroy();
      this.glowOverlay = undefined;
    }
    
    // 移除高亮边框
    const highlight = (this.bg as any).highlight;
    if (highlight) {
      highlight.destroy();
      (this.bg as any).highlight = undefined;
    }
    
    // 重置位置
    this.scene.tweens.add({
      targets: this.bg,
      y: this.config.y,
      duration: 150,
      ease: 'Power2',
    });
    
    // 绘制普通边框
    this.bg.clear();
    this.redrawBackground(COLORS.ENERGY_BLUE, 0.6);
    
    // 重置名字颜色
    this.nameText.setColor('#e9f7ff');
  }
  
  /**
   * 重新绘制背景
   */
  private redrawBackground(borderColor: number, borderAlpha: number): void {
    const { x, y, width, height } = this.config;
    
    // 渐变背景（复用之前的逻辑）
    this.bg.fillStyle(0xffffff);
    this.bg.fillRect(x - width/2, y - height/2, width, height);
    
    // 使用纹理填充
    if (!this.scene.textures.exists('cardGradient')) {
      this.createGradientTexture(width, height);
    }
    this.bg.setTexture('cardGradient');
    
    // 边框
    this.bg.lineStyle(2, borderColor, borderAlpha);
    this.bg.strokeRoundedRect(x - width/2, y - height/2, width, height, 12);
  }
  
  /**
   * 创建渐变纹理
   */
  private createGradientTexture(width: number, height: number): void {
    const gradient = this.scene.textures.createCanvas('cardGradient', width, height);
    const ctx = gradient.getContext();
    
    const grd = ctx.createLinearGradient(0, 0, width, height);
    grd.addColorStop(0, `rgba(14, 16, 40, ${ALPHA.PRIMARY})`);
    grd.addColorStop(1, `rgba(28, 36, 72, ${ALPHA.PRIMARY})`);
    
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    
    gradient.refresh();
  }
  
  /**
   * 设置选中状态
   */
  setSelected(selected: boolean): void {
    if (selected === this.isSelected) return;
    
    this.isSelected = selected;
    
    if (selected) {
      this.applySelectedStyle();
    } else {
      this.applyNormalStyle();
    }
  }
  
  /**
   * 更新干员数据
   */
  updateOperator(operator: OperatorData): void {
    this.config.operator = operator;
    
    // 更新名字
    this.nameText.setText(operator.name);
    
    // 更新等级
    if (this.levelText) {
      this.levelText.setText(`Lv.${operator.level}`);
    }
    
    // 更新信任度条
    if (this.trustBar) {
      this.trustBar.clear();
      
      const { x, y, width, height } = this.config;
      const barWidth = width * 0.4;
      const barHeight = 8;
      const barX = operator.portrait ? x - width/2 + 25 + height * 0.7 + 20 : x - width/2 + 20;
      const barY = y + height * 0.3;
      
      // 背景条
      this.trustBar.fillStyle(COLORS.MIDNIGHT, ALPHA.PRIMARY);
      this.trustBar.fillRect(barX, barY, barWidth, barHeight);
      this.trustBar.lineStyle(1, COLORS.ENERGY_BLUE, 0.5);
      this.trustBar.strokeRect(barX, barY, barWidth, barHeight);
      
      // 填充条
      const fillWidth = (operator.trust / 100) * barWidth;
      const fillColor = this.getTrustColor(operator.trust);
      
      this.trustBar.fillStyle(fillColor, ALPHA.SECONDARY);
      this.trustBar.fillRect(barX, barY, fillWidth, barHeight);
      
      // 更新信任度文字
      const trustText = (this.trustBar as any).trustText;
      if (trustText) {
        trustText.setText(`${operator.trust}%`);
      }
    }
    
    // 更新状态指示器
    if (this.statusIndicator) {
      this.statusIndicator.clear();
      
      const { x, y, width, height } = this.config;
      const size = 10;
      const indicatorX = x + width/2 - 15;
      const indicatorY = y - height/2 + 15;
      
      const { color, alpha } = this.getStatusColor(operator.status);
      
      this.statusIndicator.fillStyle(color, alpha);
      this.statusIndicator.fillCircle(indicatorX, indicatorY, size);
      
      this.statusIndicator.lineStyle(1, COLORS.WARM_WHITE, 0.8);
      this.statusIndicator.strokeCircle(indicatorX, indicatorY, size);
    }
  }
  
  /**
   * 获取干员数据
   */
  getOperator(): OperatorData {
    return this.config.operator;
  }
  
  /**
   * 销毁组件
   */
  destroy(): void {
    this.bg.destroy();
    this.nameText.destroy();
    
    this.portraitBg?.destroy();
    this.portrait?.destroy();
    this.levelText?.destroy();
    this.trustBar?.destroy();
    this.statusIndicator?.destroy();
    this.glowOverlay?.destroy();
    
    // 销毁信任度文字
    if (this.trustBar && (this.trustBar as any).trustText) {
      (this.trustBar as any).trustText.destroy();
    }
    
    // 销毁高亮边框
    const highlight = (this.bg as any).highlight;
    if (highlight) {
      highlight.destroy();
    }
    
    // 清理纹理
    if (this.scene.textures.exists('cardGradient')) {
      this.scene.textures.remove('cardGradient');
    }
  }
}