import CryptoJS from 'crypto-js';
import { Role, LoginRequest, LoginResponse, AuthData } from '../types';

// Local Storage 键名
const AUTH_STORAGE_KEY = 'smartmold_auth';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

// 加密密钥（生产环境应该从环境变量获取）
const ENCRYPTION_KEY = 'SmartMoldPro2024SecureKey!@#';

// 登录有效期：30天（单位：毫秒）
const LOGIN_EXPIRES_DAYS = 30;
const LOGIN_EXPIRES_MS = LOGIN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

/**
 * 使用 AES 加密数据
 * @param data 要加密的数据对象
 * @returns 加密后的字符串
 */
function encryptData(data: AuthData): string {
  const jsonString = JSON.stringify(data);
  const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.toString();
}

/**
 * 使用 AES 解密数据
 * @param encryptedText 加密的字符串
 * @returns 解密后的数据对象，失败返回 null
 */
function decryptData(encryptedText: string): AuthData | null {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY, {
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    if (!jsonString) {
      return null;
    }
    return JSON.parse(jsonString) as AuthData;
  } catch (error) {
    console.error('Failed to decrypt auth data:', error);
    return null;
  }
}

/**
 * 实际登录API调用 (暂时使用固定返回值，后期联调接口)
 */
async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  // TODO: 后期联调接口时取消注释以下代码
  const response = await fetch(`${API_BASE_URL}/api/admin/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_name: credentials.username,
      password: credentials.password
    })
  });
  
  const data = await response.json();
  
  if (data.code !== 200) {
    throw data;
  }
  
  return data;

  // 临时固定返回值，模拟登录成功
  // return {
  //   code: 200,
  //   message: 'success',
  //   data: {
  //     token: 'mock_token_' + Date.now(),
  //     user_id: '4',
  //     user_name: '系统管理员',
  //     role: 'SUPER_ADMIN',
  //     permissions: ['DASHBOARD_VIEW', 'MACHINE_CONFIG', 'MOLD_MANAGEMENT', 'REPORT_EXPORT']
  //   }
  // };
}

/**
 * 认证服务
 */
export const AuthService = {
  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await loginApi(credentials);
      
      // 登录成功，存储认证数据
      if (response.code === 200) {
        const authData: AuthData = {
          ...response.data,
          loginTime: new Date().toISOString(),
          expiresAt: Date.now() + LOGIN_EXPIRES_MS
        };
        this.saveAuth(authData);
      }
      
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * 用户登出
   */
  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * 保存认证数据到本地存储（加密存储）
   */
  saveAuth(authData: AuthData): void {
    try {
      const encrypted = encryptData(authData);
      localStorage.setItem(AUTH_STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  },

  /**
   * 从本地存储获取认证数据（解密获取）
   */
  getStoredAuth(): AuthData | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        return null;
      }
      
      const authData = decryptData(stored);
      
      if (!authData) {
        console.warn('Failed to decrypt auth data');
        this.logout();
        return null;
      }
      
      // 验证数据完整性
      if (!authData.token || !authData.user_id || !authData.role) {
        console.warn('Invalid auth data in storage');
        this.logout();
        return null;
      }
      
      // 检查登录是否过期
      if (authData.expiresAt && Date.now() > authData.expiresAt) {
        console.warn('Login session has expired');
        this.logout();
        return null;
      }
      
      return authData;
    } catch (error) {
      console.error('Failed to parse auth data:', error);
      this.logout();
      return null;
    }
  },

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return this.getStoredAuth() !== null;
  }
};
