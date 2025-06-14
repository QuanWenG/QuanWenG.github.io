<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const displayedTitle = ref('')
const displayedText = ref('')
const titleText = 'Hello!这里是QuanWenG!'
const contentText = '你想要了解更多关于我的项目吗>_< ...'
const snowflakes = ref([])
const stars = ref([])

// 检测是否为移动设备的辅助函数
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 鼠标位置和光晕相关
const mouseX = ref(0)
const mouseY = ref(0)
const mouseGlow = ref(null)

// 添加毛玻璃透明度控制
const glassBoxOpacity = ref(0) // 初始透明度为0
const isGlassBoxVisible = ref(false) // 控制毛玻璃是否可见

// 添加字符抖动相关的函数
const splitTextToChars = (text) => {
  return text.split('').map((char, index) => ({
    char: char,
    id: index,
    isShaking: false
  }))
}

const titleChars = ref([])
const textChars = ref([])

const typeWriter = (text, displayRef, delay = 100, callback = null) => {
  let index = 0
  const timer = setInterval(() => {
    if (index < text.length) {
      displayRef.value += text.charAt(index)
      index++
    } else {
      clearInterval(timer)
      if (callback) callback()
    }
  }, delay)
}

const createStars = () => {
  const starArray = []
  const starCount = isMobileDevice() ? 30 : 80 // 移动端30颗，PC端80颗
  for (let i = 0; i < starCount; i++) {
    starArray.push({
      id: i,
      left: Math.random() * 100, // 0-100%
      top: Math.random() * 40, // 只在上方40%的区域
      size: 2 + Math.random() * (isMobileDevice() ? 4 : 4), // 移动端尺寸小一些
      opacity: 0.2 + Math.random() * 0.8, // 0.2-1.0 增加透明度范围
      animationDelay: Math.random() * 6, // 0-6秒延迟，增加随机性
      animationDuration: 1.5 + Math.random() * 2.5, // 1.5-4秒闪烁周期，更快的闪烁
      brightness: 0.3 + Math.random() * 0.7 // 0.3-1.0亮度
    })
  }
  stars.value = starArray
}

// 创建雪花
const createSnowflakes = () => {
  const flakes = []
  const snowflakeCount = isMobileDevice() ? 20 : 50 // 移动端20片，PC端50片
  for (let i = 0; i < snowflakeCount; i++) {
    const willDisappear = Math.random() < 0.8 // 80%的雪花会消失
    const animationDuration = 30 + Math.random() * 40 // 30-70秒
    flakes.push({
      id: i,
      left: Math.random() * 100,
      animationDelay: -Math.random() * animationDuration * 0.8,
      animationDuration: animationDuration,
      size: (isMobileDevice() ? 6 : 8) + Math.random() * (isMobileDevice() ? 8 : 8), // 移动端尺寸小一些
      opacity: 0.4 + Math.random() * 0.6,
      willDisappear: willDisappear
    })
  }
  snowflakes.value = flakes
}

// 鼠标移动事件处理
// 在现有的ref声明后添加
const learnMoreRef = ref(null)
const learnMoreColor = ref('rgba(255, 255, 255, 0.9)')
const learnMoreGlow = ref('none')

