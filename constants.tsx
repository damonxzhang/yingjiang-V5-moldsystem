
import React from 'react';

export const STATUS_COLORS = {
  IDLE: 'bg-blue-100 text-blue-700 border-blue-200',
  IN_USE: 'bg-green-100 text-green-700 border-green-200',
  MAINTENANCE: 'bg-amber-100 text-amber-700 border-amber-200',
  REPAIR: 'bg-red-100 text-red-700 border-red-200',
  PENDING_BUYOFF: 'bg-purple-100 text-purple-700 border-purple-200',
  SCRAPPED: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const STATUS_LABELS: Record<string, string> = {
  IDLE: '闲置',
  IN_USE: '使用中',
  MAINTENANCE: '保养中',
  REPAIR: '维修中',
  PENDING_BUYOFF: '待BUYOFF',
  SCRAPPED: '已报废',
};

export const BUYOFF_COLORS = {
  NOT_INITIATED: 'bg-slate-100 text-slate-500',
  PROCESSING: 'bg-blue-100 text-blue-600 animate-pulse',
  PASS: 'bg-green-100 text-green-700',
  FAIL: 'bg-red-100 text-red-700',
  EXCEPTION: 'bg-amber-100 text-amber-700',
};

export const BUYOFF_LABELS: Record<string, string> = {
  NOT_INITIATED: '未发起',
  PROCESSING: '处理中',
  PASS: '通过',
  FAIL: '不通过',
  EXCEPTION: '异常',
};

// 图片中的预定义维修内容
export const REPAIR_CONTENTS = [
  "更新E-PIN",
  "更换上模右cavitybar",
  "更换上模左cavitybar",
  "更换cull bar",
  "更换上模resin stopper",
  "更换上模pillior",
  "更换上模碟形弹簧",
  "更换下模右cavitybar",
  "更换下模左cavitybar",
  "更换pot bar",
  "更换下模resin stopper",
  "更换下模pillior",
  "更换下模碟形弹簧",
  "更换右spacer",
  "更换左spacer",
  "更换上模右insert block",
  "更换上模左insert block",
  "更换pot&plunger",
  "更换Transfer 弹簧",
  "调整模具平整度",
  "压模试验",
  "模具Alignment",
  "更换排气镶块",
  "更换排气镶条"
];

// 图片中的预定义保养内容
export const MAINTENANCE_CONTENTS = [
  "模具化学清洁",
  "模具物理清洁",
  "模具深度清洁",
  "更换pot&plunger",
  "更换plunger密封圈",
  "更换模具密封圈"
];
