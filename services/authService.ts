import { Role, LoginRequest, LoginResponse, AuthData } from '../types';

// Session Storage 键名
const AUTH_STORAGE_KEY = 'smartmold_auth';

// API 基础URL
const API_BASE_URL = 'http://212.64.29.230:8087';

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
  
  if (!response.ok) {
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
          loginTime: new Date().toISOString()
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
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /**
   * 保存认证数据到会话存储
   */
  saveAuth(authData: AuthData): void {
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  },

  /**
   * 从会话存储获取认证数据
   */
  getStoredAuth(): AuthData | null {
    try {
      const stored = sessionStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) {
        return null;
      }
      
      const authData = JSON.parse(stored) as AuthData;
      
      // 验证数据完整性
      if (!authData.token || !authData.user_id || !authData.role) {
        console.warn('Invalid auth data in storage');
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