const handleMouseMove = (event) => {
  mouseX.value = event.clientX
  mouseY.value = event.clientY
  
  // 检测鼠标与"了解更多"的距离
  if (learnMoreRef.value && learnMoreRef.value.length > 0) {
    // 取第一个字符元素作为参考点
    const firstChar = learnMoreRef.value[0]
    if (firstChar && firstChar.getBoundingClientRect) {
      const rect = firstChar.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const distance = Math.sqrt(
        Math.pow(event.clientX - centerX, 2) + 
        Math.pow(event.clientY - centerY, 2)
      )
      
      // 200px范围内的颜色和光晕渐变
      if (distance <= 200) {
        const intensity = 1 - (distance / 200) // 距离越近，强度越大
        
        // 浅紫白色 RGB(200, 180, 230) - 比较浅的紫色
        const redValue = Math.floor(200 * intensity)
        const greenValue = Math.floor(180 * intensity)
        const blueValue = Math.floor(230 * intensity)
        
        // 从白色渐变到浅紫色
        const finalRed = Math.floor(255 - (255 - redValue) * intensity)
        const finalGreen = Math.floor(255 - (255 - greenValue) * intensity)
        const finalBlue = Math.floor(255 - (255 - blueValue) * intensity)
        
        learnMoreColor.value = `rgba(${finalRed}, ${finalGreen}, ${finalBlue}, ${0.9 + intensity * 0.1})`
        
        // 背景光晕效果 - 更浅的紫白色
        const glowIntensity = intensity * 0.6 // 光晕强度比文字浅
        const glowRed = Math.floor(220 + (235 - 220) * (1 - glowIntensity))
        const glowGreen = Math.floor(200 + (235 - 200) * (1 - glowIntensity))
        const glowBlue = Math.floor(240 + (255 - 240) * (1 - glowIntensity))
        
        learnMoreGlow.value = `
          0 0 10px rgba(${glowRed}, ${glowGreen}, ${glowBlue}, ${glowIntensity * 0.3}),
          0 0 20px rgba(${glowRed}, ${glowGreen}, ${glowBlue}, ${glowIntensity * 0.2}),
          0 0 30px rgba(${glowRed}, ${glowGreen}, ${glowBlue}, ${glowIntensity * 0.1})
        `
      } else {
        learnMoreColor.value = 'rgba(255, 255, 255, 0.9)' // 默认白色
        learnMoreGlow.value = 'none' // 无光晕
      }
    }
  }
}

// 跳转到GitHub页面
const goToGitHub = () => {
  window.open('https://github.com/QuanWenG', '_blank')
}

// 毛玻璃现身动画
const showGlassBox = () => {
  isGlassBoxVisible.value = true
  // 使用CSS transition实现渐显效果
  setTimeout(() => {
    glassBoxOpacity.value = 1
  }, 50) // 小延迟确保DOM更新
}

// 开始打字机效果
const startTypewriter = () => {
  typeWriter(titleText, displayedTitle, 150, () => {
    titleChars.value = splitTextToChars(displayedTitle.value)
    setTimeout(() => {
      typeWriter(contentText, displayedText, 100, () => {
        textChars.value = splitTextToChars(displayedText.value)
      })
    }, 500)
  })
}

// 添加加载状态
const isLoading = ref(true)

// 修改onMounted函数
onMounted(() => {
  // 预加载背景图片
  const img = new Image()
  img.src = '/background.webp'
  
  img.onload = () => {
    // 图片加载完成后，延迟一点时间再隐藏加载页，让用户看到加载完成
    setTimeout(() => {
      isLoading.value = false
      
      // 图片加载完成后开始原有的动画序列
      createSnowflakes()
      createStars()
      
      // 添加鼠标移动监听
      document.addEventListener('mousemove', handleMouseMove)
      
      // 页面加载动画时序：
      setTimeout(() => {
        showGlassBox()
        
        setTimeout(() => {
          startTypewriter()
        }, 1000)
      }, 500) // 缩短等待时间，因为图片已经加载完成
    }, 300) // 短暂延迟让用户感知到加载完成
  }
  
  img.onerror = () => {
    // 如果图片加载失败，也要隐藏加载页
    console.warn('背景图片加载失败')
    isLoading.value = false
    // 继续执行原有逻辑
    createSnowflakes()
    createStars()
    document.addEventListener('mousemove', handleMouseMove)
    setTimeout(() => {
      showGlassBox()
      setTimeout(() => {
        startTypewriter()
      }, 1000)
    }, 500)
  }
})
onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <!-- 加载页面 -->
  <div v-if="isLoading" class="loading-page">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">少女正在祈祷中...</p>
    </div>
  </div>
  
  <!-- 主内容 -->
  <div v-else class="container">
    <!-- 鼠标光晕效果 -->
    <div 
      class="mouse-glow"
      :style="{
        left: mouseX + 'px',
        top: mouseY + 'px'
      }"
    ></div>
    
