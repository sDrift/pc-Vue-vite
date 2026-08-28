<template>
  <div ref="containerRef" class="character-3d"></div>
</template>

<script setup>
/**
 * Character3D — 程序化生成 3D 人物模型组件
 *
 *  - 不依赖外部 GLB/GLTF 文件，用 Three.js 基础几何体 + Group 组装人偶
 *  - 肢体用层级 Group 做"骨骼"：肩/肘/髋/膝 分别作为独立枢轴点 → 天然支持摆动
 *  - 内置 3 种动作: 'idle'（站立小呼吸）/ 'walk'（向前走 + 摆臂 + 交替抬腿）/ 'wave'（右手挥）
 *  - 通过 OrbitControls 可以鼠标任意环绕观察
 */

import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/* ===================== Props ===================== */
const props = defineProps({
  // 预设动作 idle / walk / wave
  action: {
    type: String,
    default: 'idle',
    validator: (v) => ['idle', 'walk', 'wave'].includes(v),
  },
  // 走路速度（也影响挥手频率）
  speed: {
    type: Number,
    default: 1.0,
  },
  // 是否向前位移（walk 模式下，如果 false 就是原地踏步）
  moveForward: {
    type: Boolean,
    default: false,
  },
  // 人物整体缩放
  scale: {
    type: Number,
    default: 1.0,
  },
  // 皮肤颜色
  skinColor: {
    type: String,
    default: '#f2c6a0',
  },
  // 衣服颜色
  shirtColor: {
    type: String,
    default: '#4a90e2',
  },
  // 裤子颜色
  pantsColor: {
    type: String,
    default: '#2c3e50',
  },
  // 鞋子颜色
  shoeColor: {
    type: String,
    default: '#1a1a1a',
  },
  // 头发颜色
  hairColor: {
    type: String,
    default: '#3d2817',
  },
  // 背景色
  backgroundColor: {
    type: String,
    default: '#f0f0f0',
  },
  // 是否显示地面
  showGround: {
    type: Boolean,
    default: true,
  },
  // 允许鼠标拖拽
  interactive: {
    type: Boolean,
    default: true,
  },
  // 自动旋转镜头
  autoRotate: {
    type: Boolean,
    default: false,
  },
});

/* ===================== Emits ===================== */
const emit = defineEmits(['ready']);

/* ===================== 内部变量 ===================== */
const containerRef = ref(null);
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let animationId = null;
let clock = null;

// 根 & 骨骼"关节"节点（枢轴点）
let characterRoot = null;   // 角色整体根节点（位移用）
let bodyRoot = null;        // 身体根（上下呼吸用）
let headPivot = null;       // 头 ← 做左右点头
let shoulderL = null;       // 左肩（左臂绕肩转）
let shoulderR = null;       // 右肩（挥手动作绕右肩转）
let elbowL = null;          // 左肘
let elbowR = null;          // 右肘
let hipL = null;            // 左髋（大腿绕髋转）
let hipR = null;            // 右髋
let kneeL = null;           // 左膝
let kneeR = null;           // 右膝

// 存所有 mesh，切换颜色时统一替换
const colorableMeshes = {
  skin: [],   // 皮肤（头、手臂、手、腿）
  shirt: [],  // 躯干
  pants: [],  // 裤腿
  shoes: [],  // 鞋子
  hair: [],   // 头发
};

/* ===================== 材质工厂 ===================== */
const makeMat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({
    color,
    roughness: 0.75,
    metalness: 0.05,
    ...opts,
  });

/* ===================== 创建一个部件（带枢轴 Group + 偏移几何体） ===================== */
/**
 * 由于肢体需要绕关节旋转，正确做法是：
 *   pivot 放在关节点 → 子 mesh 向远端平移
 * 这样旋转 pivot 时就会以关节为圆心摆动
 *
 * @param {THREE.BufferGeometry} geo   几何体
 * @param {THREE.Material}       mat   材质
 * @param {THREE.Vector3}        offset mesh 在 pivot 内的偏移（让旋转中心在关节而不是几何中心）
 */
const buildLimb = (geo, mat, offset) => {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.copy(offset);
  pivot.add(mesh);
  return { pivot, mesh };
};

