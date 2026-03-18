import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-4xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">出错了</h1>
            <p className="text-slate-500 mb-6">
              应用程序遇到了一个错误，请刷新页面重试
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
            >
              刷新页面
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-slate-400 cursor-pointer">
                  错误详情
                </summary>
                <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