<!-- 星星效果 -->
<div class="stars-container">
      <div 
        v-for="star in stars" 
        :key="star.id"
        class="star"
        :style="{
          left: star.left + '%',
          top: star.top + '%',
          width: star.size + 'px',
          height: star.size + 'px',
          opacity: star.opacity,
          animationDelay: star.animationDelay + 's',
          animationDuration: star.animationDuration + 's',
          filter: `brightness(${star.brightness})`
        }"
      >
        .
      </div>
    </div>

    <!-- 雪花效果 -->
    <div class="snow-container">
      <div 
        v-for="flake in snowflakes" 
        :key="flake.id"
        :class="['snowflake', { 'disappearing': flake.willDisappear }]"
        :style="{
          left: flake.left + '%',
          animationDelay: flake.animationDelay + 's',
          animationDuration: flake.animationDuration + 's',
          fontSize: flake.size + 'px',
          opacity: flake.opacity
        }"
      >
        ❄
      </div>
    </div>
    
    <!-- 毛玻璃盒子 -->
    <div 
      v-show="isGlassBoxVisible"
      class="glass-box"
      :style="{
        opacity: glassBoxOpacity,
        transition: 'opacity 1s ease-in-out'
      }"
    >
      <h2 class="typewriter-title">
        <template v-if="titleChars.length > 0">
          <span 
            v-for="charObj in titleChars" 
            :key="charObj.id"
            class="shakeable-char"
            @mouseenter="charObj.isShaking = true"
            @mouseleave="charObj.isShaking = false"
            :class="{ 'shaking': charObj.isShaking }"
          >
            {{ charObj.char }}
          </span>
        </template>
        <template v-else>
          {{ displayedTitle }}
        </template>
        <span class="cursor" v-show="displayedTitle.length < titleText.length">|</span>
      </h2>
      <p class="typewriter-text">
        <template v-if="displayedText.includes('了解更多') && textChars.length > 0">
          <template v-for="(charObj, index) in textChars" :key="charObj.id">
            <span 
              v-if="charObj.char !== '了' && charObj.char !== '解' && charObj.char !== '更' && charObj.char !== '多'"
              class="shakeable-char"
              @mouseenter="charObj.isShaking = true"
              @mouseleave="charObj.isShaking = false"
              :class="{ 'shaking': charObj.isShaking }"
            >
              {{ charObj.char }}
            </span>
            <!-- 当遇到"了"字符时，渲染整个"了解更多"链接 -->
            <span 
              v-else-if="charObj.char === '了' && index === displayedText.indexOf('了解更多')"
              ref="learnMoreRef"
              class="learn-more-link"
              :style="{ 
                color: learnMoreColor,
                textShadow: learnMoreGlow
              }"
              @click="goToGitHub"
            >
              了解更多
            </span>
            <!-- 跳过"解"、"更"、"多"字符，因为它们已经包含在上面的"了解更多"中 -->
          </template>
        </template>
        <template v-else-if="textChars.length > 0">
          <span 
            v-for="charObj in textChars" 
            :key="charObj.id"
            class="shakeable-char"
            @mouseenter="charObj.isShaking = true"
            @mouseleave="charObj.isShaking = false"
            :class="{ 'shaking': charObj.isShaking }"
          >
            {{ charObj.char }}
          </span>
        </template>
        <template v-else>
          {{ displayedText }}
        </template>
        <span class="cursor" v-show="displayedText.length > 0 && displayedText.length < contentText.length">|</span>
      </p>
    </div>
  </div>
</template>

