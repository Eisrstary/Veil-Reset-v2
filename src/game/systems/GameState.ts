/* ================================================================
   《覆幕重启》Veil Reset - 游戏状态管理系统
   功能：
   1. 资源管理（能量、材料、数据、影响力）
   2. 游戏进度跟踪
   3. 保存/加载系统
   4. 事件和状态管理
   ================================================================ */

export enum ResourceType {
  ENERGY = 'energy',
  MATERIAL = 'material',
  DATA = 'data',
  INFLUENCE = 'influence'
}

export enum FactionType {
  SCAVENGERS = 'scavengers',      // 拾烬者
  WEAVERS = 'weavers',           // 织命者
  ENDCULT = 'endcult'            // 终末教团
}

export enum GamePhase {
  EXPLORATION = 'exploration',   // 探索阶段
  CONSOLIDATION = 'consolidation', // 巩固阶段
  CONFRONTATION = 'confrontation', // 对抗阶段
  CLIMAX = 'climax'              // 高潮阶段
}

export interface GameSaveData {
  seed: string;
  faction: FactionType;
  difficulty: string;
  resources: Record<ResourceType, number>;
  currentPhase: GamePhase;
  completedBlocks: number[];
  activeEvents: string[];
  timestamp: string;
  playtime: number; // 游戏时长（毫秒）
}

export interface GameEvent {
  id: string;
  type: 'resource' | 'block' | 'agent' | 'story';
  title: string;
  description: string;
  timestamp: number;
  data?: any;
}

export class GameState {
  private saveData: GameSaveData;
  private events: GameEvent[] = [];
  private startTime: number = 0;
  private lastUpdateTime: number = 0;

  constructor() {
    // 初始化默认保存数据
    this.saveData = {
      seed: '',
      faction: FactionType.SCAVENGERS,
      difficulty: 'normal',
      resources: {
        [ResourceType.ENERGY]: 0,
        [ResourceType.MATERIAL]: 0,
        [ResourceType.DATA]: 0,
        [ResourceType.INFLUENCE]: 0
      },
      currentPhase: GamePhase.EXPLORATION,
      completedBlocks: [],
      activeEvents: [],
      timestamp: new Date().toISOString(),
      playtime: 0
    };
  }

  // ==================== 初始化方法 ====================

  initialize(config: {
    seed: string;
    faction: FactionType;
    difficulty: string;
  }): void {
    this.saveData.seed = config.seed;
    this.saveData.faction = config.faction;
    this.saveData.difficulty = config.difficulty;
    this.saveData.timestamp = new Date().toISOString();
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;

    console.log(`游戏状态初始化 - 种子: ${config.seed}, 势力: ${config.faction}, 难度: ${config.difficulty}`);
  }

  // ==================== 资源管理 ====================

  addResource(type: ResourceType, amount: number): boolean {
    if (amount <= 0) {
      console.warn(`尝试添加非正数资源: ${type} ${amount}`);
      return false;
    }

    const current = this.saveData.resources[type] || 0;
    this.saveData.resources[type] = current + amount;

    this.addEvent({
      id: `resource_gain_${Date.now()}`,
      type: 'resource',
      title: '资源获得',
      description: `获得了 ${amount} 点 ${this.getResourceName(type)}`,
      timestamp: Date.now(),
      data: { type, amount }
    });

    console.log(`资源更新: ${type} +${amount} = ${this.saveData.resources[type]}`);
    return true;
  }

  consumeResource(type: ResourceType, amount: number): boolean {
    if (amount <= 0) {
      console.warn(`尝试消耗非正数资源: ${type} ${amount}`);
      return false;
    }

    const current = this.saveData.resources[type] || 0;
    if (current < amount) {
      console.warn(`资源不足: ${type} (${current} < ${amount})`);
      return false;
    }

    this.saveData.resources[type] = current - amount;

    this.addEvent({
      id: `resource_consume_${Date.now()}`,
      type: 'resource',
      title: '资源消耗',
      description: `消耗了 ${amount} 点 ${this.getResourceName(type)}`,
      timestamp: Date.now(),
      data: { type, amount }
    });

    console.log(`资源消耗: ${type} -${amount} = ${this.saveData.resources[type]}`);
    return true;
  }

  getResource(type: ResourceType): number {
    return this.saveData.resources[type] || 0;
  }

  getAllResources(): Record<ResourceType, number> {
    return { ...this.saveData.resources };
  }

  private getResourceName(type: ResourceType): string {
    const names: Record<ResourceType, string> = {
      [ResourceType.ENERGY]: '能量',
      [ResourceType.MATERIAL]: '材料',
      [ResourceType.DATA]: '数据',
      [ResourceType.INFLUENCE]: '影响力'
    };
    return names[type] || type;
  }

  // ==================== 区块管理 ====================

  completeBlock(blockId: number): void {
    if (!this.saveData.completedBlocks.includes(blockId)) {
      this.saveData.completedBlocks.push(blockId);
      this.saveData.completedBlocks.sort((a, b) => a - b);

      this.addEvent({
        id: `block_complete_${Date.now()}`,
        type: 'block',
        title: '区块完成',
        description: `区块 ${blockId} 已探索完成`,
        timestamp: Date.now(),
        data: { blockId }
      });

      console.log(`区块 ${blockId} 已标记为完成`);
      
      // 检查是否进入下一阶段
      this.checkPhaseProgression();
    }
  }

  isBlockCompleted(blockId: number): boolean {
    return this.saveData.completedBlocks.includes(blockId);
  }

