import { Scene, GameObjects, Math as PhaserMath, Geom } from 'phaser';

/* ================================================================
   《覆幕重启》Veil Reset - 区块管理系统
   功能：
   1. 区块视觉表示（2.5D等距视图）
   2. 区块状态管理（安全、危险、资源、神秘、Boss）
   3. 交互和事件触发
   4. 资源生成和消耗
   ================================================================ */

export type BlockType = 'home' | 'resource' | 'danger' | 'mystery' | 'safe' | 'boss';

export interface BlockConfig {
  type: BlockType;
  difficulty: number; // 1-10
  rewardMultiplier: number; // 奖励系数
  eventFrequency: number; // 事件频率（毫秒）
  isExplored: boolean;
  isActive: boolean;
}

export class Block {
  private scene: Scene;
  private x: number;
  private y: number;
  private id: number;
  private config: BlockConfig;
  
  // 视觉元素
  private container!: GameObjects.Container;
  private background!: GameObjects.Graphics;
  private highlight!: GameObjects.Graphics;
  private icon!: GameObjects.Text;
  private label!: GameObjects.Text;
  private statusIndicator!: GameObjects.Graphics;
  
  // 交互状态
  private isHovered: boolean = false;
  private isSelected: boolean = false;
  private isExplorable: boolean = true;
  
  // 区块数据
  private resources: {
    energy: number;
    material: number;
    data: number;
  };
  
