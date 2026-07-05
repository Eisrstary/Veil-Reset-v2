import { Scene } from 'phaser';
import { UIFactory, COLORS, FONTS } from '../ui/UIFactory';
import { OperatorCard, OperatorData } from '../ui/components/OperatorCard';

/**
 * 干员管理界面测试场景
 */
export class OperatorTestScene extends Scene {
  private uiFactory!: UIFactory;
  private testOperators: OperatorData[] = [];
  private operatorCards: OperatorCard[] = [];
  private selectedOperator: OperatorData | null = null;
  
  constructor() {
    super({ key: 'OperatorTestScene' });
  }
  
  preload(): void {
    // 预加载头像资源（如果有）
  }
  
  create(): void {
    this.uiFactory = new UIFactory(this);
    
    // 创建背景
    this.add.rectangle(0, 0, 1920, 1080, COLORS.DEEP_BLUE, 1)
      .setOrigin(0, 0)
      .setDepth(-1);
    
    // 标题
    this.uiFactory.createText(960, 60, '干员管理界面测试', {
      fontSize: FONTS.SIZES.HEADLINE,
      color: '#f6f9ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    });
    
    // 生成测试干员
    this.generateTestOperators();
    
    // 创建界面
    this.createOperatorListPanel();
    this.createOperatorDetailPanel();
    this.createControlPanel();
    
    // 返回按钮
    this.uiFactory.createButton({
      x: 1800,
      y: 1000,
      width: 200,
      height: 60,
      label: '返回主菜单',
      onClick: () => this.scene.start('HomeScene'),
      fontSize: FONTS.SIZES.BODY,
    });
    
    // 键盘快捷键
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start('HomeScene'));
  }
  
  /**
   * 生成测试干员数据
   */
  private generateTestOperators(): void {
    const classes: OperatorData['class'][] = ['combat', 'support', 'scout', 'specialist'];
    const statuses: OperatorData['status'][] = ['available', 'deployed', 'resting', 'injured'];
    const names = ['林霜白', '铸铁', '火花', '穗', '守灯人', '翻译者', '织命者', '拾烬者'];
    
    for (let i = 0; i < 8; i++) {
      const operator: OperatorData = {
        id: `operator_${i}`,
        name: names[i] || `干员${i + 1}`,
        class: classes[i % classes.length],
        level: Math.floor(Math.random() * 20) + 1,
        trust: Math.floor(Math.random() * 100),
        bond: Math.floor(Math.random() * 100),
        status: statuses[i % statuses.length],
        portrait: i % 3 === 0 ? 'operator_portrait' : undefined, // 部分有头像
      };
      
      this.testOperators.push(operator);
    }
  }
  
  /**
   * 创建干员列表面板
   */
  private createOperatorListPanel(): void {
    const panel = this.uiFactory.createPanel({
      x: 200,
      y: 150,
      width: 500,
      height: 800,
      title: '干员列表',
      headerHeight: 60,
    });
    
    // 筛选按钮
    const filterButtons = [
      { label: '全部', filter: 'all' },
      { label: '可用', filter: 'available' },
      { label: '部署中', filter: 'deployed' },
      { label: '休息中', filter: 'resting' },
      { label: '受伤', filter: 'injured' },
    ];
    
    filterButtons.forEach((btn, index) => {
      const { bg, text } = this.uiFactory.createButton({
        x: 200 + index * 90,
        y: 220,
        width: 80,
        height: 40,
        label: btn.label,
        onClick: () => this.filterOperators(btn.filter as any),
        fontSize: FONTS.SIZES.SMALL,
      });
    });
    
    // 创建干员卡片列表
    const cardWidth = 460;
    const cardHeight = 120;
    const startX = 200 - 250 + 20; // 面板左侧 + 边距
    const startY = 280;
    const cardsPerColumn = 5;
    
    this.testOperators.forEach((operator, index) => {
      const row = Math.floor(index / 1); // 单列布局
      const col = index % 1;
      
      const x = startX + col * (cardWidth + 20);
      const y = startY + row * (cardHeight + 15);
      
      const card = new OperatorCard(this, {
        x: x + cardWidth/2,
        y: y + cardHeight/2,
        width: cardWidth,
        height: cardHeight,
        operator,
        onClick: (op) => this.selectOperator(op),
        showStatus: true,
        showLevel: true,
      });
      
      this.operatorCards.push(card);
    });
  }
  
  /**
   * 创建干员详情面板
   */
  private createOperatorDetailPanel(): void {
    const panel = this.uiFactory.createPanel({
      x: 800,
      y: 150,
      width: 1000,
      height: 800,
      title: '干员详情',
      headerHeight: 60,
    });
    
    // 详情内容容器
    this.add.rectangle(800, 150 + 60, 1000, 800 - 60, COLORS.MIDNIGHT, 0.3)
      .setOrigin(0, 0)
      .setDepth(5);
    
    // 默认提示文字
    const hintText = this.uiFactory.createText(1300, 400, '请从左侧列表中选择一个干员', {
      fontSize: FONTS.SIZES.SUBHEAD,
      color: '#7aa9d8',
      align: 'center',
      originX: 0.5,
      originY: 0.5,
    });
    
    // 保存引用，用于后续更新
    (this as any).detailHint = hintText;
  }
  
  /**
   * 创建控制面板
   */
  private createControlPanel(): void {
    const panel = this.uiFactory.createPanel({
      x: 1400,
      y: 150,
      width: 400,
      height: 300,
      title: '操作',
      headerHeight: 50,
    });
    
    // 操作按钮
    const actions = [
      { label: '部署干员', action: 'deploy', color: COLORS.SUCCESS },
      { label: '撤回干员', action: 'withdraw', color: COLORS.INFO },
      { label: '训练干员', action: 'train', color: COLORS.GOLD_ACCENT },
      { label: '恢复状态', action: 'heal', color: COLORS.BRIGHT_BLUE },
      { label: '生成新干员', action: 'generate', color: COLORS.GLOW_BLUE },
    ];
    
    actions.forEach((action, index) => {
      const y = 220 + index * 70;
      
      const { bg, text } = this.uiFactory.createButton({
        x: 1400,
        y,
        width: 320,
        height: 50,
        label: action.label,
        color: action.color,
        onClick: () => this.handleAction(action.action),
        enabled: action.action !== 'generate', // 生成按钮始终可用
        fontSize: FONTS.SIZES.BODY,
      });
      
      // 保存引用
      (this as any)[`actionBtn_${action.action}`] = { bg, text };
    });
    
    // 状态指示器
    const statusPanel = this.uiFactory.createPanel({
      x: 1400,
      y: 550,
      width: 400,
      height: 400,
      title: '状态信息',
      headerHeight: 50,
    });
    
    // 状态指示器内容
    this.uiFactory.createText(1400, 620, '当前选中干员: 无', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#8ec5ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    }).setData('key', 'selectedOperatorText');
    
    this.uiFactory.createText(1400, 660, '干员总数: 8', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#8fd0ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    }).setData('key', 'operatorCountText');
    
    this.uiFactory.createText(1400, 700, '可用干员: 2', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#8fd0ff',
      align: 'center',
      originX: 0.5,
      originY: 0,
    }).setData('key', 'availableCountText');
    
    this.uiFactory.createText(1400, 740, '部署中: 2', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#80b0f0',
      align: 'center',
      originX: 0.5,
      originY: 0,
    }).setData('key', 'deployedCountText');
    
    this.uiFactory.createText(1400, 780, '平均信任度: 65%', {
      fontSize: FONTS.SIZES.CAPTION,
      color: '#f4d88a',
      align: 'center',
      originX: 0.5,
      originY: 0,
    }).setData('key', 'avgTrustText');
    
    // 更新状态显示
    this.updateStatusDisplay();
  }
  
  /**
   * 筛选干员
   */
  private filterOperators(filter: OperatorData['status'] | 'all'): void {
    this.operatorCards.forEach((card, index) => {
      const operator = card.getOperator();
      const shouldShow = filter === 'all' || operator.status === filter;
      
      // 简单隐藏/显示（实际项目中应该实现更好的方法）
      const bg = (card as any).bg;
      if (bg) {
        bg.setAlpha(shouldShow ? 1 : 0.3);
      }
    });
    
    // 更新按钮状态
    console.log(`筛选: ${filter}`);
  }
  
  /**
   * 选择干员
   */
  private selectOperator(operator: OperatorData): void {
    // 取消之前的选择
    this.operatorCards.forEach(card => {
      if (card.getOperator().id !== operator.id) {
        card.setSelected(false);
      }
    });
    
    // 设置新选择
    this.selectedOperator = operator;
    
    // 找到对应的卡片并选中
    const selectedCard = this.operatorCards.find(card => card.getOperator().id === operator.id);
    if (selectedCard) {
      selectedCard.setSelected(true);
    }
    
    // 更新详情面板
    this.updateOperatorDetail(operator);
    
    // 更新操作按钮状态
    this.updateActionButtons();
    
    // 更新状态显示
    this.updateStatusDisplay();
    
    console.log(`选中干员: ${operator.name}`);
  }
  
  /**
   * 更新干员详情
   */
  private updateOperatorDetail(operator: OperatorData): void {
    // 移除之前的详情内容
    const oldDetail = (this as any).detailContainer;
    if (oldDetail) {
      oldDetail.destroy();
    }
    
    // 移除提示文字
    const hintText = (this as any).detailHint;
    if (hintText) {
      hintText.destroy();
    }
    
    // 创建详情容器
    const container = this.add.container(800, 210);
    container.setDepth(10);
    
    // 头像区域
    const portraitBg = this.add.graphics();
    portraitBg.fillStyle(COLORS.DEEP_BLUE, 0.9);
    portraitBg.fillRoundedRect(50, 30, 200, 200, 20);
    portraitBg.lineStyle(2, COLORS.BRIGHT_BLUE, 0.8);
    portraitBg.strokeRoundedRect(50, 30, 200, 200, 20);
    container.add(portraitBg);
    
    // 职业图标
    const classIcon = this.add.text(150, 130, this.getClassIcon(operator.class), {
      fontFamily: FONTS.CHINESE,
      fontSize: 80,
      color: '#8fd0ff',
    }).setOrigin(0.5);
    container.add(classIcon);
    
    // 基本信息
    const infoX = 300;
    
    // 名字
    const nameText = this.add.text(infoX, 40, operator.name, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.HEADLINE,
      color: '#f6f9ff',
    });
    container.add(nameText);
    
    // 等级和职业
    const levelText = this.add.text(infoX, 100, `Lv.${operator.level} | ${this.getClassText(operator.class)}`, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.BODY,
      color: '#8fd0ff',
    });
    container.add(levelText);
    