<style scoped>
  .container{
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: url('/background.webp');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  /* 鼠标光晕效果 */
  .mouse-glow {
    position: fixed;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    pointer-events: none;
    z-index: 999;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle,
      rgba(135, 206, 235, 0.8) 0%,
      rgba(135, 206, 235, 0.6) 20%,
      rgba(135, 206, 235, 0.4) 40%,
      rgba(135, 206, 235, 0.2) 60%,
      rgba(135, 206, 235, 0.1) 80%,
      transparent 100%
    );
    filter: blur(12px);
    animation: smoothPulse 4s ease-in-out infinite;
  }
  
  /* 更圆滑的脉冲动画 */
  @keyframes smoothPulse {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.6;
    }
    25% {
      transform: translate(-50%, -50%) scale(1.0);
      opacity: 0.8;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 1.0;
    }
    75% {
      transform: translate(-50%, -50%) scale(1.0);
      opacity: 0.8;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0.6;
    }
  }
  
  /* 彩色渐变动画 */
  @keyframes colorShift {
    0% {
      background: radial-gradient(
        circle,
        rgba(255, 0, 150, 0.6) 0%,
        rgba(0, 255, 255, 0.4) 25%,
        rgba(255, 255, 0, 0.3) 50%,
        rgba(150, 0, 255, 0.2) 75%,
        transparent 100%
      );
    }
    25% {
      background: radial-gradient(
        circle,
        rgba(0, 255, 150, 0.6) 0%,
        rgba(255, 100, 255, 0.4) 25%,
        rgba(100, 255, 255, 0.3) 50%,
        rgba(255, 150, 0, 0.2) 75%,
        transparent 100%
      );
    }
    50% {
      background: radial-gradient(
        circle,
        rgba(150, 255, 0, 0.6) 0%,
        rgba(255, 0, 100, 0.4) 25%,
        rgba(0, 150, 255, 0.3) 50%,
        rgba(255, 255, 150, 0.2) 75%,
        transparent 100%
      );
    }
    75% {
      background: radial-gradient(
        circle,
        rgba(255, 150, 255, 0.6) 0%,
        rgba(150, 255, 0, 0.4) 25%,
        rgba(255, 0, 150, 0.3) 50%,
        rgba(0, 255, 100, 0.2) 75%,
        transparent 100%
      );
    }
    100% {
      background: radial-gradient(
        circle,
        rgba(255, 0, 150, 0.6) 0%,
        rgba(0, 255, 255, 0.4) 25%,
        rgba(255, 255, 0, 0.3) 50%,
        rgba(150, 0, 255, 0.2) 75%,
        transparent 100%
      );
    }
  }
  
  /* 脉冲动画 */
  @keyframes pulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0.8;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.2);
      opacity: 0.6;
    }
  }

  /* 星星容器 */
  .stars-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0; /* 在雪花下方 */
  }
  
  /* 星星样式 */
  .star {
    position: absolute;
    color: #ffffff;
    text-shadow: 
      0 0 6px rgba(255, 255, 255, 0.8),
      0 0 12px rgba(255, 255, 255, 0.6),
      0 0 18px rgba(255, 255, 255, 0.4);
    animation: starTwinkle infinite ease-in-out;
    font-size: inherit;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  /* 星星闪烁动画 - 增强版 */
  @keyframes starTwinkle {
    0% {
      opacity: 0.1;
      transform: scale(0.6);
      text-shadow: 
        0 0 4px rgba(255, 255, 255, 0.2),
        0 0 8px rgba(255, 255, 255, 0.1),
        0 0 12px rgba(255, 255, 255, 0.05);
    }
    25% {
      opacity: 0.6;
      transform: scale(0.9);
      text-shadow: 
        0 0 6px rgba(255, 255, 255, 0.6),
        0 0 12px rgba(255, 255, 255, 0.4),
        0 0 18px rgba(255, 255, 255, 0.2),
        0 0 24px rgba(255, 255, 255, 0.1);
    }
    50% {
      opacity: 1;
      transform: scale(1.4);
      text-shadow: 
        0 0 10px rgba(255, 255, 255, 1),
        0 0 20px rgba(255, 255, 255, 0.9),
        0 0 30px rgba(255, 255, 255, 0.7),
        0 0 40px rgba(255, 255, 255, 0.5),
        0 0 50px rgba(255, 255, 255, 0.3);
    }
    75% {
      opacity: 0.4;
      transform: scale(1.1);
      text-shadow: 
        0 0 8px rgba(255, 255, 255, 0.5),
        0 0 16px rgba(255, 255, 255, 0.3),
        0 0 24px rgba(255, 255, 255, 0.2),
        0 0 32px rgba(255, 255, 255, 0.1);
    }
    100% {
      opacity: 0.1;
      transform: scale(0.6);
      text-shadow: 
        0 0 4px rgba(255, 255, 255, 0.2),
        0 0 8px rgba(255, 255, 255, 0.1),
        0 0 12px rgba(255, 255, 255, 0.05);
    }
  }
  
  /* 雪花容器 */
  .snow-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 1;
  }
  
  /* 雪花飘落动画 - 修正Y轴范围和增强左右飘飞效果 */
  @keyframes fall {
    0% {
      transform: translateY(-100vh) translateX(0px) rotate(0deg);
    }
    10% {
      transform: translateY(-80vh) translateX(40px) rotate(36deg);
    }
    20% {
      transform: translateY(-60vh) translateX(-30px) rotate(72deg);
    }
    30% {
      transform: translateY(-40vh) translateX(60px) rotate(108deg);
    }
    40% {
      transform: translateY(-20vh) translateX(-45px) rotate(144deg);
    }
    50% {
      transform: translateY(0vh) translateX(70px) rotate(180deg);
    }
    60% {
      transform: translateY(20vh) translateX(-50px) rotate(216deg);
    }
    70% {
      transform: translateY(40vh) translateX(55px) rotate(252deg);
    }
    80% {
      transform: translateY(60vh) translateX(-40px) rotate(288deg);
    }
    90% {
      transform: translateY(80vh) translateX(35px) rotate(324deg);
    }
    100% {
      transform: translateY(100vh) translateX(-20px) rotate(360deg);
    }
  }
  
  /* 雪花样式 - 添加光晕效果 */
  .snowflake {
    position: absolute;
    top: -10px;
    color: rgba(255, 255, 255, 0.9);
    user-select: none;
    pointer-events: none;
    animation: fall ease-in-out infinite;
    /* 多层光晕效果 */
    text-shadow: 
      0 0 5px rgba(255, 255, 255, 0.8),
      0 0 10px rgba(255, 255, 255, 0.6),
      0 0 15px rgba(255, 255, 255, 0.4),
      0 0 20px rgba(173, 216, 230, 0.3),
      0 0 25px rgba(173, 216, 230, 0.2),
      0 0 30px rgba(173, 216, 230, 0.1);
    /* 添加光环动画 */
    filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
  }
  
  /* 会消失的雪花 - 增强光晕 */
  .snowflake.disappearing {
    animation: fallAndDisappear ease-in-out infinite;
    /* 消失雪花的光晕更强烈 */
    text-shadow: 
      0 0 8px rgba(255, 255, 255, 0.9),
      0 0 15px rgba(255, 255, 255, 0.7),
      0 0 22px rgba(255, 255, 255, 0.5),
      0 0 30px rgba(173, 216, 230, 0.4),
      0 0 40px rgba(173, 216, 230, 0.3),
      0 0 50px rgba(173, 216, 230, 0.2),
      0 0 60px rgba(135, 206, 250, 0.1);
    filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.8));
  }
  
  /* 添加光环闪烁动画 */
  @keyframes glowPulse {
    0%, 100% {
      text-shadow: 
        0 0 5px rgba(255, 255, 255, 0.8),
        0 0 10px rgba(255, 255, 255, 0.6),
        0 0 15px rgba(255, 255, 255, 0.4),
        0 0 20px rgba(173, 216, 230, 0.3),
        0 0 25px rgba(173, 216, 230, 0.2);
    }
    50% {
      text-shadow: 
        0 0 8px rgba(255, 255, 255, 1),
        0 0 15px rgba(255, 255, 255, 0.8),
        0 0 22px rgba(255, 255, 255, 0.6),
        0 0 30px rgba(173, 216, 230, 0.5),
        0 0 40px rgba(173, 216, 230, 0.4),
        0 0 50px rgba(135, 206, 250, 0.3);
    }
  }
  
  /* 为部分雪花添加闪烁效果 */
  .snowflake:nth-child(3n) {
    animation: fall ease-in-out infinite, glowPulse 3s ease-in-out infinite;
  }
  
  .snowflake.disappearing:nth-child(3n) {
    animation: fallAndDisappear ease-in-out infinite, glowPulse 3s ease-in-out infinite;
  }
  
  /* 为另一部分雪花添加不同频率的闪烁 */
  .snowflake:nth-child(5n) {
    animation: fall ease-in-out infinite, glowPulse 4.5s ease-in-out infinite;
  }
  
  .snowflake.disappearing:nth-child(5n) {
    animation: fallAndDisappear ease-in-out infinite, glowPulse 4.5s ease-in-out infinite;
  }
  
  /* 普通雪花飘落动画 - 增强左右飘飞效果 */
  @keyframes fall {
    0% {
      transform: translateY(-100vh) translateX(0px) rotate(0deg);
    }
    8% {
      transform: translateY(-84vh) translateX(80px) rotate(29deg);
    }
    16% {
      transform: translateY(-68vh) translateX(-60px) rotate(58deg);
    }
    24% {
      transform: translateY(-52vh) translateX(100px) rotate(87deg);
    }
    32% {
      transform: translateY(-36vh) translateX(-80px) rotate(116deg);
    }
    40% {
      transform: translateY(-20vh) translateX(120px) rotate(145deg);
    }
    48% {
      transform: translateY(-4vh) translateX(-90px) rotate(174deg);
    }
    56% {
      transform: translateY(12vh) translateX(110px) rotate(203deg);
    }
    64% {
      transform: translateY(28vh) translateX(-70px) rotate(232deg);
    }
    72% {
      transform: translateY(44vh) translateX(90px) rotate(261deg);
    }
    80% {
      transform: translateY(60vh) translateX(-60px) rotate(290deg);
    }
    88% {
      transform: translateY(76vh) translateX(70px) rotate(319deg);
    }
    96% {
      transform: translateY(92vh) translateX(-40px) rotate(348deg);
    }
    100% {
      transform: translateY(100vh) translateX(20px) rotate(360deg);
    }
  }
  
  /* 会消失的雪花动画 - 在半空中渐渐消失 */
  @keyframes fallAndDisappear {
    0% {
      transform: translateY(-100vh) translateX(0px) rotate(0deg);
      opacity: 1;
    }
    8% {
      transform: translateY(-84vh) translateX(80px) rotate(29deg);
      opacity: 1;
    }
    16% {
      transform: translateY(-68vh) translateX(-60px) rotate(58deg);
      opacity: 1;
    }
    24% {
      transform: translateY(-52vh) translateX(100px) rotate(87deg);
      opacity: 1;
    }
    32% {
      transform: translateY(-36vh) translateX(-80px) rotate(116deg);
      opacity: 1;
    }
    40% {
      transform: translateY(-20vh) translateX(120px) rotate(145deg);
      opacity: 0.8;
    }
    50% {
      transform: translateY(-5vh) translateX(-90px) rotate(180deg);
      opacity: 0.6;
    }
    60% {
      transform: translateY(10vh) translateX(110px) rotate(216deg);
      opacity: 0.4;
    }
    70% {
      transform: translateY(25vh) translateX(-70px) rotate(252deg);
      opacity: 0.2;
    }
    80% {
      transform: translateY(40vh) translateX(90px) rotate(288deg);
      opacity: 0.1;
    }
    90% {
      transform: translateY(55vh) translateX(-60px) rotate(324deg);
      opacity: 0.05;
    }
    100% {
      transform: translateY(70vh) translateX(70px) rotate(360deg);
      opacity: 0;
    }
  }
  
  .glass-box {
    width: 250px;
    height: 100px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 30px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    z-index: 2;
    top:-75px;
  }
  
  .typewriter-title {
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 20px 0;
    font-size: 20px;
    font-weight: 600;
    min-height: 24px;
  }
  
  .typewriter-text {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
    min-height: 24px;
    white-space: nowrap;
  }
  
  .cursor {
    animation: blink 1s infinite;
    color: rgba(255, 255, 255, 0.9);
  }
  
  @keyframes blink {
    0%, 50% {
      opacity: 1;
    }
    51%, 100% {
      opacity: 0;
    }
  }
