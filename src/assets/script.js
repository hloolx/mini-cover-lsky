import { defaultConfig } from '../config';
import { reactive } from 'vue';
import { waitForFont, forceFontLoad } from '../utils/fontLoader';

const loadedImages = new Map();
export const state = reactive({
    bgImageUrl: null,
    squareImageUrl: null,
    bgType: 'color', // 'color' | 'gradient' | 'image'
    bgColor: '#ffffff',
    bgGradientStart: '#3b82f6',
    bgGradientEnd: '#8b5cf6',
    bgGradientDirection: 'to-bottom-right', // 渐变方向（保留兼容）
    bgGradientAngle: 135, // 渐变角度（度数）
    textColor: '#eeeeee',
    watermarkColor: '#dddddd',
    iconColor: '#eeeeee',
    rotation: 0,
    shadowColor: '#646464',
    shadowBlur: 120,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    shadowStrength: 60,
    watermark: defaultConfig.watermark,
    textSize: 200,
    lineHeight: 1,
    text3D: 0,
    squareSize: 300,
    text: defaultConfig.text,
    bgBlur: 3,
    iconBgSize: 0,
    selectedFont: defaultConfig.fontFamily || '',  // 确保默认值为空字符串
    isFontMenuOpen: false,
    hasMultipleLines: false,
    isFontLoading: false,  // 字体加载状态
    fontLoadHint: '',  // 字体加载提示
    // 导出配置
    exportFormat: 'webp',
    exportQuality: 0.95,
    exportWidth: 1920,
    exportHeight: 1080,
    exportPlatform: 'custom',
    showExportDialog: false
});

export let canvas = null;
export let ctx = null;

const createCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d') };
};

// 创建内部canvas时使用导出尺寸
export let bgCanvas, bgCtx, textCanvas, textCtx, watermarkCanvas, watermarkCtx, squareCanvas, squareCtx;

// 初始化内部canvas
function initInternalCanvases() {
    const width = state.exportWidth || 1920;
    const height = state.exportHeight || 1080;
    
    ({ canvas: bgCanvas, ctx: bgCtx } = createCanvas(width, height));
    ({ canvas: textCanvas, ctx: textCtx } = createCanvas(width, height));
    ({ canvas: watermarkCanvas, ctx: watermarkCtx } = createCanvas(width, height));
    ({ canvas: squareCanvas, ctx: squareCtx } = createCanvas(width, height));
}

// 初始调用
initInternalCanvases();

// 当导出尺寸改变时重新初始化canvas
export function updateCanvasSize(width, height) {
    state.exportWidth = width;
    state.exportHeight = height;
    
    // 重新创建内部canvas
    initInternalCanvases();
    
    // 更新主预览canvas尺寸
    if (canvas) {
        canvas.width = width;
        canvas.height = height;
    }
    
    // 重新绘制所有内容
    drawBackground();
    drawText();
    drawSquareImage();
    drawWatermark();
    composeCanvases();
}

export async function updatePreview(type, event) {
    const updateFunctions = {
        bg: updateBackgroundImage,
        bgColor: updateBackgroundColor,
        bgGradientStart: updateBackgroundGradientStart,
        bgGradientEnd: updateBackgroundGradientEnd,
        bgGradientAngle: updateBackgroundGradientAngle,
        textColor: updateTextColor,
        watermarkColor: updateWatermarkColor,
        square: updateSquareImage,
        rotation: updateRotation,
        text: updateText,
        watermark: updateWatermark,
        textSize: updateTextSize,
        squareSize: updateSquareSize,
        bgBlur: updateBgBlur,
        iconColor: updateIconColor,
        iconBgSize: updateIconBgSize,
        font: updateFont,
        lineHeight: () => { drawText(); composeCanvases(); },
        text3D: updateText3D,
        shadowColor: updateShadowColor,
        shadowStrength: updateShadowStrength
    };
    
    const updateFunction = updateFunctions[type];
    if (updateFunction) {
        // 如果是异步函数（比如updateFont），等待它完成
        await updateFunction(event);
    }
}

export function updateText3D(event) {
    state.text3D = event.target.value;
    drawText();
    composeCanvases();
}

// 当前正在加载的字体
let currentLoadingFont = null;

