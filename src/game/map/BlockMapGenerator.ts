// ============================================================
// 区块地图生成器 — BSP房间 / 开放区域 / 废墟
// ============================================================

import { BlockTile, TileType, BlockMapData, SpawnPoint, BlockConfig, TileVariant } from '../data/BlockTypes';

/** 简易LCG随机数生成器(可复现) */
class LCG {
    private state: number;
    constructor(seed: number) { this.state = seed; }
    next(): number {
        this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
        return this.state / 0x7fffffff;
    }
    /** 返回 [min, max) 区间的整数 */
    rangeInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min)) + min;
    }
    /** 返回 [min, max) 区间的浮点数 */
    range(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }
    /** 以概率 p 返回 true */
    chance(p: number): boolean { return this.next() < p; }
    /** 从数组中随机选一个 */
    pick<T>(arr: T[]): T { return arr[this.rangeInt(0, arr.length)]; }
}

/** BSP 树节点 */
interface BSPNode {
    x: number; y: number; w: number; h: number;
    left?: BSPNode; right?: BSPNode;
    room?: { rx: number; ry: number; rw: number; rh: number };
}

// ============================================================
// 主生成器
// ============================================================
export class BlockMapGenerator {

    /** 根据区块配置生成完整战术地图 */
    static generate(config: BlockConfig, seed: number): BlockMapData {
        const rng = new LCG(seed);
        let tiles: BlockTile[][];
        let spawns: SpawnPoint[];

        switch (config.generationType) {
            case 'rooms':
                ({ tiles, spawns } = this.bspRooms(rng, config));
                break;
            case 'open_field':
                ({ tiles, spawns } = this.openField(rng, config));
                break;
            case 'ruins':
                ({ tiles, spawns } = this.ruins(rng, config));
                break;
            default:
                ({ tiles, spawns } = this.openField(rng, config));
        }

        // 后处理：确保 deploy 区全是平地
        for (const sp of spawns) {
            if (sp.type === 'player_deploy') {
                tiles[sp.y][sp.x] = makeTile(TileType.FLOOR, rng);
            }
        }

        return {
            width: config.mapWidth,
            height: config.mapHeight,
            tiles,
            spawns,
            blockId: config.id,
            blockName: config.name,
            seed,
        };
    }

    // ============================================================
    // 算法一：BSP 房间 + 走廊
    // ============================================================
    private static bspRooms(rng: LCG, cfg: BlockConfig): { tiles: BlockTile[][]; spawns: SpawnPoint[] } {
        const { mapWidth: W, mapHeight: H } = cfg;
        const tiles = fillGrid(W, H, TileType.WALL, rng);

        const root: BSPNode = { x: 0, y: 0, w: W, h: H };
        this.splitBSP(rng, root, 4 + cfg.tier);

        // 收集房间
        const rooms: Array<{ rx: number; ry: number; rw: number; rh: number }> = [];
        this.collectRooms(root, rooms);

        // 雕刻房间
        for (const r of rooms) {
            fillRoom(tiles, r, TileType.FLOOR, rng);
        }

        // 连接相邻房间（遍历BSP兄弟节点）
        this.connectSiblings(rng, tiles, root);

        // 生成点
        const spawns: SpawnPoint[] = [];
        this.placeSpawns(rng, cfg, rooms, tiles, W, H, spawns);

        return { tiles, spawns };
    }

    private static splitBSP(rng: LCG, node: BSPNode, depth: number): void {
        if (depth <= 0) return;

        // 最小房间尺寸
        const minRoom = 5;
        const minSplit = minRoom * 2 + 1;

        const canSplitH = node.w >= minSplit;
        const canSplitV = node.h >= minSplit;
        if (!canSplitH && !canSplitV) return;

        // 随机决定横切还是竖切
        const splitH = canSplitH && (!canSplitV || rng.chance(0.5));
        // 调整比例:倾向于让宽的方向切
        const actualSplitH = splitH || !canSplitV;

        if (actualSplitH) {
            const split = rng.rangeInt(minRoom, node.w - minRoom);
            node.left = { x: node.x, y: node.y, w: split, h: node.h };
            node.right = { x: node.x + split, y: node.y, w: node.w - split, h: node.h };
        } else {
            const split = rng.rangeInt(minRoom, node.h - minRoom);
            node.left = { x: node.x, y: node.y, w: node.w, h: split };
            node.right = { x: node.x, y: node.y + split, w: node.w, h: node.h - split };
        }

        this.splitBSP(rng, node.left, depth - 1);
        this.splitBSP(rng, node.right, depth - 1);
    }

