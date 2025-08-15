// 获取导入的字体
const getImportedFonts = () => {
    try {
        const imported = JSON.parse(localStorage.getItem('imported_fonts') || '[]');
        return imported;
    } catch {
        return [];
    }
};

// 构建字体选项
const buildFontOptions = () => {
    const defaultFonts = [
        { value: '', label: '默认字体' },
        { value: 'Microsoft YaHei', label: '微软雅黑' },
        { value: 'Arial', label: 'Arial' },
        { value: 'sans-serif', label: 'Sans Serif' }
    ];
    
    // 添加导入的字体
    const importedFonts = getImportedFonts();
    const importedOptions = importedFonts.map(font => ({
        value: font.name,
        label: font.name
    }));
    
    return [...defaultFonts, ...importedOptions];
};

// 获取所有字体样式链接
const getFontStyles = () => {
    const importedFonts = getImportedFonts();
    return importedFonts.map(font => font.url);
};

export const defaultConfig = {
    text: '阿懒同学',       // 默认文本
    watermark: '@阿懒同学', // 默认水印
    fontFamily: '',
    fontStyles: getFontStyles(),
    fontOptions: buildFontOptions(),
    // 刷新字体配置的方法
    refreshFonts() {
        this.fontStyles = getFontStyles();
        this.fontOptions = buildFontOptions();
    }
};