export async function updateFont(event) {
    const fontName = event.target.value;
    console.log('开始更新字体:', fontName);
    
    // 记录当前正在加载的字体
    currentLoadingFont = fontName;
    
    // 先立即更新状态，这样下面的drawText会使用新字体
    state.selectedFont = fontName;
    state.fontLoadHint = ''; // 清除提示
    
    // 如果是默认字体（空字符串），直接绘制
    if (!fontName || fontName === '') {
        state.isFontLoading = false;
        drawText();
        drawWatermark();
        composeCanvases();
        return;
    }
    
    // 设置加载状态
    state.isFontLoading = true;
    
    try {
        // 强制触发字体加载
        forceFontLoad(fontName);
        
        // 检查字体是否已经可用（快速检查）
        let fontReady = false;
        
        // 先快速检查字体是否已经加载
        if (document.fonts && document.fonts.check) {
            fontReady = document.fonts.check(`20px "${fontName}"`);
        }
        
        // 如果还没加载，等待加载
        if (!fontReady) {
            console.log('字体未加载，开始等待...');
            fontReady = await waitForFont(fontName, 1000);
        } else {
            console.log('字体已加载');
        }
        
        // 检查是否还是当前需要加载的字体
        if (currentLoadingFont !== fontName) {
            console.log('字体已切换，取消当前加载');
            return;
        }
        
        if (!fontReady) {
            console.warn(`字体 "${fontName}" 加载失败`);
            state.fontLoadHint = '⚠️ 字体加载可能需要时间，如未生效请重新选择';
        }
        
    } catch (error) {
        console.error('字体加载出错:', error);
        state.fontLoadHint = '⚠️ 字体加载失败，请检查网络后重新选择';
    } finally {
        // 只有当前字体仍然是需要的字体时才更新
        if (currentLoadingFont === fontName) {
            state.isFontLoading = false;
            
            // 强制重绘多次确保更新
            console.log('开始重绘Canvas');
            
            // 第一次立即重绘
            drawText();
            drawWatermark();
            composeCanvases();
            
            // 使用setTimeout确保浏览器渲染
            setTimeout(() => {
                if (state.selectedFont === fontName) {
                    drawText();
                    drawWatermark();
                    composeCanvases();
                }
            }, 50);
            
            // 再次使用requestAnimationFrame
            requestAnimationFrame(() => {
                if (state.selectedFont === fontName) {
                    drawText();
                    drawWatermark();
                    composeCanvases();
                }
            });
        }
    }
}

// 强制重绘所有Canvas内容
function forceRedraw() {
    // 清空并重绘所有层
    drawBackground();
    drawSquareImage();
    drawText();
    drawWatermark();
    // 使用requestAnimationFrame确保在下一帧合成
    requestAnimationFrame(() => {
        composeCanvases();
    });
}

export function updateBackgroundImage(event) {
    const bgImage = event.target.files[0];
    if (bgImage) {
        loadImage(bgImage, (url) => {
            state.bgImageUrl = url;
            drawBackground();
        });
    }
}

export function updateBackgroundColor(event) {
    state.bgColor = event.target.value;
    state.bgImageUrl = null;
    state.bgType = 'color';
    drawBackground();
}

export function updateBackgroundGradientStart(event) {
    state.bgGradientStart = event.target.value;
    state.bgImageUrl = null;
    state.bgType = 'gradient';
    drawBackground();
    composeCanvases();
}

export function updateBackgroundGradientEnd(event) {
    state.bgGradientEnd = event.target.value;
    state.bgImageUrl = null;
    state.bgType = 'gradient';
    drawBackground();
    composeCanvases();
}

export function updateBackgroundGradientDirection(direction) {
    state.bgGradientDirection = direction;
    state.bgImageUrl = null;
    state.bgType = 'gradient';
    drawBackground();
    composeCanvases();
}

export function updateBackgroundGradientAngle(angle) {
    state.bgGradientAngle = angle;
    state.bgImageUrl = null;
    state.bgType = 'gradient';
    drawBackground();
    composeCanvases();
}

export function updateTextColor(event) {
    state.textColor = event.target.value;
    drawText();
    composeCanvases();
}

export function updateWatermarkColor(event) {
    state.watermarkColor = event.target.value;
    drawWatermark();
    composeCanvases();
}

export function updateSquareImage(event) {
    const squareImage = event.target.files[0];
    if (squareImage) {
        loadImage(squareImage, (url) => {
            state.squareImageUrl = url;
            drawSquareImage();
        });
    }
}

