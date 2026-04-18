import React, { useState, useRef, useEffect } from 'react';
import { AuthService } from '../../services/authService';
import { AuthData } from '../../types';

interface LoginPageProps {
  onLoginSuccess: (userData: AuthData) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const usernameInputRef = useRef<HTMLInputElement>(null);

  // 组件挂载时自动聚焦到用户名输入框
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

  /**
   * 验证表单输入
   * 检查用户名和密码是否为空或仅包含空白字符
   */
  const validateForm = (): string | null => {
    // 检查用户名
    if (!username || username.trim() === '') {
      return '请输入用户名';
    }

    // 检查密码
    if (!password || password.trim() === '') {
      return '请输入密码';
    }

    return null;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 清除之前的错误
    setError(null);

    // 验证表单
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // 开始登录
    setIsLoading(true);

    try {
      const response = await AuthService.login({
        username: username.trim(),
        password: password.trim()
      });

      // 登录成功
      if (response.code === 200) {
        onLoginSuccess(response.data);
      } else {
        setError(response.message || '登录失败，请重试');
      }
    } catch (err: any) {
      // 处理错误
      if (err.code === 401) {
        setError(err.message || '用户名或密码错误');
        // 清空密码输入框
        setPassword('');
      } else {
        setError('网络连接失败，请检查网络后重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理键盘事件 - 支持 Enter 键提交
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  /**
   * 处理访客登录 - 快速进入看板
   */
  const handleGuestLogin = (dept: 'big' | 'small') => {
    const deptName = dept === 'big' ? '大材料' : '小材料';
    const role = dept === 'big' ? 'MOLD_ENGINEER_BIG' : 'MOLD_ENGINEER_SMALL';

    const guestAuth: AuthData = {
      token: 'guest_token',
      user_id: 'GUEST',
      user_name: `访客 ${deptName}`,
      email: '',
      role: role,
      department: deptName,
      permissions: []
    };

    // 调用登录成功回调，进入看板
    onLoginSuccess(guestAuth);
  };

  return (
    <div className="h-screen bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-white p-5 rounded-3xl shadow-2xl w-full max-w-md max-h-[95vh] overflow-y-auto">
        {/* Logo 和品牌标识 */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <i className="fas fa-microchip text-2xl"></i>
          </div>
          <h1 className="text-lg font-bold text-slate-800">SmartMold Pro</h1>
          <p className="text-xs text-slate-500">欢迎使用模具管理系统</p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 用户名输入框 */}
          <div>
            <label htmlFor="username" className="block text-xs font-medium text-slate-700 mb-1">
              用户名
            </label>
            <input
              ref={usernameInputRef}
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="请输入用户名"
              disabled={isLoading}
              autoComplete="username"
              aria-label="用户名"
              aria-required="true"
            />
          </div>

          {/* 密码输入框 */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-slate-700 mb-1">
              密码
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              placeholder="请输入密码"
              disabled={isLoading}
              autoComplete="current-password"
              aria-label="密码"
              aria-required="true"
            />
          </div>

          {/* 错误消息显示 */}
          {error && (
            <div 
              className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs"
              role="alert"
              aria-live="polite"
            >
              <i className="fas fa-exclamation-circle mr-1"></i>
              {error}
            </div>
          )}

          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                登录中...
              </span>
            ) : (
              '登录系统'
            )}
          </button>
          {/* 快速访问链接 (访客模式) */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center mb-3 uppercase tracking-widest font-bold">快速看板访问 (无需登录)</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleGuestLogin('big')}
                className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-xl transition-all border border-slate-100 hover:border-indigo-100 group"
              >
                <i className="fas fa-cube text-xs opacity-50 group-hover:opacity-100"></i>
                <span className="text-[11px] font-bold">大材料看板</span>
              </button>
              <button
                type="button"
                onClick={() => handleGuestLogin('small')}
                className="flex items-center justify-center gap-2 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition-all border border-slate-100 hover:border-blue-100 group"
              >
                <i className="fas fa-cube text-xs opacity-50 group-hover:opacity-100"></i>
                <span className="text-[11px] font-bold">小材料看板</span>
              </button>
            </div>
          </div>
        </form>

        {/* 测试账号提示 */}
        <div className="mt-3 pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-400 text-center mb-1.5">测试账号</p>
          <div className="text-xs text-slate-500 leading-relaxed">
            <p>• 张英江 / 123456</p>
            <p>• 史健 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