    // 状态
    const statusText = this.add.text(infoX, 140, `状态: ${this.getStatusText(operator.status)}`, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.BODY,
      color: this.getStatusColor(operator.status),
    });
    container.add(statusText);
    
    // 信任度和羁绊
    const trustY = 190;
    
    // 信任度条
    const trustBarBg = this.add.graphics();
    trustBarBg.fillStyle(COLORS.MIDNIGHT, 0.9);
    trustBarBg.fillRect(infoX, trustY, 400, 20);
    trustBarBg.lineStyle(1, COLORS.ENERGY_BLUE, 0.5);
    trustBarBg.strokeRect(infoX, trustY, 400, 20);
    container.add(trustBarBg);
    
    const trustFill = this.add.graphics();
    const fillColor = this.getTrustColor(operator.trust);
    const fillWidth = (operator.trust / 100) * 400;
    trustFill.fillStyle(fillColor, 0.9);
    trustFill.fillRect(infoX, trustY, fillWidth, 20);
    container.add(trustFill);
    
    const trustText = this.add.text(infoX + 410, trustY + 10, `信任度: ${operator.trust}%`, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.SMALL,
      color: '#8ec5ff',
    }).setOrigin(0, 0.5);
    container.add(trustText);
    
    // 羁绊
    const bondY = trustY + 40;
    const bondBarBg = this.add.graphics();
    bondBarBg.fillStyle(COLORS.MIDNIGHT, 0.9);
    bondBarBg.fillRect(infoX, bondY, 400, 20);
    bondBarBg.lineStyle(1, COLORS.GLOW_BLUE, 0.5);
    bondBarBg.strokeRect(infoX, bondY, 400, 20);
    container.add(bondBarBg);
    
    const bondFill = this.add.graphics();
    const bondFillWidth = (operator.bond / 100) * 400;
    bondFill.fillStyle(COLORS.GLOW_BLUE, 0.9);
    bondFill.fillRect(infoX, bondY, bondFillWidth, 20);
    container.add(bondFill);
    
    const bondText = this.add.text(infoX + 410, bondY + 10, `羁绊: ${operator.bond}%`, {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.SMALL,
      color: '#95b9ff',
    }).setOrigin(0, 0.5);
    container.add(bondText);
    
    // 人格描述（模拟PAPS数据）
    const descY = bondY + 60;
    const description = this.add.text(infoX, descY, this.generatePersonalityDescription(operator), {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.CAPTION,
      color: '#7fb7ef',
      wordWrap: { width: 650 },
    });
    container.add(description);
    
    // 技能区域
    const skillsY = descY + 120;
    const skillsTitle = this.add.text(infoX, skillsY, '技能:', {
      fontFamily: FONTS.CHINESE,
      fontSize: FONTS.SIZES.BODY_LARGE,
      color: '#f4d88a',
    });
    container.add(skillsTitle);
    
    const skills = this.generateSkills(operator);
    skills.forEach((skill, index) => {
      const skillY = skillsY + 40 + index * 40;
      const skillText = this.add.text(infoX + 20, skillY, `• ${skill}`, {
        fontFamily: FONTS.CHINESE,
        fontSize: FONTS.SIZES.CAPTION,
        color: '#9fc8ff',
      });
      container.add(skillText);
    });
    
    // 保存引用
    (this as any).detailContainer = container;
  }
  
  /**
   * 获取职业图标
   */
  private getClassIcon(opClass: OperatorData['class']): string {
    switch (opClass) {
      case 'combat': return '⚔️';
      case 'support': return '🛡️';
      case 'scout': return '👁️';
      case 'specialist': return '🔧';
      default: return '❓';
    }
  }
  
  /**
   * 获取职业文字
   */
  private getClassText(opClass: OperatorData['class']): string {
    switch (opClass) {
      case 'combat': return '战斗干员';
      case 'support': return '支援干员';
      case 'scout': return '侦察干员';
      case 'specialist': return '特殊干员';
      default: return '未知';
    }
  }
  
  /**
   * 获取状态文字
   */
  private getStatusText(status: OperatorData['status']): string {
    switch (status) {
      case 'available': return '可用';
      case 'deployed': return '部署中';
      case 'resting': return '休息中';
      case 'injured': return '受伤';
      default: return '未知';
    }
  }
  
  /**
   * 获取状态颜色
   */
  private getStatusColor(status: OperatorData['status']): string {
    switch (status) {
      case 'available': return '#8fd0ff';
      case 'deployed': return '#80b0f0';
      case 'resting': return '#6b8db8';
      case 'injured': return '#ff8a8a';
      default: return '#95b9ff';
    }
  }
  
  /**
   * 获取信任度颜色
   */
  private getTrustColor(trust: number): number {
    if (trust >= 80) return COLORS.SUCCESS;
    if (trust >= 50) return COLORS.INFO;
    if (trust >= 30) return COLORS.WARNING;
    return COLORS.DANGER;
  }
  
  /**
   * 生成人格描述
   */
  private generatePersonalityDescription(operator: OperatorData): string {
    const traits = [
      '冷静沉着，善于分析局势',
      '富有同情心，关心队友',
      '警惕性高，时刻保持戒备',
      '乐观开朗，能够鼓舞士气',
      '谨慎细致，做事有条理',
      '勇敢果断，关键时刻能够做出决策',
      '富有创造力，善于解决问题',
      '忠诚可靠，值得信赖',
    ];
    
    const index = operator.name.length % traits.length;
    return traits[index];
  }
  
  /**
   * 生成技能
   */
  private generateSkills(operator: OperatorData): string[] {
    const skillsByClass = {
      combat: ['近战精通', '防御姿态', '冲锋', '战斗恢复'],
      support: ['治疗术', '防护罩', '能量补给', '状态净化'],
      scout: ['隐蔽行动', '侦查视野', '快速移动', '陷阱识别'],
      specialist: ['工程维修', '设备破解', '资源采集', '技术分析'],
    };
    
    return skillsByClass[operator.class] || ['基础训练', '团队协作'];
  }
  
  /**
   * 处理操作
   */
  private handleAction(action: string): void {
    if (!this.selectedOperator && action !== 'generate') {
      console.log('请先选择一个干员');
      return;
    }
    
    switch (action) {
      case 'deploy':
        this.deployOperator();
        break;
      case 'withdraw':
        this.withdrawOperator();
        break;
      case 'train':
        this.trainOperator();
        break;
      case 'heal':
        this.healOperator();
        break;
      case 'generate':
        this.generateNewOperator();
        break;
    }
  }
  
  /**
   * 部署干员
   */
  private deployOperator(): void {
    if (!this.selectedOperator) return;
    
    // 更新状态
    this.selectedOperator.status = 'deployed';
    
    // 更新卡片
    const card = this.operatorCards.find(c => c.getOperator().id === this.selectedOperator!.id);
    if (card) {
      card.updateOperator(this.selectedOperator);
    }
    
    // 更新详情
    this.updateOperatorDetail(this.selectedOperator);
    
    console.log(`部署干员: ${this.selectedOperator.name}`);
  }
  
  /**
   * 撤回干员
   */
  private withdrawOperator(): void {
    if (!this.selectedOperator) return;
    
    // 更新状态
    this.selectedOperator.status = 'available';
    
    // 更新卡片
    const card = this.operatorCards.find(c => c.getOperator().id === this.selectedOperator!.id);
    if (card) {
      card.updateOperator(this.selectedOperator);
    }
    
    // 更新详情
    this.updateOperatorDetail(this.selectedOperator);
    
    console.log(`撤回干员: ${this.selectedOperator.name}`);
  }
  
  /**
   * 训练干员
   */
  private trainOperator(): void {
    if (!this.selectedOperator) return;
    
    // 增加等级和信任度
    this.selectedOperator.level += 1;
    this.selectedOperator.trust = Math.min(100, this.selectedOperator.trust + 10);
    
    // 更新卡片
    const card = this.operatorCards.find(c => c.getOperator().id === this.selectedOperator!.id);
    if (card) {
      card.updateOperator(this.selectedOperator);
    }
    
    // 更新详情
    this.updateOperatorDetail(this.selectedOperator);
    
    console.log(`训练干员: ${this.selectedOperator.name} 等级提升到 ${this.selectedOperator.level}`);
  }
  
  /**
   * 恢复干员状态
   */
  private healOperator(): void {
    if (!this.selectedOperator) return;
    
    // 如果受伤，恢复为可用
    if (this.selectedOperator.status === 'injured') {
      this.selectedOperator.status = 'available';
      
      // 更新卡片
      const card = this.operatorCards.find(c => c.getOperator().id === this.selectedOperator!.id);
      if (card) {
        card.updateOperator(this.selectedOperator);
      }
      
      // 更新详情
      this.updateOperatorDetail(this.selectedOperator);
      
      console.log(`恢复干员: ${this.selectedOperator.name} 已恢复健康`);
    } else {
      console.log(`干员 ${this.selectedOperator.name} 不需要恢复`);
    }
  }
  
  /**
   * 生成新干员
   */
  private generateNewOperator(): void {
    const classes: OperatorData['class'][] = ['combat', 'support', 'scout', 'specialist'];
    const names = ['新干员A', '新干员B', '新干员C', '新干员D', '新干员E'];
    
    const newOperator: OperatorData = {
      id: `operator_${this.testOperators.length}`,
      name: names[this.testOperators.length % names.length],
      class: classes[this.testOperators.length % classes.length],
      level: 1,
      trust: 30,
      bond: 0,
      status: 'available',
    };
    
    this.testOperators.push(newOperator);
    
    // 创建新卡片
    const cardWidth = 460;
    const cardHeight = 120;
    const startX = 200 - 250 + 20;
    const startY = 280;
    const row = Math.floor((this.testOperators.length - 1) / 1);
    
    const x = startX + cardWidth/2;
    const y = startY + row * (cardHeight + 15) + cardHeight/2;
    
    const card = new OperatorCard(this, {
      x,
      y,
      width: cardWidth,
      height: cardHeight,
      operator: newOperator,
      onClick: (op) => this.selectOperator(op),
      showStatus: true,
      showLevel: true,
    });
    
    this.operatorCards.push(card);
    
    // 自动选中新干员
    this.selectOperator(newOperator);
    
    console.log(`生成新干员: ${newOperator.name}`);
  }
  
  /**
   * 更新操作按钮状态
   */
  private updateActionButtons(): void {
    if (!this.selectedOperator) return;
    
    const actions = ['deploy', 'withdraw', 'train', 'heal'];
    
    actions.forEach(action => {
      const btn = (this as any)[`actionBtn_${action}`];
      if (!btn) return;
      
      let enabled = true;
      
      switch (action) {
        case 'deploy':
          enabled = this.selectedOperator!.status === 'available';
          break;
        case 'withdraw':
          enabled = this.selectedOperator!.status === 'deployed';
          break;
        case 'heal':
          enabled = this.selectedOperator!.status === 'injured';
          break;
      }
      
      // 更新按钮状态（简化实现）
      btn.bg.setAlpha(enabled ? 1 : 0.5);
      btn.text.setAlpha(enabled ? 1 : 0.5);
    });
  }
  
  /**
   * 更新状态显示
   */
  private updateStatusDisplay(): void {
    // 计算统计数据
    const total = this.testOperators.length;
    const available = this.testOperators.filter(op => op.status === 'available').length;
    const deployed = this.testOperators.filter(op => op.status === 'deployed').length;
    const avgTrust = Math.round(
      this.testOperators.reduce((sum, op) => sum + op.trust, 0) / total
    );
    
    // 更新文字
    const selectedName = this.selectedOperator ? this.selectedOperator.name : '无';
    
    const texts = [
      { key: 'selectedOperatorText', text: `当前选中干员: ${selectedName}` },
      { key: 'operatorCountText', text: `干员总数: ${total}` },
      { key: 'availableCountText', text: `可用干员: ${available}` },
      { key: 'deployedCountText', text: `部署中: ${deployed}` },
      { key: 'avgTrustText', text: `平均信任度: ${avgTrust}%` },
    ];
    
    // 查找并更新文字对象
    this.children.each((child: any) => {
      if (child.getData && child.getData('key')) {
        const key = child.getData('key');
        const textConfig = texts.find(t => t.key === key);
        if (textConfig) {
          child.setText(textConfig.text);
        }
      }
    });
  }
  
  update(): void {
    // 更新逻辑（如果需要）
  }
  
  shutdown(): void {
    // 清理
    this.operatorCards.forEach(card => card.destroy());
    this.operatorCards = [];
  }
}