export function updateRotation(event) {
    state.rotation = event.target.value;
    drawSquareImage();
}

export function updateText(event) {
    state.text = event.target.value || defaultConfig.text;
    state.hasMultipleLines = state.text.includes('\n');
    drawText();
    composeCanvases();
}

export function updateWatermark(event) {
    state.watermark = event.target.value;
    drawWatermark();
    composeCanvases();
}

export function updateTextSize(event) {
    state.textSize = event.target.value;
    drawText();
    composeCanvases();
}

export function updateSquareSize(event) {
    state.squareSize = event.target.value;
    drawSquareImage();
}

export function updateBgBlur(event) {
    state.bgBlur = event.target.value;
    drawBackground();
}

export function updateIconColor(event) {
    state.iconColor = event.target.value;
    drawSquareImage();
}

export function updateIconBgSize(event) {
    state.iconBgSize = Number(event.target.value);
    drawSquareImage();
}

export function updateShadowColor(event) {
    state.shadowColor = event.target.value;
    drawSquareImage();
}

export function updateShadowStrength(event) {
    const strength = state.shadowStrength;
    state.shadowBlur = strength * 2;
    state.shadowOffsetX = 0;
    state.shadowOffsetY = 0;
    drawSquareImage();
}

function loadImage(file, callback) {
    if (!loadedImages.has(file)) {
        const reader = new FileReader();
        reader.onload = (e) => {
            loadedImages.set(file, e.target.result);
            callback(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        callback(loadedImages.get(file));
    }
}

// 获取渐变方向的坐标（支持角度）
function getGradientCoords(angleOrDirection, width, height) {
    // 如果是数字，作为角度处理
    if (typeof angleOrDirection === 'number') {
        const angle = angleOrDirection;
        // CSS渐变角度定义:
        // 0° = 向上 (从下到上), 90° = 向右 (从左到右)
        // 180° = 向下 (从上到下), 270° = 向左 (从右到左)
        
        // 转换为弧度，注意CSS角度从垂直向上开始
        const radians = (angle) * Math.PI / 180;
        
        // 计算渐变线的方向向量
        // sin给出x分量，-cos给出y分量（因为y轴向下）
        const dx = Math.sin(radians);
        const dy = -Math.cos(radians);
        
        // 计算中心点
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 计算渐变线需要延伸的长度（确保覆盖整个矩形）
        const diagonal = Math.sqrt(width * width + height * height) / 2;
        
        // 计算起点和终点
        const x0 = centerX - diagonal * dx;
        const y0 = centerY - diagonal * dy;
        const x1 = centerX + diagonal * dx;
        const y1 = centerY + diagonal * dy;
        
        return { x0, y0, x1, y1 };
    }
    
    // 兼容旧的方向字符串
    switch(angleOrDirection) {
        case 'to-right':
            return { x0: 0, y0: 0, x1: width, y1: 0 };
        case 'to-left':
            return { x0: width, y0: 0, x1: 0, y1: 0 };
        case 'to-bottom':
            return { x0: 0, y0: 0, x1: 0, y1: height };
        case 'to-top':
            return { x0: 0, y0: height, x1: 0, y1: 0 };
        case 'to-bottom-right':
            return { x0: 0, y0: 0, x1: width, y1: height };
        case 'to-bottom-left':
            return { x0: width, y0: 0, x1: 0, y1: height };
        case 'to-top-right':
            return { x0: 0, y0: height, x1: width, y1: 0 };
        case 'to-top-left':
            return { x0: width, y0: height, x1: 0, y1: 0 };
        default:
            return { x0: 0, y0: 0, x1: width, y1: height };
    }
}

export function drawBackground() {
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    if (state.bgImageUrl) {
        const img = new Image();
        img.onload = () => {
            const scaleX = bgCanvas.width / img.width;
            const scaleY = bgCanvas.height / img.height;
            const scale = Math.max(scaleX, scaleY);
            const width = img.width * scale;
            const height = img.height * scale;
            const x = (bgCanvas.width - width) / 2;
            const y = (bgCanvas.height - height) / 2;

            bgCtx.filter = `blur(${state.bgBlur}px)`;
            bgCtx.drawImage(img, x, y, width, height);
            composeCanvases();
        };
        img.src = state.bgImageUrl;
    } else if (state.bgType === 'gradient') {
        // 绘制渐变背景（优先使用角度）
        const coords = getGradientCoords(state.bgGradientAngle, bgCanvas.width, bgCanvas.height);
        const gradient = bgCtx.createLinearGradient(coords.x0, coords.y0, coords.x1, coords.y1);
        gradient.addColorStop(0, state.bgGradientStart);
        gradient.addColorStop(1, state.bgGradientEnd);
        bgCtx.fillStyle = gradient;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        composeCanvases();
    } else {
        // 纯色背景
        bgCtx.fillStyle = state.bgColor;
        bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
        composeCanvases();
    }
}

export function drawSquareImage() {
    squareCtx.clearRect(0, 0, squareCanvas.width, squareCanvas.height);
    if (state.squareImageUrl) {
        const squareImg = new Image();
        squareImg.onload = () => {
            // 根据画布尺寸调整图标大小
            const scaleRatio = Math.min(squareCanvas.width / 1920, squareCanvas.height / 1080);
            const totalSize = state.squareSize * scaleRatio;
            const borderWidth = 20 * scaleRatio;
            const size = totalSize - 2 * borderWidth;
            const x = (squareCanvas.width - totalSize) / 2;
            const y = (squareCanvas.height - totalSize) / 2;
            const radius = 30 * scaleRatio;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = totalSize;
            tempCanvas.height = totalSize;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制背景
            if (state.iconBgSize > 0) {
                const bgPadding = state.iconBgSize * scaleRatio;
                tempCtx.fillStyle = state.iconColor;
                tempCtx.beginPath();
                tempCtx.moveTo(radius + borderWidth - bgPadding, borderWidth - bgPadding);
                tempCtx.arcTo(
                    totalSize - borderWidth + bgPadding, 
                    borderWidth - bgPadding, 
                    totalSize - borderWidth + bgPadding, 
                    radius + borderWidth - bgPadding, 
                    radius
                );
                tempCtx.arcTo(
                    totalSize - borderWidth + bgPadding, 
                    totalSize - borderWidth + bgPadding, 
                    totalSize - radius - borderWidth + bgPadding, 
                    totalSize - borderWidth + bgPadding, 
                    radius
                );
                tempCtx.arcTo(
                    borderWidth - bgPadding, 
                    totalSize - borderWidth + bgPadding, 
                    borderWidth - bgPadding, 
                    totalSize - radius - borderWidth + bgPadding, 
                    radius
                );
                tempCtx.arcTo(
                    borderWidth - bgPadding, 
                    borderWidth - bgPadding, 
                    radius + borderWidth - bgPadding, 
                    borderWidth - bgPadding, 
                    radius
                );
                tempCtx.closePath();
                tempCtx.fill();
            }

            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.moveTo(radius + borderWidth, borderWidth);
            tempCtx.arcTo(totalSize - borderWidth, borderWidth, totalSize - borderWidth, radius + borderWidth, radius);
            tempCtx.arcTo(totalSize - borderWidth, totalSize - borderWidth, totalSize - radius - borderWidth, totalSize - borderWidth, radius);
            tempCtx.arcTo(borderWidth, totalSize - borderWidth, borderWidth, totalSize - radius - borderWidth, radius);
            tempCtx.arcTo(borderWidth, borderWidth, radius + borderWidth, borderWidth, radius);
            tempCtx.closePath();
            tempCtx.clip();

            // 计算图像的缩放比例
            const imgAspectRatio = squareImg.width / squareImg.height;
            const containerAspectRatio = size / size; // 因为容器是正方形，所以宽高比为1

            let scaledWidth, scaledHeight;
            if (imgAspectRatio > containerAspectRatio) {
                // 图像比容器宽，按宽度缩放
                scaledWidth = size;
                scaledHeight = size / imgAspectRatio;
            } else {
                // 图像比容器高，按高度缩放
                scaledWidth = size * imgAspectRatio;
                scaledHeight = size;
            }

            // 计算图像在容器中的偏移量，使其居中
            const offsetX = (size - scaledWidth) / 2;
            const offsetY = (size - scaledHeight) / 2;

            tempCtx.drawImage(squareImg, borderWidth + offsetX, borderWidth + offsetY, scaledWidth, scaledHeight);
            tempCtx.restore();

            squareCtx.save();
            squareCtx.shadowColor = state.shadowColor;
            squareCtx.shadowBlur = state.shadowBlur;
            squareCtx.shadowOffsetX = state.shadowOffsetX;
            squareCtx.shadowOffsetY = state.shadowOffsetY;

            squareCtx.translate(x + totalSize / 2, y + totalSize / 2);
            squareCtx.rotate(state.rotation * Math.PI / 180);
            squareCtx.translate(-(x + totalSize / 2), -(y + totalSize / 2));

            squareCtx.drawImage(tempCanvas, x, y, totalSize, totalSize);
            squareCtx.restore();

            composeCanvases();
        };
        squareImg.src = state.squareImageUrl;
    } else {
        composeCanvases();
    }
}

function getHtmlFontStyles() {
    const htmlElement = document.documentElement;
    const computedStyle = getComputedStyle(htmlElement);
    const fontFamily = computedStyle.fontFamily;
    return { fontFamily };
}

export function drawText() {
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    const { fontFamily } = getHtmlFontStyles();
    // 处理字体选择：如果没有选择或选择了默认，使用系统字体
    let font;
    if (state.selectedFont && state.selectedFont !== 'default') {
        // 如果字体名包含空格或特殊字符，添加引号
        const needsQuotes = state.selectedFont.includes(' ') || state.selectedFont.includes('-');
        font = needsQuotes 
            ? `"${state.selectedFont}", ${fontFamily}`
            : `${state.selectedFont}, ${fontFamily}`;
    } else {
        font = fontFamily;
    }
    
    // 根据画布尺寸自动调整字体大小
    const baseFontSize = state.textSize;
    const scaleRatio = Math.min(textCanvas.width / 1920, textCanvas.height / 1080);
    const fontSize = baseFontSize * scaleRatio;
    
    textCtx.font = `600 ${fontSize}px ${font}`;
    textCtx.fillStyle = state.textColor;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';

    if (state.text3D > 0) {
        const scaleRatio = Math.min(textCanvas.width / 1920, textCanvas.height / 1080);
        textCtx.shadowColor = 'rgba(0, 0, 0, .4)';
        textCtx.shadowBlur = state.text3D * 0.5 * scaleRatio;
        textCtx.shadowOffsetX = state.text3D * scaleRatio;
        textCtx.shadowOffsetY = state.text3D * scaleRatio;
    } else {
        textCtx.shadowColor = 'transparent';
        textCtx.shadowBlur = 0;
        textCtx.shadowOffsetX = 0;
        textCtx.shadowOffsetY = 0;
    }

    // 处理多行文本（根据画布尺寸缩放）
    const lines = state.text.split('\n');
    const lineHeight = fontSize * state.lineHeight;
    const totalHeight = lineHeight * lines.length;
    const startY = (textCanvas.height - totalHeight) / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
        const y = startY + index * lineHeight;
        textCtx.fillText(line, textCanvas.width / 2, y);
    });

    // 不在这里调用composeCanvases，让调用者决定何时合成
    // composeCanvases();
}

