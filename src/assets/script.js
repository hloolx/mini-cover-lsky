import { defaultConfig } from '../config';
import { reactive } from 'vue';
import { waitForFont, forceFontLoad } from '../utils/fontLoader';

const loadedImages = new Map();
export const state = reactive({
    bgImageUrl: null,
    squareImageUrl: null,
    bgColor: '#ffffff',
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
    fontLoadHint: ''  // 字体加载提示
});

export let canvas = null;
export let ctx = null;

const createCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return { canvas, ctx: canvas.getContext('2d') };
};

export const { canvas: bgCanvas, ctx: bgCtx } = createCanvas(1000, 500);
export const { canvas: textCanvas, ctx: textCtx } = createCanvas(1000, 500);
export const { canvas: watermarkCanvas, ctx: watermarkCtx } = createCanvas(1000, 500);
export const { canvas: squareCanvas, ctx: squareCtx } = createCanvas(1000, 500);

export async function updatePreview(type, event) {
    const updateFunctions = {
        bg: updateBackgroundImage,
        bgColor: updateBackgroundColor,
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
    drawBackground();
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
    } else {
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
            const totalSize = state.squareSize;
            const borderWidth = 20;
            const size = totalSize - 2 * borderWidth;
            const x = (squareCanvas.width - totalSize) / 2;
            const y = (squareCanvas.height - totalSize) / 2;
            const radius = 30;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = totalSize;
            tempCanvas.height = totalSize;
            const tempCtx = tempCanvas.getContext('2d');

            // 绘制背景
            if (state.iconBgSize > 0) {
                const bgPadding = state.iconBgSize;
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
    
    textCtx.font = `600 ${state.textSize}px ${font}`;
    textCtx.fillStyle = state.textColor;
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';

    if (state.text3D > 0) {
        textCtx.shadowColor = 'rgba(0, 0, 0, .4)';
        textCtx.shadowBlur = state.text3D * 0.5;
        textCtx.shadowOffsetX = state.text3D;
        textCtx.shadowOffsetY = state.text3D;
    } else {
        textCtx.shadowColor = 'transparent';
        textCtx.shadowBlur = 0;
        textCtx.shadowOffsetX = 0;
        textCtx.shadowOffsetY = 0;
    }

    // 处理多行文本
    const lines = state.text.split('\n');
    const lineHeight = state.textSize * state.lineHeight;
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
        // 如果字体名包含空格或特殊字符，添加引号
        const needsQuotes = state.selectedFont.includes(' ') || state.selectedFont.includes('-');
        font = needsQuotes 
            ? `"${state.selectedFont}", ${fontFamily}`
            : `${state.selectedFont}, ${fontFamily}`;
    } else {
        font = fontFamily;
    }
    watermarkCtx.font = `italic 14px ${font}`;
    watermarkCtx.fillStyle = state.watermarkColor;
    watermarkCtx.textAlign = 'right';
    watermarkCtx.fillText(state.watermark, watermarkCanvas.width - 20, watermarkCanvas.height - 20);
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

export function saveWebp() {
    if (canvas) {
        canvas.toBlob(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'Canvas-Ruom.webp';
            link.click();
            URL.revokeObjectURL(link.href);
        }, 'image/webp');
    }
}

export async function initialize() {
    canvas = document.getElementById('canvasPreview');
    if (canvas) {
        ctx = canvas.getContext('2d');
        
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
        
        drawBackground();
        drawText();
        drawWatermark();
        composeCanvases();
    } else {
        console.error('Canvas element not found');
    }
}