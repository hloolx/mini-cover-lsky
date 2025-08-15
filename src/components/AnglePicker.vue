<template>
  <div class="angle-picker-container">
    <div 
      ref="picker"
      class="angle-picker"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    >
      <!-- 圆形背景 -->
      <div class="picker-circle">
        <!-- 渐变预览 -->
        <div 
          class="gradient-preview"
          :style="gradientPreviewStyle"
        ></div>
        <!-- 角度指示线 -->
        <div 
          class="angle-indicator"
          :style="{ transform: `rotate(${angle}deg)` }"
        >
          <div class="indicator-line"></div>
          <div class="indicator-handle"></div>
        </div>
      </div>
      <!-- 角度数值 -->
      <div class="angle-value">{{ Math.round(angle) }}°</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnglePicker',
  props: {
    modelValue: {
      type: Number,
      default: 0
    },
    startColor: {
      type: String,
      default: '#3b82f6'
    },
    endColor: {
      type: String,
      default: '#8b5cf6'
    }
  },
  data() {
    return {
      angle: this.modelValue,
      isDragging: false
    };
  },
  computed: {
    gradientPreviewStyle() {
      return {
        background: `linear-gradient(${this.angle}deg, ${this.startColor}, ${this.endColor})`
      };
    }
  },
  watch: {
    modelValue(newValue) {
      this.angle = newValue;
    }
  },
  methods: {
    handleMouseDown(e) {
      e.preventDefault();
      this.isDragging = true;
      this.updateAngle(e.clientX, e.clientY);
      
      document.addEventListener('mousemove', this.handleMouseMove);
      document.addEventListener('mouseup', this.handleMouseUp);
    },
    
    handleMouseMove(e) {
      if (this.isDragging) {
        this.updateAngle(e.clientX, e.clientY);
      }
    },
    
    handleMouseUp() {
      this.isDragging = false;
      document.removeEventListener('mousemove', this.handleMouseMove);
      document.removeEventListener('mouseup', this.handleMouseUp);
    },
    
    handleTouchStart(e) {
      e.preventDefault();
      const touch = e.touches[0];
      this.isDragging = true;
      this.updateAngle(touch.clientX, touch.clientY);
      
      document.addEventListener('touchmove', this.handleTouchMove);
      document.addEventListener('touchend', this.handleTouchEnd);
    },
    
    handleTouchMove(e) {
      if (this.isDragging) {
        const touch = e.touches[0];
        this.updateAngle(touch.clientX, touch.clientY);
      }
    },
    
    handleTouchEnd() {
      this.isDragging = false;
      document.removeEventListener('touchmove', this.handleTouchMove);
      document.removeEventListener('touchend', this.handleTouchEnd);
    },
    
    updateAngle(clientX, clientY) {
      const rect = this.$refs.picker.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;
      
      // 计算角度，符合CSS渐变定义
      // CSS: 0° = 向上, 90° = 向右, 180° = 向下, 270° = 向左
      // Math.atan2(y, x) 返回的角度: 右=0, 下=π/2, 左=π, 上=-π/2
      // 需要转换: atan2角度 + 90° 并调整到 0-360 范围
      let angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
      angle = angle + 90; // 调整使0°在顶部
      
      // 确保角度在 0-360 范围内
      if (angle < 0) angle += 360;
      if (angle >= 360) angle -= 360;
      
      this.angle = angle;
      this.$emit('update:modelValue', angle);
      this.$emit('change', angle);
    }
  },
  beforeUnmount() {
    // 清理事件监听器
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
};
</script>

<style scoped>
.angle-picker-container {
  display: inline-block;
  position: relative;
}

.angle-picker {
  width: 48px;
  height: 48px;
  position: relative;
  cursor: pointer;
  user-select: none;
}

.picker-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.gradient-preview {
  position: absolute;
  inset: 2px;
  border-radius: 50%;
  opacity: 0.3;
}

.angle-indicator {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  pointer-events: none;
}

.indicator-line {
  position: absolute;
  top: 2px;
  left: 50%;
  width: 2px;
  height: 22px;
  background: #3b82f6;
  transform: translateX(-50%);
}

.indicator-handle {
  position: absolute;
  top: 2px;
  left: 50%;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.angle-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 10px;
  font-weight: 600;
  color: #4b5563;
  pointer-events: none;
}

/* 悬停效果 */
.angle-picker:hover .picker-circle {
  border-color: #3b82f6;
}

/* 拖动时的效果 */
.angle-picker:active .picker-circle {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>