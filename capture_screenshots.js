
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = './screenshots';

const PAGES = [
  { name: '01_设备生产看板', id: 'machine_screen' },
  { name: '02_仪表盘', id: 'dashboard' },
  { name: '03_模具监控大屏', id: 'tooling_screen' },
  { name: '04_可生产产品LIST', id: 'production_list' },
  { name: '05_实时Shot数监控', id: 'shot_monitor' },
  { name: '06_模具台账_大材料', id: 'molds_big' },
  { name: '07_模具台账_小材料', id: 'molds_small' },
  { name: '08_Audit清单', id: 'molds_audit' },
  { name: '09_备件管理_大材料', id: 'spares_big' },
  { name: '10_备件管理_小材料', id: 'spares_small' },
  { name: '11_备件购买预测', id: 'prediction' },
  { name: '12_模具配件绑定', id: 'binding' },
  { name: '13_保养任务中心', id: 'maintenance_confirm' },
  { name: '14_维修任务中心', id: 'repair_confirm' },
  { name: '15_保养执行记录', id: 'maintenance_logs' },
  { name: '16_维修执行记录', id: 'repair_logs' },
  { name: '17_保养选项管理', id: 'maintenance_option_manage' },
  { name: '18_维修选项管理', id: 'repair_option_manage' },
  { name: '19_角色权限管理', id: 'role_manage' },
  { name: '20_用户账号管理', id: 'user_manage' }
];

async function capture() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  console.log('正在启动浏览器...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log(`正在访问 ${BASE_URL}...`);
  try {
    await page.goto(BASE_URL);
    // 等待页面加载完成，特别是侧边栏
    await page.waitForSelector('nav', { timeout: 10000 });
  } catch (e) {
    console.error('无法连接到开发服务器，请确保 npm run dev 正在运行！');
    await browser.close();
    return;
  }

  for (const item of PAGES) {
    console.log(`正在截图: ${item.name}...`);
    
    // 点击侧边栏对应的菜单项
    // 这里假设侧边栏项有对应的 data-testid 或可以通过文本匹配
    const menuHandle = page.getByText(new RegExp(item.name.split('_')[1], 'i'));
    if (await menuHandle.count() > 0) {
      await menuHandle.first().click();
      // 等待内容渲染完成
      await page.waitForTimeout(1000); 
      
      const fileName = `${item.name}.png`;
      await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: false });
    } else {
      console.warn(`未找到菜单项: ${item.name}`);
    }
  }

  console.log('所有截图已完成，保存在 screenshots 文件夹中。');
  await browser.close();
}

capture().catch(console.error);