</style>

<style scoped>
  .container{
    width: 100%;
    height: 100vh;
  }
  .bg{
    width: 100%;
    height: 100vh;
    object-fit: cover;
  }
  
  /* 了解更多链接样式 */
  .learn-more-link {
    cursor: pointer;
    transition: all 0.3s ease;
    text-decoration: none;
    position: relative;
    display: inline-block;
    padding: 5px; /* 减小检测区域，只保留少量padding */
    margin: -5px; /* 对应的负边距保持视觉位置 */
  }
  
  .learn-more-link:active {
    transform: scale(0.98);
  }
  
  /* 移除所有悬停效果和下划线 */
  .learn-more-link:hover {
    color: rgba(138, 43, 226, 1); /* 蓝紫色 */
    text-shadow: 
      0 0 5px rgba(138, 43, 226, 0.8),
      0 0 10px rgba(138, 43, 226, 0.6),
      0 0 15px rgba(138, 43, 226, 0.4);
    transform: scale(1.05);
  }
  
  .learn-more-link:active {
    transform: scale(0.98);
  }
  
  /* 移除下划线动画效果 */
  /* .learn-more-link::after 和 .learn-more-link:hover::after 已删除 */
  .learn-more-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: rgba(135, 206, 235, 0.8);
    transition: width 0.3s ease;
  }
  
  .learn-more-link:hover::after {
    width: 100%;
    box-shadow: 0 0 5px rgba(135, 206, 235, 0.6);
  }
  
