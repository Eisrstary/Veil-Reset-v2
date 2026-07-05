import { HomeScene } from './scenes/HomeScene';
import { Game as GameScene } from './scenes/Game';
import { PAPSTestScene } from './scenes/PAPSTestScene';
import { AUTO, Game, Scale, Types, WEBGL } from 'phaser';

/* ================================================================
   《覆幕重启》Veil Reset - 游戏引擎配置
   核心优化:
   - roundPixels + 1920x1080 基底分辨率 → Canvas内清晰
   - WEBGL优先 → 更好的纹理过滤
   - CSS处理所有文字 → 浏览器原生字体抗锯齿
   ================================================================ */

const config: Types.Core.GameConfig = {
    type: WEBGL,
    width: 1920,
    height: 1080,
    parent: 'phaser-canvas',
    backgroundColor: '#07070f',
    roundPixels: true,
    antialias: true,
    antialiasGL: true,
    scale: {
        mode: Scale.FIT,
        autoCenter: Scale.CENTER_BOTH,
    },
    scene: [HomeScene, GameScene, PAPSTestScene],
};

const StartGame = (parent: string) => {
    return new Game({ ...config, parent });
};

export default StartGame;