    /** 为叶子节点生成房间 */
    private static collectRooms(node: BSPNode, rooms: Array<{ rx: number; ry: number; rw: number; rh: number }>): void {
        if (node.left || node.right) {
            if (node.left) this.collectRooms(node.left, rooms);
            if (node.right) this.collectRooms(node.right, rooms);
            return;
        }
        // 叶子节点:在区域内生成一个带边距的房间
        const margin = 1;
        const rw = Math.max(4, node.w - margin * 2);
        const rh = Math.max(4, node.h - margin * 2);
        const rx = node.x + margin;
        const ry = node.y + margin;
        node.room = { rx, ry, rw, rh };
        rooms.push(node.room!);
    }

    /** 连接兄弟节点的房间 */
    private static connectSiblings(rng: LCG, tiles: BlockTile[][], node: BSPNode): void {
        if (!node.left || !node.right) return;

        this.connectSiblings(rng, tiles, node.left);
        this.connectSiblings(rng, tiles, node.right);

        // 获取两个子节点各自的某个房间
        const roomA = pickLeafRoom(node.left);
        const roomB = pickLeafRoom(node.right);
        if (!roomA || !roomB) return;

        // 连接两个房间中心点（L形走廊）
        const ax = Math.floor(roomA.rx + roomA.rw / 2);
        const ay = Math.floor(roomA.ry + roomA.rh / 2);
        const bx = Math.floor(roomB.rx + roomB.rw / 2);
        const by = Math.floor(roomB.ry + roomB.rh / 2);

        this.carveCorridor(tiles, ax, ay, bx, by, rng);
    }

    /** L形走廊雕刻 */
    private static carveCorridor(tiles: BlockTile[][], x1: number, y1: number, x2: number, y2: number, rng: LCG): void {
        const W = tiles[0].length, H = tiles.length;
        if (rng.chance(0.5)) {
            carveH(tiles, x1, x2, y1, W);
            carveV(tiles, y1, y2, x2, H);
        } else {
            carveV(tiles, y1, y2, x1, H);
            carveH(tiles, x1, x2, y2, W);
        }
    }

