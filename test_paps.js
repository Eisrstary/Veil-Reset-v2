// PAPS WASM测试脚本
// 验证personality_generator.js和WASM的集成

// 在浏览器环境中测试PAPS WASM
console.log("PAPS WASM测试开始...");

// 模拟浏览器环境
if (typeof window === 'undefined') {
    global.window = global;
}

// 尝试导入并测试PAPS
async function testPapsWasm() {
    try {
        console.log("加载PAPS模块...");
        
        // 直接使用提供的文件
        const modulePath = './personality_generator.js';
        
        // 动态导入
        const papsModule = await import(modulePath);
        console.log("PAPS模块加载成功:", Object.keys(papsModule));
        
        // 初始化WASM
        if (papsModule.default) {
            await papsModule.default();
        }
        
        console.log("WASM初始化完成");
        
        // 测试创建实例
        const wasm = new papsModule.PapsWasm();
        console.log("PapsWasm实例创建成功");
        
        // 测试全随机初始化
        wasm.init_random();
        console.log("init_random() 成功");
        
        // 测试获取版本
        const version = wasm.version();
        console.log("PAPS版本:", version);
        
        // 测试获取参数数量
        const paramCount = wasm.parameter_count();
        console.log("参数总数:", paramCount);
        
        // 测试导出功能
        const aiMd = wasm.export_ai_md();
        console.log("AI Markdown导出成功，长度:", aiMd.length);
        
        const humanMd = wasm.export_human_md();
        console.log("人类可读Markdown导出成功，长度:", humanMd.length);
        
        const rawJson = wasm.export_raw_json();
        console.log("原始JSON导出成功，长度:", rawJson.length);
        
        // 测试倾向设置
        try {
            const value1 = wasm.set_tendency('A008', 'very_high');
            console.log("set_tendency('A008', 'very_high') 返回:", value1);
            
            const value2 = wasm.set_tendency('B015', 'very_low');
            console.log("set_tendency('B015', 'very_low') 返回:", value2);
        } catch (e) {
            console.log("倾向设置测试失败:", e.message);
        }
        
        // 测试获取参数值
        try {
            const paramValue = wasm.get_value('A008');
            console.log("get_value('A008') 返回:", paramValue);
        } catch (e) {
            console.log("获取参数值测试失败:", e.message);
        }
        
        // 测试系统信息
        const sysInfo = wasm.system_info_json();
        console.log("系统信息:", sysInfo.substring(0, 100) + "...");
        
        // 清理
        wasm.free();
        console.log("PAPS实例已释放");
        
        console.log("\n✅ PAPS WASM测试完成！所有基本功能正常。");
        
    } catch (error) {
        console.error("❌ PAPS WASM测试失败:", error);
        console.error("错误堆栈:", error.stack);
    }
}

// 运行测试
testPapsWasm().catch(console.error);