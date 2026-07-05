import { Scene } from 'phaser';

/* ================================================================
   Game 场景 — 纯 UI 框架（玩法已移除）
   当前仅保留标题面板与返回主幕按钮，后续在此迭代 UI 设计。
   ================================================================ */

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    create() {
        this.cameras.main.fadeIn(900, 6, 6, 18);

        // 背景
        this.add.rectangle(0, 0, 1920, 1080, 0x04060f, 1).setOrigin(0, 0).setDepth(-1);

        // 左侧标题面板
        const panel = this.add.graphics();
        panel.fillStyle(0x04070f, 0.86);
        panel.lineStyle(2, 0x2f5c76, 0.6);
        panel.fillRoundedRect(60, 40, 700, 200, 28);
        panel.strokeRoundedRect(60, 40, 700, 200, 28);
        panel.setDepth(5);

        this.add.text(120, 100, '裂隙之门', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 64,
            color: '#e8f5ff',
            stroke: '#091120',
            strokeThickness: 8,
        }).setDepth(10);

        this.add.text(120, 170, 'UI 迭代场景 — 玩法已移除，专注界面设计。', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 22,
            color: '#8ec4ff',
            wordWrap: { width: 580 },
        }).setDepth(10);

        // 返回主幕按钮
        const returnBg = this.add.rectangle(180, 340, 220, 52, 0x0e1a2e, 0.9)
            .setStrokeStyle(1, 0x4f6aa8, 0.8)
            .setDepth(10)
            .setInteractive({ useHandCursor: true });
        returnBg.on('pointerover', () => returnBg.setFillStyle(0x1a2e4e, 0.95));
        returnBg.on('pointerout', () => returnBg.setFillStyle(0x0e1a2e, 0.9));
        returnBg.on('pointerdown', () => this.scene.start('HomeScene'));

        this.add.text(180, 340, '← 返回主幕', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 22, color: '#c8dcff',
        }).setOrigin(0.5).setDepth(10);

        this.input.keyboard?.on('keydown-ESC', () => this.scene.start('HomeScene'));
    }
}
