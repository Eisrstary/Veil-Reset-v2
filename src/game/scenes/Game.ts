import { Scene, GameObjects, Math as PhaserMath, Types, Input } from 'phaser';
import { Block, BlockType } from '../systems/Block';
import { GameState, ResourceType, FactionType } from '../systems/GameState';

/* ================================================================
   《覆幕重启》Veil Reset - 基地场景
   核心功能：
   1. 2.5D等距视角基地场景
   2. 区块管理系统（9个区块）
   3. 资源显示和管理
   4. 干员管理和部署
   5. 游戏状态和事件系统
   ================================================================ */

interface UIElement {
  container: GameObjects.Container;
  update: () => void;
}

export class Game extends Scene {
  private gameState: GameState;
  private blocks: Block[] = [];
  private cameraControls: { zoom: number; offsetX: number; offsetY: number };
  
  // UI元素
  private resourcePanel!: UIElement;
  private agentPanel!: UIElement;
  private blockPanel!: UIElement;
  private eventLogPanel!: UIElement;
  private mainMenuButton!: GameObjects.Text;
  
  // 视觉元素
  private backgroundGrid!: GameObjects.Graphics;
  private isometricGrid!: GameObjects.Graphics;
  
  constructor() {
    super('Game');
    this.gameState = new GameState();
    this.cameraControls = { zoom: 1.0, offsetX: 0, offsetY: 0 };
  }

  preload(): void {
    // 加载游戏资源
    this.load.image('block-bg', 'assets/blocks/background.png');
    this.load.image('agent-icon', 'assets/ui/agent-icon.png');
    this.load.image('resource-icon', 'assets/ui/resource-icon.png');
    this.load.image('block-highlight', 'assets/ui/block-highlight.png');
    
    // 创建临时占位纹理
    this.createPlaceholderTextures();
  }

  create(): void {
    console.log('基地场景创建 - 《覆幕重启》');
    
    // 初始化游戏状态
    this.initializeGameState();
    
    // 设置摄像机
    this.setupCamera();
    
    // 创建视觉元素
    this.createBackground();
    this.createIsometricGrid();
    
    // 初始化区块
    this.initializeBlocks();
    
    // 创建UI系统
    this.createResourcePanel();
    this.createAgentPanel();
    this.createBlockPanel();
    this.createEventLog();
    this.createMainMenuButton();
    
    // 设置输入控制
    this.setupInputControls();
    
    // 开始游戏循环
    this.startGameLoop();
    
    // 淡入效果
    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  update(time: number, delta: number): void {
    // 更新游戏状态
    this.gameState.update(delta);
    
    // 更新UI
    this.updateUI();
    
    // 更新区块状态
    this.blocks.forEach(block => block.update(delta));
  }

  // ==================== 初始化方法 ====================

  private initializeGameState(): void {
    // 初始化游戏状态
    this.gameState.initialize({
      seed: Date.now().toString(),
      faction: FactionType.SCAVENGERS, // 默认选择拾烬者
      difficulty: 'normal'
    });
    
    // 添加初始资源
    this.gameState.addResource(ResourceType.ENERGY, 100);
    this.gameState.addResource(ResourceType.MATERIAL, 50);
    this.gameState.addResource(ResourceType.DATA, 25);
    this.gameState.addResource(ResourceType.INFLUENCE, 10);
    
    console.log('游戏状态初始化完成:', this.gameState.getSaveData());
  }

  private setupCamera(): void {
    const camera = this.cameras.main;
    
    // 设置摄像机初始位置和缩放
    camera.setZoom(1.0);
    camera.centerOn(960, 540); // 1920x1080的中心
    
    // 启用摄像机控制
    camera.setBounds(0, 0, 1920 * 2, 1080 * 2); // 允许摄像机移动的范围
  }

  private createBackground(): void {
    // 创建纯色背景
    const background = this.add.graphics();
    
    // 使用线性渐变效果 - 手动创建渐变效果
    background.fillStyle(0x04060f, 1);
    background.fillRect(0, 0, 1920, 1080);
    
    // 添加渐变覆盖层
    const gradientOverlay = this.add.graphics();
    gradientOverlay.fillStyle(0x080a18, 0.3);
    gradientOverlay.fillRect(0, 0, 1920, 540);
    
    gradientOverlay.fillStyle(0x0c0e20, 0.2);
    gradientOverlay.fillRect(0, 540, 1920, 540);
    
    background.setDepth(-100);
    gradientOverlay.setDepth(-99);
    
    this.backgroundGrid = background;
  }

  private createIsometricGrid(): void {
    // 创建2.5D等距网格
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1c2448, 0.3);
    
    // 绘制等距网格
    const gridSize = 100;
    const offsetX = 960;
    const offsetY = 540;
    
    for (let x = -10; x <= 10; x++) {
      for (let y = -10; y <= 10; y++) {
        const isoX = (x - y) * gridSize / 2 + offsetX;
        const isoY = (x + y) * gridSize / 4 + offsetY;
        
        // 绘制菱形网格
        grid.strokePoints([
          { x: isoX, y: isoY - gridSize/4 },
          { x: isoX + gridSize/2, y: isoY },
          { x: isoX, y: isoY + gridSize/4 },
          { x: isoX - gridSize/2, y: isoY },
          { x: isoX, y: isoY - gridSize/4 }
        ]);
      }
    }
    
    grid.setDepth(-50);
    this.isometricGrid = grid;
  }

