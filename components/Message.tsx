/**
 * 全局 Message 信息提示组件
 *
 * 命令式 API，用法与 antd message 一致，可在任意位置（组件、事件回调、services 层）直接调用：
 *
 *   message.success('保存成功');
 *   message.error('保存失败');
 *   message.warning('请先选择机台');
 *   message.info('已忽略该项建议');
 *   const close = message.loading('提交中...');  // loading 默认不自动关闭，需手动 close()
 *
 *   message.success('保存成功', 3000);           // 自定义自动关闭时长（毫秒），0 表示不自动关闭
 *   message.destroy();                           // 关闭全部提示
 *
 * 实现方式：模块级消息队列 + useSyncExternalStore 订阅，<MessageContainer /> 在应用根部挂载一次即可。
 */
import React, { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';

/** 提示类型 */
export type MessageType = 'success' | 'error' | 'warning' | 'info' | 'loading';

/** 单条提示的数据结构 */
export interface MessageItem {
  /** 唯一标识 */
  key: string;
  /** 提示类型 */
  type: MessageType;
  /** 提示内容 */
  content: ReactNode;
  /** 自动关闭时长（毫秒），0 表示不自动关闭 */
  duration: number;
}

/** message.open 的配置参数 */
export interface MessageConfig {
  /** 提示类型 */
  type: MessageType;
  /** 提示内容 */
  content: ReactNode;
  /** 自动关闭时长（毫秒），0 表示不自动关闭，不传时取各类型默认值 */
  duration?: number;
}

/** 默认自动关闭时长（毫秒），与项目原有 Toast 的 2 秒保持一致 */
const DEFAULT_DURATION = 2000;
/** 同一时间最多展示条数，超出后最早的一条被顶掉（与 antd 默认行为一致） */
const MAX_COUNT = 5;

/** 模块级消息队列 */
let messageStore: MessageItem[] = [];
/** 订阅者集合 */
const listeners = new Set<() => void>();
/** 每条消息对应的自动关闭定时器 */
const timers = new Map<string, ReturnType<typeof setTimeout>>();
/** 自增序号，保证 key 唯一 */
let seed = 0;

/** 通知所有订阅者队列已变更 */
function emitChange(): void {
  listeners.forEach((listener) => listener());
}

/** 订阅队列变更（供 useSyncExternalStore 使用） */
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 获取当前队列快照（供 useSyncExternalStore 使用） */
function getSnapshot(): MessageItem[] {
  return messageStore;
}

/** 清除某条消息的定时器 */
function clearTimer(key: string): void {
  const timer = timers.get(key);
  if (timer) {
    clearTimeout(timer);
    timers.delete(key);
  }
}

/** 移除指定提示，不传 key 时清空全部 */
function remove(key: string): void {
  clearTimer(key);
  messageStore = messageStore.filter((item) => item.key !== key);
  emitChange();
}

/** 新增一条提示，返回手动关闭函数 */
function add(type: MessageType, content: ReactNode, duration: number): () => void {
  const key = `global-message-${Date.now()}-${seed++}`;
  const item: MessageItem = { key, type, content, duration };

  // 超出最大展示条数时，移除最早的一条
  if (messageStore.length >= MAX_COUNT) {
    const oldest = messageStore[0];
    clearTimer(oldest.key);
    messageStore = messageStore.slice(1);
  }

  messageStore = [...messageStore, item];
  emitChange();

  // duration > 0 时自动关闭；0 表示常驻（如 loading），由调用方手动关闭
  if (duration > 0) {
    const timer = setTimeout(() => remove(key), duration);
    timers.set(key, timer);
  }

  return () => remove(key);
}

/**
 * 全局消息提示 API，用法与 antd message 一致
 */
export const message = {
  /** 通用方法，通过 config 指定类型 */
  open(config: MessageConfig): () => void {
    const duration = config.duration ?? (config.type === 'loading' ? 0 : DEFAULT_DURATION);
    return add(config.type, config.content, duration);
  },
  /** 成功提示，默认 2 秒自动关闭 */
  success(content: ReactNode, duration: number = DEFAULT_DURATION): () => void {
    return add('success', content, duration);
  },
  /** 错误提示，默认 2 秒自动关闭 */
  error(content: ReactNode, duration: number = DEFAULT_DURATION): () => void {
    return add('error', content, duration);
  },
  /** 警告提示，默认 2 秒自动关闭 */
  warning(content: ReactNode, duration: number = DEFAULT_DURATION): () => void {
    return add('warning', content, duration);
  },
  /** 普通信息提示，默认 2 秒自动关闭 */
  info(content: ReactNode, duration: number = DEFAULT_DURATION): () => void {
    return add('info', content, duration);
  },
  /** 加载中提示，默认不自动关闭，需调用返回的关闭函数 */
  loading(content: ReactNode = '加载中...'): () => void {
    return add('loading', content, 0);
  },
  /** 关闭指定提示；不传 key 时关闭全部 */
  destroy(key?: string): void {
    if (key) {
      remove(key);
      return;
    }
    Array.from(timers.keys()).forEach(clearTimer);
    messageStore = [];
    emitChange();
  },
};

/** 各类型对应的样式与图标（Font Awesome），风格与项目原有 Toast 保持一致 */
const TYPE_STYLES: Record<MessageType, { wrapper: string; icon: string }> = {
  success: {
    wrapper: 'bg-emerald-500 text-white border-emerald-400',
    icon: 'fas fa-check-circle',
  },
  error: {
    wrapper: 'bg-red-500 text-white border-red-400',
    icon: 'fas fa-times-circle',
  },
  warning: {
    wrapper: 'bg-amber-500 text-white border-amber-400',
    icon: 'fas fa-exclamation-triangle',
  },
  info: {
    wrapper: 'bg-slate-800 text-white border-slate-700',
    icon: 'fas fa-info-circle',
  },
  loading: {
    wrapper: 'bg-slate-800 text-white border-slate-700',
    icon: 'fas fa-spinner fa-spin',
  },
};

/**
 * 全局提示渲染容器，在应用根部挂载一次。
 * 固定在视口顶部居中，多条提示垂直堆叠。
 */
export const MessageContainer: React.FC = () => {
  const items = useSyncExternalStore(subscribe, getSnapshot);

  return (
    <>
      <style>{`
        @keyframes global-message-slide-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .global-message-item {
          animation: global-message-slide-in 0.25s ease-out;
        }
      `}</style>
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2 w-full px-4 pointer-events-none">
        {items.map((item) => {
          const style = TYPE_STYLES[item.type];
          return (
            <div
              key={item.key}
              role="alert"
              className={`global-message-item pointer-events-auto max-w-[90vw] px-6 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 ${style.wrapper}`}
            >
              <i className={`${style.icon} text-base`}></i>
              <span className="text-sm font-bold whitespace-pre-wrap break-words">{item.content}</span>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default message;
