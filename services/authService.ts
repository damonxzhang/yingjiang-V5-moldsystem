import { Role, LoginRequest, LoginResponse, AuthData } from '../types';

// Session Storage 键名
const AUTH_STORAGE_KEY = 'smartmold_auth';

// Mock 用户数据
const MOCK_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    data: {
      userid: 'ADM001',
      username: '系统管理员',
      role: Role.Admin,
      department: '管理部门'
    }
  },
  {
    username: 'engineer_big',
    password: 'eng123',
    data: {
      userid: 'ENG001',
      username: '大材料工程师',
      role: Role.MoldEngineerBig,
      department: '大材料'
    }
  },
  {
    username: 'engineer_small',
    password: 'eng123',
    data: {
      userid: 'ENG002',
      username: '小材料工程师',
      role: Role.MoldEngineerSmall,
      department: '小材料'
    }
  },
  {
    username: 'leader',
    password: 'lead123',
    data: {
      userid: 'LEAD001',
      username: '带班长',
      role: Role.ShiftLeader,
      department: '生产部门'
    }
  },
  {
    username: 'operator',
    password: 'op123',
    data: {
      userid: 'OP001',
      username: '操作员',
      role: Role.Operator,
      department: '生产部门'
    }
  }
];

/**
 * Mock 登录函数
 * 模拟网络延迟和后端验证
 */
function mockLogin(username: string, password: string): Promise<LoginResponse> {
  return new Promise((resolve, reject) => {
    // 模拟网络延迟 800ms
    setTimeout(() => {
      const user = MOCK_USERS.find(
        u => u.username === username && u.password === password
      );
      
      if (user) {
        resolve({
          code: 200,
          message: 'success',
          data: {
            token: 'mock_token_' + user.data.userid + '_' + Date.now(),
            ...user.data
          }
        });
      } else {
        reject({
          code: 401,
          message: '用户名或密码错误'
        });
      }
    }, 800);
  });
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
      const response = await mockLogin(credentials.username, credentials.password);
      
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
      if (!authData.token || !authData.userid || !authData.role) {
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