  private initializeBlocks(): void {
    // 根据游戏设计文档初始化9个区块
    const blockPositions = [
      { x: 400, y: 300, type: 'home' as BlockType },
      { x: 800, y: 200, type: 'resource' as BlockType },
      { x: 1200, y: 300, type: 'danger' as BlockType },
      { x: 300, y: 600, type: 'mystery' as BlockType },
      { x: 700, y: 700, type: 'resource' as BlockType },
      { x: 1100, y: 600, type: 'danger' as BlockType },
      { x: 500, y: 900, type: 'safe' as BlockType },
      { x: 900, y: 900, type: 'mystery' as BlockType },
      { x: 1300, y: 900, type: 'boss' as BlockType }
    ];
    
    blockPositions.forEach((pos, index) => {
      const block = new Block(this, pos.x, pos.y, index + 1, pos.type);
      block.create();
      this.blocks.push(block);
    });
    
    console.log(`初始化了 ${this.blocks.length} 个区块`);
  }

  // ==================== UI创建方法 ====================

  private createResourcePanel(): void {
    const container = this.add.container(1600, 80);
    
    // 背景面板
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0e1a, 0.85);
    panel.lineStyle(2, 0x2f5c76, 0.6);
    panel.fillRoundedRect(0, 0, 280, 200, 12);
    panel.strokeRoundedRect(0, 0, 280, 200, 12);
    