export function drawWatermark() {
    watermarkCtx.clearRect(0, 0, watermarkCanvas.width, watermarkCanvas.height);
    const { fontFamily } = getHtmlFontStyles();
    // 处理字体选择：如果没有选择或选择了默认，使用系统字体
    let font;
    if (state.selectedFont && state.selectedFont !== 'default') {
        // 如果字体名富含空格或特殊字符，添加引号
        const needsQuotes = state.selectedFont.includes(' ') || state.selectedFont.includes('-');
        font = needsQuotes 
            ? `"${state.selectedFont}", ${fontFamily}`
            : `${state.selectedFont}, ${fontFamily}`;
    } else {
        font = fontFamily;
    }
    
    // 根据画布尺寸调整水印字体大小
    const scaleRatio = Math.min(watermarkCanvas.width / 1920, watermarkCanvas.height / 1080);
    const fontSize = 14 * scaleRatio;
    const padding = 20 * scaleRatio;
    
    watermarkCtx.font = `italic ${fontSize}px ${font}`;
    watermarkCtx.fillStyle = state.watermarkColor;
    watermarkCtx.textAlign = 'right';
    watermarkCtx.fillText(state.watermark, watermarkCanvas.width - padding, watermarkCanvas.height - padding);
    // 不在这里调用composeCanvases，让调用者决定何时合成
    // composeCanvases();
}

