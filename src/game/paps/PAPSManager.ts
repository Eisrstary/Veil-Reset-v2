/**
 * PAPS WASM 管理器
 * 负责加载和初始化PAPS WASM模块，提供人格生成服务
 */
import { PAPSProfile, PAPSParameters, PAPSTendency, KEY_PAPSPARAMETERS } from '../types/paps';

// 全局PAPS模块引用
let PapsWasmClass: any = null;
let isInitialized = false;

export class PAPSManager {
    private static instance: PAPSManager;
    
    /**
     * 获取单例实例
     */
    public static getInstance(): PAPSManager {
        if (!PAPSManager.instance) {
            PAPSManager.instance = new PAPSManager();
        }
        return PAPSManager.instance;
    }
    
    /**
     * 初始化PAPS WASM模块
     */
    public async initialize(): Promise<boolean> {
        if (isInitialized && PapsWasmClass) {
            console.log('✅ PAPS WASM 已初始化');
            return true;
        }
        
        try {
            console.log('🚀 正在初始化 PAPS WASM...');
            
            // 动态导入PAPS WASM模块
            const module = await import('../../../personality_generator.js');
            
            // 初始化WASM
            if (module.default) {
                await module.default();
            }
            
            PapsWasmClass = module.PapsWasm;
            
            if (!PapsWasmClass) {
                throw new Error('PapsWasm类未找到');
            }
            
            isInitialized = true;
            console.log('✅ PAPS WASM 初始化成功');
            
            // 测试版本信息
            const wasm = new PapsWasmClass();
            const version = wasm.version();
            const paramCount = wasm.parameter_count();
            wasm.free();
            
            console.log(`📦 PAPS 版本: ${version}, 参数数量: ${paramCount}`);
            
            return true;
            
        } catch (error) {
            console.error('❌ PAPS WASM 初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 检查是否已初始化
     */
    public isReady(): boolean {
        return isInitialized && PapsWasmClass !== null;
    }
    
    /**
     * 生成随机人格
     * @param seed 可选的种子值，影响随机生成
     */
    public generateRandomProfile(seed?: number): PAPSProfile {
        if (!this.isReady()) {
            throw new Error('PAPS WASM 未初始化');
        }
        
        const wasm = new PapsWasmClass();
        
        try {
            // 全随机初始化
            wasm.init_random();
            
            // 如果有种子，可以设置特定的倾向（示例）
            if (seed !== undefined) {
                // 使用种子影响特定的关键参数
                this.applySeedInfluence(wasm, seed);
            }
            
            const profile: PAPSProfile = {
                aiPrompt: wasm.export_ai_md(),
                humanReadable: wasm.export_human_md(),
                rawParameters: this.parseRawParameters(wasm.export_raw_json()),
                seed: seed,
                timestamp: Date.now()
            };
            
            return profile;
            
        } finally {
            wasm.free();
        }
    }
    
    /**
     * 生成具有特定倾向的人格
     * @param tendencies 倾向设置映射
     */
    public generateProfileWithTendencies(tendencies: Record<string, PAPSTendency>): PAPSProfile {
        if (!this.isReady()) {
            throw new Error('PAPS WASM 未初始化');
        }
        
        const wasm = new PapsWasmClass();
        
        try {
            // 先全随机初始化
            wasm.init_random();
            
            // 应用指定的倾向
            for (const [paramId, tendency] of Object.entries(tendencies)) {
                try {
                    wasm.set_tendency(paramId, tendency);
                } catch (error) {
                    console.warn(`设置参数 ${paramId} 倾向 ${tendency} 失败:`, error);
                }
            }
            
            const profile: PAPSProfile = {
                aiPrompt: wasm.export_ai_md(),
                humanReadable: wasm.export_human_md(),
                rawParameters: this.parseRawParameters(wasm.export_raw_json()),
                timestamp: Date.now()
            };
            
            return profile;
            
        } finally {
            wasm.free();
        }
    }
    
    /**
     * 生成特定职业倾向的人格
     * @param profession 职业类型
     */
    public generateProfileForProfession(profession: string): PAPSProfile {
        const tendencies: Record<string, PAPSTendency> = {};
        
        // 根据职业设置不同的倾向
        switch (profession) {
            case 'guard': // 近卫
                tendencies[KEY_PAPSPARAMETERS.THREAT_PERCEPTION] = 'high';
                tendencies[KEY_PAPSPARAMETERS.AGGRESSION] = 'medium';
                tendencies[KEY_PAPSPARAMETERS.TRUST] = 'medium';
                break;
                
            case 'sniper': // 狙击
                tendencies[KEY_PAPSPARAMETERS.THREAT_PERCEPTION] = 'very_high';
                tendencies[KEY_PAPSPARAMETERS.EMPATHY] = 'low';
                tendencies[KEY_PAPSPARAMETERS.AVOIDANCE] = 'medium';
                break;
                
            case 'defender': // 重装
                tendencies[KEY_PAPSPARAMETERS.EMPATHY] = 'high';
                tendencies[KEY_PAPSPARAMETERS.GUILT] = 'high';
                tendencies[KEY_PAPSPARAMETERS.TRUST] = 'high';
                break;
                
            case 'medic': // 医疗
                tendencies[KEY_PAPSPARAMETERS.EMPATHY] = 'very_high';
                tendencies[KEY_PAPSPARAMETERS.MEANING_SEEKING] = 'high';
                tendencies[KEY_PAPSPARAMETERS.GUILT] = 'very_high';
                break;
                
            default:
                // 使用随机倾向
                break;
        }
        
        return this.generateProfileWithTendencies(tendencies);
    }
    
    /**
     * 批量生成人格
     * @param count 生成数量
     */
    public generateBatchProfiles(count: number): PAPSProfile[] {
        const profiles: PAPSProfile[] = [];
        
        for (let i = 0; i < count; i++) {
            const seed = Math.floor(Math.random() * 1000000);
            profiles.push(this.generateRandomProfile(seed));
        }
        
        return profiles;
    }
    
    /**
     * 获取参数信息
     */
    public getParameterInfo(wasm: any): {
        count: number;
        allIds: string[];
        allValues: Record<string, number>;
    } {
        if (!this.isReady()) {
            throw new Error('PAPS WASM 未初始化');
        }
        
        const instance = wasm || new PapsWasmClass();
        
        try {
            const count = instance.parameter_count();
            const idsJson = instance.all_parameter_ids_json();
            const valuesJson = instance.get_all_values_json();
            
            return {
                count,
                allIds: JSON.parse(idsJson),
                allValues: JSON.parse(valuesJson)
            };
        } finally {
            if (!wasm) {
                instance.free();
            }
        }
    }
    
    /**
     * 解析原始JSON参数
     */
    private parseRawParameters(jsonString: string): PAPSParameters {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error('解析PAPS参数失败:', error);
            return {};
        }
    }
    
    /**
     * 应用种子影响
     */
    private applySeedInfluence(wasm: any, seed: number): void {
        // 使用种子影响特定的参数
        const seedStr = seed.toString();
        let seedHash = 0;
        
        // 简单哈希计算
        for (let i = 0; i < seedStr.length; i++) {
            seedHash = ((seedHash << 5) - seedHash) + seedStr.charCodeAt(i);
            seedHash |= 0;
        }
        
        // 影响关键参数
        const keyParams = Object.values(KEY_PAPSPARAMETERS);
        const targetParam = keyParams[Math.abs(seedHash) % keyParams.length];
        
        // 根据种子决定倾向
        const tendencies: PAPSTendency[] = ['very_low', 'low', 'medium', 'high', 'very_high'];
        const tendency = tendencies[Math.abs(seedHash) % tendencies.length];
        
        try {
            wasm.set_tendency(targetParam, tendency);
        } catch (error) {
            console.warn(`应用种子影响失败:`, error);
        }
    }
    
    /**
     * 获取系统信息
     */
    public getSystemInfo(): any {
        if (!this.isReady()) {
            throw new Error('PAPS WASM 未初始化');
        }
        
        const wasm = new PapsWasmClass();
        
        try {
            const infoJson = wasm.system_info_json();
            return JSON.parse(infoJson);
        } finally {
            wasm.free();
        }
    }
}

// 导出单例实例
export const papsManager = PAPSManager.getInstance();