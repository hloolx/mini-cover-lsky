<template>
  <main class="container mx-auto max-w-[1600px] p-4 flex flex-col lg:flex-row lg:flex-wrap justify-center items-center gap-5 relative">
    <!-- 粘贴提示 -->
    <Transition
      enter-from-class="opacity-0 scale-75"
      enter-to-class="opacity-100 scale-100"
      enter-active-class="transition-all duration-500 ease-out"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
      leave-active-class="transition-all duration-300"
    >
      <div v-if="showPasteTip" 
           class="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-3 backdrop-blur-sm">
        <Icon icon="mdi:content-paste" class="w-12 h-12 animate-bounce" />
        <div class="text-center">
          <p class="text-xl font-bold mb-1">支持快捷粘贴</p>
          <p class="text-sm opacity-90">使用 Ctrl+V 或 Cmd+V 粘贴图片</p>
        </div>
      </div>
    </Transition>
    <!-- 拖拽提示覆盖层 -->
    <Transition
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      enter-active-class="transition-opacity duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      leave-active-class="transition-opacity duration-300"
    >
      <div v-if="isDragging && !dragHighlight" 
           class="fixed inset-0 bg-blue-500 bg-opacity-10 pointer-events-none z-40 flex items-center justify-center">
        <div class="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
          <Icon icon="mdi:cloud-upload" class="w-16 h-16 text-blue-500 mb-4 animate-bounce" />
          <p class="text-lg font-semibold text-gray-800">拖拽图片到上传区域</p>
          <p class="text-sm text-gray-600 mt-2">将图片拖到「背景图片」或「图标图片」按钮上</p>
        </div>
      </div>
    </Transition>
    
    <!-- 控制面板 -->
    <div class="w-full lg:flex-1 flex flex-col p-4 bg-white rounded-lg shadow-md">
      <!-- 图标选择器 -->
      <div class="flex gap-2 items-center mb-3">
        <input 
          type="text" 
          v-model="iconName"
          @input="loadIcon"
          placeholder="输入图标名称，例如 logos:chrome"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all duration-300 hover:border-blue-400 text-sm"
        />
        <div class="flex gap-1">
          <a 
            href="https://yesicon.app/" 
            target="_blank"
            class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            title="Yesicon图标库"
          >
            <Icon icon="mdi:magnify" class="inline w-4 h-4" />
          </a>
          <a 
            href="https://www.aigei.com/s?type=icon&q=app" 
            target="_blank"
            class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            title="爱给网图标"
          >
            <Icon icon="mdi:image-search" class="inline w-4 h-4" />
          </a>
          <a 
            href="https://www.uwarp.design/logo-hunter" 
            target="_blank"
            class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
            title="Logo Hunter"
          >
            <Icon icon="mdi:alpha-l-circle" class="inline w-4 h-4" />
          </a>
        </div>
      </div>

      <!-- 背景设置 -->
      <div class="flex gap-2 mb-3 relative">
        <!-- 背景图片按钮 -->
        <button
          v-if="state.bgImageUrl"
          @click="clearBackground"
          class="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-center text-sm flex items-center justify-center gap-1"
        >
          <Icon icon="mdi:delete" class="w-4 h-4" />
          <span>清除背景图片</span>
        </button>
        <label 
          v-else
          for="inputBgImage" 
          @dragover.prevent="handleBgDragOver"
          @dragleave.prevent="handleBgDragLeave"
          @drop.prevent="handleBgDrop"
          class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all cursor-pointer text-center text-sm flex items-center justify-center gap-1"
          :class="{
            'scale-105 shadow-lg ring-4 ring-blue-300 bg-blue-600': isDragging && dragHighlight === 'bg',
            'animate-pulse': isDragging && !dragHighlight
          }"
        >
          <Icon :icon="isDragging && dragHighlight === 'bg' ? 'mdi:cloud-download' : 'mdi:image-plus'" class="w-4 h-4" />
          <span>{{ isDragging && dragHighlight === 'bg' ? '放开上传' : '背景图片' }}</span>
        </label>
        <input type="file" id="inputBgImage" accept="image/*" @change="updatePreview('bg', $event)" class="hidden">
        
        <!-- 图标图片按钮 -->
        <button
          v-if="state.squareImageUrl"
          @click="clearSquareImage"
          class="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all text-center text-sm flex items-center justify-center gap-1"
        >
          <Icon icon="mdi:delete" class="w-4 h-4" />
          <span>清除图标图片</span>
        </button>
        <label 
          v-else
          for="inputSquareImage" 
          @dragover.prevent="handleIconDragOver"
          @dragleave.prevent="handleIconDragLeave"
          @drop.prevent="handleIconDrop"
          class="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all cursor-pointer text-center text-sm flex items-center justify-center gap-1"
          :class="{
            'scale-105 shadow-lg ring-4 ring-blue-300 bg-blue-600': isDragging && dragHighlight === 'icon',
            'animate-pulse': isDragging && !dragHighlight
          }"
        >
          <Icon :icon="isDragging && dragHighlight === 'icon' ? 'mdi:cloud-download' : 'mdi:shape-plus'" class="w-4 h-4" />
          <span>{{ isDragging && dragHighlight === 'icon' ? '放开上传' : '图标图片' }}</span>
        </label>
        <input type="file" id="inputSquareImage" accept="image/*" @change="updatePreview('square', $event)" class="hidden">
        <a 
          href="https://icon.ruom.top" 
          target="_blank"
          class="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap flex items-center gap-1"
        >
          <Icon icon="mdi:download" class="w-4 h-4" />
          <span>下载</span>
        </a>
      </div>

      <!-- 颜色设置 -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <div class="flex items-center gap-2">
          <label class="whitespace-nowrap" for="inputTextColor">标题颜色</label>
          <input 
            type="color" 
            id="inputTextColor"
            v-model="state.textColor"
            @input="updatePreview('textColor', $event)"
            class="w-full h-6 rounded cursor-pointer"
          >
        </div>
        <div class="flex items-center gap-2">
          <label class="whitespace-nowrap" for="inputWatermarkColor">水印颜色</label>
          <input 
            type="color"
            id="inputWatermarkColor"
            v-model="state.watermarkColor"
            @input="updatePreview('watermarkColor', $event)"
            class="w-full h-6 rounded cursor-pointer"
          >
        </div>
      </div>

      <!-- 背景类型选择 -->
      <div class="flex gap-2 mb-3">
        <button
          @click="setBgType('color')"
          :class="[
            'flex-1 px-3 py-2 rounded-lg transition-all text-sm',
            state.bgType === 'color' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          纯色背景
        </button>
        <button
          @click="setBgType('gradient')"
          :class="[
            'flex-1 px-3 py-2 rounded-lg transition-all text-sm',
            state.bgType === 'gradient' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300'
          ]"
        >
          渐变背景
        </button>
      </div>

      <!-- 纯色背景设置 -->
      <div v-if="state.bgType === 'color'" class="flex flex-col sm:flex-row items-center gap-3 mb-3">
        <div class="w-full sm:flex-[6] flex items-center gap-2">
          <label class="whitespace-nowrap" for="inputBgBlur">背景模糊</label>
          <input 
            type="range"
            id="inputBgBlur"
            min="0"
            max="20"
            v-model="state.bgBlur"
            @input="updatePreview('bgBlur', $event)"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          >
        </div>
        <div class="w-full sm:flex-[4] flex items-center gap-2">
          <label class="whitespace-nowrap" for="inputBgColor">背景颜色</label>
          <input 
            type="color"
            id="inputBgColor"
            v-model="state.bgColor"
            @input="updatePreview('bgColor', $event)"
            class="w-full h-6 rounded cursor-pointer"
          >
        </div>
      </div>

      <!-- 渐变背景设置 -->
      <div v-if="state.bgType === 'gradient'" class="flex items-center gap-2 mb-3">
        <!-- 起始颜色 -->
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-600" for="inputGradientStart">起始</label>
          <input 
            type="color"
            id="inputGradientStart"
            v-model="state.bgGradientStart"
            @input="updatePreview('bgGradientStart', $event)"
            class="w-8 h-8 rounded cursor-pointer border border-gray-300"
            title="渐变起始颜色"
          >
        </div>
        
        <!-- 角度选择器 -->
        <AnglePicker
          v-model="state.bgGradientAngle"
          :start-color="state.bgGradientStart"
          :end-color="state.bgGradientEnd"
          @change="onGradientAngleChange"
        />
        
        <!-- 结束颜色 -->
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-600" for="inputGradientEnd">结束</label>
          <input 
            type="color"
            id="inputGradientEnd"
            v-model="state.bgGradientEnd"
            @input="updatePreview('bgGradientEnd', $event)"
            class="w-8 h-8 rounded cursor-pointer border border-gray-300"
            title="渐变结束颜色"
          >
        </div>
        
        <!-- 快速方向按钮 -->
        <div class="flex gap-1 ml-auto">
          <button
            v-for="angle in [0, 45, 90, 135, 180]"
            :key="angle"
            @click="setGradientAngle(angle)"
            :class="[
              'px-2 py-1 text-xs rounded transition-all',
              Math.abs(state.bgGradientAngle - angle) < 5
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            ]"
            :title="`${angle}°`"
          >
            {{ angle }}°
          </button>
        </div>
      </div>

      <!-- 图标和阴影设置 -->
      <div 
        class="flex flex-col gap-3 overflow-hidden transition-all duration-300 ease-out"
        :class="state.squareImageUrl ? 'mb-3 max-h-[300px] sm:max-h-[200px] opacity-100' : 'max-h-0 opacity-0'"
      >
        <!-- 图标控制 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="w-full sm:flex-1 flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputSquareSize">图标大小</label>
            <input 
              type="range"
              id="inputSquareSize"
              min="200"
              max="500"
              v-model="state.squareSize"
              @input="updatePreview('squareSize', $event)"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
          </div>
          <div class="w-full sm:flex-1 flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputRotation">图标旋转</label>
            <input 
              type="range"
              id="inputRotation"
              min="0"
              max="360"
              v-model="state.rotation"
              @input="updatePreview('rotation', $event)"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
          </div>
        </div>

        <!-- 阴影控制 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="w-full sm:flex-[6] flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputShadowStrength">图标阴影大小</label>
            <input 
              type="range"
              id="inputShadowStrength"
              min="0"
              max="100"
              v-model.number="state.shadowStrength"
              @input="updatePreview('shadowStrength', $event)"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
          </div>
          <div class="w-full sm:flex-[4] flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputShadowColor">图标阴影颜色</label>
            <input 
              type="color"
              id="inputShadowColor"
              :value="state.shadowColor.startsWith('rgba') ? '#000000' : state.shadowColor"
              @input="updatePreview('shadowColor', $event)"
              class="w-full h-6 rounded cursor-pointer"
            >
          </div>
        </div>

        <!-- 图标背景控制 -->
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="w-full sm:flex-[6] flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputIconBgSize">图标背景大小</label>
            <input 
              type="range"
              id="inputIconBgSize"
              min="0"
              max="20"
              v-model="state.iconBgSize"
              @input="updatePreview('iconBgSize', $event)"
              class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
          </div>
          <div class="w-full sm:flex-[4] flex items-center gap-2">
            <label class="whitespace-nowrap" for="inputIconColor">图标背景颜色</label>
            <input 
              type="color"
              id="inputIconColor"
              v-model="state.iconColor"
              @input="updatePreview('iconColor', $event)"
              class="w-full h-6 rounded cursor-pointer"
            >
          </div>
        </div>
      </div>

      <!-- 文本设置 -->
      <div class="flex flex-col sm:flex-row gap-3 mb-3">
        <div class="w-full sm:flex-1 flex items-center gap-2">
          <label class="whitespace-nowrap" for="inputTextSize">标题大小</label>
          <input 
            type="range"
            id="inputTextSize"
            min="100"
            max="300"
            v-model="state.textSize"
            @input="updatePreview('textSize', $event)"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          >
        </div>
        <div class="w-full sm:flex-1 flex items-center gap-2">
          <label class="whitespace-nowrap">字体</label>
          <div class="relative flex-1" @click.stop>
            <button
              @click="state.isFontMenuOpen = !state.isFontMenuOpen"
              class="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all duration-300 hover:border-green-500 flex items-center"
              :style="{ fontFamily: state.selectedFont }"
              :disabled="state.isFontLoading"
            >
              <Icon v-if="state.isFontLoading" 
                    icon="mdi:loading" 
                    class="w-4 h-4 text-blue-500 animate-spin mr-2" />
              <span class="flex-1 text-center">
                {{ state.isFontLoading ? '字体加载中...' : defaultConfig.fontOptions.find(f => f.value === state.selectedFont)?.label }}
              </span>
              <svg v-if="!state.isFontLoading"
                class="w-3.5 h-3.5 text-gray-500 transition-transform shrink-0"
                :class="{ 'rotate-180': state.isFontMenuOpen }"
                viewBox="0 0 24 24"
              >
                <path stroke="currentColor" stroke-width="2" d="M19 9l-7 7-7-7" fill="none"/>
              </svg>
            </button>
            
            <div
              class="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto py-1 transform transition-all duration-200 ease-out origin-top"
              :class="state.isFontMenuOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'"
            >
              <div
                v-for="font in defaultConfig.fontOptions"
                :key="font.value"
                @click.stop="selectFont(font.value)"
                class="px-3 py-1.5 text-sm hover:bg-green-50 cursor-pointer"
                :class="{ 'text-green-600': state.selectedFont === font.value }"
              >
                <span :style="{ fontFamily: font.value || 'inherit' }" class="block text-center">{{ font.label }}</span>
              </div>
            </div>
          </div>
        </div>
        <!-- 字体加载提示 -->
        <div v-if="state.fontLoadHint" class="text-xs text-yellow-600 mt-1">
          {{ state.fontLoadHint }}
        </div>
      </div>

      <!-- 行高和立体效果设置 -->
      <div class="flex flex-col sm:flex-row mb-3">
        <div 
          class="flex items-center gap-2 overflow-hidden transition-all duration-300 ease-out"
          :class="state.hasMultipleLines ? ['opacity-100 mb-3 sm:mb-0 sm:mr-4','w-full sm:w-[300px]'] : 'h-0 opacity-0 w-0'"
        >
          <label class="whitespace-nowrap" for="inputLineHeight">标题行高</label>
          <input 
            type="range"
            id="inputLineHeight"
            min="0.5"
            max="2"
            step="0.1"
            v-model.number="state.lineHeight"
            @input="updatePreview('lineHeight', $event)"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          >
        </div>
        <div class="flex-1 flex items-center gap-2">
          <label class="whitespace-nowrap" for="input3D">立体字</label>
          <input 
            type="range"
            id="input3D"
            min="0"
            max="10"
            step="1"
            v-model.number="state.text3D"
            @input="updatePreview('text3D', $event)"
            class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          >
        </div>
      </div>

      <!-- 标题输入 -->
      <textarea 
        id="inputText"
        :value="''"
        @input="updatePreview('text', $event)"
        placeholder="输入标题"
        rows="2"
        class="w-full min-h-[60px] px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all duration-300 hover:border-green-500 resize-y mb-3"
      ></textarea>

      <!-- 水印设置 -->
      <div class="flex items-center gap-3 mb-3">
        <input 
          type="text"
          id="inputWatermark"
          @input="updatePreview('watermark', $event)"
          placeholder="输入水印"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all duration-300 hover:border-green-500"
        >
      </div>
      
      <!-- 导出设置（可折叠） -->
      <div class="mb-3">
        <button
          @click="showExportSettings = !showExportSettings"
          class="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-300"
        >
          <div class="flex items-center gap-2">
            <Icon icon="mdi:export" class="w-5 h-5 text-blue-500" />
            <span class="text-sm font-medium">导出设置</span>
            <span class="text-xs text-gray-500">
              ({{ state.exportWidth }}×{{ state.exportHeight }} {{ state.exportFormat.toUpperCase() }})
            </span>
            <span v-if="Math.abs((state.exportWidth / state.exportHeight) - (1920 / 1080)) > 0.01" 
                  class="text-xs text-orange-500 ml-1" 
                  title="宽高比与默认值不同">
              <Icon icon="mdi:alert" class="w-3 h-3 inline" />
            </span>
          </div>
          <Icon 
            :icon="showExportSettings ? 'mdi:chevron-up' : 'mdi:chevron-down'" 
            class="w-5 h-5 text-gray-500"
          />
        </button>
        
        <Transition
          enter-from-class="opacity-0 max-h-0"
          enter-to-class="opacity-100 max-h-[800px]"
          enter-active-class="transition-all duration-300 ease-out overflow-hidden"
          leave-from-class="opacity-100 max-h-[800px]"
          leave-to-class="opacity-0 max-h-0"
          leave-active-class="transition-all duration-300 ease-in overflow-hidden"
        >
          <div v-if="showExportSettings" class="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
            <!-- 快速平台切换 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">快速选择</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="platform in quickPlatforms"
                  :key="platform.value"
                  @click="quickSelectPlatform(platform)"
                  :class="[
                    'px-3 py-2 rounded-lg border transition-all',
                    state.exportPlatform === platform.value
                      ? 'bg-blue-100 text-blue-700 border-blue-400'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                  ]"
                >
                  <div class="text-sm font-medium">{{ platform.label }}</div>
                  <div class="text-xs opacity-70 mt-0.5">{{ platform.size }}</div>
                </button>
              </div>
            </div>
            
            <!-- 平台选择 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">所有平台</label>
              <select 
                v-model="state.exportPlatform"
                @change="handlePlatformChange"
                class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
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
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">尺寸设置</label>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs text-gray-600 mb-1">宽度 (px)</label>
                  <input 
                    type="number"
                    v-model.number="state.exportWidth"
                    :disabled="state.exportPlatform !== 'custom'"
                    min="100"
                    max="4000"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                </div>
                <div>
                  <label class="block text-xs text-gray-600 mb-1">高度 (px)</label>
                  <input 
                    type="number"
                    v-model.number="state.exportHeight"
                    :disabled="state.exportPlatform !== 'custom'"
                    min="100"
                    max="4000"
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                  >
                </div>
              </div>
              <!-- 缩放信息显示 -->
              <div class="mt-3 p-2 bg-blue-50 rounded-lg">
                <div class="flex flex-wrap items-center gap-3 text-xs text-blue-700">
                  <div class="flex items-center gap-1">
                    <Icon icon="mdi:aspect-ratio" class="w-3 h-3" />
                    <span>宽高比: {{ (state.exportWidth / state.exportHeight).toFixed(2) }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Icon icon="mdi:magnify" class="w-3 h-3" />
                    <span>缩放: {{ ((state.exportWidth / 1920) * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <Icon icon="mdi:image-size-select-actual" class="w-3 h-3" />
                    <span>{{ state.exportWidth }}×{{ state.exportHeight }}px</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 格式选择 -->
            <div>
              <label class="block text-sm font-medium mb-2 text-gray-700">导出格式</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="format in exportFormats"
                  :key="format.value"
                  @click="state.exportFormat = format.value; updateCanvasSize();"
                  :class="[
                    'px-2 py-1.5 rounded-lg border transition-all text-sm',
                    state.exportFormat === format.value 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  ]"
                >
                  <div class="text-sm font-medium">{{ format.label }}</div>
                  <div class="text-xs opacity-70 mt-0.5">{{ format.desc }}</div>
                </button>
              </div>
            </div>
            
            <!-- 质量设置 -->
            <div v-if="state.exportFormat !== 'png'">
              <label class="block text-sm font-medium mb-2 text-gray-700">
                图片质量: {{ Math.round(state.exportQuality * 100) }}%
              </label>
              <input 
                type="range"
                v-model.number="state.exportQuality"
                min="0.1"
                max="1"
                step="0.05"
                class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              >
            </div>
          </div>
        </Transition>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3">
        <button 
          @click="exportImage"
          :disabled="isExporting"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon :icon="isExporting ? 'mdi:loading' : 'mdi:content-save'" 
                :class="['w-4 h-4', isExporting && 'animate-spin']" />
          <span>{{ isExporting ? '正在导出...' : '导出图片' }}</span>
        </button>
        <ImageUploader canvas-id="canvasPreview" />
        <button 
          @click="openSettings"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          title="设置"
        >
          <Icon icon="mdi:cog" class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- 画布预览 -->
    <div class="relative w-full lg:flex-[2] overflow-hidden">
      <div class="bg-gray-100 rounded-lg p-2">
        <div class="text-xs text-gray-500 mb-1 text-center">
          <div class="flex items-center justify-center gap-3">
            <span>预览: {{ canvasActualWidth }}×{{ canvasActualHeight }}</span>
            <Icon icon="mdi:arrow-right" class="w-3 h-3" />
            <span>导出: {{ state.exportWidth }}×{{ state.exportHeight }}</span>
            <span class="text-blue-600 font-medium">({{ scalePercentage }}%)</span>
          </div>
        </div>
        <div class="relative inline-block w-full">
          <!-- 导出尺寸比例指示框 -->
          <div 
            v-if="showExportSizeIndicator"
            class="absolute border-2 border-dashed border-blue-400 rounded-lg pointer-events-none"
            :style="exportSizeIndicatorStyle"
          >
            <div class="absolute -top-6 left-0 text-xs text-blue-600 whitespace-nowrap">
              导出比例: {{ state.exportWidth }}×{{ state.exportHeight }}
              <span v-if="scalePercentage" class="ml-2 text-gray-500">
                (缩放: {{ scalePercentage }}%)
              </span>
            </div>
          </div>
          <canvas 
            id="canvasPreview" 
            :width="state.exportWidth" 
            :height="state.exportHeight" 
            @dragover.prevent="handleCanvasDragOver"
            @dragleave.prevent="handleCanvasDragLeave"
            @drop.prevent="handleCanvasDrop" 
            class="w-full h-auto rounded-lg shadow-md bg-white relative"
            :style="canvasPreviewStyle"
          ></canvas>
        </div>
      </div>
      <!-- 图标区高亮 -->
      <div
        v-if="dragHighlight === 'icon'"
        class="pointer-events-none absolute left-1/2 top-1/2"
        :style="{
          width: '200px',
          height: '200px',
          transform: 'translate(-50%, -50%)',
          border: '3px dashed #22c55e',
          borderRadius: '24px',
          boxSizing: 'border-box',
          zIndex: 10
        }"
      ></div>
      <!-- 背景区高亮 -->
      <div
        v-if="dragHighlight === 'bg'"
        class="pointer-events-none absolute inset-0"
        style="border: 3px dashed #22c55e; border-radius: 16px; box-sizing: border-box; z-index: 9;"
      ></div>
    </div>

    <!-- 设置模态框 -->
    <SettingsModal
      v-model="showSettings"
      @settings-updated="onSettingsUpdated"
    />
    
    <!-- 粘贴选择对话框 -->
    <Teleport to="body">
      <Transition
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        enter-active-class="transition-opacity duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        leave-active-class="transition-opacity duration-200"
      >
        <div v-if="showPasteDialogVisible" 
             class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
             @click="closePasteDialog">
          <div class="bg-white rounded-lg p-6 max-w-sm shadow-xl" @click.stop>
            <h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
              <Icon icon="mdi:content-paste" class="w-5 h-5 text-blue-500" />
              粘贴图片到
            </h3>
            <div class="flex gap-3">
              <button @click="handlePasteChoice('bg')" 
                      class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex flex-col items-center gap-1">
                <Icon icon="mdi:image" class="w-6 h-6" />
                <span class="text-sm">背景图片</span>
              </button>
              <button @click="handlePasteChoice('square')" 
                      class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex flex-col items-center gap-1">
                <Icon icon="mdi:shape" class="w-6 h-6" />
                <span class="text-sm">图标图片</span>
              </button>
            </div>
            <button @click="closePasteDialog" 
                    class="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              取消
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<script>
import { 
  state, 
  updatePreview, 
  saveImage, 
  drawSquareImage, 
  initialize,
  drawBackground,
  composeCanvases,
  squareCtx,
  squareCanvas,
  updateBackgroundGradientDirection,
  updateBackgroundGradientAngle,
  updateCanvasSize,
  drawText,
  drawWatermark
} from '../assets/script.js';
import { defaultConfig } from '../config';
import ImageUploader from './ImageUploader.vue';
import SettingsModal from './SettingsModal.vue';
import AnglePicker from './AnglePicker.vue';
import { Icon } from '@iconify/vue';
import { preloadFonts } from '../utils/fontLoader';

export default {
  components: {
    ImageUploader,
    SettingsModal,
    AnglePicker,
    Icon
  },
  computed: {
    canvasPreviewStyle() {
      // 预览画布保持原始比例，不进行拉伸
      return {
        maxWidth: '100%',
        height: 'auto'
      };
    },
    canvasActualWidth() {
      const canvas = document.getElementById('canvasPreview');
      return canvas ? canvas.width : 1920;
    },
    canvasActualHeight() {
      const canvas = document.getElementById('canvasPreview');
      return canvas ? canvas.height : 1080;
    },
    scalePercentage() {
      // 计算相对于基准尺寸（1920x1080）的缩放比例
      const baseWidth = 1920;
      const scaleRatio = this.state.exportWidth / baseWidth;
      return Math.round(scaleRatio * 100);
    },
    showExportSizeIndicator() {
      // 当导出比例与画布比例不同时显示指示框
      const canvasRatio = 1000 / 500;
      const exportRatio = this.state.exportWidth / this.state.exportHeight;
      return Math.abs(canvasRatio - exportRatio) > 0.01;
    },
    exportSizeIndicatorStyle() {
      // 计算导出尺寸指示框的样式
      const canvasRatio = 1000 / 500;
      const exportRatio = this.state.exportWidth / this.state.exportHeight;
      
      let width = '100%';
      let height = '100%';
      let left = '0';
      let top = '0';
      
      if (exportRatio > canvasRatio) {
        // 导出更宽，高度受限
        height = `${(canvasRatio / exportRatio) * 100}%`;
        top = `${(100 - (canvasRatio / exportRatio) * 100) / 2}%`;
      } else if (exportRatio < canvasRatio) {
        // 导出更高，宽度受限
        width = `${(exportRatio / canvasRatio) * 100}%`;
        left = `${(100 - (exportRatio / canvasRatio) * 100) / 2}%`;
      }
      
      return {
        width,
        height,
        left,
        top
      };
    }
  },
  data() {
    return {
      state,
      defaultConfig,
      iconName: '',
      iconUrl: null,
      showSettings: false,
      dragHighlight: null,
      isDragging: false,
      dragCounter: 0,
      showPasteTip: false,
      showPasteDialogVisible: false,
      pendingPasteFile: null,
      showExportSettings: false,
      isExporting: false,
      exportFormats: [
        { value: 'webp', label: 'WEBP', desc: '高压缩' },
        { value: 'png', label: 'PNG', desc: '无损' },
        { value: 'jpeg', label: 'JPEG', desc: '有损' }
      ],
      gradientDirections: [
        { value: 'to-right', label: '→', icon: 'mdi:arrow-right' },
        { value: 'to-left', label: '←', icon: 'mdi:arrow-left' },
        { value: 'to-bottom', label: '↓', icon: 'mdi:arrow-down' },
        { value: 'to-top', label: '↑', icon: 'mdi:arrow-up' },
        { value: 'to-bottom-right', label: '↘', icon: 'mdi:arrow-bottom-right' },
        { value: 'to-bottom-left', label: '↙', icon: 'mdi:arrow-bottom-left' },
        { value: 'to-top-right', label: '↗', icon: 'mdi:arrow-top-right' },
        { value: 'to-top-left', label: '↖', icon: 'mdi:arrow-top-left' }
      ],
      canvasResizeTimer: null,
      platformSizes: {
        custom: { width: 1920, height: 1080 },
        wechat: { width: 900, height: 383 },
        juejin: { width: 900, height: 600 },
        zhihu: { width: 1080, height: 607 },
        aliyun: { width: 1000, height: 600 },
        tencent: { width: 960, height: 540 },
        csdn: { width: 1080, height: 607 },
        toutiao: { width: 900, height: 500 },
        jianshu: { width: 1250, height: 1000 }
      },
      quickPlatforms: [
        { value: 'custom', label: '自定义', size: '1920×1080' },
        { value: 'wechat', label: '微信', size: '900×383' },
        { value: 'juejin', label: '掘金', size: '900×600' }
      ]
    };
  },
  watch: {
    'state.exportWidth': {
      handler: 'handleExportSizeChange',
      immediate: false
    },
    'state.exportHeight': {
      handler: 'handleExportSizeChange',
      immediate: false
    },
    'state.exportPlatform': {
      handler: 'handlePlatformChange',
      immediate: false
    }
  },
  async mounted() {
    // 刷新字体配置
    defaultConfig.refreshFonts();
    this.defaultConfig = {...defaultConfig};
    
    // 先加载字体样式
    this.loadStyles();
    
    // 等待一下让字体CSS加载
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 预加载所有导入的字体
    try {
      const importedFonts = JSON.parse(localStorage.getItem('imported_fonts') || '[]');
      if (importedFonts.length > 0) {
        await preloadFonts(importedFonts);
      }
    } catch (error) {
      console.warn('预加载字体失败:', error);
    }
    
    // 初始化画布（现在是异步的）
    // initialize函数已经包含了所有必要的绘制
    await initialize();
    
    // Add click outside listener
    document.addEventListener('click', this.handleClickOutside);
    
    // 添加全局拖拽事件
    document.addEventListener('dragenter', this.handleGlobalDragEnter);
    document.addEventListener('dragleave', this.handleGlobalDragLeave);
    document.addEventListener('dragover', this.handleGlobalDragOver);
    document.addEventListener('drop', this.handleGlobalDrop);
    
    // 添加粘贴事件监听
    document.addEventListener('paste', this.handlePaste);
    
    // 显示粘贴提示
    setTimeout(() => {
      this.showPasteTip = true;
      setTimeout(() => {
        this.showPasteTip = false;
      }, 4000);
    }, 800);
  },
  unmounted() {
    // Remove click outside listener
    document.removeEventListener('click', this.handleClickOutside);
    
    // 清理全局拖拽事件
    document.removeEventListener('dragenter', this.handleGlobalDragEnter);
    document.removeEventListener('dragleave', this.handleGlobalDragLeave);
    document.removeEventListener('dragover', this.handleGlobalDragOver);
    document.removeEventListener('drop', this.handleGlobalDrop);
    
    // 清理粘贴事件
    document.removeEventListener('paste', this.handlePaste);
  },
  methods: {
    // Debounced handler for export size changes
    handleExportSizeChange() {
      // 使用防抖避免频繁重绘
      if (this.canvasResizeTimer) {
        clearTimeout(this.canvasResizeTimer);
      }
      this.canvasResizeTimer = setTimeout(() => {
        this.updateCanvasSize();
      }, 300); // 300ms 防抖
    },
    
    // 动态更新画布尺寸
    updateCanvasSize() {
      const canvas = document.getElementById('canvasPreview');
      if (!canvas) return;
      
      // 调用script.js中的updateCanvasSize函数
      // 这个函数会重新创建内部canvas并重绘所有内容
      updateCanvasSize(this.state.exportWidth, this.state.exportHeight);
    },
    
    // 重绘画布内容
    async redrawCanvas() {
      // 直接调用script.js中的绘制函数
      // 这些函数已经处理了正确的缩放
      drawBackground();
      drawText();
      drawSquareImage();
      drawWatermark();
      composeCanvases();
    },
    
    loadStyles() {
      // 清除旧的字体链接
      document.querySelectorAll('link[data-font-import]').forEach(link => link.remove());
      
      // 加载新的字体链接
      defaultConfig.fontStyles.forEach(url => {
        if (url) {
          const existingLink = document.querySelector(`link[href="${url}"]`);
          if (!existingLink) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.setAttribute('data-font-import', 'true');
            document.head.appendChild(link);
          }
        }
      });
    },
    updatePreview,
    loadIcon() {
      if (this.iconName) {
        this.iconUrl = `https://api.iconify.design/${this.iconName}.svg`;
        this.selectIcon();
      } else {
        this.iconUrl = null;
        state.squareImageUrl = null;
      }
    },
    selectIcon() {
      if (this.iconUrl) {
        fetch(this.iconUrl)
          .then(response => response.blob())
          .then(blob => {
            const file = new File([blob], 'icon.svg', { type: 'image/svg+xml' });
            state.squareImageUrl = URL.createObjectURL(file);
            updatePreview('square', { target: { files: [file] } });
          })
          .catch(error => {
            console.error('加载图标时出错:', error);
            this.showSuccessPopup('加载图标时出错: ' + error.message, false);
          });
      }
    },
    drawSquareImage,
    getDropArea(event) {
      const canvas = event.target;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const centerRadius = 100;
      const distanceToCenter = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      return distanceToCenter < centerRadius ? 'icon' : 'bg';
    },
    handleCanvasDragOver(event) {
      this.dragHighlight = this.getDropArea(event);
    },
    handleCanvasDragLeave() {
      this.dragHighlight = null;
    },
    handleCanvasDrop(event) {
      this.dragHighlight = null;
      const file = event.dataTransfer.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const area = this.getDropArea(event);
      this.updatePreview(area === 'icon' ? 'square' : 'bg', { target: { files: [file] } });
    },
    async selectFont(fontValue) {
      // 立即关闭菜单，避免重复点击
      state.isFontMenuOpen = false;
      // 等待字体更新完成
      await this.updatePreview('font', { target: { value: fontValue } });
    },
    handleClickOutside(event) {
      const dropdown = document.querySelector('.relative');
      if (dropdown && !dropdown.contains(event.target)) {
        state.isFontMenuOpen = false;
      }
    },
    openSettings() {
      this.showSettings = true;
    },
    
    onSettingsUpdated() {
      // 刷新字体配置
      defaultConfig.refreshFonts();
      this.defaultConfig = {...defaultConfig};
      
      // 重新加载字体样式
      this.loadStyles();
      
      // 触发重新渲染画布（如果当前选择的字体是新导入的）
      if (state.selectedFont) {
        // 延迟一下确保字体加载完成
        setTimeout(() => {
          this.updatePreview('font', { target: { value: state.selectedFont } });
        }, 500);
      }
    },
    
    // 全局拖拽事件处理
    handleGlobalDragEnter(e) {
      e.preventDefault();
      this.dragCounter++;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        const item = e.dataTransfer.items[0];
        if (item.type.match('^image/')) {
          this.isDragging = true;
        }
      }
    },
    
    handleGlobalDragLeave(e) {
      e.preventDefault();
      this.dragCounter--;
      if (this.dragCounter === 0) {
        this.isDragging = false;
        this.dragHighlight = null;
      }
    },
    
    handleGlobalDragOver(e) {
      e.preventDefault();
    },
    
    handleGlobalDrop(e) {
      e.preventDefault();
      this.isDragging = false;
      this.dragHighlight = null;
      this.dragCounter = 0;
    },
    
    // 背景图片拖拽
    handleBgDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      this.dragHighlight = 'bg';
    },
    
    handleBgDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.dragHighlight === 'bg') {
        this.dragHighlight = null;
      }
    },
    
    handleBgDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      this.dragHighlight = null;
      this.dragCounter = 0;
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.match('^image/')) {
        const event = { target: { files: [files[0]] } };
        updatePreview('bg', event);
      }
    },
    
    // 图标图片拖拽
    handleIconDragOver(e) {
      e.preventDefault();
      e.stopPropagation();
      this.dragHighlight = 'icon';
    },
    
    handleIconDragLeave(e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.dragHighlight === 'icon') {
        this.dragHighlight = null;
      }
    },
    
    handleIconDrop(e) {
      e.preventDefault();
      e.stopPropagation();
      this.isDragging = false;
      this.dragHighlight = null;
      this.dragCounter = 0;
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.match('^image/')) {
        const event = { target: { files: [files[0]] } };
        updatePreview('square', event);
      }
    },
    
    // 处理粘贴事件
    async handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          
          const file = item.getAsFile();
          if (!file) continue;
          
          // 保存文件并显示对话框
          this.pendingPasteFile = file;
          this.showPasteDialogVisible = true;
          break;
        }
      }
    },
    
    // 处理粘贴选择
    handlePasteChoice(type) {
      if (this.pendingPasteFile && type) {
        const event = { target: { files: [this.pendingPasteFile] } };
        updatePreview(type, event);
      }
      this.closePasteDialog();
    },
    
    // 关闭粘贴对话框
    closePasteDialog() {
      this.showPasteDialogVisible = false;
      this.pendingPasteFile = null;
    },
    
    // 清除背景图片
    clearBackground() {
      state.bgImageUrl = null;
      // 重新绘制背景（会使用背景颜色）
      drawBackground();
      composeCanvases();
    },
    
    // 清除图标图片
    clearSquareImage() {
      state.squareImageUrl = null;
      // 清空图标并重新合成画布
      squareCtx.clearRect(0, 0, squareCanvas.width, squareCanvas.height);
      composeCanvases();
    },
    
    // 设置背景类型
    setBgType(type) {
      state.bgType = type;
      state.bgImageUrl = null;
      drawBackground();
      composeCanvases();
    },
    
    // 设置渐变方向（保留兼容）
    setGradientDirection(direction) {
      state.bgGradientDirection = direction;
      state.bgType = 'gradient';
      state.bgImageUrl = null;
      drawBackground();
      composeCanvases();
    },
    
    // 设置渐变角度
    setGradientAngle(angle) {
      state.bgGradientAngle = angle;
      state.bgType = 'gradient';
      state.bgImageUrl = null;
      updateBackgroundGradientAngle(angle);
    },
    
    // 渐变角度变化处理
    onGradientAngleChange(angle) {
      updateBackgroundGradientAngle(angle);
    },
    
    // 处理平台变更
    handlePlatformChange() {
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
      
      const { width, height } = this.platformSizes[state.exportPlatform] || this.platformSizes.custom;
      state.exportWidth = width;
      state.exportHeight = height;
      
      // 触发画布更新
      this.handleExportSizeChange();
    },
    
    // 快速选择平台
    quickSelectPlatform(platform) {
      state.exportPlatform = platform.value;
      this.handlePlatformChange();
    },
    
    
    // 更新导出尺寸
    updateExportSize() {
      if (state.exportPlatform === 'custom') {
        // 如果是自定义尺寸，允许用户输入
        this.handleExportSizeChange();
      }
    },
    
    // 导出图片
    async exportImage() {
      if (this.isExporting) return;
      
      this.isExporting = true;
      try {
        await saveImage(
          state.exportFormat,
          state.exportQuality,
          state.exportWidth,
          state.exportHeight
        );
      } catch (error) {
        console.error('导出失败:', error);
        alert('导出图片失败，请重试');
      } finally {
        this.isExporting = false;
      }
    }
  }
};
</script>