/* ===================== 组装人物 ===================== */
const buildCharacter = () => {
  if (characterRoot) {
    scene.remove(characterRoot);
    characterRoot.traverse((o) => {
      if (o.isMesh) {
        o.geometry?.dispose?.();
        o.material?.dispose?.();
      }
    });
  }
  // 清空颜色映射表
  Object.values(colorableMeshes).forEach((arr) => (arr.length = 0));

  const skin = makeMat(props.skinColor);
  const shirt = makeMat(props.shirtColor);
  const pants = makeMat(props.pantsColor);
  const shoe = makeMat(props.shoeColor);
  const hair = makeMat(props.hairColor);
  const eyeMat = makeMat('#222222', { roughness: 0.4, metalness: 0.2 });

  characterRoot = new THREE.Group();      // 角色整体：走路位移
  bodyRoot = new THREE.Group();           // 呼吸上下浮动
  characterRoot.add(bodyRoot);

  /* ----------------------------- 躯干 ----------------------------- */
  const torsoGeo = new THREE.BoxGeometry(1.0, 1.4, 0.55);
  const torsoMesh = new THREE.Mesh(torsoGeo, shirt);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  torsoMesh.position.y = 0;   // bodyRoot 原点设在躯干中心
  bodyRoot.add(torsoMesh);
  colorableMeshes.shirt.push(torsoMesh);

  /* ----------------------------- 头 ----------------------------- */
  // 头的枢轴放在脖子处（躯干顶部）
  headPivot = new THREE.Group();
  headPivot.position.set(0, 1.4 / 2, 0);   // 躯干顶部
  bodyRoot.add(headPivot);

  const headGeo = new THREE.SphereGeometry(0.36, 32, 32);
  const headMesh = new THREE.Mesh(headGeo, skin);
  headMesh.castShadow = true;
  headMesh.position.y = 0.36;  // 从脖子向上放一个球半径
  headPivot.add(headMesh);
  colorableMeshes.skin.push(headMesh);

  // 头发：头顶 + 稍扁的半球
  const hairGeo = new THREE.SphereGeometry(0.385, 32, 32, 0, Math.PI * 2, 0, Math.PI / 1.8);
  const hairMesh = new THREE.Mesh(hairGeo, hair);
  hairMesh.position.set(0, 0.36 + 0.02, 0.04);
  hairMesh.scale.set(1.02, 1.0, 1.02);
  headPivot.add(hairMesh);
  colorableMeshes.hair.push(hairMesh);

  // 眼睛
  const eyeGeo = new THREE.SphereGeometry(0.035, 16, 16);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.42, 0.31);
  eyeR.position.set(0.12, 0.42, 0.31);
  headPivot.add(eyeL);
  headPivot.add(eyeR);

  /* ----------------------------- 左臂 ----------------------------- */
  // 肩枢轴放在躯干左上角
  shoulderL = new THREE.Group();
  shoulderL.position.set(-(1.0 / 2 + 0.02), 1.4 / 2 - 0.1, 0);
  bodyRoot.add(shoulderL);

  // 上臂（向远端=下）延伸
  const upperArmLGeo = new THREE.BoxGeometry(0.22, 0.85, 0.22);
  const { pivot: _elbL, mesh: armLMesh } = buildLimb(
    upperArmLGeo,
    shirt,
    new THREE.Vector3(0, -0.85 / 2, 0),
  );
  elbowL = _elbL;
  elbowL.position.y = -0.85;     // 肘点在肩下方 = 上臂长度
  shoulderL.add(elbowL);
  colorableMeshes.shirt.push(armLMesh);

  // 前臂
  const foreArmLGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
  const foreArmL = new THREE.Mesh(foreArmLGeo, skin);
  foreArmL.castShadow = true;
  foreArmL.position.y = -0.75 / 2;
  elbowL.add(foreArmL);
  colorableMeshes.skin.push(foreArmL);

  // 手
  const handLGeo = new THREE.SphereGeometry(0.11, 20, 20);
  const handL = new THREE.Mesh(handLGeo, skin);
  handL.position.y = -0.75 - 0.02;
  elbowL.add(handL);
  colorableMeshes.skin.push(handL);

  /* ----------------------------- 右臂（同左臂对称） ----------------------------- */
  shoulderR = new THREE.Group();
  shoulderR.position.set(1.0 / 2 + 0.02, 1.4 / 2 - 0.1, 0);
  bodyRoot.add(shoulderR);

  const upperArmRGeo = new THREE.BoxGeometry(0.22, 0.85, 0.22);
  const { pivot: _elbR, mesh: armRMesh } = buildLimb(
    upperArmRGeo,
    shirt,
    new THREE.Vector3(0, -0.85 / 2, 0),
  );
  elbowR = _elbR;
  elbowR.position.y = -0.85;
  shoulderR.add(elbowR);
  colorableMeshes.shirt.push(armRMesh);

  const foreArmRGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
  const foreArmR = new THREE.Mesh(foreArmRGeo, skin);
  foreArmR.castShadow = true;
  foreArmR.position.y = -0.75 / 2;
  elbowR.add(foreArmR);
  colorableMeshes.skin.push(foreArmR);

  const handRGeo = new THREE.SphereGeometry(0.11, 20, 20);
  const handR = new THREE.Mesh(handRGeo, skin);
  handR.position.y = -0.75 - 0.02;
  elbowR.add(handR);
  colorableMeshes.skin.push(handR);

  /* ----------------------------- 左腿 ----------------------------- */
  // 髋枢轴放在躯干下沿
  hipL = new THREE.Group();
  hipL.position.set(-0.22, -1.4 / 2, 0);
  bodyRoot.add(hipL);

  const thighLGeo = new THREE.BoxGeometry(0.28, 1.0, 0.3);
  const { pivot: _kneeL, mesh: thighL } = buildLimb(
    thighLGeo,
    pants,
    new THREE.Vector3(0, -1.0 / 2, 0),
  );
  kneeL = _kneeL;
  kneeL.position.y = -1.0;
  hipL.add(kneeL);
  colorableMeshes.pants.push(thighL);

  const shinLGeo = new THREE.BoxGeometry(0.24, 0.95, 0.26);
  const shinL = new THREE.Mesh(shinLGeo, pants);
  shinL.castShadow = true;
  shinL.position.y = -0.95 / 2;
  kneeL.add(shinL);
  colorableMeshes.pants.push(shinL);

  // 脚
  const footLGeo = new THREE.BoxGeometry(0.28, 0.12, 0.5);
  const footL = new THREE.Mesh(footLGeo, shoe);
  footL.castShadow = true;
  // 膝盖下方=小腿末端，脚向前伸出 1/3
  footL.position.set(0, -0.95 - 0.06, 0.12);
  kneeL.add(footL);
  colorableMeshes.shoes.push(footL);

  /* ----------------------------- 右腿（对称） ----------------------------- */
  hipR = new THREE.Group();
  hipR.position.set(0.22, -1.4 / 2, 0);
  bodyRoot.add(hipR);

  const thighRGeo = new THREE.BoxGeometry(0.28, 1.0, 0.3);
  const { pivot: _kneeR, mesh: thighR } = buildLimb(
    thighRGeo,
    pants,
    new THREE.Vector3(0, -1.0 / 2, 0),
  );
  kneeR = _kneeR;
  kneeR.position.y = -1.0;
  hipR.add(kneeR);
  colorableMeshes.pants.push(thighR);

  const shinRGeo = new THREE.BoxGeometry(0.24, 0.95, 0.26);
  const shinR = new THREE.Mesh(shinRGeo, pants);
  shinR.castShadow = true;
  shinR.position.y = -0.95 / 2;
  kneeR.add(shinR);
  colorableMeshes.pants.push(shinR);

  const footRGeo = new THREE.BoxGeometry(0.28, 0.12, 0.5);
  const footR = new THREE.Mesh(footRGeo, shoe);
  footR.castShadow = true;
  footR.position.set(0, -0.95 - 0.06, 0.12);
  kneeR.add(footR);
  colorableMeshes.shoes.push(footR);

  /* ----------------------------- 整体高度校准 ----------------------------- */
  // 默认人物脚大约在 bodyRoot.y ≈ -(1.4/2 + 1.0 + 0.95) 左右
  // 让脚底站在 y = 0 处
  const footBottom = 1.4 / 2 + 1.0 + 0.95 + 0.12;
  bodyRoot.position.y = footBottom;

  characterRoot.scale.setScalar(props.scale);
  scene.add(characterRoot);
};

