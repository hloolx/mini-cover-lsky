<template>
  <Teleport to="body">
    <div v-if="mounted" 
         class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- 背景遮罩 -->
      <Transition
        appear
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        enter-active-class="transition-opacity duration-300"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
      >
        <div v-show="modelValue"
             class="absolute inset-0 bg-black/60" 
             @click="$emit('update:modelValue', false)"
        ></div>
      </Transition>
      
      <!-- 设置容器 -->
      <Transition
        appear
        enter-from-class="opacity-0 translate-y-4 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        enter-active-class="transition-all duration-300 transform"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-4 scale-95"
        leave-active-class="transition-all duration-300 transform"
        @after-leave="onAfterLeave"
      >
        <div v-show="modelValue"
             class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl
                    border border-gray-200 p-6 max-h-[90vh] overflow-y-auto"
             @click.stop
        >
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-xl font-bold text-gray-800">设置</h3>
            <button @click="$emit('update:modelValue', false)"
                    class="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
              <Icon icon="mdi:close" class="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <!-- 设置内容 -->
          <div class="space-y-6">
            <!-- 兰空图床配置 -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-4">
                <Icon icon="mdi:cloud-upload" class="w-5 h-5 text-blue-500" />
                <h4 class="text-lg font-semibold text-gray-700">兰空图床配置</h4>
              </div>

              <!-- API地址 -->
              <div class="mb-4">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  API 地址
                  <Tooltip content="格式: https://你的域名/api/v2/upload">
                    <Icon icon="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>
                <input type="text" 
                       v-model="uploadUrl"
                       @change="saveSettings"
                       placeholder="https://example.com/api/v2/upload"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
              </div>

              <!-- Token -->
              <div class="mb-4">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  API Token
                  <Tooltip content="在兰空图床后台 → 个人中心 → 接口 → 生成Token">
                    <Icon icon="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>
                <div class="space-y-2">
                  <div class="relative">
                    <input :type="showToken ? 'text' : 'password'" 
                           v-model="uploadToken"
                           @change="saveSettings"
                           placeholder="1|xxxxxxxxxxxxxxxxxxxxx"
                           class="w-full pr-10 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <button @click="showToken = !showToken"
                            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                      <Icon :icon="showToken ? 'mdi:eye-off' : 'mdi:eye'" class="w-5 h-5" />
                    </button>
                  </div>
                  <div class="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                    <Icon icon="mdi:lightbulb-on" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div class="text-xs text-gray-600">
                      <p class="font-medium mb-1">获取 Token 步骤：</p>
                      <ol class="list-decimal list-inside space-y-1">
                        <li>登录你的兰空图床后台</li>
                        <li>进入「个人中心」或「设置」</li>
                        <li>找到「API」或「接口」选项</li>
                        <li>点击「生成 Token」</li>
                        <li>复制生成的 Token 到这里</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 存储策略管理 -->
              <div class="mb-4">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  存储策略
                  <Tooltip content="选择或管理图床存储策略">
                    <Icon icon="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>
                
                <div class="space-y-2">
                  <!-- 当前策略显示 -->
                  <div v-if="currentStorageId" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div class="flex items-center gap-2">
                      <Icon icon="mdi:check-circle" class="w-5 h-5 text-green-500" />
                      <span class="text-sm">当前策略 ID: {{ currentStorageId }}</span>
                    </div>
                    <button @click="clearStorageId"
                            class="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors">
                      清除
                    </button>
                  </div>
                  
                  <!-- 策略选择 -->
                  <div class="flex gap-2">
                    <select v-model="storageId" 
                            @change="saveSettings"
                            class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            :disabled="!strategies.length">
                      <option value="">自动选择</option>
                      <option v-for="strategy in strategies" :key="strategy.id" :value="strategy.id">
                        {{ strategy.name }} (ID: {{ strategy.id }})
                      </option>
                    </select>
                    <button @click="refreshStrategies"
                            :disabled="!uploadUrl || !uploadToken"
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      <Icon icon="mdi:refresh" class="w-4 h-4" />
                      刷新
                    </button>
                  </div>
                  
                  <p v-if="!strategies.length" class="text-xs text-gray-500">
                    点击"刷新"按钮获取可用的存储策略
                  </p>
                </div>
              </div>

              <!-- 测试连接按钮 -->
              <div class="flex justify-end gap-2">
                <button @click="testConnection"
                        :disabled="!uploadUrl || !uploadToken"
                        class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  <Icon icon="mdi:connection" class="w-4 h-4" />
                  测试连接
                </button>
              </div>

              <!-- 测试结果 -->
              <div v-if="testResult" 
                   class="mt-3 p-3 rounded-lg"
                   :class="testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                <div class="flex items-start gap-2">
                  <Icon :icon="testResult.success ? 'mdi:check-circle' : 'mdi:alert-circle'" 
                        class="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span class="text-sm">{{ testResult.message }}</span>
                </div>
              </div>
            </div>

            <!-- 字体设置 -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center gap-2 mb-4">
                <Icon icon="mdi:format-font" class="w-5 h-5 text-blue-500" />
                <h4 class="text-lg font-semibold text-gray-700">字体引入设置</h4>
              </div>
              
              <!-- 字体CDN推荐 -->
              <div class="mb-4 p-3 bg-blue-50 rounded-lg">
                <div class="flex items-start gap-2">
                  <Icon icon="mdi:lightbulb-on" class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div class="text-xs text-gray-600">
                    <p class="font-medium mb-1">字体CDN推荐：</p>
                    <a href="https://chinese-font.netlify.app/zh-cn/cdn/" 
                       target="_blank" 
                       class="text-blue-500 hover:underline">
                      中文字体CDN服务
                    </a>
                    <p class="mt-1">可获取如：https://chinese-fonts-cdn.deno.dev/packages/sypxzs/dist/思源屏显臻宋/result.css</p>
                  </div>
                </div>
              </div>

              <!-- 添加字体 -->
              <div class="mb-4">
                <label class="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  添加字体
                  <Tooltip content="输入CSS链接，系统会自动获取字体名称">
                    <Icon icon="mdi:information-outline" class="w-4 h-4 text-gray-400 cursor-help" />
                  </Tooltip>
                </label>
                <div class="space-y-2">
                  <div class="flex gap-2">
                    <input type="text" 
                           v-model="newFontUrl"
                           @keyup.enter="addFont"
                           placeholder="输入字体CSS链接"
                           class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none">
                    <button @click="addFont"
                            :disabled="!newFontUrl || loadingFont"
                            class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                      <Icon v-if="loadingFont" icon="mdi:loading" class="w-4 h-4 animate-spin" />
                      <Icon v-else icon="mdi:plus" class="w-4 h-4" />
                      添加
                    </button>
                  </div>
                  
                  <!-- 手动输入字体名称 -->
                  <div v-if="showManualFontName" class="p-3 bg-yellow-50 rounded-lg">
                    <p class="text-sm text-yellow-800 mb-2">无法自动获取字体名称，请手动输入：</p>
                    <div class="flex gap-2">
                      <input type="text" 
                             v-model="manualFontName"
                             @keyup.enter="confirmManualFont"
                             placeholder="输入字体名称（例如：思源宋体）"
                             class="flex-1 px-3 py-2 border border-yellow-300 rounded focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none">
                      <button @click="confirmManualFont"
                              :disabled="!manualFontName"
                              class="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors disabled:opacity-50">
                        确定
                      </button>
                      <button @click="cancelManualFont"
                              class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 已引入的字体列表 -->
              <div v-if="importedFonts.length > 0" class="space-y-2">
                <label class="text-sm font-medium text-gray-700">已引入的字体</label>
                <div class="max-h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg">
                  <div v-for="(font, index) in importedFonts" 
                       :key="index"
                       class="flex items-center justify-between p-2 bg-white rounded border"
                       :class="{
                         'border-gray-200': font.status === 'success',
                         'border-yellow-300': font.status === 'loading',
                         'border-red-300': font.status === 'error'
                       }">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                      <!-- 状态图标 -->
                      <Icon v-if="font.status === 'loading'" 
                            icon="mdi:loading" 
                            class="w-4 h-4 text-yellow-500 animate-spin flex-shrink-0" />
                      <Icon v-else-if="font.status === 'success'" 
                            icon="mdi:check-circle" 
                            class="w-4 h-4 text-green-500 flex-shrink-0" />
                      <Icon v-else-if="font.status === 'error'" 
                            icon="mdi:alert-circle" 
                            class="w-4 h-4 text-red-500 flex-shrink-0" />
                      
                      <div class="flex-1 min-w-0 overflow-hidden">
                        <p class="text-sm font-medium truncate" :style="{ fontFamily: font.name }">
                          {{ font.name || '正在获取字体名称...' }}
                        </p>
                        <p class="text-xs text-gray-500 truncate">
                          {{ font.url }}
                        </p>
                        <p v-if="font.error" class="text-xs text-red-500 truncate">
                          {{ font.error }}
                        </p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-1 flex-shrink-0 ml-2">
                      <!-- 重试按钮 -->
                      <button v-if="font.status === 'error'"
                              @click="retryFont(index)"
                              class="p-1 text-yellow-500 hover:bg-yellow-50 rounded transition-colors"
                              title="重试">
                        <Icon icon="mdi:refresh" class="w-4 h-4" />
                      </button>
                      <!-- 删除按钮 -->
                      <button @click="removeFont(index)"
                              class="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="删除">
                        <Icon icon="mdi:delete" class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <p v-else class="text-xs text-gray-500 text-center py-4">
                还未引入任何字体
              </p>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script>