  getCompletedBlocks(): number[] {
    return [...this.saveData.completedBlocks];
  }

  getProgressPercentage(): number {
    // 总共有9个区块
    const totalBlocks = 9;
    const completedBlocks = this.saveData.completedBlocks.length;
    return Math.round((completedBlocks / totalBlocks) * 100);
  }

  // ==================== 游戏阶段管理 ====================

  private checkPhaseProgression(): void {
    const completedCount = this.saveData.completedBlocks.length;
    let newPhase: GamePhase | null = null;

    if (completedCount >= 6 && this.saveData.currentPhase === GamePhase.EXPLORATION) {
      newPhase = GamePhase.CONSOLIDATION;
    } else if (completedCount >= 8 && this.saveData.currentPhase === GamePhase.CONSOLIDATION) {
      newPhase = GamePhase.CONFRONTATION;
    } else if (completedCount >= 9 && this.saveData.currentPhase === GamePhase.CONFRONTATION) {
      newPhase = GamePhase.CLIMAX;
    }

    if (newPhase) {
      this.setPhase(newPhase);
    }
  }

  setPhase(phase: GamePhase): void {
    const oldPhase = this.saveData.currentPhase;
    this.saveData.currentPhase = phase;

    this.addEvent({
      id: `phase_change_${Date.now()}`,
      type: 'story',
      title: '阶段变更',
      description: `游戏进入 ${this.getPhaseName(phase)} 阶段`,
      timestamp: Date.now(),
      data: { from: oldPhase, to: phase }
    });

    console.log(`游戏阶段变更: ${oldPhase} → ${phase}`);
  }

  getCurrentPhase(): GamePhase {
    return this.saveData.currentPhase;
  }

  private getPhaseName(phase: GamePhase): string {
    const names: Record<GamePhase, string> = {
      [GamePhase.EXPLORATION]: '探索',
      [GamePhase.CONSOLIDATION]: '巩固',
      [GamePhase.CONFRONTATION]: '对抗',
      [GamePhase.CLIMAX]: '高潮'
    };
    return names[phase] || phase;
  }

  // ==================== 事件管理 ====================

  addEvent(event: GameEvent): void {
    this.events.push(event);
    
    // 保持最近100个事件
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // 添加到活跃事件列表
    if (!this.saveData.activeEvents.includes(event.id)) {
      this.saveData.activeEvents.push(event.id);
    }
  }

  getRecentEvents(count: number = 10): GameEvent[] {
    return this.events.slice(-count).reverse();
  }

  clearEvent(eventId: string): void {
    this.saveData.activeEvents = this.saveData.activeEvents.filter(id => id !== eventId);
  }

  getActiveEvents(): string[] {
    return [...this.saveData.activeEvents];
  }

  // ==================== 游戏状态更新 ====================

  update(delta: number): void {
    const currentTime = Date.now();
    
    // 更新游戏时长
    this.saveData.playtime += delta;
    
    // 定期自动保存
    if (currentTime - this.lastUpdateTime > 30000) { // 每30秒
      this.autoSave();
      this.lastUpdateTime = currentTime;
    }
  }

  private autoSave(): void {
    const saveKey = 'veil-reset-autosave';
    const saveData = this.getSaveData();
    
    try {
      localStorage.setItem(saveKey, JSON.stringify(saveData));
      console.log('游戏自动保存完成');
    } catch (error) {
      console.error('自动保存失败:', error);
    }
  }

  // ==================== 保存/加载系统 ====================

  getSaveData(): GameSaveData {
    return {
      ...this.saveData,
      timestamp: new Date().toISOString(),
      playtime: this.saveData.playtime
    };
  }

  loadSaveData(data: GameSaveData): boolean {
    try {
      this.saveData = { ...data };
      this.startTime = Date.now() - this.saveData.playtime;
      this.lastUpdateTime = this.startTime;
      
      console.log('游戏状态加载成功:', data);
      return true;
    } catch (error) {
      console.error('加载游戏状态失败:', error);
      return false;
    }
  }

  // ==================== 游戏统计 ====================

  getPlaytimeFormatted(): string {
    const totalSeconds = Math.floor(this.saveData.playtime / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getGameStats(): {
    playtime: string;
    progress: number;
    resources: Record<ResourceType, number>;
    faction: string;
    phase: string;
  } {
    const factionNames: Record<FactionType, string> = {
      [FactionType.SCAVENGERS]: '拾烬者',
      [FactionType.WEAVERS]: '织命者',
      [FactionType.ENDCULT]: '终末教团'
    };

    return {
      playtime: this.getPlaytimeFormatted(),
      progress: this.getProgressPercentage(),
      resources: this.getAllResources(),
      faction: factionNames[this.saveData.faction] || this.saveData.faction,
      phase: this.getPhaseName(this.saveData.currentPhase)
    };
  }

  // ==================== 调试和开发工具 ====================

  reset(): void {
    this.saveData = {
      seed: Date.now().toString(),
      faction: FactionType.SCAVENGERS,
      difficulty: 'normal',
      resources: {
        [ResourceType.ENERGY]: 0,
        [ResourceType.MATERIAL]: 0,
        [ResourceType.DATA]: 0,
        [ResourceType.INFLUENCE]: 0
      },
      currentPhase: GamePhase.EXPLORATION,
      completedBlocks: [],
      activeEvents: [],
      timestamp: new Date().toISOString(),
      playtime: 0
    };
    
    this.events = [];
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    
    console.log('游戏状态已重置');
  }
}