/* ===================== 应用颜色（props 变化时只换材质颜色，不重建） ===================== */
const applyColors = () => {
  const map = {
    skin: props.skinColor,
    shirt: props.shirtColor,
    pants: props.pantsColor,
    shoes: props.shoeColor,
    hair: props.hairColor,
  };
  for (const [key, color] of Object.entries(map)) {
    colorableMeshes[key]?.forEach((m) => {
      m.material.color.set(color);
    });
  }
};

/* ===================== 初始化场景 ===================== */
const initScene = () => {
  if (!containerRef.value) return;
  const W = containerRef.value.clientWidth;
  const H = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(props.backgroundColor);

  camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 500);
  camera.position.set(3.5 * props.scale, 3.5 * props.scale, 6.5 * props.scale);
  camera.lookAt(0, 2, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(W, H);
  containerRef.value.appendChild(renderer.domElement);

  if (props.interactive) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 2 * props.scale, 0);
    controls.autoRotate = props.autoRotate;
    controls.autoRotateSpeed = 0.8;
    controls.minDistance = 2 * props.scale;
    controls.maxDistance = 20 * props.scale;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;   // 不让镜头穿越地面
    controls.update();
  }

  /* ----------------- 灯光 ----------------- */
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 0.9);
  dir.position.set(6, 9, 5);
  dir.castShadow = true;
  dir.shadow.mapSize.set(1024, 1024);
  dir.shadow.camera.left = -8;
  dir.shadow.camera.right = 8;
  dir.shadow.camera.top = 8;
  dir.shadow.camera.bottom = -8;
  dir.shadow.camera.near = 0.5;
  dir.shadow.camera.far = 40;
  scene.add(dir);

  const rim = new THREE.DirectionalLight(0x9ec7ff, 0.35);
  rim.position.set(-5, 4, -5);
  scene.add(rim);

  /* ----------------- 地面 ----------------- */
  if (props.showGround) {
    const groundGeo = new THREE.PlaneGeometry(40, 40);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#d8d8d8',
      roughness: 0.95,
      metalness: 0,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // 地面阴影更柔和：加一个淡灰网格参考
    const grid = new THREE.GridHelper(20, 20, '#bbbbbb', '#e6e6e6');
    grid.position.y = 0.001;
    scene.add(grid);
  }

  buildCharacter();
  clock = new THREE.Clock();

  emit('ready', { scene, camera, renderer, characterRoot });
  window.addEventListener('resize', handleResize);
  animate();
};

