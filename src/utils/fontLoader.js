/**
 * 可靠的字体加载工具
 */

/**
 * 等待字体真正加载完成
 * @param {string} fontName - 字体名称
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} - 是否加载成功
 */
export async function waitForFont(fontName, timeout = 1000) {
    const startTime = Date.now();
    console.log(`开始等待字体: ${fontName}`);
    
    // 使用Font Loading API加载字体
    if (document.fonts && document.fonts.load) {
        try {
            // 加载字体
            await document.fonts.load(`20px "${fontName}"`);
            
            // 检查是否加载成功
            const loaded = document.fonts.check(`20px "${fontName}"`);
            console.log(`Font Loading API 检查结果: ${loaded}`);
            
            if (loaded) {
                return true;
            }
        } catch (error) {
            console.warn('Font Loading API 失败:', error);
        }
    }
    
    // 使用简化的像素检测作为备用
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 100;
    canvas.height = 50;
    
    // 测试文本
    const testText = '测';
    
    // 获取默认字体的宽度
    ctx.font = '30px sans-serif';
    const defaultWidth = ctx.measureText(testText).width;
    
    // 循环检查字体宽度变化
    while (Date.now() - startTime < timeout) {
        ctx.font = `30px "${fontName}", sans-serif`;
        const currentWidth = ctx.measureText(testText).width;
        
        // 如果宽度不同，说明字体已加载
        if (Math.abs(currentWidth - defaultWidth) > 0.01) {
            console.log(`字体宽度检测成功: ${defaultWidth} -> ${currentWidth}`);
            return true;
        }
        
        // 短暂等待
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.warn(`字体 ${fontName} 加载超时`);
    return false;
}

/**
 * 强制触发字体加载
 * @param {string} fontName - 字体名称
 */
export function forceFontLoad(fontName) {
    // 创建隐藏元素来触发字体加载
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = '-10000px';
    div.style.top = '-10000px';
    div.style.fontFamily = `"${fontName}", sans-serif`;
    div.style.fontSize = '50px';
    div.textContent = '测试Test字体123';
    
    document.body.appendChild(div);
    
    // 快速清理
    setTimeout(() => {
        if (div.parentNode) {
            div.parentNode.removeChild(div);
        }
    }, 200);
}

/**
 * 预加载字体列表
 * @param {Array<{name: string, url: string}>} fonts - 字体列表
 */
export async function preloadFonts(fonts) {
    const promises = fonts.map(async font => {
        if (!font.name) return false;
        
        try {
            // 先强制触发加载
            forceFontLoad(font.name);
            
            // 然后等待字体真正可用
            const loaded = await waitForFont(font.name, 3000);
            
            if (!loaded) {
                console.warn(`预加载字体 "${font.name}" 失败`);
            }
            
            return loaded;
        } catch (error) {
            console.error(`预加载字体 "${font.name}" 出错:`, error);
            return false;
        }
    });
    
    return Promise.all(promises);
}