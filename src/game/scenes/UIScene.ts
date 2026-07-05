import { Scene } from 'phaser';
import { UIFactory, COLORS, FONTS, ALPHA } from '../ui/UIFactory';

/**
 * UI组件测试场景
 * 用于演示和测试UIFactory的所有功能
 */
export class UIScene extends Scene {
  private uiFactory!: UIFactory;
  private testComponents: Array<{ destroy: () => void }> = [];
  
  constructor() {
    super({ key: 'UIScene' });
  }
  
  preload(): void {
    // 预加载资源（如果需要）
  }
  
  create(): void {
    this.uiFactory = new UIFactory(this);
    
    // 创建背景
    this.add.rectangle(0, 0, 1920, 1080, COLORS.DEEP_BLUE, 1)
      .setOrigin(0, 0)
      .setDepth(-1);
    
    // 标题
    this.uiFactory.createText(960, 60, 'UI组件系统测试', {
      fontSize: FONTS.SIZES.HEADLINE,
      color: '#f6f9ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    });
    
    // 创建测试区域
    this.createButtonTest();
    this.createCardTest();
    this.createPanelTest();
    this.createProgressBarTest();
    this.createTextTest();
    
    // 返回按钮
    const { bg: backBtn, text: backText } = this.uiFactory.createButton({
      x: 1800,
      y: 1000,
      width: 200,
      height: 60,
      label: '返回主菜单',
      onClick: () => this.scene.start('HomeScene'),
      fontSize: FONTS.SIZES.BODY,
    });
    
    this.testComponents.push({
      destroy: () => {
        backBtn.destroy();
        backText.destroy();
      },
    });
    
    // 添加键盘快捷键
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('HomeScene'));
  }
  
  /**
   * 按钮测试区域
   */
  private createButtonTest(): void {
    const panel = this.uiFactory.createPanel({
      x: 100,
      y: 150,
      width: 800,
      height: 250,
      title: '按钮组件测试',
    });
    
    this.testComponents.push(panel);
    
    // 标准按钮
    const { bg: btn1, text: text1 } = this.uiFactory.createButton({
      x: 250,
      y: 250,
      width: 200,
      height: 60,
      label: '标准按钮',
      onClick: () => console.log('标准按钮点击'),
    });
    
    // 大号按钮
    const { bg: btn2, text: text2 } = this.uiFactory.createButton({
      x: 500,
      y: 250,
      width: 300,
      height: 80,
      label: '大号按钮',
      fontSize: FONTS.SIZES.SUBHEAD,
      onClick: () => console.log('大号按钮点击'),
    });
    
    // 禁用按钮
    const { bg: btn3, text: text3 } = this.uiFactory.createButton({
      x: 750,
      y: 250,
      width: 200,
      height: 60,
      label: '禁用按钮',
      enabled: false,
      onClick: () => console.log('禁用按钮点击（不应该触发）'),
    });
    
    this.testComponents.push(
      { destroy: () => { btn1.destroy(); text1.destroy(); } },
      { destroy: () => { btn2.destroy(); text2.destroy(); } },
      { destroy: () => { btn3.destroy(); text3.destroy(); } },
    );
  }
  
  /**
   * 卡片测试区域
   */
  private createCardTest(): void {
    const panel = this.uiFactory.createPanel({
      x: 100,
      y: 420,
      width: 800,
      height: 280,
      title: '卡片组件测试',
    });
    
    this.testComponents.push(panel);
    
    // 基础卡片
    const card1 = this.uiFactory.createCard({
      x: 250,
      y: 550,
      width: 300,
      height: 180,
      title: '基础卡片',
      content: '这是一个基础的卡片组件，显示一些简单的信息。',
    });
    
    // 可选卡片
    const card2 = this.uiFactory.createCard({
      x: 600,
      y: 550,
      width: 300,
      height: 180,
      title: '可选卡片',
      content: '这个卡片是可选择的，点击会有选中效果。',
      selectable: true,
    });
    
    // 卡片交互
    if (card2.bg.input) {
      card2.bg.on('pointerdown', () => {
        card2.bg.clear();
        
        // 切换选中状态
        const wasSelected = card2.bg.fillColor === COLORS.VEIL_PURPLE;
        const fillColor = wasSelected ? COLORS.DEEP_BLUE : COLORS.VEIL_PURPLE;
        const strokeColor = wasSelected ? COLORS.ENERGY_BLUE : COLORS.BRIGHT_BLUE;
        
        card2.bg.fillStyle(fillColor, ALPHA.PRIMARY);
        card2.bg.fillRoundedRect(600 - 150, 550 - 90, 300, 180, 16);
        
        card2.bg.lineStyle(2, strokeColor, wasSelected ? 0.6 : 0.9);
        card2.bg.strokeRoundedRect(600 - 150, 550 - 90, 300, 180, 16);
        
        // 更新文字颜色
        if (card2.title) {
          card2.title.setColor(wasSelected ? '#e9f7ff' : '#fef3c7');
        }
        if (card2.content) {
          card2.content.setColor(wasSelected ? '#7fb7ef' : '#aee2ff');
        }
      });
    }
    
    this.testComponents.push(card1, card2);
  }
  
  /**
   * 面板测试区域
   */
  private createPanelTest(): void {
    const panel = this.uiFactory.createPanel({
      x: 950,
      y: 150,
      width: 850,
      height: 250,
      title: '面板组件测试',
    });
    
    this.testComponents.push(panel);
    
    // 面板内的内容
    this.uiFactory.createText(1300, 200, '面板组件是UI布局的基础容器', {
      fontSize: FONTS.SIZES.BODY,
      color: '#95b9ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    });
    
    this.uiFactory.createText(1300, 240, '可以包含标题栏、内容区域和滚动功能', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#7aa9d8',
      align: 'center',
      originX: 0.5,
      originY: 0,
      wordWrap: { width: 700 },
    });
    
    // 面板内的按钮
    const { bg: panelBtn, text: panelBtnText } = this.uiFactory.createButton({
      x: 1300,
      y: 320,
      width: 180,
      height: 50,
      label: '面板内按钮',
      onClick: () => console.log('面板内按钮点击'),
    });
    
    this.testComponents.push({
      destroy: () => {
        panelBtn.destroy();
        panelBtnText.destroy();
      },
    });
  }
  
  /**
   * 进度条测试区域
   */
  private createProgressBarTest(): void {
    const panel = this.uiFactory.createPanel({
      x: 950,
      y: 420,
      width: 850,
      height: 280,
      title: '进度条组件测试',
    });
    
    this.testComponents.push(panel);
    
    // 创建多个进度条
    const progressBar1 = this.uiFactory.createProgressBar({
      x: 1300,
      y: 520,
      width: 600,
      height: 20,
      value: 2,
      maxValue: 15,
      showText: true,
      color: COLORS.ENERGY_BLUE,
      glow: true,
    });
    
    const progressBar2 = this.uiFactory.createProgressBar({
      x: 1300,
      y: 580,
      width: 600,
      height: 15,
      value: 75,
      maxValue: 100,
      showText: true,
      color: COLORS.SUCCESS,
    });
    
    const progressBar3 = this.uiFactory.createProgressBar({
      x: 1300,
      y: 640,
      width: 600,
      height: 12,
      value: 30,
      maxValue: 100,
      showText: false,
      color: COLORS.WARNING,
    });
    
    this.testComponents.push(progressBar1, progressBar2, progressBar3);
    
    // 进度条标签
    this.uiFactory.createText(950, 520, '残响回收进度：', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#8ec5ff',
      originY: 0.5,
    });
    
    this.uiFactory.createText(950, 580, '识能储备：', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#8fd0ff',
      originY: 0.5,
    });
    
    this.uiFactory.createText(950, 640, '覆幕倒计时：', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#f4d88a',
      originY: 0.5,
    });
  }
  
  /**
   * 文字测试区域
   */
  private createTextTest(): void {
    const panel = this.uiFactory.createPanel({
      x: 100,
      y: 720,
      width: 1700,
      height: 300,
      title: '文字系统测试',
    });
    
    this.testComponents.push(panel);
    
    // 不同字号的文字
    const textY = 800;
    const texts = [
      { size: FONTS.SIZES.TITLE, label: '标题文字 (86px)', color: '#f6f9ff' },
      { size: FONTS.SIZES.HEADLINE, label: '大标题 (64px)', color: '#e8f5ff' },
      { size: FONTS.SIZES.SUBHEAD, label: '副标题 (32px)', color: '#c8dcff' },
      { size: FONTS.SIZES.BODY_LARGE, label: '大正文 (26px)', color: '#aee2ff' },
      { size: FONTS.SIZES.BODY, label: '正文 (22px)', color: '#95b9ff' },
      { size: FONTS.SIZES.CAPTION, label: '说明文字 (18px)', color: '#7aa9d8' },
      { size: FONTS.SIZES.SMALL, label: '小字 (16px)', color: '#6b8db8' },
      { size: FONTS.SIZES.TINY, label: '极小字 (14px)', color: '#5a7ba0' },
    ];
    
    let currentY = textY;
    texts.forEach((textConfig, index) => {
      const x = 150 + (index % 4) * 400;
      if (index % 4 === 0 && index > 0) {
        currentY += 80;
      }
      
      this.uiFactory.createText(x, currentY, textConfig.label, {
        fontSize: textConfig.size,
        color: textConfig.color,
        originY: 0.5,
      });
    });
    
    // 文字对齐示例
    const alignPanel = this.uiFactory.createPanel({
      x: 100,
      y: 950,
      width: 1700,
      height: 120,
      title: '文字对齐示例',
    });
    
    this.testComponents.push(alignPanel);
    
    const alignY = 1000;
    this.uiFactory.createText(200, alignY, '左对齐', {
      fontSize: FONTS.SIZES.BODY,
      color: '#95b9ff',
      align: 'left',
      originY: 0.5,
    });
    
    this.uiFactory.createText(960, alignY, '居中对齐', {
      fontSize: FONTS.SIZES.BODY,
      color: '#95b9ff',
      align: 'center',
      originX: 0.5,
      originY: 0.5,
    });
    
    this.uiFactory.createText(1720, alignY, '右对齐', {
      fontSize: FONTS.SIZES.BODY,
      color: '#95b9ff',
      align: 'right',
      originY: 0.5,
    });
  }
  
  update(): void {
    // 更新逻辑（如果需要）
  }
  
  shutdown(): void {
    // 清理所有测试组件
    this.testComponents.forEach(component => component.destroy());
    this.testComponents = [];
  }
}