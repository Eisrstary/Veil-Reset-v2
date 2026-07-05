# PAPS WASM 调用文档

## 文件

| 文件 | 大小 | 说明 |
|------|------|------|
| `personality_generator_bg.wasm` | 391 KB | WASM 核心 |
| `personality_generator.js` | 18 KB | JS 胶水代码 |
| `personality_generator.d.ts` | 1 KB | TypeScript 类型 |

## 快速开始

### Node.js

```javascript
const paps = require('./personality_generator.js');

// 1. 创建实例 + 全随机初始化
const wasm = new paps.PapsWasm();
wasm.init_random();

// 2. 获取三种格式
const aiMd = wasm.export_ai_md();       // AI 行为指令 Markdown
const humanMd = wasm.export_human_md(); // 人类可读 Markdown
const rawJson = wasm.export_raw_json(); // 原始 JSON

// 3. 释放
wasm.free();
```

### 浏览器

```html
<script type="module">
  import init, { PapsWasm } from './personality_generator.js';
  await init();

  const wasm = new PapsWasm();
  wasm.init_random();
  const aiMd = wasm.export_ai_md();
  document.getElementById('output').textContent = aiMd;
  wasm.free();
</script>
```

## API 参考

### 初始化

| 方法 | 说明 |
|------|------|
| `new PapsWasm()` | 创建实例 |
| `init_random()` | 全随机初始化（无滤镜，84参数全光谱随机） |
| `free()` | 释放 WASM 内存 |

### 倾向设置

```javascript
// 按倾向设置单个参数，返回实际生成的值
wasm.set_tendency('A008', 'very_high');  // → 0.92
wasm.set_tendency('B015', 'very_low');   // → 0.08
wasm.set_tendency('C031', 'negative');   // → -0.55 (bipolar)

// 精确设置
wasm.set_value('A008', 0.73);
```

### 倾向值

| 倾向 | Normalized 范围 | Bipolar 范围 |
|------|----------------|-------------|
| `very_low` | [0.0, 0.2] | — |
| `low` | [0.1, 0.4] | — |
| `medium` | [0.35, 0.65] | — |
| `high` | [0.6, 0.9] | — |
| `very_high` | [0.8, 1.0] | — |
| `any` | [0.0, 1.0] | [-1.0, 1.0] |
| `very_negative` | — | [-1.0, -0.6] |
| `negative` | — | [-0.7, -0.2] |
| `neutral` | — | [-0.3, 0.3] |
| `positive` | — | [0.2, 0.7] |
| `very_positive` | — | [0.6, 1.0] |

### 导出

| 方法 | 返回 | 说明 |
|------|------|------|
| `export_ai_md()` | String | AI 行为指令 Markdown（~1KB） |
| `export_human_md()` | String | 人类可读 Markdown（~10KB） |
| `export_raw_json()` | String | 原始 JSON（~22KB） |

### 查询

| 方法 | 返回 | 说明 |
|------|------|------|
| `parameter_count()` | Number | 参数总数（84） |
| `get_value(id)` | Number | 获取参数值 |
| `get_all_values_json()` | String | 所有参数值 JSON |
| `analyze_couplings_json()` | String | 耦合分析 JSON |
| `epsilon_value()` | Number | ε 值（默认 0.3） |
| `system_info_json()` | String | 系统信息 JSON |
| `version()` | String | 版本号 |

## 典型用法

### 生成指定倾向的角色

```javascript
const wasm = new paps.PapsWasm();
wasm.init_random(); // 先全随机打底

// 覆盖关键参数
wasm.set_tendency('A008', 'very_low');   // 低威胁感知 → 不偏执
wasm.set_tendency('A009', 'very_high');  // 高共情
wasm.set_tendency('B015', 'very_high');  // 强内疚
wasm.set_tendency('B019', 'very_low');   // 愤怒内敛
wasm.set_tendency('C036', 'very_low');   // 不说谎
wasm.set_tendency('D040', 'very_low');   // 低攻击

const prompt = wasm.export_ai_md(); // 直接塞 LLM system prompt
wasm.free();
```

### 批量生成

```javascript
function batchGenerate(n) {
  const results = [];
  for (let i = 0; i < n; i++) {
    const wasm = new paps.PapsWasm();
    wasm.init_random();
    results.push({
      ai: wasm.export_ai_md(),
      human: wasm.export_human_md(),
      raw: wasm.export_raw_json(),
    });
    wasm.free();
  }
  return results;
}

const profiles = batchGenerate(100);
```