</style>

<style scoped>
  /* 字符抖动效果 */
  .shakeable-char {
    display: inline-block;
    transition: transform 0.1s ease;
    cursor: default;
  }
  
  .shakeable-char.shaking {
    animation: charShake 0.3s ease-in-out infinite;
  }
  
  @keyframes charShake {
    0% { transform: translate(0, 0) rotate(0deg); }
    10% { transform: translate(-1px, -1px) rotate(-0.5deg); }
    20% { transform: translate(1px, -1px) rotate(0.5deg); }
    30% { transform: translate(-1px, 1px) rotate(-0.5deg); }
    40% { transform: translate(1px, 1px) rotate(0.5deg); }
    50% { transform: translate(-1px, 0px) rotate(-0.3deg); }
    60% { transform: translate(1px, 0px) rotate(0.3deg); }
    70% { transform: translate(0px, -1px) rotate(-0.2deg); }
    80% { transform: translate(0px, 1px) rotate(0.2deg); }
    90% { transform: translate(-0.5px, -0.5px) rotate(-0.1deg); }
    100% { transform: translate(0, 0) rotate(0deg); }
  }
  
  /* 确保"了解更多"链接的抖动效果与点击效果兼容 */
  .learn-more-link.shakeable-char {
    cursor: pointer;
  }
  
  .learn-more-link.shakeable-char:hover {
    color: rgba(138, 43, 226, 1);
    text-shadow: 
      0 0 5px rgba(138, 43, 226, 0.8),
      0 0 10px rgba(138, 43, 226, 0.6),
      0 0 15px rgba(138, 43, 226, 0.4);
    transform: scale(1.05);
  }
  
  .learn-more-link.shakeable-char:active {
    transform: scale(0.98);
  }
  
  /* 移除所有悬停效果和下划线 */
  .learn-more-link:hover {
    color: rgba(138, 43, 226, 1); /* 蓝紫色 */
    text-shadow: 
      0 0 5px rgba(138, 43, 226, 0.8),
      0 0 10px rgba(138, 43, 226, 0.6),
      0 0 15px rgba(138, 43, 226, 0.4);
    transform: scale(1.05);
  }
  
  .learn-more-link:active {
    transform: scale(0.98);
  }
  
  /* 移除下划线动画效果 */
  /* .learn-more-link::after 和 .learn-more-link:hover::after 已删除 */
  .learn-more-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 1px;
    background: rgba(135, 206, 235, 0.8);
    transition: width 0.3s ease;
  }
  
  .learn-more-link:hover::after {
    width: 100%;
    box-shadow: 0 0 5px rgba(135, 206, 235, 0.6);
  }
  
  /* 加载页面样式 */
.loading-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  transition: opacity 0.5s ease-out;
}

.loading-content {
  text-align: center;
  color: white;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.loading-text {
  font-size: 18px;
  font-weight: 300;
  letter-spacing: 2px;
  margin: 0;
  opacity: 0.9;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
