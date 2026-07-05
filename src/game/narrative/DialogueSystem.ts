/**
 * 《覆幕重启》AVG叙事系统 - 对话系统核心
 */

import { DialogueUnit, DialogueChoice, GameProgress, ImmediateEffect, DelayedEffect } from './DialogueTypes';

export class DialogueSystem {
  // 当前对话状态
  private currentDialogue: DialogueUnit | null = null;
  private dialogueQueue: DialogueUnit[] = [];
  private history: DialogueUnit[] = [];
  
  // 游戏进度引用
  private progress: GameProgress;
  
  // 延迟反馈队列
  private delayedFeedbacks: Array<{
    effect: DelayedEffect;
    scheduledDay: number;
  }> = [];
  
  constructor(initialProgress: GameProgress) {
    this.progress = initialProgress;
  }
  
  /**
   * 显示对话
   * @param dialogueId 对话ID
   * @param dialogues 对话数据字典
   */
  showDialogue(dialogueId: string, dialogues: { [id: string]: DialogueUnit }): DialogueUnit | null {
    const dialogue = dialogues[dialogueId];
    if (!dialogue) {
      console.error(`对话不存在: ${dialogueId}`);
      return null;
    }
    
    this.currentDialogue = dialogue;
    this.history.push(dialogue);
    
    // 如果有选择支，需要暂停等待玩家选择
    if (dialogue.choices && dialogue.choices.length > 0) {
      // 选择支将在UI中处理
      return dialogue;
    }
    
    // 没有选择支，自动继续
    if (dialogue.next) {
      this.dialogueQueue.push(dialogues[dialogue.next]);
    }
    
    return dialogue;
  }
  
  /**
   * 处理选择
   * @param choiceId 选择的选项ID
   * @param dialogueId 当前对话ID
   */
  processChoice(choiceId: string, dialogueId: string): {
    nextDialogue?: string;
    effects: ImmediateEffect;
    delayedEffects?: DelayedEffect[];
  } {
    if (!this.currentDialogue || this.currentDialogue.id !== dialogueId) {
      throw new Error(`当前对话不匹配: ${dialogueId}`);
    }
    
    const choice = this.currentDialogue.choices?.find(c => c.id === choiceId);
    if (!choice) {
      throw new Error(`选择支不存在: ${choiceId}`);
    }
    
    // 记录选择历史
    this.progress.choiceHistory[dialogueId] = choiceId;
    
    // 应用即时反馈
    const immediateEffects = choice.immediateEffect;
    this.applyImmediateEffects(immediateEffects);
    
    // 设置延迟反馈
    const delayedEffects: DelayedEffect[] = [];
    if (choice.delayedEffect) {
      this.scheduleDelayedFeedback(choice.delayedEffect);
      delayedEffects.push(choice.delayedEffect);
    }
    
    return {
      nextDialogue: this.currentDialogue.next,
      effects: immediateEffects,
      delayedEffects
    };
  }
  
  /**
   * 应用即时反馈效果
   */
  private applyImmediateEffects(effects: ImmediateEffect): void {
    // 更新羁绊值
    if (effects.bondChange) {
      for (const [operatorId, change] of Object.entries(effects.bondChange)) {
        this.progress.bonds[operatorId] = (this.progress.bonds[operatorId] || 0) + change;
        // 限制羁绊值在合理范围
        this.progress.bonds[operatorId] = Math.max(0, Math.min(100, this.progress.bonds[operatorId]));
      }
    }
    
    // 更新路径分数
    if (effects.pathScore) {
      for (const [path, change] of Object.entries(effects.pathScore)) {
        if (path in this.progress.pathScore) {
          (this.progress.pathScore as any)[path] += change;
        }
      }
    }
    
    // TODO: 处理触发的额外对话
    if (effects.dialogue) {
      // 将额外对话加入队列
    }
  }
  
  /**
   * 设置延迟反馈
   */
  private scheduleDelayedFeedback(effect: DelayedEffect): void {
    const scheduledDay = this.progress.currentDay + effect.triggerDay;
    this.delayedFeedbacks.push({
      effect,
      scheduledDay
    });
    
    // 按触发时间排序
    this.delayedFeedbacks.sort((a, b) => a.scheduledDay - b.scheduledDay);
  }
  
  /**
   * 检查延迟反馈触发
   * @param currentDay 当前天数
   * @returns 需要触发的反馈列表
   */
  checkDelayedFeedbacks(currentDay: number): DelayedEffect[] {
    const triggered: DelayedEffect[] = [];
    
    // 找出所有应该触发的反馈
    while (this.delayedFeedbacks.length > 0 && this.delayedFeedbacks[0].scheduledDay <= currentDay) {
      const { effect } = this.delayedFeedbacks.shift()!;
      triggered.push(effect);
    }
    
    return triggered;
  }
  
  /**
   * 继续下一个对话
   */
  continueDialogue(dialogues: { [id: string]: DialogueUnit }): DialogueUnit | null {
    if (this.dialogueQueue.length === 0) {
      return null;
    }
    
    const nextDialogue = this.dialogueQueue.shift()!;
    return this.showDialogue(nextDialogue.id, dialogues);
  }
  
  /**
   * 清空对话队列
   */
  clearQueue(): void {
    this.dialogueQueue = [];
    this.currentDialogue = null;
  }
  
  /**
   * 获取对话历史
   */
  getHistory(): DialogueUnit[] {
    return [...this.history];
  }
  
  /**
   * 获取当前对话
   */
  getCurrentDialogue(): DialogueUnit | null {
    return this.currentDialogue;
  }
  
  /**
   * 更新游戏进度引用
   */
  updateProgress(newProgress: GameProgress): void {
    this.progress = newProgress;
  }
  
  /**
   * 获取游戏进度
   */
  getProgress(): GameProgress {
    return { ...this.progress };
  }
  
  /**
   * 计算结局权重
   */
  calculateEndingWeights(): {
    submission: number;
    resistance: number;
    transcendence: number;
  } {
    return {
      submission: this.progress.pathScore.submission,
      resistance: this.progress.pathScore.resistance,
      transcendence: this.progress.pathScore.transcendence
    };
  }
  
  /**
   * 检查干员羁绊等级
   * @param operatorId 干员ID
   * @returns 羁绊等级 (1-4)
   */
  getBondLevel(operatorId: string): number {
    const bond = this.progress.bonds[operatorId] || 0;
    
    if (bond >= 80) return 4;
    if (bond >= 60) return 3;
    if (bond >= 40) return 2;
    return 1;
  }
  
  /**
   * 导出对话系统状态（用于保存）
   */
  exportState(): {
    history: DialogueUnit[];
    delayedFeedbacks: Array<{ effect: DelayedEffect; scheduledDay: number }>;
  } {
    return {
      history: [...this.history],
      delayedFeedbacks: [...this.delayedFeedbacks]
    };
  }
  
  /**
   * 导入对话系统状态（用于加载）
   */
  importState(state: {
    history: DialogueUnit[];
    delayedFeedbacks: Array<{ effect: DelayedEffect; scheduledDay: number }>;
  }): void {
    this.history = [...state.history];
    this.delayedFeedbacks = [...state.delayedFeedbacks];
  }
}