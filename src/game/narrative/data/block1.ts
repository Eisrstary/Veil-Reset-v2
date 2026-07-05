/**
 * 区块1：灰烬哨站废墟 - 剧情数据
 * 对应剧情文档中的"区块1：灰烬哨站废墟（combat / Day 1）"
 */

import { DialogueUnit, EchoMemory, StoryBlock } from '../DialogueTypes';

// ==================== 对话数据 ====================
export const block1Dialogues: { [id: string]: DialogueUnit } = {
  // 开场对话
  block1_opening: {
    id: 'block1_opening',
    speaker: '系统',
    content: '虚渊历873年。距离上一次覆幕，已经过去了八百七十三年。<br><br>没有人知道这是第几轮文明。识网——前序文明留下的遗产——像空气一样无处不在，但没有人真正理解它。',
    bg: 'backgrounds/ruins',
    next: 'block1_intro'
  },
  
  block1_intro: {
    id: 'block1_intro',
    speaker: '系统',
    content: '在一次深层识网勘探中，拾烬者发现了你。<br><br>两个意识，共享一个存在位格。你的意识痕迹散落在多个前轮文明的层位中。你是唯一跨越过覆幕的人——虽然你自己不记得了。',
    bg: 'backgrounds/ruins',
    next: 'block1_wakeup'
  },
  
  block1_wakeup: {
    id: 'block1_wakeup',
    speaker: '系统',
    content: '拾烬者把你从识网深处唤醒，给了你一个据点，一些资源，和一个问题：<br><br>**「你是唯一跨越过覆幕的人。你想知道你是谁吗？」**',
    bg: 'backgrounds/base_interior',
    next: 'block1_arrival'
  },
  
  block1_arrival: {
    id: 'block1_arrival',
    speaker: '系统',
    content: '灰烬哨站。拾烬者的前哨基地，现已废弃。墙上还有前任主人留下的涂鸦：<br><br>**「别相信织命者。——K」**',
    bg: 'backgrounds/ash_outpost',
    next: 'block1_meet_operator'
  },
  
  block1_meet_operator: {
    id: 'block1_meet_operator',
    speaker: '初始干员',
    content: '你醒了。我是拾烬者派来协助你的。',
    avatar: 'avatars/operator_default',
    next: 'block1_operator_explain'
  },
  
  block1_operator_explain: {
    id: 'block1_operator_explain',
    speaker: '初始干员',
    content: '仓库里有基本物资：够一个人吃十天的口粮，几捆木材，一小袋铁矿石。还有一台还能用的识网终端。',
    avatar: 'avatars/operator_default',
    next: 'block1_noise'
  },
  
  block1_noise: {
    id: 'block1_noise',
    speaker: '系统',
    content: '（远处传来奇怪的声音）',
    sfx: 'sfx/echo_rumble',
    next: 'block1_operator_alert'
  },
  
  block1_operator_alert: {
    id: 'block1_operator_alert',
    speaker: '初始干员',
    content: '有东西在外面。可能是残响体——被覆幕清除后残留在识网表层的意识碎片。',
    avatar: 'avatars/operator_alert',
    next: 'block1_combat_start'
  },
  
  block1_combat_start: {
    id: 'block1_combat_start',
    speaker: '系统',
    content: '**战斗开始**<br>部署干员，并肩战斗，消灭全部残响体。',
    bg: 'backgrounds/combat_arena',
    next: 'block1_post_combat'
  },
  
  block1_post_combat: {
    id: 'block1_post_combat',
    speaker: '系统',
    content: '残响体消散了。在最后一个消散的位置，你发现了一枚微弱的识能结晶——残响碎片。',
    bg: 'backgrounds/ash_outpost',
    next: 'block1_echo_found'
  },
  
  block1_echo_found: {
    id: 'block1_echo_found',
    speaker: '初始干员',
    content: '这是……残响碎片。前轮文明留下的记忆碎片。你要触碰它吗？',
    avatar: 'avatars/operator_curious',
    choices: [
      {
        id: 'touch_echo',
        text: '触碰残响碎片',
        immediateEffect: {
          dialogue: 'block1_echo_sequence'
        }
      },
      {
        id: 'ignore_echo',
        text: '暂时不触碰',
        immediateEffect: {
          bondChange: { 'operator_01': -5 }
        },
        delayedEffect: {
          triggerDay: 3,
          dialogueId: 'block1_echo_delayed'
        }
      }
    ]
  },
  
  block1_echo_sequence: {
    id: 'block1_echo_sequence',
    speaker: '系统',
    content: '你触碰了残响碎片。识网涌入了不属于你的记忆。破碎的，不完整的，像隔着一层水在看。',
    next: 'block1_echo_content'
  },
  
  block1_echo_content: {
    id: 'block1_echo_content',
    speaker: '残响',
    content: '「……信号确认。双螺旋结构。从未见过的识网特征。」<br>「唤醒程序启动。准备接收。」<br>「等等——他的意识层位——不止一层。他在前轮文明的层位里也有痕迹。」<br>「这不可能。覆幕会清除一切。」',
    next: 'block1_echo_end'
  },
  
  block1_echo_end: {
    id: 'block1_echo_end',
    speaker: '系统',
    content: '记忆中断。你只看到几个模糊的人影围在识网终端旁边。声音里有一种混合了敬畏和恐惧的情绪。',
    next: 'block1_operator_question'
  },
  
  block1_operator_question: {
    id: 'block1_operator_question',
    speaker: '初始干员',
    content: '你……看到了什么？',
    avatar: 'avatars/operator_concerned',
    choices: [
      {
        id: 'share_memory',
        text: '「我看到了一些人。他们唤醒了我。」',
        immediateEffect: {
          bondChange: { 'operator_01': 5 },
          dialogue: 'block1_response_warm'
        }
      },
      {
        id: 'hide_memory',
        text: '「没什么。只是一些碎片。」',
        immediateEffect: {
          dialogue: 'block1_response_neutral'
        },
        delayedEffect: {
          triggerDay: 3,
          dialogueId: 'block1_delayed_question'
        }
      },
      {
        id: 'stay_silent',
        text: '（沉默）',
        immediateEffect: {
          dialogue: 'block1_response_silent'
        },
        delayedEffect: {
          triggerDay: 7,
          dialogueId: 'block1_delayed_acceptance'
        }
      }
    ]
  },
  
  block1_response_warm: {
    id: 'block1_response_warm',
    speaker: '初始干员',
    content: '……是吗。看来你不只是传说中的名字。',
    avatar: 'avatars/operator_warm',
    next: 'block1_block_complete'
  },
  
  block1_response_neutral: {
    id: 'block1_response_neutral',
    speaker: '初始干员',
    content: '……我明白了。',
    avatar: 'avatars/operator_neutral',
    next: 'block1_block_complete'
  },
  
  block1_response_silent: {
    id: 'block1_response_silent',
    speaker: '初始干员',
    content: '……',
    avatar: 'avatars/operator_neutral',
    next: 'block1_block_complete'
  },
  
  // 延迟对话
  block1_delayed_question: {
    id: 'block1_delayed_question',
    speaker: '初始干员',
    content: '上次那个残响……你真的没看到什么吗？',
    avatar: 'avatars/operator_hesitate',
    choices: [
      {
        id: 'delayed_share',
        text: '「其实我看到了一些东西……」',
        immediateEffect: {
          bondChange: { 'operator_01': 3 }
        }
      },
      {
        id: 'delayed_deny',
        text: '「没有，只是一些模糊的影像。」',
        immediateEffect: {
          bondChange: { 'operator_01': -2 }
        }
      }
    ]
  },
  
  block1_delayed_acceptance: {
    id: 'block1_delayed_acceptance',
    speaker: '初始干员',
    content: '你不爱说话。这没什么不好。我也不是话多的人。',
    avatar: 'avatars/operator_gentle',
    next: 'block1_delayed_end'
  },
  
  block1_delayed_end: {
    id: 'block1_delayed_end',
    speaker: '系统',
    content: '（干员似乎接受了你的沉默）'
  },
  
  // 区块完成
  block1_block_complete: {
    id: 'block1_block_complete',
    speaker: '系统',
    content: '**区块完成：灰烬哨站废墟**<br><br>你收集了第一个残响，与初始干员建立了初步的联系。拾烬者的基地现在是你的了。',
    next: 'block1_return_base'
  },
  
  block1_return_base: {
    id: 'block1_return_base',
    speaker: '系统',
    content: '回到基地后，你在识网终端上看到了拾烬者发来的消息：<br><br>**「欢迎加入拾烬者。你的探索才刚刚开始。」**'
  }
};