    // 标题
    const title = this.add.text(20, 15, '资源状况', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 22,
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 4
    });
    
    // 资源列表
    const resources = [
      { type: ResourceType.ENERGY, name: '能量', color: '#ffaa44' },
      { type: ResourceType.MATERIAL, name: '材料', color: '#44aaff' },
      { type: ResourceType.DATA, name: '数据', color: '#aa44ff' },
      { type: ResourceType.INFLUENCE, name: '影响力', color: '#44ffaa' }
    ];
    
    const resourceTexts: GameObjects.Text[] = [];
    resources.forEach((resource, index) => {
      const y = 60 + index * 30;
      
      // 图标
      const icon = this.add.text(20, y, '●', {
        fontSize: 16,
        color: resource.color
      });
      
      // 名称和数量
      const text = this.add.text(45, y, `${resource.name}: 0`, {
        fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
        fontSize: 18,
        color: '#c8dcff'
      });
      
      container.add([icon, text]);
      resourceTexts.push(text);
    });
    
    container.add([panel, title]);
    
    this.resourcePanel = {
      container,
      update: () => {
        resources.forEach((resource, index) => {
          const amount = this.gameState.getResource(resource.type);
          resourceTexts[index].setText(`${resource.name}: ${amount}`);
        });
      }
    };
  }

  private createAgentPanel(): void {
    const container = this.add.container(1600, 320);
    
    // 背景面板
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0e1a, 0.85);
    panel.lineStyle(2, 0x2f5c76, 0.6);
    panel.fillRoundedRect(0, 0, 280, 200, 12);
    panel.strokeRoundedRect(0, 0, 280, 200, 12);
    
    // 标题
    const title = this.add.text(20, 15, '干员状态', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 22,
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 4
    });
    
    // 干员列表（占位）
    const agentText = this.add.text(20, 60, '干员系统待集成', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 18,
      color: '#8ec4ff',
      wordWrap: { width: 240 }
    });
    
    container.add([panel, title, agentText]);
    
    this.agentPanel = {
      container,
      update: () => {
        // 等待WASM系统集成
        // 这里将显示干员状态和PAPS人格参数
      }
    };
  }

  private createBlockPanel(): void {
    const container = this.add.container(1600, 560);
    
    // 背景面板
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0e1a, 0.85);
    panel.lineStyle(2, 0x2f5c76, 0.6);
    panel.fillRoundedRect(0, 0, 280, 200, 12);
    panel.strokeRoundedRect(0, 0, 280, 200, 12);
    
    // 标题
    const title = this.add.text(20, 15, '区块信息', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 22,
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 4
    });
    
    // 当前选中区块信息
    const blockInfo = this.add.text(20, 60, '未选中区块\n\n点击地图上的区块\n查看详细信息', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 16,
      color: '#a8ccff',
      wordWrap: { width: 240 },
      lineSpacing: 8
    });
    
    container.add([panel, title, blockInfo]);
    
    this.blockPanel = {
      container,
      update: () => {
        // 这里将显示当前选中区块的详细信息
      }
    };
  }

  private createEventLog(): void {
    const container = this.add.container(40, 800);
    
    // 背景面板
    const panel = this.add.graphics();
    panel.fillStyle(0x0a0e1a, 0.85);
    panel.lineStyle(2, 0x2f5c76, 0.6);
    panel.fillRoundedRect(0, 0, 400, 240, 12);
    panel.strokeRoundedRect(0, 0, 400, 240, 12);
    
    // 标题
    const title = this.add.text(20, 15, '事件日志', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 22,
      color: '#e8f5ff',
      stroke: '#091120',
      strokeThickness: 4
    });
    
    // 事件内容
    const eventText = this.add.text(20, 60, '欢迎来到《覆幕重启》\n基地已初始化...', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 16,
      color: '#b8dcff',
      wordWrap: { width: 360 },
      lineSpacing: 6
    });
    
    container.add([panel, title, eventText]);
    
    this.eventLogPanel = {
      container,
      update: () => {
        // 这里将显示游戏事件和系统消息
      }
    };
  }

  private createMainMenuButton(): void {
    const button = this.add.text(1800, 40, '主菜单', {
      fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
      fontSize: 20,
      color: '#c8dcff',
      backgroundColor: '#0e1a2e',
      padding: { x: 16, y: 8 }
    });
    
    button.setInteractive({ useHandCursor: true });
    
    button.on('pointerover', () => {
      button.setStyle({ color: '#ffffff', backgroundColor: '#1a2e4e' });
    });
    
    button.on('pointerout', () => {
      button.setStyle({ color: '#c8dcff', backgroundColor: '#0e1a2e' });
    });
    
    button.on('pointerdown', () => {
      // 返回主菜单前保存游戏
      this.saveGameState();
      this.scene.start('HomeScene');
    });
    
    this.mainMenuButton = button;
  }

  // ==================== 游戏系统方法 ====================

  private setupInputControls(): void {
    const camera = this.cameras.main;
    
    // 鼠标滚轮缩放
    this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
      const zoomDelta = deltaY > 0 ? -0.1 : 0.1;
      const newZoom = PhaserMath.Clamp(camera.zoom + zoomDelta, 0.5, 2.0);
      camera.zoom = newZoom;
    });
    
    // 鼠标拖动移动摄像机
    let isDragging = false;
    let dragStart = { x: 0, y: 0 };
    let cameraStart = { x: 0, y: 0 };
    
    this.input.on('pointerdown', (pointer: Types.Input.Pointer) => {
      if (pointer.button === 0) { // 左键
        isDragging = true;
        dragStart.x = pointer.x;
        dragStart.y = pointer.y;
        cameraStart.x = camera.scrollX;
        cameraStart.y = camera.scrollY;
      }
    });
    
    this.input.on('pointermove', (pointer: Types.Input.Pointer) => {
      if (isDragging) {
        const dx = pointer.x - dragStart.x;
        const dy = pointer.y - dragStart.y;
        camera.scrollX = cameraStart.x - dx / camera.zoom;
        camera.scrollY = cameraStart.y - dy / camera.zoom;
      }
    });
    
    this.input.on('pointerup', () => {
      isDragging = false;
    });
    
    // ESC键返回主菜单
    this.input.keyboard?.on('keydown-ESC', () => {
      this.saveGameState();
      this.scene.start('HomeScene');
    });
  }

  private startGameLoop(): void {
    // 游戏定时器 - 每5秒产生资源
    this.time.addEvent({
      delay: 5000,
      callback: () => {
        this.gameState.addResource(ResourceType.ENERGY, 10);
        this.gameState.addResource(ResourceType.MATERIAL, 5);
        this.addEventLog('资源已更新');
      },
      loop: true
    });
    
    // 区块事件定时器
    this.time.addEvent({
      delay: 10000,
      callback: () => {
        this.triggerRandomBlockEvent();
      },
      loop: true
    });
    
    console.log('游戏循环已启动');
  }

  private updateUI(): void {
    // 更新所有UI面板
    this.resourcePanel.update();
    this.agentPanel.update();
    this.blockPanel.update();
    this.eventLogPanel.update();
  }

  private addEventLog(message: string): void {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const logMessage = `[${timeStr}] ${message}`;
    
    // 这里应该更新事件日志面板
    console.log('事件:', logMessage);
  }

  private triggerRandomBlockEvent(): void {
    if (this.blocks.length > 0) {
      const randomIndex = Math.floor(Math.random() * this.blocks.length);
      const block = this.blocks[randomIndex];
      
      const events = [
        `区块 ${block.getBlockId()} 发现了新的资源`,
        `区块 ${block.getBlockId()} 发生了异常波动`,
        `区块 ${block.getBlockId()} 需要干员调查`,
        `区块 ${block.getBlockId()} 安全状况已更新`
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      this.addEventLog(randomEvent);
    }
  }

  private saveGameState(): void {
    const saveData = this.gameState.getSaveData();
    localStorage.setItem('veil-reset-save', JSON.stringify(saveData));
    console.log('游戏状态已保存:', saveData);
  }

  private createPlaceholderTextures(): void {
    // 创建占位纹理
    const graphics = this.add.graphics();
    
    // 区块背景纹理
    graphics.fillStyle(0x1c2448, 0.3);
    graphics.lineStyle(1, 0x4470b8, 0.5);
    graphics.fillRect(0, 0, 200, 200);
    graphics.strokeRect(0, 0, 200, 200);
    graphics.generateTexture('placeholder-block', 200, 200);
    graphics.clear();
    
    graphics.destroy();
  }
}