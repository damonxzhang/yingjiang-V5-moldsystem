/**
 * 全局 API 配置
 *
 * 切换部署环境方式：
 * - 测试环境（默认）：npm run dev 或 npm run build（读取 .env）
 * - 正式环境：npm run build:prod（读取 .env.production）
 */
const getApiBaseUrl = (): string => {
  // Vite 自动注入 .env 文件中的 VITE_ 前缀变量
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // 构建时注入的 process.env 后备
  if (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) {
    return process.env.VITE_API_BASE_URL;
  }

  // 默认回退到测试环境
  return 'http://212.64.29.230:8087';
};

export const API_BASE_URL = getApiBaseUrl();

/** 当前环境标识 */
export const IS_PRODUCTION = API_BASE_URL.includes('nxp.com');
export const ENV_LABEL = IS_PRODUCTION ? '正式环境' : '测试环境';