export function composeCanvases() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bgCanvas, 0, 0);
        ctx.drawImage(textCanvas, 0, 0);
        ctx.drawImage(squareCanvas, 0, 0);
        ctx.drawImage(watermarkCanvas, 0, 0);
    }
}

// 用于导出的重绘函数
export function drawBackgroundForExport(targetCanvas, targetCtx, scaleFactor) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);

    if (state.bgImageUrl) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const scaleX = targetCanvas.width / img.width;
                const scaleY = targetCanvas.height / img.height;
                const scale = Math.max(scaleX, scaleY);
                const width = img.width * scale;
                const height = img.height * scale;
                const x = (targetCanvas.width - width) / 2;
                const y = (targetCanvas.height - height) / 2;

                targetCtx.filter = `blur(${state.bgBlur * scaleFactor}px)`;
                targetCtx.drawImage(img, x, y, width, height);
                targetCtx.filter = 'none';
                resolve();
            };
            img.src = state.bgImageUrl;
        });
    } else if (state.bgType === 'gradient') {
        const coords = getGradientCoords(state.bgGradientAngle, targetCanvas.width, targetCanvas.height);
        const gradient = targetCtx.createLinearGradient(coords.x0, coords.y0, coords.x1, coords.y1);
        gradient.addColorStop(0, state.bgGradientStart);
        gradient.addColorStop(1, state.bgGradientEnd);
        targetCtx.fillStyle = gradient;
        targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        return Promise.resolve();
    } else {
        targetCtx.fillStyle = state.bgColor;
        targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
        return Promise.resolve();
    }
}

