const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. 打开页面
    console.log('1. 打开登录页面...');
    await page.goto('http://127.0.0.1:5173', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log('   页面加载完成');
    await page.screenshot({ path: 'test-1-login.png', fullPage: true });
    console.log('   截图: test-1-login.png');
    
    // 2. 点击切换到注册模式
    console.log('2. 切换到注册模式...');
    await page.click('button:has-text("立即注册")');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test-2-register.png', fullPage: true });
    console.log('   截图: test-2-register.png');
    
    // 3. 填写注册信息 - 使用 placeholder 精确选择
    console.log('3. 填写注册信息...');
    await page.fill('input[placeholder="昵称"]', '测试用户');
    await page.fill('input[placeholder="邮箱地址"]', 'testuser@example.com');
    await page.fill('input[placeholder="密码"]', 'test123456');
    await page.fill('input[placeholder="确认密码"]', 'test123456');
    await page.check('input[type="checkbox"]');
    console.log('   信息填写完成');
    await page.screenshot({ path: 'test-3-filled.png', fullPage: true });
    
    // 4. 点击注册按钮
    console.log('4. 点击注册...');
    await page.click('button:has-text("注册")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-4-result.png', fullPage: true });
    
    // 5. 检查结果
    const content = await page.content();
    const errorText = await page.$eval('p.text-red-500', el => el.textContent()).catch(() => '');
    console.log('   错误提示:', errorText || '无');
    
    if (content.includes('验证') || content.includes('成功')) {
      console.log('✅ 注册可能成功，请检查邮箱验证');
    } else if (errorText) {
      console.log('❌ 注册失败:', errorText);
    } else {
      console.log('❌ 注册可能失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    await browser.close();
  }
})();
