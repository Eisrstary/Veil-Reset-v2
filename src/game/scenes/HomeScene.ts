import { Scene, GameObjects } from 'phaser';

const W = 1920, H = 1080;
const C = { deep: 0x060612, mid: 0x0e1028, veil: 0x1c2448, energy: 0x4470b8, glow: 0x6090d0, bright: 0x80b0f0 };

type MenuChoice = 'continue' | 'newGame';
interface SaveData {
    chapter: string;
    updatedAt: string;
    source: 'continue' | 'newGame';
}

export class HomeScene extends Scene {
    private motes: Array<{ img: GameObjects.Image; vx: number; vy: number }> = [];
    private rings: GameObjects.Graphics[] = [];
    private elapsed = 0;
    private saveState: SaveData | null = null;
    private selectedChoice: MenuChoice = 'newGame';
    private optionCards: Array<{ choice: MenuChoice; card: GameObjects.Rectangle; title: GameObjects.Text; detail: GameObjects.Text; glow: GameObjects.Rectangle; accent: GameObjects.Rectangle }> = [];
    private statusText!: GameObjects.Text;
    private panelHalo!: GameObjects.Graphics;
    private titleText!: GameObjects.Text;
    private subtitleText!: GameObjects.Text;
    private introText!: GameObjects.Text;
    private panel!: GameObjects.Graphics;
    private panelOverlay!: GameObjects.Graphics;
    private veilSeal!: GameObjects.Graphics;
    private infoTitle!: GameObjects.Text;
    private infoItems: GameObjects.Text[] = [];

    constructor() { super({ key: 'HomeScene' }); }

    preload(): void {
        const g = this.add.graphics();
        g.fillStyle(C.bright, 0.7); g.fillCircle(4, 4, 4);
        g.fillStyle(C.glow, 0.4); g.fillCircle(4, 4, 8);
        g.generateTexture('mote', 16, 16); g.clear();
        g.fillStyle(C.energy, 0.5); g.fillRect(0, 0, 6, 6);
        g.lineStyle(1, C.glow, 0.6); g.strokeRect(0.5, 0.5, 5, 5);
        g.generateTexture('echo', 6, 6); g.clear();
        g.fillStyle(0xffffff, 0.12); g.fillCircle(1, 1, 1);
        g.generateTexture('dust', 2, 2);
        g.destroy();
    }

    create(): void {
        this.saveState = this.loadSave();
        this.selectedChoice = this.saveState ? 'continue' : 'newGame';
        this.drawSky();
        this.drawEnergyWaves();
        this.drawOrnament();
        this.createMotes();
        this.createEchoes();
        this.createDust();
        this.drawVignette();
        this.createMenuUI();
        this.cameras.main.fadeIn(1600, 6, 6, 18);
    }

    private createMenuUI(): void {
        // ── 顶部栏：卷宗标识 ──
        const topBar = this.add.graphics();
        topBar.fillStyle(0x060d1a, 0.82);
        topBar.fillRect(0, 0, W, 68);
        topBar.lineStyle(1, 0x3b5a8c, 0.5);
        topBar.lineBetween(0, 68, W, 68);
        topBar.setDepth(105);

        this.add.text(60, 34, 'ARCHIVE / RECONSTRUCTION', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 18,
            color: '#7aa9d8',
            letterSpacing: 6,
        }).setOrigin(0, 0.5).setDepth(120);

