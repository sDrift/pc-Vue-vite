<template>
  <div ref="containerRef" class="three-particles"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ===================== Props ===================== */
const props = defineProps({
  // 粒子模式: nebula 星云扩散 | sphere 粒子球体 | text 文字粒子
  mode: {
    type: String,
    default: 'nebula',
    validator: (v) => ['nebula', 'sphere', 'text'].includes(v),
  },
  // 粒子数量
  count: {
    type: Number,
    default: 3000,
  },
  // 主粒子颜色（字符串或数组，数组时为渐变颜色）
  color: {
    type: [String, Array],
    default: () => ['#00c6ff', '#0072ff', '#8e2de2', '#4a00e0'],
  },
  // 背景颜色
  backgroundColor: {
    type: String,
    default: '#03060d',
  },
  // 粒子尺寸
  size: {
    type: Number,
    default: 0.06,
  },
  // 粒子运动速度系数
  speed: {
    type: Number,
    default: 1.0,
  },
  // 文字粒子模式下显示的文字
  text: {
    type: String,
    default: 'HELLO',
  },
  // 球体模式半径
  sphereRadius: {
    type: Number,
    default: 5,
  },
  // 是否启用 OrbitControls 鼠标交互
  interactive: {
    type: Boolean,
    default: true,
  },
  // 是否自动旋转
  autoRotate: {
    type: Boolean,
    default: true,
  },
});

/* ===================== Emits ===================== */
const emit = defineEmits(['ready', 'click']);

/* ===================== 内部变量 ===================== */
const containerRef = ref(null);

let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let animationId = null;
let particles = null;        // THREE.Points
let particlesData = null;    // 粒子运动数据（速度、原始位置等）
let clock = null;

/* ===================== 工具：颜色转数组 ===================== */
const resolveColors = () => {
  const list = Array.isArray(props.color) ? props.color : [props.color];
  return list.map((c) => new THREE.Color(c));
};

/* ===================== 工具：创建圆形粒子贴图 ===================== */
const makeCircleTexture = () => {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.8)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
};

/* ===================== 生成粒子数据 ===================== */
const buildPositionsColorsMode = () => {
  const count = Math.max(100, Math.floor(props.count));
// const count = 1;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const palette = resolveColors();
  const data = new Array(count);

  if (props.mode === 'sphere') {
    const R = props.sphereRadius;
    for (let i = 0; i < count; i++) {
      // 均匀球面采样
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = R * (0.9 + Math.random() * 0.15);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = palette[i % palette.length];
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      data[i] = {
        ox: x, oy: y, oz: z,
        vx: (Math.random() - 0.5) * 0.003,
        vy: (Math.random() - 0.5) * 0.003,
        vz: (Math.random() - 0.5) * 0.003,
        phase: Math.random() * Math.PI * 2,
        amp: 0.12 + Math.random() * 0.2,
      };
    }
  } else if (props.mode === 'text') {
    // 使用 canvas 采样文字像素
    const canvas = document.createElement('canvas');
    const W = 1024;
    const H = 256;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const fontSize = Math.floor(H * 0.7);
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", Arial, sans-serif`;
    ctx.fillText(props.text || 'HELLO', W / 2, H / 2);
    const img = ctx.getImageData(0, 0, W, H).data;

    // 收集白色像素点
    const pts = [];
    const step = 2;
    for (let y = 0; y < H; y += step) {
      for (let x = 0; x < W; x += step) {
        const idx = (y * W + x) * 4;
        if (img[idx] > 128) pts.push([x, y]);
      }
    }

    const scaleX = 12 / W;   // 文字宽 12
    const scaleY = 3 / H;    // 文字高 3
    for (let i = 0; i < count; i++) {
      let x = 0, y = 0;
      if (pts.length > 0) {
        const p = pts[Math.floor(Math.random() * pts.length)];
        x = p[0];
        y = p[1];
      } else {
        x = Math.random() * W;
        y = Math.random() * H;
      }
      const px = (x - W / 2) * scaleX;
      const py = -(y - H / 2) * scaleY;
      const pz = (Math.random() - 0.5) * 0.3;
      positions[i * 3 + 0] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      const c = palette[i % palette.length];
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      data[i] = {
        ox: px, oy: py, oz: pz,
        vx: 0, vy: 0, vz: 0,
        phase: Math.random() * Math.PI * 2,
        amp: 0.05 + Math.random() * 0.08,
      };
    }
  } else {
    // nebula 模式：球形高斯分布的星云
    const spread = 10;
    for (let i = 0; i < count; i++) {
      // 高斯分布
      const r = (Math.random() + Math.random() + Math.random()) / 3;
      const radius = r * spread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const c = palette[i % palette.length];
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      data[i] = {
        ox: x, oy: y, oz: z,
        vx: (Math.random() - 0.5) * 0.002,
        vy: (Math.random() - 0.5) * 0.002,
        vz: (Math.random() - 0.5) * 0.002,
        phase: Math.random() * Math.PI * 2,
        amp: 0.2 + Math.random() * 0.4,
      };
    }
  }
  
  return { positions, colors, data };
};

/* ===================== 构建 Points ===================== */
const createParticles = () => {
  if (!scene) return;

  // 清理旧粒子
  if (particles) {
    scene.remove(particles);
    particles.geometry?.dispose();
    if (particles.material) {
      if (particles.material.map) particles.material.map.dispose();
      particles.material.dispose();
    }
    particles = null;
  }

  const { positions, colors, data } = buildPositionsColorsMode();
  particlesData = data;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: props.size,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    map: makeCircleTexture(),
    sizeAttenuation: true,
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);
};