export function drawTextForExport(targetCanvas, targetCtx, scaleFactor) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    
    const lines = state.text.split('\n');
    const fontSize = state.textSize * scaleFactor;
    const lineHeight = state.lineHeight;
    
    const { fontFamily } = getHtmlFontStyles();
    let font;
    if (state.selectedFont && state.selectedFont !== 'default') {
        const needsQuotes = state.selectedFont.includes(' ') || state.selectedFont.includes('-');
        font = needsQuotes ? `"${state.selectedFont}", ${fontFamily}` : `${state.selectedFont}, ${fontFamily}`;
    } else {
        font = fontFamily;
    }
    
    targetCtx.font = `600 ${fontSize}px ${font}`;
    targetCtx.fillStyle = state.textColor;
    targetCtx.textAlign = 'center';
    targetCtx.textBaseline = 'middle';
    
    // 立体字效果
    if (state.text3D > 0) {
        targetCtx.shadowColor = 'rgba(0, 0, 0, .4)';
        targetCtx.shadowBlur = state.text3D * scaleFactor * 0.5;
        targetCtx.shadowOffsetX = state.text3D * scaleFactor;
        targetCtx.shadowOffsetY = state.text3D * scaleFactor;
    }
    
    const totalHeight = fontSize * lines.length + (fontSize * lineHeight - fontSize) * (lines.length - 1);
    const startY = (targetCanvas.height - totalHeight) / 2 + fontSize / 2;
    
    lines.forEach((line, index) => {
        const y = startY + index * fontSize * lineHeight;
        const x = targetCanvas.width / 2;
        targetCtx.fillText(line, x, y);
    });
}