// ==================== 残响数据 ====================
export const block1Echoes: { [id: string]: EchoMemory } = {
  echo_01: {
    id: 'echo_01',
    title: '唤醒',
    content: '「……信号确认。双螺旋结构。从未见过的识网特征。」<br>「唤醒程序启动。准备接收。」<br>「等等——他的意识层位——不止一层。他在前轮文明的层位里也有痕迹。」<br>「这不可能。覆幕会清除一切。」<br><br>记忆中断。声音里有一种混合了敬畏和恐惧的情绪。',
    type: 'main',
    visualEffects: {
      blur: 0.3,
      saturation: 0.7,
      colorShift: '#2f5c76',
      textStyle: 'glitch'
    },
    audio: 'sfx/echo_whisper',
    unlockCondition: 'block:block_1',
    cgUnlock: 'cg_opening'
  }
};

// ==================== 区块配置 ====================
export const block1Config: StoryBlock = {
  id: 'block_1',
  name: '灰烬哨站废墟',
  day: 1,
  type: 'combat',
  prerequisites: [],
  dialogues: [
    'block1_opening',
    'block1_intro',
    'block1_wakeup',
    'block1_arrival',
    'block1_meet_operator',
    'block1_operator_explain',
    'block1_noise',
    'block1_operator_alert',
    'block1_combat_start',
    'block1_post_combat',
    'block1_echo_found'
  ],
  echoes: ['echo_01'],
  cgs: ['cg_opening'],
  choices: [
    'block1_echo_found',
    'block1_operator_question'
  ],
  unlockBlocks: ['block_2'],
  cleared: false
};

// ==================== 初始游戏进度 ====================
export const initialProgress = {
  currentDay: 1,
  currentYear: 873,
  pathScore: {
    submission: 0,
    resistance: 0,
    transcendence: 0
  },
  bonds: {
    'operator_01': 20  // 初始干员初始羁绊值
  },
  unlockedBlocks: ['block_1'],
  clearedBlocks: [],
  collectedEchoes: [],
  collectedCGs: [],
  memoryFragments: [],
  completedMemories: [],
  choiceHistory: {}
};