/* ===================== 动画循环（动作） ===================== */
const animate = () => {
  animationId = requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const t = clock.elapsedTime * props.speed;

  if (characterRoot) {
    /* 所有动作先 reset 到默认姿势，再叠加动作量（简单/可控） */
    resetPose();

    if (props.action === 'walk') {
      animateWalk(t, dt);
    } else if (props.action === 'wave') {
      animateWave(t);
    } else {
      animateIdle(t);
    }
  }

  if (controls) controls.update();
  if (renderer) renderer.render(scene, camera);
};

/* 回到 T 字（标准站姿） */
const resetPose = () => {
  // 躯干
  bodyRoot.rotation.set(0, 0, 0);
  // 头
  headPivot.rotation.set(0, 0, 0);
  // 手臂（T字：两臂展开，这里采用自然下垂的站姿）
  shoulderL.rotation.set(0, 0, 0.05);   // 微向外
  shoulderR.rotation.set(0, 0, -0.05);
  elbowL.rotation.set(0, 0, 0);
  elbowR.rotation.set(0, 0, 0);
  // 腿：自然站立
  hipL.rotation.set(0, 0, 0);
  hipR.rotation.set(0, 0, 0);
  kneeL.rotation.set(0, 0, 0);
  kneeR.rotation.set(0, 0, 0);
};

/* 站立：呼吸起伏 + 头微晃 */
const animateIdle = (t) => {
  bodyRoot.position.y = bodyRoot.userData.baseY ?? bodyRoot.position.y;
  if (!('baseY' in bodyRoot.userData)) {
    bodyRoot.userData.baseY = bodyRoot.position.y;
  }
  // 呼吸：正弦上下
  bodyRoot.position.y = bodyRoot.userData.baseY + Math.sin(t * 1.8) * 0.03;
  // 头轻微左右摆
  headPivot.rotation.y = Math.sin(t * 1.2) * 0.08;
  headPivot.rotation.x = Math.sin(t * 0.9) * 0.04;
  // 肩膀微动
  shoulderL.rotation.z += Math.sin(t * 1.8) * 0.02;
  shoulderR.rotation.z -= Math.sin(t * 1.8) * 0.02;
};