export function drawSquareImageForExport(targetCanvas, targetCtx, scaleFactor) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    if (!state.squareImageUrl) return Promise.resolve();
    
    return new Promise(resolve => {
        const squareImg = new Image();
        squareImg.onload = () => {
            const totalSize = state.squareSize * scaleFactor;
            const borderWidth = 20 * scaleFactor;
            const size = totalSize - 2 * borderWidth;
            const x = (targetCanvas.width - totalSize) / 2;
            const y = (targetCanvas.height - totalSize) / 2;
            const radius = 30 * scaleFactor;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = totalSize;
            tempCanvas.height = totalSize;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制背景
            if (state.iconBgSize > 0) {
                const bgPadding = state.iconBgSize * scaleFactor;
                tempCtx.fillStyle = state.iconColor;
                tempCtx.beginPath();
                tempCtx.moveTo(radius + borderWidth - bgPadding, borderWidth - bgPadding);
                tempCtx.arcTo(
                    totalSize - borderWidth + bgPadding,
                    borderWidth - bgPadding,
                    totalSize - borderWidth + bgPadding,
                    radius + borderWidth - bgPadding,
                    radius
                );
                tempCtx.arcTo(
                    totalSize - borderWidth + bgPadding,
                    totalSize - borderWidth + bgPadding,
                    totalSize - radius - borderWidth + bgPadding,
                    totalSize - borderWidth + bgPadding,
                    radius
                );
                tempCtx.arcTo(
                    borderWidth - bgPadding,
                    totalSize - borderWidth + bgPadding,
                    borderWidth - bgPadding,
                    totalSize - radius - borderWidth + bgPadding,
                    radius
                );
                tempCtx.arcTo(
                    borderWidth - bgPadding,
                    borderWidth - bgPadding,
                    radius + borderWidth - bgPadding,
                    borderWidth - bgPadding,
                    radius
                );
                tempCtx.closePath();
                tempCtx.fill();
            }

            tempCtx.save();
            tempCtx.beginPath();
            tempCtx.moveTo(radius + borderWidth, borderWidth);
            tempCtx.arcTo(totalSize - borderWidth, borderWidth, totalSize - borderWidth, radius + borderWidth, radius);
            tempCtx.arcTo(totalSize - borderWidth, totalSize - borderWidth, totalSize - radius - borderWidth, totalSize - borderWidth, radius);
            tempCtx.arcTo(borderWidth, totalSize - borderWidth, borderWidth, totalSize - radius - borderWidth, radius);
            tempCtx.arcTo(borderWidth, borderWidth, radius + borderWidth, borderWidth, radius);
            tempCtx.closePath();
            tempCtx.clip();

            const imgAspectRatio = squareImg.width / squareImg.height;
            let scaledWidth, scaledHeight;
            if (imgAspectRatio > 1) {
                scaledWidth = size;
                scaledHeight = size / imgAspectRatio;
            } else {
                scaledWidth = size * imgAspectRatio;
                scaledHeight = size;
            }

            const offsetX = (size - scaledWidth) / 2;
            const offsetY = (size - scaledHeight) / 2;
            tempCtx.drawImage(squareImg, borderWidth + offsetX, borderWidth + offsetY, scaledWidth, scaledHeight);
            tempCtx.restore();

            targetCtx.save();
            targetCtx.shadowColor = state.shadowColor;
            targetCtx.shadowBlur = state.shadowBlur * scaleFactor;
            targetCtx.shadowOffsetX = state.shadowOffsetX * scaleFactor;
            targetCtx.shadowOffsetY = state.shadowOffsetY * scaleFactor;

            targetCtx.translate(x + totalSize / 2, y + totalSize / 2);
            targetCtx.rotate(state.rotation * Math.PI / 180);
            targetCtx.translate(-(x + totalSize / 2), -(y + totalSize / 2));

            targetCtx.drawImage(tempCanvas, x, y);
            targetCtx.restore();
            
            resolve();
        };
        squareImg.src = state.squareImageUrl;
    });
}

export function drawWatermarkForExport(targetCanvas, targetCtx, scaleFactor) {
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    
    const fontSize = 14 * scaleFactor;
    const { fontFamily } = getHtmlFontStyles();
    let font;
    if (state.selectedFont && state.selectedFont !== 'default') {
        const needsQuotes = state.selectedFont.includes(' ') || state.selectedFont.includes('-');
        font = needsQuotes ? `"${state.selectedFont}", ${fontFamily}` : `${state.selectedFont}, ${fontFamily}`;
    } else {
        font = fontFamily;
    }
    
    targetCtx.font = `italic ${fontSize}px ${font}`;
    targetCtx.fillStyle = state.watermarkColor;
    targetCtx.textAlign = 'right';
    targetCtx.fillText(state.watermark, targetCanvas.width - 20 * scaleFactor, targetCanvas.height - 20 * scaleFactor);
}