import { Icon } from '@iconify/vue';

export default {
  name: 'SettingsModal',
  components: {
    Icon,
    Tooltip: {
      props: ['content'],
      template: `
        <div class="relative inline-block group">
          <slot />
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg 
                      opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-10">
            {{ content }}
            <div class="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div class="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      `
    }
  },
  props: {
    modelValue: Boolean
  },
  emits: ['update:modelValue', 'settings-updated'],
  data() {
    return {
      mounted: false,
      uploadUrl: localStorage.getItem('upload_url') || import.meta.env.VITE_APP_UPLOAD_API_URL || '',
      uploadToken: localStorage.getItem('upload_token') || import.meta.env.VITE_APP_UPLOAD_API_TOKEN || '',
      storageId: localStorage.getItem('storage_id') || import.meta.env.VITE_APP_LSKY_STORAGE_ID || '',
      currentStorageId: localStorage.getItem('lsky_storage_id') || '',
      testResult: null,
      showToken: false,
      strategies: [],
      newFontUrl: '',
      loadingFont: false,
      importedFonts: JSON.parse(localStorage.getItem('imported_fonts') || '[]'),
      showManualFontName: false,
      manualFontName: '',
      pendingFontUrl: ''
    }
  },
  watch: {
    modelValue(val) {
      if (val) {
        this.mounted = true;
        this.testResult = null;
        this.currentStorageId = localStorage.getItem('lsky_storage_id') || '';
        // 如果有配置，自动获取策略列表
        if (this.uploadUrl && this.uploadToken) {
          this.refreshStrategies();
        }
      }
    }
  },
  methods: {
    onAfterLeave() {
      this.mounted = false;
    },
    saveSettings() {
      // 保存到localStorage
      localStorage.setItem('upload_url', this.uploadUrl);
      localStorage.setItem('upload_token', this.uploadToken);
      localStorage.setItem('storage_id', this.storageId);
      localStorage.setItem('imported_fonts', JSON.stringify(this.importedFonts));
      
      // 如果选择了固定策略，保存到lsky_storage_id
      if (this.storageId) {
        localStorage.setItem('lsky_storage_id', this.storageId);
        this.currentStorageId = this.storageId;
      }
      
      // 触发设置更新事件
      this.$emit('settings-updated', {
        uploadUrl: this.uploadUrl,
        uploadToken: this.uploadToken,
        storageId: this.storageId,
        importedFonts: this.importedFonts
      });
      
      // 加载所有字体
      this.loadAllFonts();
    },
    clearStorageId() {
      localStorage.removeItem('lsky_storage_id');
      this.currentStorageId = '';
      this.storageId = '';
      this.saveSettings();
      alert('已清除存储策略，下次上传时将重新选择');
    },
    async refreshStrategies() {
      try {
        const baseUrl = this.uploadUrl.replace(/\/upload$/, '');
        const strategiesUrl = baseUrl.replace('/v2', '/v1') + '/strategies';
        
        const headers = {
          'Accept': 'application/json'
        };
        
        if (this.uploadToken) {
          headers['Authorization'] = this.uploadToken.startsWith('Bearer ') 
            ? this.uploadToken 
            : `Bearer ${this.uploadToken}`;
        }
        
        const response = await fetch(strategiesUrl, {
          method: 'GET',
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === true && data.data && data.data.strategies) {
            this.strategies = data.data.strategies;
            console.log('获取到存储策略:', this.strategies);
          }
        }
      } catch (error) {
        console.error('获取存储策略失败:', error);
      }
    },
    async testConnection() {
      this.testResult = null;
      
      try {
        // 测试兰空图床连接
        const headers = {
          'Accept': 'application/json'
        };
        
        if (this.uploadToken) {
          headers['Authorization'] = this.uploadToken.startsWith('Bearer ') 
            ? this.uploadToken 
            : `Bearer ${this.uploadToken}`;
        }
        
        const baseUrl = this.uploadUrl.replace(/\/upload$/, '');
        const profileUrl = baseUrl.replace('/v2', '/v1') + '/profile';
        
        const response = await fetch(profileUrl, {
          method: 'GET',
          headers: headers
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.status === true) {
            this.testResult = {
              success: true,
              message: `连接成功！用户: ${data.data.name || data.data.username}`
            };
          } else {
            this.testResult = {
              success: false,
              message: '连接失败：API响应错误'
            };
          }
        } else {
          this.testResult = {
            success: false,
            message: `连接失败：HTTP ${response.status}`
          };
        }
      } catch (error) {
        this.testResult = {
          success: false,
          message: `连接失败：${error.message}`
        };
      }
    },
    
    async addFont() {
      if (!this.newFontUrl || this.loadingFont) return;
      
      this.loadingFont = true;
      try {
        // 检查是否已存在
        if (this.importedFonts.some(f => f.url === this.newFontUrl)) {
          alert('该字体已引入');
          this.newFontUrl = '';
          this.loadingFont = false;
          return;
        }
        
        // 先加载CSS
        this.loadFont(this.newFontUrl);
        
        // 尝试获取字体名称
        const fontName = await this.fetchFontName(this.newFontUrl);
        
        if (fontName) {
          // 自动获取成功
          await this.addFontWithName(this.newFontUrl, fontName);
          this.newFontUrl = '';
        } else {
          // 需要手动输入
          this.pendingFontUrl = this.newFontUrl;
          this.showManualFontName = true;
          this.manualFontName = '';
        }
      } catch (error) {
        console.error('添加字体失败:', error);
        alert('添加字体失败：' + error.message);
      } finally {
        this.loadingFont = false;
      }
    },
    
    async addFontWithName(url, name) {
      // 检查字体名称冲突
      if (this.importedFonts.some(f => f.name === name)) {
        alert(`字体名称“${name}”已存在，无法导入`);
        return false;
      }
      
      // 添加字体并设置初始状态
      const fontItem = {
        url: url,
        name: name,
        status: 'loading',
        error: null
      };
      
      this.importedFonts.push(fontItem);
      const index = this.importedFonts.length - 1;
      
      // 验证字体加载
      const loaded = await this.checkFontLoaded(name);
      
      if (loaded) {
        this.importedFonts[index].status = 'success';
      } else {
        this.importedFonts[index].status = 'error';
        this.importedFonts[index].error = '字体加载失败';
      }
      
      // 保存设置
      this.saveSettings();
      return true;
    },
    
    async confirmManualFont() {
      if (!this.manualFontName) return;
      
      await this.addFontWithName(this.pendingFontUrl, this.manualFontName);
      
      // 清理
      this.newFontUrl = '';
      this.pendingFontUrl = '';
      this.manualFontName = '';
      this.showManualFontName = false;
    },
    
    cancelManualFont() {
      this.newFontUrl = '';
      this.pendingFontUrl = '';
      this.manualFontName = '';
      this.showManualFontName = false;
    },
    
    async fetchFontName(url) {
      try {
        // 使用fetch尝试获取CSS内容
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          console.warn('无法直接获取CSS内容，可能是CORS限制');
          // 尝试从URL解析
          return this.parseFontNameFromUrl(url);
        }
        
        const cssText = await response.text();
        
        // 解析font-family（支持多种格式）
        const patterns = [
          /@font-face\s*{[^}]*font-family\s*:\s*['"]?([^'";}]+)['"]?/i,
          /font-family\s*:\s*['"]?([^'";}]+)['"]?/i
        ];
        
        for (const pattern of patterns) {
          const match = cssText.match(pattern);
          if (match) {
            return match[1].trim().replace(/['"]$/, '').replace(/^['"]/,'');
          }
        }
        
        // 如果无法从CSS解析，尝试从URL解析
        return this.parseFontNameFromUrl(url);
      } catch (error) {
        // CORS错误或其他网络错误
        console.warn('获取CSS内容失败:', error.message);
        return this.parseFontNameFromUrl(url);
      }
    },
    
    parseFontNameFromUrl(url) {
      // 从常见CDN URL格式中提取字体名
      const patterns = [
        /\/([^\/]+)\/result\.css/,  // chinese-fonts-cdn 格式
        /\/dist\/([^\/]+)\//,        // 其他常见格式
        /family=([^&]+)/             // Google Fonts 格式
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          return decodeURIComponent(match[1]).replace(/\+/g, ' ');
        }
      }
      
      return null;
    },
    
    loadFont(url) {
      // 加载字体CSS
      const existingLink = document.querySelector(`link[href="${url}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.setAttribute('data-font-import', 'true');
        document.head.appendChild(link);
      }
    },
    
    async checkFontLoaded(fontName, timeout = 5000) {
      // 使用Font Loading API检查字体是否加载
      try {
        // 等待一小段时间让CSS加载
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 尝试加载字体
        const fonts = await Promise.race([
          document.fonts.load(`16px "${fontName}"`),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Font load timeout')), timeout)
          )
        ]);
        
        // 检查字体是否真正可用
        return document.fonts.check(`16px "${fontName}"`);
      } catch (error) {
        console.error(`字体 "${fontName}" 加载失败:`, error);
        return false;
      }
    },
    
    loadAllFonts() {
      // 加载所有已保存的字体
      this.importedFonts.forEach(font => {
        this.loadFont(font.url);
      });
    },
    
    removeFont(index) {
      // 移除字体
      const font = this.importedFonts[index];
      
      // 移除CSS链接
      const link = document.querySelector(`link[href="${font.url}"]`);
      if (link) {
        link.remove();
      }
      
      // 从列表中移除
      this.importedFonts.splice(index, 1);
      
      // 保存设置
      this.saveSettings();
    },
    
    async retryFont(index) {
      // 重试加载字体
      const font = this.importedFonts[index];
      font.status = 'loading';
      font.error = null;
      
      // 重新加载字体
      this.loadFont(font.url);
      
      // 验证加载
      const loaded = await this.checkFontLoaded(font.name);
      
      if (loaded) {
        font.status = 'success';
      } else {
        font.status = 'error';
        font.error = '字体加载失败，请检查链接是否有效';
      }
      
      // 保存设置
      this.saveSettings();
    },
    
    async loadAndVerifyFonts() {
      // 加载所有字体
      this.importedFonts.forEach(font => {
        // 设置默认状态
        if (!font.status) {
          font.status = 'loading';
        }
        this.loadFont(font.url);
      });
      
      // 等待CSS加载
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 验证每个字体
      for (let i = 0; i < this.importedFonts.length; i++) {
        const font = this.importedFonts[i];
        if (font.name) {
          // 预加载字体到浏览器
          try {
            await document.fonts.load(`16px "${font.name}"`);
          } catch (e) {
            console.warn(`预加载字体 ${font.name} 失败:`, e);
          }
          
          const loaded = await this.checkFontLoaded(font.name);
          font.status = loaded ? 'success' : 'error';
          if (!loaded) {
            font.error = '字体加载失败';
          }
        } else {
          font.status = 'error';
          font.error = '缺少字体名称';
        }
      }
      
      // 保存更新后的状态
      this.saveSettings();
    }
  },
  
  async mounted() {
    // 加载并验证所有已保存的字体
    await this.loadAndVerifyFonts();
  }
}
</script>

<style scoped>
/* 自定义滚动条 */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>