/* 走路：交替摆臂 + 交替抬腿 + 可选整体前进 */
const animateWalk = (t, dt) => {
  // 基础呼吸
  if (!('baseY' in bodyRoot.userData)) {
    bodyRoot.userData.baseY = bodyRoot.position.y;
  }
  bodyRoot.position.y = bodyRoot.userData.baseY + Math.abs(Math.sin(t * 6)) * 0.04;

  const swingX = Math.sin(t * 6);       // 髋/肩前后摆动（绕X? 不，绕X是前后）
  const swingZ = Math.sin(t * 6) * 0.35; // 手臂辅助摆动量（绕Z错，实际应绕X轴前后）

  // 腿：左腿在前 -> 右腿在后，周期性交替
  // 旋转轴 X：正数=腿向前（脚跟向后抬起）
  hipL.rotation.x = swingX * 0.6;
  hipR.rotation.x = -swingX * 0.6;

  // 膝盖：后腿膝盖微弯（hip.x<0 说明腿在"后"，同时抬小腿膝盖弯曲）
  kneeL.rotation.x = Math.max(0, -swingX) * 0.7;
  kneeR.rotation.x = Math.max(0, swingX) * 0.7;

  // 手臂：与对应侧的腿反向
  shoulderL.rotation.x = -swingX * 0.5;
  shoulderR.rotation.x = swingX * 0.5;
  elbowL.rotation.x = Math.abs(swingX) * 0.25;    // 走路时肘始终弯一点
  elbowR.rotation.x = Math.abs(swingX) * 0.25;

  // 整体轻微左倾右倾（模拟步态）
  bodyRoot.rotation.z = Math.sin(t * 6) * 0.03;

  // 头保持看向前方，抵消身体一点晃动
  headPivot.rotation.z = -bodyRoot.rotation.z * 1.2;
  headPivot.rotation.x = Math.sin(t * 3) * 0.03;

  // 位移（可选）
  if (props.moveForward) {
    const forwardStep = props.speed * 1.2 * dt;
    characterRoot.position.z -= forwardStep;
  }
};

/* 挥手：右手抬起挥动，左手自然；身体 idle */
const animateWave = (t) => {
  // idle 呼吸
  if (!('baseY' in bodyRoot.userData)) {
    bodyRoot.userData.baseY = bodyRoot.position.y;
  }
  bodyRoot.position.y = bodyRoot.userData.baseY + Math.sin(t * 1.8) * 0.025;

  // 右肩抬起来（Z轴内旋 + X 向前抬起）
  shoulderR.rotation.z = -1.55;    // 右手向上举（左肩是+，右肩是-）
  shoulderR.rotation.x = -0.3;     // 略微向前
  elbowR.rotation.x = 0.35;        // 手肘微弯
  // 挥动手：手腕 + 肘 + 小幅度肩
  elbowR.rotation.z = Math.sin(t * 6) * 0.5;

  // 头向右上方看
  headPivot.rotation.y = -0.2;
  headPivot.rotation.x = 0.08;

  // 左手自然下垂并小幅前后
  shoulderL.rotation.x = Math.sin(t * 1.2) * 0.08;
  elbowL.rotation.x = 0.08;
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

/* ===================== 暴露方法 ===================== */
defineExpose({
  rebuild: () => {
    if (scene) buildCharacter();
  },
  setAutoRotate: (v) => {
    if (controls) controls.autoRotate = !!v;
  },
  isReady: () => !!renderer,
  getScene: () => scene,
  getCamera: () => camera,
  getRenderer: () => renderer,
  getCharacter: () => characterRoot,
});

/* ===================== 生命周期 / 监听 ===================== */
onMounted(async () => {
  await nextTick();
  initScene();
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  if (animationId) cancelAnimationFrame(animationId);
  if (controls) controls.dispose();
  if (renderer) {
    renderer.dispose();
    if (renderer.domElement?.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
  }
  scene = camera = renderer = controls = characterRoot = null;
});

// 颜色 / 缩放等不触发重建的 props 热更新
watch(
  () => [props.skinColor, props.shirtColor, props.pantsColor, props.shoeColor, props.hairColor],
  () => applyColors(),
);
watch(
  () => props.backgroundColor,
  (c) => scene && (scene.background = new THREE.Color(c)),
);
watch(
  () => props.autoRotate,
  (v) => controls && (controls.autoRotate = v),
);

// 触发重建的 props：scale
watch(
  () => props.scale,
  (s) => {
    if (characterRoot) characterRoot.scale.setScalar(s);
    if (camera) {
      camera.position.set(3.5 * s, 3.5 * s, 6.5 * s);
      controls?.target.set(0, 2 * s, 0);
      controls?.update();
    }
  },
);
</script>

<style scoped>
.character-3d {
  width: 100%;
  height: 100%;
  min-height: 360px;
  display: block;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
}
</style>