  private events: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: number;
  }>;

  constructor(scene: Scene, x: number, y: number, id: number, type: BlockType = 'safe') {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.id = id;
    
    // 根据类型配置区块
    this.config = this.getConfigForType(type);
    
    // 初始化资源和事件
    this.resources = {
      energy: this.generateRandomResource(100, 300),
      material: this.generateRandomResource(50, 150),
      data: this.generateRandomResource(10, 50)
    };
    
    this.events = [];
  }

  // ==================== 公共方法 ====================

  create(): void {
    this.createVisualElements();
    this.setupInteractivity();
    this.updateVisualState();
    
    console.log(`区块 ${this.id} 创建完成 - 类型: ${this.config.type}, 位置: (${this.x}, ${this.y})`);
  }

  update(): void {
    // 更新区块状态
    if (this.config.isActive && this.config.eventFrequency > 0) {
      // 这里可以添加定时事件触发逻辑
    }
    
    // 更新视觉状态
    if (this.isHovered) {
      this.updateHoverEffect();
    }
  }

  getBlockId(): number {
    return this.id;
  }

  getBlockType(): BlockType {
    return this.config.type;
  }

  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y };
  }

  getResources(): { energy: number; material: number; data: number } {
    return { ...this.resources };
  }

  getConfig(): BlockConfig {
    return { ...this.config };
  }

  isExplorableNow(): boolean {
    return this.isExplorable && !this.config.isExplored;
  }

  explore(): { success: boolean; rewards: any; events: any[] } {
    if (!this.isExplorableNow()) {
      return {
        success: false,
        rewards: null,
        events: []
      };
    }
    
    this.config.isExplored = true;
    this.isExplorable = false;
    
    // 生成探索奖励
    const rewards = this.generateExplorationRewards();
    
    // 生成探索事件
    const events = this.generateExplorationEvents();
    
    // 更新视觉状态
    this.updateVisualState();
    
    console.log(`区块 ${this.id} 已探索 - 奖励:`, rewards);
    
    return {
      success: true,
      rewards,
      events
    };
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateVisualState();
  }

  setHovered(hovered: boolean): void {
    this.isHovered = hovered;
    this.updateVisualState();
  }

  // ==================== 私有方法 ====================

  private createVisualElements(): void {
    // 创建容器
    this.container = this.scene.add.container(this.x, this.y);
    
    // 创建背景（等距菱形）
    this.background = this.scene.add.graphics();
    this.drawBlockBackground();
    
    // 创建高亮效果
    this.highlight = this.scene.add.graphics();
    
    // 创建图标
    const iconChar = this.getIconForType();
    this.icon = this.scene.add.text(0, -20, iconChar, {
      fontFamily: 'Arial, sans-serif',
      fontSize: 48,
      color: this.getColorForType(),
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);
    
    // 创建标签
    this.label = this.scene.add.text(0, 40, `区块 ${this.id}`, {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 18,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5);
    
    // 创建状态指示器
    this.statusIndicator = this.scene.add.graphics();
    
    // 添加到容器
    this.container.add([
      this.background,
      this.highlight,
      this.icon,
      this.label,
      this.statusIndicator
    ]);
    
    // 设置容器深度
    this.container.setDepth(this.y); // 使用y坐标作为深度，实现2.5D重叠效果
  }

  private drawBlockBackground(): void {
    const size = 120;
    const halfSize = size / 2;
    const quarterSize = size / 4;
    
    // 清空图形
    this.background.clear();
    
    // 根据区块类型设置颜色
    const fillColor = this.getBackgroundColor();
    const lineColor = this.getBorderColor();
    
    // 绘制等距菱形（2.5D效果）
    this.background.fillStyle(fillColor, 0.8);
    this.background.lineStyle(2, lineColor, 0.9);
    
    // 绘制等距菱形（2.5D效果） - 手动绘制而不是使用fillPoints
    this.background.beginPath();
    this.background.moveTo(0, -quarterSize);
    this.background.lineTo(halfSize, 0);
    this.background.lineTo(0, quarterSize);
    this.background.lineTo(-halfSize, 0);
    this.background.closePath();
    this.background.fillPath();
    this.background.strokePath();
    
    // 添加内部纹理
    this.background.lineStyle(1, lineColor, 0.4);
    
    // 对角线
    this.background.lineBetween(-halfSize, 0, halfSize, 0);
    this.background.lineBetween(0, -quarterSize, 0, quarterSize);
    
    // 内部菱形 - 手动绘制
    const innerSize = size * 0.6;
    const innerHalf = innerSize / 2;
    const innerQuarter = innerSize / 4;
    
    this.background.beginPath();
    this.background.moveTo(0, -innerQuarter);
    this.background.lineTo(innerHalf, 0);
    this.background.lineTo(0, innerQuarter);
    this.background.lineTo(-innerHalf, 0);
    this.background.closePath();
    this.background.strokePath();
  }

  private setupInteractivity(): void {
    // 设置交互区域（使用背景图形的边界框）
    this.container.setInteractive(
      new Phaser.Geom.Rectangle(-60, -30, 120, 60),
      Phaser.Geom.Rectangle.Contains
    );
    
    // 鼠标悬停事件
    this.container.on('pointerover', () => {
      this.setHovered(true);
    });
    
    this.container.on('pointerout', () => {
      this.setHovered(false);
    });
    
    // 点击事件
    this.container.on('pointerdown', () => {
      this.setSelected(true);
      
      // 触发区块选择事件
      this.scene.events.emit('blockSelected', {
        blockId: this.id,
        blockType: this.config.type,
        position: this.getPosition(),
        config: this.getConfig(),
        resources: this.getResources()
      });
    });
  }

  private updateVisualState(): void {
    // 更新高亮效果
    this.highlight.clear();
    
    if (this.isSelected) {
      // 选中状态 - 金色边框
      this.highlight.lineStyle(4, 0xFFD700, 0.8);
      this.drawBlockOutline(this.highlight, 1.1);
    } else if (this.isHovered) {
      // 悬停状态 - 蓝色光晕
      this.highlight.lineStyle(3, 0x4470B8, 0.6);
      this.drawBlockOutline(this.highlight, 1.05);
    }
    
    // 更新状态指示器
    this.statusIndicator.clear();
    
    if (this.config.isExplored) {
      // 已探索 - 绿色标记
      this.statusIndicator.fillStyle(0x00FF00, 0.8);
      this.statusIndicator.fillCircle(50, -40, 6);
    } else if (!this.isExplorable) {
      // 不可探索 - 红色标记
      this.statusIndicator.fillStyle(0xFF0000, 0.8);
      this.statusIndicator.fillCircle(50, -40, 6);
    }
    
    // 更新图标颜色
    if (this.config.isExplored) {
      this.icon.setColor('#88FF88');
    } else if (!this.isExplorable) {
      this.icon.setColor('#FF8888');
    } else {
      this.icon.setColor(this.getColorForType());
    }
  }

  private updateHoverEffect(): void {
    // 添加脉动效果
    const pulse = Math.sin(Date.now() * 0.005) * 0.05 + 1.0;
    
    if (this.isHovered && !this.isSelected) {
      this.container.setScale(pulse);
    } else {
      this.container.setScale(1.0);
    }
  }

  private drawBlockOutline(graphics: GameObjects.Graphics, scale: number): void {
    const size = 120 * scale;
    const halfSize = size / 2;
    const quarterSize = size / 4;
    
    graphics.beginPath();
    graphics.moveTo(0, -quarterSize);
    graphics.lineTo(halfSize, 0);
    graphics.lineTo(0, quarterSize);
    graphics.lineTo(-halfSize, 0);
    graphics.closePath();
    graphics.strokePath();
  }

  // ==================== 配置和颜色方法 ====================

  private getConfigForType(type: BlockType): BlockConfig {
    const configs: Record<BlockType, BlockConfig> = {
      'home': {
        type: 'home',
        difficulty: 1,
        rewardMultiplier: 1.0,
        eventFrequency: 0,
        isExplored: true,
        isActive: true
      },
      'resource': {
        type: 'resource',
        difficulty: 3,
        rewardMultiplier: 2.0,
        eventFrequency: 15000,
        isExplored: false,
        isActive: true
      },
      'danger': {
        type: 'danger',
        difficulty: 6,
        rewardMultiplier: 1.5,
        eventFrequency: 10000,
        isExplored: false,
        isActive: true
      },
      'mystery': {
        type: 'mystery',
        difficulty: 4,
        rewardMultiplier: 3.0,
        eventFrequency: 20000,
        isExplored: false,
        isActive: true
      },
      'safe': {
        type: 'safe',
        difficulty: 2,
        rewardMultiplier: 1.2,
        eventFrequency: 30000,
        isExplored: false,
        isActive: true
      },
      'boss': {
        type: 'boss',
        difficulty: 10,
        rewardMultiplier: 5.0,
        eventFrequency: 5000,
        isExplored: false,
        isActive: false // 需要特定条件激活
      }
    };
    
    return configs[type] || configs.safe;
  }

  private getColorForType(): string {
    const colors: Record<BlockType, string> = {
      'home': '#FFAA44',      // 橙色 - 家园
      'resource': '#44AAFF',  // 蓝色 - 资源
      'danger': '#FF4444',    // 红色 - 危险
      'mystery': '#AA44FF',   // 紫色 - 神秘
      'safe': '#44FFAA',      // 绿色 - 安全
      'boss': '#FF44AA'       // 粉色 - Boss
    };
    
    return colors[this.config.type] || '#FFFFFF';
  }

  private getBackgroundColor(): number {
    const colors: Record<BlockType, number> = {
      'home': 0x1A2E4E,      // 深蓝
      'resource': 0x0E3A5E,  // 资源蓝
      'danger': 0x4E1A1A,    // 暗红
      'mystery': 0x3A1A5E,   // 暗紫
      'safe': 0x1A4E3A,      // 暗绿
      'boss': 0x5E1A3A       // 暗粉
    };
    
    return colors[this.config.type] || 0x1A2E4E;
  }

  private getBorderColor(): number {
    const colors: Record<BlockType, number> = {
      'home': 0xFFAA44,      // 金橙色
      'resource': 0x44AAFF,  // 亮蓝色
      'danger': 0xFF4444,    // 亮红色
      'mystery': 0xAA44FF,   // 亮紫色
      'safe': 0x44FFAA,      // 亮绿色
      'boss': 0xFF44AA       // 亮粉色
    };
    
    return colors[this.config.type] || 0x4470B8;
  }

  private getIconForType(): string {
    const icons: Record<BlockType, string> = {
      'home': '🏠',      // 家
      'resource': '⚙️',  // 齿轮
      'danger': '⚠️',    // 警告
      'mystery': '❓',   // 问号
      'safe': '🛡️',     // 盾牌
      'boss': '👑'      // 皇冠
    };
    
    return icons[this.config.type] || '■';
  }

  // ==================== 资源和事件生成 ====================

  private generateRandomResource(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private generateExplorationRewards(): {
    energy: number;
    material: number;
    data: number;
    influence: number;
  } {
    const baseReward = 50 * this.config.rewardMultiplier;
    
    return {
      energy: Math.floor(this.resources.energy * 0.7 * this.config.rewardMultiplier),
      material: Math.floor(this.resources.material * 0.7 * this.config.rewardMultiplier),
      data: Math.floor(this.resources.data * 0.7 * this.config.rewardMultiplier),
      influence: Math.floor(baseReward * (this.config.difficulty / 10))
    };
  }

  private generateExplorationEvents(): Array<{
    id: string;
    type: string;
    description: string;
    timestamp: number;
  }> {
    const events = [];
    const timestamp = Date.now();
    
    // 根据区块类型生成不同事件
    switch (this.config.type) {
      case 'resource':
        events.push({
          id: `resource_discovery_${this.id}_${timestamp}`,
          type: 'discovery',
          description: `在区块 ${this.id} 发现了丰富的资源矿脉`,
          timestamp
        });
        break;
        
      case 'danger':
        events.push({
          id: `danger_encounter_${this.id}_${timestamp}`,
          type: 'encounter',
          description: `区块 ${this.id} 存在危险实体，需要小心应对`,
          timestamp
        });
        break;
        
      case 'mystery':
        events.push({
          id: `mystery_reveal_${this.id}_${timestamp}`,
          type: 'mystery',
          description: `区块 ${this.id} 的神秘面纱被揭开...`,
          timestamp
        });
        break;
        
      case 'boss':
        events.push({
          id: `boss_awaken_${this.id}_${timestamp}`,
          type: 'boss',
          description: `警告！区块 ${this.id} 的Boss已被唤醒`,
          timestamp
        });
        break;
        
      default:
        events.push({
          id: `block_explored_${this.id}_${timestamp}`,
          type: 'exploration',
          description: `区块 ${this.id} 已被成功探索`,
          timestamp
        });
    }
    
    // 添加到事件列表
    this.events.push(...events);
    
    return events;
  }

  // ==================== 序列化和反序列化 ====================

  serialize(): any {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      type: this.config.type,
      config: this.config,
      resources: this.resources,
      events: this.events,
      isExplorable: this.isExplorable
    };
  }

  static deserialize(scene: Scene, data: any): Block {
    const block = new Block(scene, data.x, data.y, data.id, data.type);
    block.config = data.config;
    block.resources = data.resources;
    block.events = data.events;
    block.isExplorable = data.isExplorable;
    
    // 重新创建视觉元素
    block.create();
    
    return block;
  }
}