        this.add.text(W - 60, 34, '卷宗编号 · V-07', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 16,
            color: '#7dbdff',
            letterSpacing: 4,
        }).setOrigin(1, 0.5).setDepth(120).setAlpha(0.85);

        // ── 标题区 ──
        this.titleText = this.add.text(120, 140, '覆幕重启', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 86,
            color: '#f6f9ff',
            stroke: '#091120',
            strokeThickness: 10,
        }).setOrigin(0, 0.5).setDepth(120);
        this.titleText.setAlpha(0);
        this.tweens.add({ targets: this.titleText, alpha: 1, duration: 900, ease: 'Power2' });

        this.subtitleText = this.add.text(120, 200, '在无数次重启的尽头，这一次，能否有人被记住？', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 22,
            color: '#95b9ff',
            fontStyle: 'italic',
        }).setOrigin(0, 0.5).setDepth(120);
        this.subtitleText.setAlpha(0);
        this.tweens.add({ targets: this.subtitleText, alpha: 1, duration: 1000, delay: 100, ease: 'Power2' });

        // ── 左侧：章节导航（残响收集 / 章回档案 / 科考记录 / 终章遗响）──
        const leftPanel = this.add.graphics();
        leftPanel.fillStyle(0x060d1a, 0.75);
        leftPanel.fillRoundedRect(80, 260, 220, 420, 16);
        leftPanel.lineStyle(1, 0x3b5a8c, 0.45);
        leftPanel.strokeRoundedRect(80, 260, 220, 420, 16);
        leftPanel.setDepth(100);

        this.add.text(190, 290, '◈ 末世卷宗 ◈', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 16,
            color: '#8fd0ff',
            letterSpacing: 3,
        }).setOrigin(0.5, 0.5).setDepth(120);

        const chapterList = ['残响收集', '章回档案', '科考记录', '终章遗响'];
        chapterList.forEach((label, index) => {
            const y = 350 + index * 72;
            const badge = this.add.rectangle(118, y, 40, 40, 0x10213a, 0.9).setDepth(110);
            badge.setStrokeStyle(1, 0x6698f0, 0.7);
            this.add.text(118, y, String(index + 1), {
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                fontSize: 20,
                color: '#8ec5ff',
            }).setOrigin(0.5).setDepth(120);

            this.add.text(148, y, label, {
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                fontSize: 22,
                color: '#dfe9ff',
                letterSpacing: 1,
            }).setOrigin(0, 0.5).setDepth(120);
        });

        // ── 左侧底部：残响收集进度 ──
        const echoCollected = 2, echoTotal = 15; // TODO: 后续接入 localStorage 实际值
        const progressY = 600;
        this.add.text(190, progressY, '残响回收率', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 14,
            color: '#7aa9d8',
        }).setOrigin(0.5, 0.5).setDepth(120);

        const barBg = this.add.rectangle(190, progressY + 22, 160, 10, 0x0e1a2e, 0.9).setDepth(110);
        barBg.setStrokeStyle(1, 0x3b5a8c, 0.5);

        const barFill = this.add.rectangle(190 - 80, progressY + 22, 160 * (echoCollected / echoTotal), 10, 0x4470b8, 0.85).setDepth(111);
        barFill.setOrigin(0, 0.5);

        this.add.text(190, progressY + 42, `${echoCollected} / ${echoTotal}`, {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 13,
            color: '#8ec5ff',
        }).setOrigin(0.5, 0.5).setDepth(120);

        // 进度条脉冲动画
        this.tweens.add({ targets: barFill, alpha: 0.7, duration: 1800, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });


        // ── 中央面板：裂隙 + 选择卡 ──
        this.panel = this.add.graphics();
        this.panel.fillStyle(0x04070f, 0.86);
        this.panel.lineStyle(2, 0x2f5c76, 0.7);
        this.panel.fillRoundedRect(340, 260, 860, 560, 28);
        this.panel.strokeRoundedRect(340, 260, 860, 560, 28);
        this.panel.setDepth(100);
        this.panel.setAlpha(0);
        this.tweens.add({ targets: this.panel, alpha: 1, duration: 1000, delay: 220, ease: 'Power2' });

        this.panelHalo = this.add.graphics();
        this.panelHalo.setDepth(99);
        this.panelHalo.setAlpha(0);
        this.tweens.add({ targets: this.panelHalo, alpha: 0.85, duration: 1800, delay: 260, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        this.panelOverlay = this.add.graphics();
        this.panelOverlay.setDepth(101);
        this.panelOverlay.setAlpha(0.5);

        this.veilSeal = this.add.graphics();
        this.veilSeal.setDepth(102);
        this.veilSeal.setAlpha(0.65);
        this.tweens.add({ targets: this.veilSeal, alpha: 0.95, duration: 1800, delay: 280, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        // 裂隙视觉
        const portalX = 770, portalY = 360;
        const heroLens = this.add.graphics();
        heroLens.lineStyle(2, 0x5f80c1, 0.3);
        heroLens.strokeCircle(portalX, portalY, 200);
        heroLens.strokeCircle(portalX, portalY, 150);
        heroLens.strokeCircle(portalX, portalY, 100);
        heroLens.setDepth(104);

        const portalCore = this.add.graphics();
        portalCore.fillStyle(0x0b1832, 0.96);
        portalCore.fillCircle(portalX, portalY, 90);
        portalCore.lineStyle(2, 0x7da1f3, 0.6);
        portalCore.strokeCircle(portalX, portalY, 90);
        portalCore.setDepth(105);

        this.add.text(portalX, portalY, '裂隙', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 22,
            color: '#cde4ff',
        }).setOrigin(0.5).setDepth(120).setAlpha(0.75);

        this.tweens.add({ targets: portalCore, scale: 1.03, duration: 3200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
        this.tweens.add({ targets: heroLens, alpha: 0.8, duration: 2600, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        // 面板内引导文字
        this.add.text(portalX, 480, '选择你的归途', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 28,
            color: '#f4d88a',
            letterSpacing: 2,
        }).setOrigin(0.5, 0.5).setDepth(120);

        this.statusText = this.add.text(portalX, 518, this.saveState
            ? '旧日残响已在你身后留下足迹。'
            : '此刻尚无可追忆的痕迹，只有新的幕启等待你点燃。', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 18,
            color: '#9fc8ff',
            wordWrap: { width: 500 },
        }).setOrigin(0.5, 0.5).setDepth(120);
        this.statusText.setAlpha(0);
        this.tweens.add({ targets: this.statusText, alpha: 1, duration: 1000, delay: 280, ease: 'Power2' });

        // 选择卡：续行残响 / 重启幕启
        this.createChoiceCard(550, 600, '续行残响', '接上旧日残响，从上次断点继续向前。', 'continue');
        this.createChoiceCard(990, 600, '重启幕启', '清空旧梦，在裂隙中重写命运与光谱。', 'newGame');

        // 开始按钮（中央面板下方）
        const startButton = this.add.rectangle(770, 740, 280, 72, 0x1d324e, 0.94);
        startButton.setOrigin(0.5);
        startButton.setStrokeStyle(2, 0x84b4ff, 0.9);
        startButton.setDepth(110);
        startButton.setInteractive({ useHandCursor: true });
        startButton.on('pointerdown', () => this.confirmSelection());
        startButton.on('pointerover', () => { startButton.setFillStyle(0x243a65, 0.98); });
        startButton.on('pointerout', () => { startButton.setFillStyle(0x1d324e, 0.94); });

        const startText = this.add.text(770, 740, '开始探索', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 32,
            color: '#eef7ff',
            fontStyle: 'bold',
        }).setOrigin(0.5).setDepth(120);
        this.tweens.add({ targets: startText, alpha: 1, duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        // ── 日常锚定微交互：随机日常文本 ──
        const dailyLines = [
            '今晚谁做饭？',
            '炉火还亮着。',
            '苹果比上一轮甜。',
            '灯塔的灯，总得有人点。',
            '早饭还没吃。',
            '有人在识网深处留了一盏灯。',
            '种子已经编码进识网了。',
        ];
        const dailyText = dailyLines[Math.floor(Math.random() * dailyLines.length)];
        const dailyAnchor = this.add.text(770, 800, `「${dailyText}」`, {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 16,
            color: '#6b8db8',
            fontStyle: 'italic',
        }).setOrigin(0.5, 0.5).setDepth(120);
        dailyAnchor.setAlpha(0);
        this.tweens.add({ targets: dailyAnchor, alpha: 0.7, duration: 2000, delay: 600, ease: 'Power2' });


        // ── 右侧：科考记录 ──
        this.createRightInfoPanel();

        // ── 氛围层 ──
        const frameLeft = this.add.graphics();
        frameLeft.fillStyle(0x0b1223, 0.78);
        frameLeft.fillRect(0, 0, 40, H);
        frameLeft.setDepth(103);
        const frameRight = this.add.graphics();
        frameRight.fillStyle(0x0b1223, 0.78);
        frameRight.fillRect(W - 40, 0, 40, H);
        frameRight.setDepth(103);

        const grain = this.add.graphics();
        grain.fillStyle(0xffffff, 0.015);
        for (let i = 0; i < 120; i++) {
            grain.fillRect(Math.random() * W, Math.random() * H, 2, 2);
        }
        grain.setDepth(108);

        this.refreshChoiceUI();

        this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1));
        this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1));
        this.input.keyboard?.on('keydown-ENTER', () => this.confirmSelection());
        this.input.keyboard?.on('keydown-SPACE', () => this.confirmSelection());
        
        // UI测试按钮（开发用）
        const uiTestButton = this.add.rectangle(1800, 80, 150, 50, 0x1d324e, 0.9);
        uiTestButton.setStrokeStyle(1, 0x4f6aa8, 0.8);
        uiTestButton.setDepth(120);
        uiTestButton.setInteractive({ useHandCursor: true });
        uiTestButton.on('pointerover', () => uiTestButton.setFillStyle(0x243a65, 0.95));
        uiTestButton.on('pointerout', () => uiTestButton.setFillStyle(0x1d324e, 0.9));
        uiTestButton.on('pointerdown', () => this.scene.start('PAPSTestScene'));
        
        this.add.text(1800, 80, 'AI人格测试', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 18,
            color: '#c8dcff',
        }).setOrigin(0.5).setDepth(121);
        
        // AVG叙事测试按钮
        const avgTestButton = this.add.rectangle(1800, 140, 150, 50, 0x3a1d4e, 0.9);
        avgTestButton.setStrokeStyle(1, 0x884faa, 0.8);
        avgTestButton.setDepth(120);
        avgTestButton.setInteractive({ useHandCursor: true });
        avgTestButton.on('pointerover', () => avgTestButton.setFillStyle(0x4a2d6a, 0.95));
        avgTestButton.on('pointerout', () => avgTestButton.setFillStyle(0x3a1d4e, 0.9));
        avgTestButton.on('pointerdown', () => this.scene.start('AVGScene'));
        
        this.add.text(1800, 140, 'AVG叙事测试', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 18,
            color: '#dc8cff',
        }).setOrigin(0.5).setDepth(121);
        
        this.input.keyboard?.on('keydown-P', () => this.scene.start('PAPSTestScene'));
        this.input.keyboard?.on('keydown-A', () => this.scene.start('AVGScene'));
    }

    private createRightInfoPanel(): void {
        const panelX = 1240;
        const rightPanel = this.add.graphics();
        rightPanel.fillStyle(0x060d1a, 0.75);
        rightPanel.fillRoundedRect(panelX, 260, 600, 420, 16);
        rightPanel.lineStyle(1, 0x3b5a8c, 0.45);
        rightPanel.strokeRoundedRect(panelX, 260, 600, 420, 16);
        rightPanel.setDepth(100);

        this.infoTitle = this.add.text(panelX + 300, 290, '◈ 科考记录 ◈', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
            fontSize: 20,
            color: '#f4d88a',
        }).setOrigin(0.5, 0.5).setDepth(120);
        this.infoTitle.setAlpha(0);
        this.tweens.add({ targets: this.infoTitle, alpha: 1, duration: 900, delay: 420, ease: 'Power2' });

        const entries = [
            ['残响碎片', '02 / 15'],
            ['深潜层级', 'SHALLOW 1-3'],
            ['刻蚀章套组', '蚀刻章 · 第四章'],
            ['识网状态', '幕缝稳定'],
        ];

        entries.forEach(([label, value], index) => {
            const y = 340 + index * 78;
            const card = this.add.rectangle(panelX + 20, y, 560, 62, 0x08141f, 0.92);
            card.setOrigin(0, 0.5);
            card.setStrokeStyle(1, 0x476995, 0.85);
            card.setDepth(110);
            card.setAlpha(0);
            this.tweens.add({ targets: card, alpha: 1, duration: 900, delay: 440 + index * 80, ease: 'Power2' });

            this.add.rectangle(panelX + 28, y, 5, 36, 0x6bb2ff, 0.5).setOrigin(0, 0.5).setDepth(111);

            const labelText = this.add.text(panelX + 48, y - 10, label, {
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                fontSize: 18,
                color: '#dceeff',
            }).setOrigin(0, 0.5).setDepth(120);
            labelText.setAlpha(0);
            this.tweens.add({ targets: labelText, alpha: 1, duration: 900, delay: 448 + index * 80, ease: 'Power2' });

            const valueText = this.add.text(panelX + 48, y + 16, value, {
                fontFamily: 'Microsoft YaHei, SimHei, sans-serif',
                fontSize: 22,
                color: '#92c9ff',
            }).setOrigin(0, 0.5).setDepth(120);
            valueText.setAlpha(0);
            this.tweens.add({ targets: valueText, alpha: 1, duration: 900, delay: 456 + index * 80, ease: 'Power2' });

            this.infoItems.push(labelText, valueText);
        });
    }

    private createChoiceCard(x: number, y: number, title: string, detail: string, choice: MenuChoice): void {
        const card = this.add.rectangle(x, y, 380, 90, 0x09101f, 0.92);
        card.setOrigin(0.5);
        card.setStrokeStyle(2, 0x28507a, 0.9);
        card.setDepth(110);
        card.setInteractive({ useHandCursor: true });
        card.setAlpha(0);
        this.tweens.add({ targets: card, alpha: 1, duration: 900, delay: 500 + (choice === 'continue' ? 0 : 140), ease: 'Power2' });

        const glow = this.add.rectangle(x, y, 392, 102, 0x80b0f0, 0.0);
        glow.setOrigin(0.5);
        glow.setDepth(109);
        glow.setAlpha(0);

        const accent = this.add.rectangle(x - 190, y, 6, 56, 0x80b0f0, 0.0);
        accent.setOrigin(0, 0.5);
        accent.setDepth(108);
        accent.setAlpha(0);

        const marker = this.add.text(x - 160, y - 34, choice === 'continue' ? '◈' : '◎', {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif', fontSize: 18, color: '#80b0f0',
        }).setOrigin(0, 0.5).setDepth(120);

        const titleText = this.add.text(x - 130, y - 12, title, {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif', fontSize: 26, color: '#e9f7ff',
        }).setOrigin(0, 0.5).setDepth(120);
        titleText.setAlpha(0);
        this.tweens.add({ targets: titleText, alpha: 1, duration: 900, delay: 520 + (choice === 'continue' ? 0 : 140), ease: 'Power2' });

        const detailText = this.add.text(x - 130, y + 18, detail, {
            fontFamily: 'Microsoft YaHei, SimHei, sans-serif', fontSize: 15, color: '#7fb7ef',
            wordWrap: { width: 280 },
        }).setOrigin(0, 0.5).setDepth(120);
        detailText.setAlpha(0);
        this.tweens.add({ targets: detailText, alpha: 1, duration: 900, delay: 540 + (choice === 'continue' ? 0 : 140), ease: 'Power2' });

        card.on('pointerover', () => this.selectChoice(choice));
        card.on('pointerdown', () => this.confirmSelection());

        this.optionCards.push({ choice, card, title: titleText, detail: detailText, glow, accent });
        this.tweens.add({ targets: marker, alpha: 0.7, duration: 1200, delay: 520 + (choice === 'continue' ? 0 : 140), ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
    }

    private moveSelection(step: number): void {
        const choices: MenuChoice[] = this.saveState ? ['continue', 'newGame'] : ['newGame'];
        if (choices.length === 1) {
            this.selectedChoice = choices[0];
            this.refreshChoiceUI();
            return;
        }

        const currentIndex = choices.indexOf(this.selectedChoice);
        const nextIndex = (currentIndex + step + choices.length) % choices.length;
        this.selectedChoice = choices[nextIndex];
        this.refreshChoiceUI();
    }

    private selectChoice(choice: MenuChoice): void {
        if (choice === 'continue' && !this.saveState) { return; }
        this.selectedChoice = choice;
        this.refreshChoiceUI();
    }

    private refreshChoiceUI(): void {
        this.optionCards.forEach(({ choice, card, title, detail, glow, accent }) => {
            const isSelected = choice === this.selectedChoice;
            const isAvailable = choice !== 'continue' || Boolean(this.saveState);
            card.setFillStyle(isSelected ? 0x14314f : 0x09101f, isAvailable ? 0.95 : 0.45);
            card.setStrokeStyle(2, isSelected ? 0x80b0f0 : 0x28507a, isAvailable ? 0.95 : 0.6);
            card.setScale(isSelected ? 1.01 : 1);
            card.setAlpha(isAvailable ? 1 : 0.55);
            title.setColor(isSelected ? '#fef3c7' : '#e9f7ff');
            title.setScale(isSelected ? 1.02 : 1);
            title.setLetterSpacing(isSelected ? 1 : 0);
            detail.setColor(isSelected ? '#aee2ff' : '#7fb7ef');
            detail.setScale(isSelected ? 1.01 : 1);
            glow.setFillStyle(0x80b0f0, isSelected ? 0.12 : 0.0);
            glow.setScale(isSelected ? 1.01 : 1);
            accent.setFillStyle(0x80b0f0, isSelected ? 0.9 : 0.25);
            accent.setScale(isSelected ? 1.06 : 1);
            if (isSelected) {
                this.tweens.add({ targets: card, scaleX: 1.01, scaleY: 1.01, duration: 180, ease: 'Power2' });
                this.tweens.add({ targets: glow, alpha: 0.25, duration: 220, ease: 'Power2' });
                this.tweens.add({ targets: accent, alpha: 0.95, duration: 220, ease: 'Power2' });
                this.tweens.add({ targets: title, y: title.y - 2, duration: 160, ease: 'Power2' });
                this.tweens.add({ targets: detail, y: detail.y - 2, duration: 160, ease: 'Power2' });
            } else {
                this.tweens.add({ targets: card, scaleX: 1, scaleY: 1, duration: 180, ease: 'Power2' });
                this.tweens.add({ targets: glow, alpha: 0, duration: 220, ease: 'Power2' });
                this.tweens.add({ targets: accent, alpha: 0.2, duration: 220, ease: 'Power2' });
                this.tweens.add({ targets: title, y: title.y + 0, duration: 160, ease: 'Power2' });
                this.tweens.add({ targets: detail, y: detail.y + 0, duration: 160, ease: 'Power2' });
            }
        });
    }

    private confirmSelection(): void {
        if (this.selectedChoice === 'continue' && !this.saveState) {
            this.selectedChoice = 'newGame';
            this.refreshChoiceUI();
            return;
        }

        const source = this.selectedChoice === 'continue' ? 'continue' : 'newGame';
        if (source === 'newGame') {
            this.saveProgress('初幕之门');
        }
        this.cameras.main.fadeOut(700, 6, 6, 18);
        this.time.delayedCall(760, () => {
            this.scene.start('Game', { source, saveState: this.saveState });
        });
    }

    private saveProgress(chapter: string): void {
        const payload: SaveData = {
            chapter,
            updatedAt: new Date().toISOString(),
            source: 'newGame',
        };
        localStorage.setItem('veil-reset-save', JSON.stringify(payload));
        this.saveState = payload;
        this.statusText.setText('旧日的残响已被你拾起，下一次可从这里续行。');
    }

    private loadSave(): SaveData | null {
        try {
            const raw = localStorage.getItem('veil-reset-save');
            if (!raw) return null;
            return JSON.parse(raw) as SaveData;
        } catch {
            return null;
        }
    }

    private drawSky(): void {
        const g = this.add.graphics();
        const h = H;
        for (let y = 0; y < h; y++) {
            const t = y / h;
            const r = Math.floor(6 + t * 8);
            const gr = Math.floor(6 + t * 12);
            const b = Math.floor(18 + t * 35);
            g.fillStyle((r << 16) | (gr << 8) | b, 1);
            g.fillRect(0, y, W, 1);
        }
    }

    private drawEnergyWaves(): void {
        for (let i = 0; i < 6; i++) {
            const g = this.add.graphics();
            g.setAlpha(0);
            const offset = i * (H / 6);
            const amp = 25 + i * 8;
            g.lineStyle(1.5, C.energy, 0.12 - i * 0.015);

            g.beginPath();
            for (let x = 0; x <= W; x += 4) {
                const y = offset + Math.sin(x * 0.003 + i) * amp + Math.sin(x * 0.007 + i * 2) * amp * 0.5;
                if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
            }
            g.strokePath();

            this.tweens.add({
                targets: g, alpha: 0.15 - i * 0.02,
                duration: 6000 + i * 1200, ease: 'Sine.easeInOut', yoyo: true, repeat: -1, delay: i * 400,
            });
        }
    }

    private drawOrnament(): void {
        const cx = W * 0.64, cy = H * 0.38;

        const g1 = this.add.graphics();
        for (let r = 60; r <= 280; r += 3) {
            const alpha = 0.04 + (r < 140 ? 0.06 : 0.02);
            g1.lineStyle(1, r < 140 ? C.glow : C.energy, alpha);
            const sweep = Math.PI * (1.6 - r * 0.001);
            g1.beginPath();
            g1.arc(cx, cy, r, -sweep, sweep, false);
            g1.strokePath();
        }
        g1.fillStyle(C.deep, 0.85);
        g1.fillCircle(cx, cy, 38);
        g1.lineStyle(1.5, C.bright, 0.2);
        g1.strokeCircle(cx, cy, 45);

        this.tweens.add({ targets: g1, angle: 360, duration: 240000, repeat: -1 });
        this.tweens.add({ targets: g1, alpha: 0.6, duration: 7000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });

        for (let i = 0; i < 3; i++) {
            const ring = this.add.graphics();
            ring.lineStyle(1, C.bright, 0.15 - i * 0.04);
            ring.strokeCircle(cx, cy, 160 + i * 70);
            this.rings.push(ring);
            this.tweens.add({
                targets: ring, scale: 1.8 - i * 0.3, alpha: 0.02,
                duration: 3500 + i * 1000, ease: 'Sine.easeOut', repeat: -1, yoyo: true, delay: i * 600,
            });
        }

        const boltRing = this.add.graphics();
        boltRing.lineStyle(1, C.energy, 0.08);
        for (let i = 0; i < 36; i++) {
            const a = (i / 36) * Math.PI * 2;
            boltRing.beginPath();
            boltRing.moveTo(cx + Math.cos(a) * 240, cy + Math.sin(a) * 240);
            boltRing.lineTo(cx + Math.cos(a) * 310, cy + Math.sin(a) * 310);
            boltRing.strokePath();
        }
        this.tweens.add({ targets: boltRing, angle: -360, duration: 180000, repeat: -1 });
    }

    private createMotes(): void {
        for (let i = 0; i < 80; i++) {
            const m = this.add.image(Math.random() * W, Math.random() * H, 'mote');
            m.setAlpha(0.1 + Math.random() * 0.35);
            m.setScale(0.2 + Math.random() * 0.7);
            this.motes.push({ img: m, vx: (Math.random() - 0.5) * 0.35, vy: -(0.15 + Math.random() * 0.55) });
        }
    }

    private createEchoes(): void {
        for (let i = 0; i < 25; i++) {
            const e = this.add.image(Math.random() * W, Math.random() * H, 'echo');
            e.setAlpha(0.06 + Math.random() * 0.14);
            e.setScale(0.5 + Math.random() * 1.2);
            e.setRotation(Math.random() * Math.PI * 2);
            this.tweens.add({
                targets: e, y: e.y + 40 + Math.random() * 130,
                x: e.x + (Math.random() - 0.5) * 70, angle: 80 + Math.random() * 240, alpha: 0.01,
                duration: 9000 + Math.random() * 18000, repeat: -1,
                onRepeat: () => { e.setY(-20); e.setX(Math.random() * W); e.setAlpha(0.06 + Math.random() * 0.14); },
            });
        }
    }

    private createDust(): void {
        for (let i = 0; i < 50; i++) {
            const d = this.add.image(Math.random() * W, Math.random() * H, 'dust');
            d.setAlpha(0.03 + Math.random() * 0.1);
            d.setScale(0.4 + Math.random() * 2);
            this.tweens.add({
                targets: d, y: d.y + 10 + Math.random() * 50,
                x: d.x + (Math.random() - 0.5) * 40,
                duration: 3000 + Math.random() * 6000, ease: 'Sine.easeInOut', repeat: -1, yoyo: true,
            });
        }
    }

    private drawVignette(): void {
        const g = this.add.graphics();
        for (let i = 0; i < 20; i++) {
            const t = i / 20, a = 0.3 * (1 - t), m = (1 - t) * 250;
            g.fillStyle(0x000000, a);
            g.fillRect(0, m, W, 2); g.fillRect(0, H - m, W, 2);
            g.fillRect(m, 0, 2, H); g.fillRect(W - m, 0, 2, H);
        }
    }

    update(_t: number, _d: number): void {
        this.elapsed += 0.016;
        if (this.panelHalo) {
            this.panelHalo.clear();
            const pulse = 0.07 + Math.sin(this.elapsed * 1.2) * 0.03;
            this.panelHalo.lineStyle(2, C.bright, pulse);
            this.panelHalo.strokeRoundedRect(332, 252, 876, 576, 30);
        }
        if (this.panelOverlay) {
            this.panelOverlay.clear();
            this.panelOverlay.lineStyle(1, C.glow, 0.06);
            for (let y = 290; y < 790; y += 24) {
                const alpha = 0.03 + Math.sin(this.elapsed * 0.8 + y * 0.02) * 0.02;
                this.panelOverlay.lineStyle(1, C.energy, alpha);
                this.panelOverlay.lineBetween(370, y, 1160, y + 8);
            }
            this.panelOverlay.lineStyle(1, C.energy, 0.14);
            this.panelOverlay.strokeRoundedRect(354, 274, 832, 532, 24);
            this.panelOverlay.lineStyle(1, C.bright, 0.08);
            this.panelOverlay.strokeRoundedRect(366, 286, 808, 508, 20);
        }
        if (this.veilSeal) {
            this.veilSeal.clear();
            const pulse = 0.16 + Math.sin(this.elapsed * 1.4) * 0.06;
            this.veilSeal.lineStyle(2, C.bright, pulse);
            this.veilSeal.strokeCircle(770, 360, 68);
            this.veilSeal.lineStyle(1.2, C.energy, 0.18);
            this.veilSeal.beginPath();
            this.veilSeal.arc(770, 360, 54, -Math.PI * 0.2 + this.elapsed * 0.3, Math.PI * 0.6 + this.elapsed * 0.3);
            this.veilSeal.strokePath();
            this.veilSeal.beginPath();
            this.veilSeal.arc(770, 360, 44, Math.PI * 0.4 + this.elapsed * 0.2, Math.PI * 1.2 + this.elapsed * 0.2);
            this.veilSeal.strokePath();
            this.veilSeal.fillStyle(C.glow, 0.12);
            this.veilSeal.fillCircle(770, 360, 20);
            this.veilSeal.lineStyle(1, C.energy, 0.2);
            this.veilSeal.strokeCircle(770, 360, 20);
        }
        for (const m of this.motes) {
            m.img.x += m.vx;
            m.img.y += m.vy + Math.sin(this.elapsed + m.img.x * 0.01) * 0.15;
            if (m.img.y < -20) { m.img.setY(H + 20); m.img.setX(Math.random() * W); }
            if (m.img.x < -20 || m.img.x > W + 20) m.img.setX(Math.random() * W);
        }
    }
}
