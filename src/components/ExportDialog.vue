<template>
  <Teleport to="body">
    <Transition
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      enter-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
    >
      <div v-if="modelValue" 
           class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
           @click="close">
        <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" @click.stop>
          <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
            <Icon icon="mdi:download" class="w-5 h-5 text-blue-500" />
            导出图片设置
          </h3>
          
          <!-- 平台选择 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">导出平台</label>
            <select 
              v-model="localState.exportPlatform"
              @change="handlePlatformChange"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="custom">自定义尺寸</option>
              <option value="wechat">微信公众号 (900×383)</option>
              <option value="juejin">掘金 (900×600)</option>
              <option value="zhihu">知乎 (1080×607)</option>
              <option value="aliyun">阿里云开发者 (1000×600)</option>
              <option value="tencent">腾讯云开发者 (960×540)</option>
              <option value="csdn">CSDN (1080×607)</option>
              <option value="toutiao">今日头条 (900×500)</option>
              <option value="jianshu">简书 (1250×1000)</option>
            </select>
          </div>
          
          <!-- 尺寸设置 -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-sm font-medium mb-1">宽度</label>
              <input 
                type="number"
                v-model.number="localState.exportWidth"
                :disabled="localState.exportPlatform !== 'custom'"
                min="100"
                max="4000"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">高度</label>
              <input 
                type="number"
                v-model.number="localState.exportHeight"
                :disabled="localState.exportPlatform !== 'custom'"
                min="100"
                max="4000"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
              >
            </div>
          </div>
          
          <!-- 格式选择 -->
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">导出格式</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="format in formats"
                :key="format.value"
                @click="localState.exportFormat = format.value"
                :class="[
                  'px-3 py-2 rounded-lg border transition-all',
                  localState.exportFormat === format.value 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                ]"
              >
                <div class="text-sm font-medium">{{ format.label }}</div>
                <div class="text-xs opacity-80">{{ format.desc }}</div>
              </button>
            </div>
          </div>
          
          <!-- 质量设置（JPEG 和 WebP） -->
          <div v-if="localState.exportFormat !== 'png'" class="mb-4">
            <label class="block text-sm font-medium mb-2">
              图片质量: {{ Math.round(localState.exportQuality * 100) }}%
            </label>
            <input 
              type="range"
              v-model.number="localState.exportQuality"
              min="0.1"
              max="1"
              step="0.05"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-500 mt-1">
              <span>低</span>
              <span>中</span>
              <span>高</span>
              <span>最高</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex gap-3">
            <button 
              @click="exportImage"
              class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Icon icon="mdi:download" class="w-4 h-4" />
              <span>导出</span>
            </button>
            <button 
              @click="close"
              class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script>
import { Icon } from '@iconify/vue';
import { reactive, watch } from 'vue';
import { state, saveImage } from '../assets/script.js';

export default {
  components: {
    Icon
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // 平台尺寸配置
    const platformSizes = {
      custom: { width: 1920, height: 1080 },
      wechat: { width: 900, height: 383 },
      juejin: { width: 900, height: 600 },
      zhihu: { width: 1080, height: 607 },
      aliyun: { width: 1000, height: 600 },
      tencent: { width: 960, height: 540 },
      csdn: { width: 1080, height: 607 },
      toutiao: { width: 900, height: 500 },
      jianshu: { width: 1250, height: 1000 }
    };
    
    // 格式选项
    const formats = [
      { value: 'webp', label: 'WEBP', desc: '高压缩' },
      { value: 'png', label: 'PNG', desc: '无损' },
      { value: 'jpeg', label: 'JPEG', desc: '有损' }
    ];
    
    // 本地状态
    const localState = reactive({
      exportFormat: state.exportFormat,
      exportQuality: state.exportQuality,
      exportWidth: state.exportWidth,
      exportHeight: state.exportHeight,
      exportPlatform: state.exportPlatform
    });
    
    // 处理平台变更
    const handlePlatformChange = () => {
      const { width, height } = platformSizes[localState.exportPlatform];
      localState.exportWidth = width;
      localState.exportHeight = height;
    };
    
    // 导出图片
    const exportImage = () => {
      // 更新全局状态
      state.exportFormat = localState.exportFormat;
      state.exportQuality = localState.exportQuality;
      state.exportWidth = localState.exportWidth;
      state.exportHeight = localState.exportHeight;
      state.exportPlatform = localState.exportPlatform;
      
      // 调用导出函数
      saveImage(
        localState.exportFormat,
        localState.exportQuality,
        localState.exportWidth,
        localState.exportHeight
      );
      
      // 关闭对话框
      close();
    };
    
    // 关闭对话框
    const close = () => {
      emit('update:modelValue', false);
    };
    
    // 监听 props 变化，同步本地状态
    watch(() => props.modelValue, (newVal) => {
      if (newVal) {
        // 打开时同步状态
        localState.exportFormat = state.exportFormat;
        localState.exportQuality = state.exportQuality;
        localState.exportWidth = state.exportWidth;
        localState.exportHeight = state.exportHeight;
        localState.exportPlatform = state.exportPlatform;
      }
    });
    
    return {
      localState,
      formats,
      handlePlatformChange,
      exportImage,
      close
    };
  }
};
</script>