/* ===================== 初始化场景 ===================== */
const initScene = () => {
  if (!containerRef.value) return;

  const W = containerRef.value.clientWidth;
  const H = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.backgroundColor);

  // 相机
  camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);
  camera.position.set(0, 0, props.mode === 'text' ? 8 : 16);

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(W, H);
  containerRef.value.appendChild(renderer.domElement);

  // 控制器
  if (props.interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = props.autoRotate;
    controls.autoRotateSpeed = 0.6;
  }

  clock = new THREE.Clock();

  createParticles();

  // 绑定点击事件
  if (renderer) {
    renderer.domElement.addEventListener('click', onCanvasClick);
  }

  // 就绪事件
  emit('ready', { scene, camera, renderer });

  animate();
  window.addEventListener('resize', handleResize);
};

const onCanvasClick = (evt) => {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((evt.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((evt.clientY - rect.top) / rect.height) * 2 + 1;
  emit('click', { x, y, event: evt });
};

/* ===================== 动画循环 ===================== */
const animate = () => {
  animationId = requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  const speed = props.speed;

  if (particles && particlesData) {
    const positionAttr = particles.geometry.getAttribute('position');
    const arr = positionAttr.array;
    const count = particlesData.length;

    if (props.mode === 'text') {
      // 文字粒子：沿原始位置做呼吸/漂浮
      for (let i = 0; i < count; i++) {
        const d = particlesData[i];
        const s = Math.sin(t * speed * 1.2 + d.phase) * d.amp;
        arr[i * 3 + 0] = d.ox + Math.cos(d.phase + t * 0.4 * speed) * 0.04;
        arr[i * 3 + 1] = d.oy + s;
        arr[i * 3 + 2] = d.oz + Math.sin(d.phase + t * 0.6 * speed) * 0.01;
      }
    } else if (props.mode === 'sphere') {
      // 球面粒子：整体旋转 + 局部抖动
      const rotY = 0.0015 * speed;
      for (let i = 0; i < count; i++) {
        const d = particlesData[i];
        const ox = d.ox, oy = d.oy, oz = d.oz;
        // Y 轴旋转
        const cos = Math.cos(rotY);
        const sin = Math.sin(rotY);
        const nx = ox * cos + oz * sin;
        const nz = -ox * sin + oz * cos;
        d.ox = nx;
        d.oz = nz;
        const s = Math.sin(t * speed + d.phase) * d.amp;
        // 沿法线方向波动
        const len = Math.hypot(nx, oy, nz) || 1;
        arr[i * 3 + 0] = nx + (nx / len) * s;
        arr[i * 3 + 1] = oy + (oy / len) * s;
        arr[i * 3 + 2] = nz + (nz / len) * s;
      }
    } else {
      // 星云：整体绕 Y 缓慢旋转 + 个体漂浮
      for (let i = 0; i < count; i++) {
        const d = particlesData[i];
        d.ox += d.vx * speed;
        d.oy += d.vy * speed;
        d.oz += d.vz * speed;
        const s = Math.sin(t * 0.6 * speed + d.phase) * d.amp;
        arr[i * 3 + 0] = d.ox + s;
        arr[i * 3 + 1] = d.oy + s * 0.7;
        arr[i * 3 + 2] = d.oz + Math.cos(t * 0.5 * speed + d.phase) * d.amp;
      }
    }

    positionAttr.needsUpdate = true;
    particles.rotation.y += 0.0005 * speed;
  }

  if (controls) controls.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
};

/* ===================== Resize ===================== */
const handleResize = () => {
  if (!containerRef.value || !renderer || !camera) return;
  const W = containerRef.value.clientWidth;
  const H = containerRef.value.clientHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
};

/* ===================== 暴露给父组件 ===================== */
const rebuild = () => {
  if (renderer) createParticles();
};

const setBackgroundColor = (color) => {
  if (scene) scene.background = new THREE.Color(color);
};

const setAutoRotate = (v) => {
  if (controls) controls.autoRotate = !!v;
};

defineExpose({
  rebuild,
  setBackgroundColor,
  setAutoRotate,
  isReady: () => !!renderer,
  getScene: () => scene,
  getCamera: () => camera,
  getRenderer: () => renderer,
});

/* ===================== 生命周期 & 监听 ===================== */
onMounted(async () => {
  await nextTick();
  initScene();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('click', onCanvasClick);
  }
  if (animationId) cancelAnimationFrame(animationId);
  if (controls) controls.dispose();
  if (particles) {
    particles.geometry?.dispose();
    if (particles.material) {
      if (particles.material.map) particles.material.map.dispose();
      particles.material.dispose();
    }
  }
  if (renderer) renderer.dispose();
  scene = camera = renderer = controls = particles = particlesData = clock = null;
});

// 监听需要重建粒子的 props
watch(
  () => [props.mode, props.count, props.color, props.text, props.sphereRadius],
  () => rebuild(),
);

// 监听可直接更新的 props
watch(
  () => props.size,
  (val) => {
    if (particles?.material) particles.material.size = val;
  },
);
watch(
  () => props.backgroundColor,
  (val) => setBackgroundColor(val),
);
watch(
  () => props.autoRotate,
  (v) => setAutoRotate(v),
);
</script>

<style scoped>
.three-particles {
  width: 100%;
  height: 100%;
  min-height: 300px;
  display: block;
  overflow: hidden;
  border-radius: 8px;
}
</style>
