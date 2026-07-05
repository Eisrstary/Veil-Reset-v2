/* tslint:disable */
/* eslint-disable */

export class PapsWasm {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * 获取所有参数ID（JSON）
     */
    all_parameter_ids_json(): string;
    /**
     * 分析耦合效应（JSON）
     */
    analyze_couplings_json(): string;
    /**
     * 获取ε值
     */
    epsilon_value(): number;
    /**
     * 导出 AI Markdown（行为指令化）
     */
    export_ai_md(): string;
    /**
     * 导出人类 Markdown
     */
    export_human_md(): string;
    /**
     * 导出原始 JSON
     */
    export_raw_json(): string;
    /**
     * 获取所有参数值（JSON）
     */
    get_all_values_json(): string;
    /**
     * 获取参数值
     */
    get_value(param_id: string): number;
    /**
     * 全随机初始化（无滤镜）
     */
    init_random(): void;
    constructor();
    /**
     * 获取参数总数
     */
    parameter_count(): number;
    /**
     * 设置 panic hook（调试用）
     */
    static setPanicHook(): void;
    /**
     * 按倾向设置参数
     */
    set_tendency(param_id: string, tendency: string): number;
    /**
     * 设置参数值
     */
    set_value(param_id: string, value: number): boolean;
    /**
     * 获取系统信息（JSON）
     */
    system_info_json(): string;
    /**
     * 获取版本号
     */
    version(): string;
}