    // ============================================================
    // 算法二：开放区域（野外战场）
    // ============================================================
    private static openField(rng: LCG, cfg: BlockConfig): { tiles: BlockTile[][]; spawns: SpawnPoint[] } {
        const W = cfg.mapWidth, H = cfg.mapHeight;
        const tiles = fillGrid(W, H, TileType.FLOOR, rng);

        // 散布障碍物和掩体
        const obstacleDensity = 0.06 + cfg.tier * 0.02;
        const coverDensity = 0.04 + cfg.tier * 0.02;
        const waterDensity = 0.02;

        // 用简单噪声生成团块感的障碍
        const noiseMap = simpleNoise(W, H, rng);

        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const n = noiseMap[y][x];
                if (n > 0.88 - cfg.tier * 0.02) {
                    tiles[y][x] = makeTile(TileType.OBSTACLE, rng);
                } else if (n > 0.84 && rng.chance(coverDensity)) {
                    tiles[y][x] = makeTile(TileType.COVER, rng);
                } else if (n < 0.06 && rng.chance(waterDensity)) {
                    tiles[y][x] = makeTile(TileType.WATER, rng);
                }
            }
        }

        // 边界围墙（可选）
        const borderChance = 0.5;
        if (rng.chance(borderChance)) {
            for (let x = 0; x < W; x++) { tiles[0][x] = makeTile(TileType.WALL, rng); tiles[H - 1][x] = makeTile(TileType.WALL, rng); }
            for (let y = 0; y < H; y++) { tiles[y][0] = makeTile(TileType.WALL, rng); tiles[y][W - 1] = makeTile(TileType.WALL, rng); }
        }

        // 部署区清理
        const deployMargin = 2;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < deployMargin; x++) {
                tiles[y][x] = makeTile(TileType.FLOOR, rng);
            }
        }

        const spawns = this.placeOpenFieldSpawns(rng, cfg, tiles, W, H);
        return { tiles, spawns };
    }

    // ============================================================
    // 算法三：废墟（半开放+断墙+残骸）
    // ============================================================
    private static ruins(rng: LCG, cfg: BlockConfig): { tiles: BlockTile[][]; spawns: SpawnPoint[] } {
        const W = cfg.mapWidth, H = cfg.mapHeight;
        const tiles = fillGrid(W, H, TileType.FLOOR, rng);

        // 放置断墙片段
        const wallSegments = Math.floor(W * H * (0.04 + cfg.tier * 0.01));
        for (let i = 0; i < wallSegments; i++) {
            const x = rng.rangeInt(0, W);
            const y = rng.rangeInt(0, H);
            const len = rng.rangeInt(2, 5);
            const dx = rng.pick([1, 0]);
            const dy = dx === 1 ? 0 : 1;

            for (let j = 0; j < len; j++) {
                const wx = x + j * dx, wy = y + j * dy;
                if (wx >= 0 && wx < W && wy >= 0 && wy < H && tiles[wy][wx].type === TileType.FLOOR) {
                    tiles[wy][wx] = makeTile(rng.chance(0.6) ? TileType.WALL : TileType.COVER, rng);
                }
            }
        }

        // 散落障碍物
        const obstacleCount = Math.floor(W * H * 0.03);
        for (let i = 0; i < obstacleCount; i++) {
            const x = rng.rangeInt(1, W - 1);
            const y = rng.rangeInt(1, H - 1);
            if (tiles[y][x].type === TileType.FLOOR) {
                tiles[y][x] = makeTile(TileType.OBSTACLE, rng);
            }
        }

        // 危险区域（识能泄漏）
        if (cfg.tier >= 2) {
            const hazardCount = rng.rangeInt(2, 5);
            for (let i = 0; i < hazardCount; i++) {
                const cx = rng.rangeInt(3, W - 3);
                const cy = rng.rangeInt(3, H - 3);
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const px = cx + dx, py = cy + dy;
                        if (px >= 0 && px < W && py >= 0 && py < H && tiles[py][px].type === TileType.FLOOR) {
                            tiles[py][px] = makeTile(TileType.HAZARD, rng);
                        }
                    }
                }
            }
        }

        const spawns = this.placeOpenFieldSpawns(rng, cfg, tiles, W, H);
        return { tiles, spawns };
    }

    // ============================================================
    // 生成点放置
    // ============================================================
    private static placeSpawns(
        rng: LCG, cfg: BlockConfig,
        rooms: Array<{ rx: number; ry: number; rw: number; rh: number }>,
        tiles: BlockTile[][], W: number, H: number,
        spawns: SpawnPoint[],
    ): void {
        if (rooms.length < 2) {
            // 退化为开放区域生成
            spawns.push(...this.placeOpenFieldSpawns(rng, cfg, tiles, W, H));
            return;
        }

        // 玩家部署区 = 最左边的房间
        const deployRoom = [...rooms].sort((a, b) => a.rx - b.rx)[0];
        const deployCount = Math.min(3, deployRoom.rw);
        for (let i = 0; i < deployCount; i++) {
            const dx = deployRoom.rx + i + Math.floor((deployRoom.rw - deployCount) / 2);
            const dy = Math.floor(deployRoom.ry + deployRoom.rh / 2);
            if (dx < W && dy < H) spawns.push({ x: dx, y: dy, type: 'player_deploy' });
        }

        // 敌人放在其他房间
        const enemyRooms = rooms.filter(r => r !== deployRoom);
        const enemyCount = 1 + cfg.tier * 2 + (cfg.type === 'combat' ? 2 : 0);
        for (let i = 0; i < enemyCount && i < enemyRooms.length; i++) {
            const room = enemyRooms[i % enemyRooms.length];
            const ex = Math.floor(room.rx + room.rw / 2);
            const ey = Math.floor(room.ry + room.rh / 2);
            if (ex < W && ey < H) spawns.push({ x: ex, y: ey, type: 'enemy', data: { tier: cfg.tier } });
        }

        // 残响碎片（探索/故事区块额外放置）
        if (cfg.type === 'explore' || cfg.type === 'story') {
            const echoRooms = rng.chance(0.5)
                ? enemyRooms.filter(() => rng.chance(0.4))
                : enemyRooms;
            const echoCount = Math.min(3, echoRooms.length);
            const picked = shuffle(rng, [...echoRooms]).slice(0, echoCount);
            for (const room of picked) {
                const ex = Math.floor(room.rx + rng.rangeInt(1, room.rw - 1));
                const ey = Math.floor(room.ry + rng.rangeInt(1, room.rh - 1));
                spawns.push({ x: ex, y: ey, type: 'echo_fragment', data: { echoId: `echo_${cfg.id}_${spawns.length}` } });
            }
        }
    }

    private static placeOpenFieldSpawns(rng: LCG, cfg: BlockConfig, tiles: BlockTile[][], W: number, H: number): SpawnPoint[] {
        const spawns: SpawnPoint[] = [];

        // 玩家部署: 地图左侧 2-3列
        const deployCount = Math.min(3, Math.floor(H / 4));
        for (let i = 0; i < deployCount; i++) {
            const dy = Math.floor(H / (deployCount + 1)) * (i + 1);
            let dx = 1;
            // 确保可通行
            while (dx < 3 && dx < W && !isWalkable(tiles[dy][dx])) dx++;
            if (dx < W) spawns.push({ x: dx, y: dy, type: 'player_deploy' });
        }

        // 敌人: 地图右侧 40%-90% 范围
        const enemyCount = 1 + cfg.tier * 2 + (cfg.type === 'combat' ? 2 : 0);
        for (let i = 0; i < enemyCount; i++) {
            let ex: number, ey: number, tries = 0;
            do {
                ex = rng.rangeInt(Math.floor(W * 0.4), Math.floor(W * 0.9));
                ey = rng.rangeInt(1, H - 1);
                tries++;
            } while (tries < 20 && !isWalkable(tiles[ey][ex]));
            if (isWalkable(tiles[ey][ex])) {
                spawns.push({ x: ex, y: ey, type: 'enemy', data: { tier: cfg.tier } });
            }
        }

        // 残响碎片
        if (cfg.type === 'explore' || cfg.type === 'story') {
            const echoCount = rng.rangeInt(1, 4);
            for (let i = 0; i < echoCount; i++) {
                let ex: number, ey: number, tries = 0;
                do {
                    ex = rng.rangeInt(2, W - 2);
                    ey = rng.rangeInt(2, H - 2);
                    tries++;
                } while (tries < 30 && !isWalkable(tiles[ey][ex]));
                if (isWalkable(tiles[ey][ex])) {
                    spawns.push({ x: ex, y: ey, type: 'echo_fragment', data: { echoId: `echo_${cfg.id}_${i}` } });
                }
            }
        }

        return spawns;
    }
}

