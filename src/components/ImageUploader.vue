<template>
  <button v-if="uploadApiUrl" 
          @click="uploadImage"
          :disabled="isUploading"
          class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
    <svg v-if="isUploading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
    </svg>
    {{ isUploading ? '上传中...' : '获取外链' }}
  </button>
  
  <!-- 上传弹窗 -->
  <div class="fixed top-0 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[600px] bg-white rounded-lg shadow-lg transition-all duration-300"
       :class="[showPopup ? 'opacity-100 visible translate-y-3' : 'opacity-0 invisible translate-y-0']">
    <div class="flex flex-col items-center justify-center p-4 text-center">
      <p v-if="isSuccess">{{ successMessage }}</p>
      <p v-else class="text-red-500">{{ errorMessage }}</p>
      <div v-if="isSuccess" class="mt-2 w-full">
        <div class="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <input 
            type="text" 
            :value="uploadedImageUrl"
            readonly
            class="flex-1 px-2 py-1 text-sm text-gray-700 bg-transparent border-none outline-none"
            @click="selectAllText"
          />
          <button 
            @click="copyUrl"
            class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            复制
          </button>
        </div>
        <p class="mt-1 text-xs text-blue-500">链接已自动复制到剪贴板</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageUploader',
  props: {
    canvasId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      uploadApiUrl: localStorage.getItem('upload_url') || import.meta.env.VITE_APP_UPLOAD_API_URL || '',
      uploadApiToken: localStorage.getItem('upload_token') || import.meta.env.VITE_APP_UPLOAD_API_TOKEN || '',
      storageId: localStorage.getItem('storage_id') || import.meta.env.VITE_APP_LSKY_STORAGE_ID || '',
      showPopup: false,
      uploadedImageUrl: '',
      isSuccess: false,
      successMessage: '',
      errorMessage: '',
      isUploading: false
    }
  },
  methods: {
    uploadImage() {
      // 防止重复点击
      if (this.isUploading) {
        return;
      }
      
      this.isUploading = true;
      const canvas = document.getElementById(this.canvasId);
      
      // 从全局状态获取导出设置
      import('../assets/script.js').then(({ state }) => {
        const format = state.exportFormat || 'webp';
        const quality = state.exportQuality || 0.95;
        const width = state.exportWidth || 1920;
        const height = state.exportHeight || 1080;
        
        // 创建临时画布用于调整尺寸
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const exportCtx = exportCanvas.getContext('2d');
        
        // 清空画布并填充白色背景
        exportCtx.fillStyle = '#ffffff';
        exportCtx.fillRect(0, 0, width, height);
        
        // 计算缩放比例
        const scaleX = width / canvas.width;
        const scaleY = height / canvas.height;
        
        // 绘制缩放后的内容
        exportCtx.scale(scaleX, scaleY);
        exportCtx.drawImage(canvas, 0, 0);
        
        // 确定MIME类型
        const mimeType = format === 'png' ? 'image/png' : 
                        format === 'jpeg' ? 'image/jpeg' : 
                        'image/webp';
        
        // 确定文件扩展名
        const extension = format === 'png' ? 'png' : 
                         format === 'jpeg' ? 'jpg' : 
                         'webp';
        
        const fileName = `Cover-${new Date().getTime()}.${extension}`;
        
        exportCanvas.toBlob(blob => {
          this.uploadToLsky(blob, fileName);
        }, mimeType, quality);
      });
    },
    uploadToLsky(blob, fileName = 'Canvas-Ruom.webp') {
      // 使用配置的存储策略ID
      const storageId = this.storageId || localStorage.getItem('lsky_storage_id') || '';
      if (!storageId) {
        this.showUploadResult('请先在设置中配置存储策略', false);
        this.isUploading = false;
        return;
      }
      
      const formData = new FormData();
      formData.append('file', blob, fileName);
      formData.append('storage_id', storageId);
        
        const headers = {
          'Accept': 'application/json'
        };
        
        // 兰空图床主要使用 Authorization header 进行认证
        if (this.uploadApiToken) {
          // 如果token没有Bearer前缀，自动添加
          if (!this.uploadApiToken.startsWith('Bearer ')) {
            headers['Authorization'] = `Bearer ${this.uploadApiToken}`;
          } else {
            headers['Authorization'] = this.uploadApiToken;
          }
        }
        
        console.log('上传到兰空图床:', this.uploadApiUrl);
        console.log('使用认证头:', headers.Authorization ? '已配置' : '未配置');
        console.log('使用存储策略ID:', storageId);
        
        fetch(this.uploadApiUrl, {
          method: 'POST',
          headers: headers,
          body: formData
        })
      .then(response => {
        console.log('响应状态:', response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('兰空图床响应:', data);
        
        // 兰空图床 v2 API 响应格式：
        // { "status": "success", "message": "successful", "data": { "public_url": "..." } }
        
        if ((data.status === 'success' || data.status === true) && data.data) {
          let imageUrl = null;
          
          // 尝试不同的响应格式
          if (data.data.public_url) {
            imageUrl = data.data.public_url;
          } else if (data.data.links && data.data.links.url) {
            imageUrl = data.data.links.url;
          } else if (data.data.url) {
            imageUrl = data.data.url;
          } else if (typeof data.data === 'string') {
            imageUrl = data.data;
          }
          
          if (imageUrl) {
            this.showUploadResult(imageUrl, true);
          } else {
            console.error('无法从响应中提取图片URL:', data);
            this.showUploadResult('上传成功但无法获取图片链接', false);
          }
        } else if (data.status === 'error' || data.status === false) {
          const errorMsg = data.message || data.msg || '未知错误';
          console.error('兰空图床返回错误:', errorMsg);
          this.showUploadResult('图片上传失败: ' + errorMsg, false);
        } else {
          console.error('未知响应格式:', data);
          this.showUploadResult('图片上传失败: 响应格式不正确', false);
        }
      })
      .catch(error => {
        console.error('上传请求失败:', error);
        
        // 可能是CORS问题
        if (error.message.includes('Failed to fetch')) {
          this.showUploadResult('上传失败: 可能是跨域问题(CORS)，请检查图床设置', false);
        } else {
          this.showUploadResult('上传失败: ' + error.message, false);
        }
      }).finally(() => {
        this.isUploading = false;
      });
    },
    showUploadResult(message, isSuccess) {
      this.isSuccess = isSuccess;
      if (isSuccess) {
        this.successMessage = '图片上传成功！';
        this.errorMessage = '';
        this.uploadedImageUrl = message;
        // 自动复制到剪贴板
        navigator.clipboard.writeText(message).then(() => {
          console.log('链接已复制到剪贴板');
        }).catch(err => {
          console.error('复制失败:', err);
        });
      } else {
        this.successMessage = '';
        this.errorMessage = message;
        this.uploadedImageUrl = '';
      }
      this.showPopup = true;
      // 延长显示时间，让用户有时间手动复制
      setTimeout(() => {
        this.showPopup = false;
      }, 5000);
    },
    
    selectAllText(event) {
      // 点击输入框时全选文本
      event.target.select();
    },
    
    copyUrl() {
      // 手动复制链接
      navigator.clipboard.writeText(this.uploadedImageUrl).then(() => {
        // 临时更改按钮文本提示
        const originalText = this.successMessage;
        this.successMessage = '复制成功！';
        setTimeout(() => {
          this.successMessage = originalText;
        }, 1500);
      }).catch(err => {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      });
    },
    handleStorageChange(e) {
      // 当localStorage变化时更新配置
      if (e.key === 'upload_url') {
        this.uploadApiUrl = e.newValue || '';
      } else if (e.key === 'upload_token') {
        this.uploadApiToken = e.newValue || '';
      } else if (e.key === 'storage_id' || e.key === 'lsky_storage_id') {
        this.storageId = e.newValue || '';
      }
    }
  },
  mounted() {
    // 监听设置更新
    window.addEventListener('storage', this.handleStorageChange);
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.handleStorageChange);
  }
};
</script> 