export async function saveImage(format = 'webp', quality = 0.95, width = 1920, height = 1080, fileName = '') {
    if (!canvas) {
        console.error('画布未初始化');
        return;
    }
    
    // 如果导出尺寸与当前画布尺寸相同，直接使用当前画布
    if (canvas.width === width && canvas.height === height) {
        // 直接使用当前画布导出
        const mimeType = format === 'png' ? 'image/png' : 
                        format === 'jpeg' ? 'image/jpeg' : 
                        'image/webp';
        const extension = format === 'png' ? 'png' : 
                         format === 'jpeg' ? 'jpg' : 
                         'webp';
        const downloadName = fileName || `Cover-${new Date().getTime()}.${extension}`;
        
        canvas.toBlob(blob => {
            if (blob) {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = downloadName;
                link.click();
                URL.revokeObjectURL(link.href);
            } else {
                console.error('生成图片失败');
            }
        }, mimeType, quality);
        return;
    }
    
    // 如果尺寸不同，创建新的导出画布
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d');
    
    // 计算缩放因子（基于当前内部画布尺寸）
    const currentWidth = bgCanvas ? bgCanvas.width : 1920;
    const currentHeight = bgCanvas ? bgCanvas.height : 1080;
    const scaleFactor = Math.min(width / currentWidth, height / currentHeight);
    
    // 创建临时画布用于各个层（使用不同的变量名避免冲突）
    const tempBgCanvas = document.createElement('canvas');
    tempBgCanvas.width = width;
    tempBgCanvas.height = height;
    const tempBgCtx = tempBgCanvas.getContext('2d');
    
    const tempTextCanvas = document.createElement('canvas');
    tempTextCanvas.width = width;
    tempTextCanvas.height = height;
    const tempTextCtx = tempTextCanvas.getContext('2d');
    
    const tempSquareCanvas = document.createElement('canvas');
    tempSquareCanvas.width = width;
    tempSquareCanvas.height = height;
    const tempSquareCtx = tempSquareCanvas.getContext('2d');
    
    const tempWatermarkCanvas = document.createElement('canvas');
    tempWatermarkCanvas.width = width;
    tempWatermarkCanvas.height = height;
    const tempWatermarkCtx = tempWatermarkCanvas.getContext('2d');
    
    // 重新绘制所有内容
    await drawBackgroundForExport(tempBgCanvas, tempBgCtx, scaleFactor);
    drawTextForExport(tempTextCanvas, tempTextCtx, scaleFactor);
    await drawSquareImageForExport(tempSquareCanvas, tempSquareCtx, scaleFactor);
    drawWatermarkForExport(tempWatermarkCanvas, tempWatermarkCtx, scaleFactor);
    
    // 合并所有层
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, width, height);
    exportCtx.drawImage(tempBgCanvas, 0, 0);
    exportCtx.drawImage(tempTextCanvas, 0, 0);
    exportCtx.drawImage(tempSquareCanvas, 0, 0);
    exportCtx.drawImage(tempWatermarkCanvas, 0, 0);
    
    // 确定MIME类型
    const mimeType = format === 'png' ? 'image/png' : 
                    format === 'jpeg' ? 'image/jpeg' : 
                    'image/webp';
    
    // 确定文件扩展名
    const extension = format === 'png' ? 'png' : 
                     format === 'jpeg' ? 'jpg' : 
                     'webp';
    
    // 生成文件名
    const downloadName = fileName || `Cover-${new Date().getTime()}.${extension}`;
    
    // 导出图片
    exportCanvas.toBlob(blob => {
        if (blob) {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = downloadName;
            document.body.appendChild(link); // 添加到DOM以确保兼容性
            link.click();
            document.body.removeChild(link); // 移除链接
            URL.revokeObjectURL(link.href);
            console.log(`图片已导出: ${downloadName}`);
        } else {
            console.error('生成图片失败');
        }
    }, mimeType, quality);
}

// 保持向后兼容
export function saveWebp() {
    saveImage(state.exportFormat, state.exportQuality, state.exportWidth, state.exportHeight);
}

export async function initialize() {
    canvas = document.getElementById('canvasPreview');
    if (canvas) {
        ctx = canvas.getContext('2d');
        
        // 初始化内部canvas（使用当前导出尺寸）
        initInternalCanvases();
        
        // 如果有选中的字体，先确保它加载完成
        if (state.selectedFont && state.selectedFont !== '') {
            try {
                // 强制触发字体加载
                forceFontLoad(state.selectedFont);
                // 等待字体真正可用（使用更短的超时）
                await waitForFont(state.selectedFont, 1000);
            } catch (error) {
                console.warn('初始化时字体加载失败:', error);
            }
        }
        
        // 绘制所有内容
        drawBackground();
        drawText();
        drawSquareImage();
        drawWatermark();
        composeCanvases();
    } else {
        console.error('Canvas element not found');
    }
}