// ============================================================
// 工具函数
// ============================================================

function fillGrid(W: number, H: number, type: TileType, rng: LCG): BlockTile[][] {
    const grid: BlockTile[][] = [];
    for (let y = 0; y < H; y++) {
        grid[y] = [];
        for (let x = 0; x < W; x++) {
            grid[y][x] = makeTile(type, rng);
        }
    }
    return grid;
}

function makeTile(type: TileType, rng: LCG): BlockTile {
    const variant = rng.rangeInt(0, 4) as TileVariant;
    return { type, variant, height: 0 };
}

function fillRoom(tiles: BlockTile[][], room: { rx: number; ry: number; rw: number; rh: number }, type: TileType, rng: LCG): void {
    for (let y = room.ry; y < room.ry + room.rh; y++) {
        for (let x = room.rx; x < room.rx + room.rw; x++) {
            if (y >= 0 && y < tiles.length && x >= 0 && x < tiles[0].length) {
                tiles[y][x] = makeTile(type, rng);
            }
        }
    }
}

function pickLeafRoom(node: BSPNode): { rx: number; ry: number; rw: number; rh: number } | null {
    if (!node.left && !node.right) return node.room ?? null;
    const child = node.left && node.right
        ? (node.left?.room ? node.left : node.right) // 优先有房间的
        : (node.left ?? node.right);
    return child ? pickLeafRoom(child) : null;
}

function carveH(tiles: BlockTile[][], x1: number, x2: number, y: number, W: number): void {
    const [sx, ex] = x1 < x2 ? [x1, x2] : [x2, x1];
    for (let x = sx; x <= ex && x < W; x++) {
        if (y >= 0 && y < tiles.length) {
            tiles[y][x] = { type: TileType.FLOOR, variant: 0, height: 0 };
        }
    }
}

function carveV(tiles: BlockTile[][], y1: number, y2: number, x: number, H: number): void {
    const [sy, ey] = y1 < y2 ? [y1, y2] : [y2, y1];
    for (let y = sy; y <= ey && y < H; y++) {
        if (x >= 0 && x < tiles[0].length) {
            tiles[y][x] = { type: TileType.FLOOR, variant: 0, height: 0 };
        }
    }
}

function isWalkable(tile: BlockTile): boolean {
    return tile.type === TileType.FLOOR || tile.type === TileType.COVER || tile.type === TileType.DOOR;
}

/** 简单噪声 (值域采样 + 平滑) */
function simpleNoise(W: number, H: number, rng: LCG): number[][] {
    // 稀疏采样点
    const sampleW = Math.max(3, Math.floor(W / 8));
    const sampleH = Math.max(3, Math.floor(H / 8));
    const samples: number[][] = [];
    for (let y = 0; y < sampleH; y++) {
        samples[y] = [];
        for (let x = 0; x < sampleW; x++) {
            samples[y][x] = rng.next();
        }
    }
    // 双线性插值到全尺寸
    const noise: number[][] = [];
    for (let y = 0; y < H; y++) {
        noise[y] = [];
        for (let x = 0; x < W; x++) {
            const sx = (x / W) * (sampleW - 1);
            const sy = (y / H) * (sampleH - 1);
            const ix = Math.floor(sx), iy = Math.floor(sy);
            const fx = sx - ix, fy = sy - iy;
            const nx = Math.min(ix + 1, sampleW - 1), ny = Math.min(iy + 1, sampleH - 1);
            noise[y][x] =
                samples[iy][ix] * (1 - fx) * (1 - fy) +
                samples[iy][nx] * fx * (1 - fy) +
                samples[ny][ix] * (1 - fx) * fy +
                samples[ny][nx] * fx * fy;
        }
    }
    return noise;
}

function shuffle<T>(rng: LCG, arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = rng.rangeInt(0, i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
