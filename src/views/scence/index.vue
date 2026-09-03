<template>
  <div class="flood-monitor-container">
    <!-- 顶部标题栏 -->
    <header class="header">
      <div class="header-left">
        <span class="title">城市内涝治理</span>
        <span class="subtitle">重庆市住房和城乡建设委员会</span>
      </div>
      <div class="header-right">
        <span class="time">{{ currentTime }}</span>
        <el-button type="primary" size="small" @click="refreshData">
          <Refresh />
          刷新数据
        </el-button>
      </div>
    </header>

    <div class="main-content">
      <!-- 左侧面板 -->
      <aside class="left-panel">
        <!-- 风险指标 -->
        <div class="panel-section">
          <div class="section-header">
            <Warning class="section-icon" />
            <span>风险指标</span>
          </div>
          <div class="risk-grid">
            <div class="risk-item">
              <div class="risk-value">1540</div>
              <div class="risk-label">风险点总数</div>
            </div>
            <div class="risk-item">
              <div class="risk-value">1320</div>
              <div class="risk-label">城市积水风险</div>
            </div>
            <div class="risk-item">
              <div class="risk-value">20</div>
              <div class="risk-label">城市内涝风险</div>
            </div>
            <div class="risk-item">
              <div class="risk-value">20</div>
              <div class="risk-label">管网风险</div>
            </div>
          </div>
          <div class="risk-details">
            <div class="detail-item">
              <span class="detail-icon">🏙️</span>
              <span>城市道路</span>
              <span class="detail-value">117个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🚇</span>
              <span>轨道交通出入口</span>
              <span class="detail-value">11个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🏠</span>
              <span>老旧小区</span>
              <span class="detail-value">554个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🚗</span>
              <span>地下车库</span>
              <span class="detail-value">34个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🏪</span>
              <span>地下商场</span>
              <span class="detail-value">26个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🏭</span>
              <span>工业园区</span>
              <span class="detail-value">16个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">🏥</span>
              <span>重点工地</span>
              <span class="detail-value">123个</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">⚡</span>
              <span>变电站区</span>
              <span class="detail-value">27个</span>
            </div>
          </div>
        </div>

        <!-- 风险监控 -->
        <div class="panel-section">
          <div class="section-header">
            <Monitor class="section-icon" />
            <span>风险监控</span>
          </div>
          <div class="monitor-tabs">
            <el-tabs v-model="activeMonitorTab" type="card" @tab-change="handleMonitorTabChange">
              <el-tab-pane label="工程进度" name="progress">
                <div class="progress-stats">
                  <span>
                    工程进度
                    <strong>39个</strong>
                  </span>
                  <span>
                    工程隐患
                    <strong>1501个</strong>
                  </span>
                </div>
                <el-table :data="projectList" border :height="180">
                  <el-table-column prop="name" label="名称" />
                  <el-table-column prop="region" label="区县" />
                  <el-table-column prop="person" label="项目负责人" />
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="隐患整改" name="hidden">
                <div class="hidden-stats">
                  <span>
                    已完工
                    <strong>3个</strong>
                  </span>
                  <span>
                    整治中
                    <strong>3个</strong>
                  </span>
                </div>
                <el-table :data="hiddenList" border :height="180">
                  <el-table-column prop="name" label="名称" />
                  <el-table-column prop="region" label="区县" />
                  <el-table-column prop="status" label="状态" />
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="历史整改记录" name="history">
                <el-table :data="historyList" border :height="220">
                  <el-table-column prop="name" label="名称" />
                  <el-table-column prop="region" label="区县" />
                  <el-table-column prop="time" label="整改时间" />
                </el-table>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 日常巡查 -->
        <div class="panel-section">
          <div class="section-header">
            <Calendar class="section-icon" />
            <span>日常巡查</span>
          </div>
          <div class="daily-tabs">
            <el-tabs v-model="activeDailyTab" type="card">
              <el-tab-pane label="今日巡查" name="today">
                <div class="daily-stat">
                  <span>巡查管网长度</span>
                  <span class="stat-value">925.74 km</span>
                </div>
                <div class="daily-grid">
                  <div class="daily-item">
                    <span class="daily-label">雨水口(座)</span>
                    <span class="daily-value">27266</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">雨水检查井(座)</span>
                    <span class="daily-value">20757</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">雨水泵站(座次)</span>
                    <span class="daily-value">24</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">上报问题清单</span>
                    <span class="daily-value">3个</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">完成整改工单</span>
                    <span class="daily-value">0个</span>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="本月累计" name="month">
                <div class="daily-stat">
                  <span>管网雨水管长度</span>
                  <span class="stat-value">484.07 km</span>
                </div>
                <div class="daily-grid">
                  <div class="daily-item">
                    <span class="daily-label">雨水口(座)</span>
                    <span class="daily-value">14960</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">检查井(座)</span>
                    <span class="daily-value">15937</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">雨水泵站(座次)</span>
                    <span class="daily-value">9个</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">上报问题清单</span>
                    <span class="daily-value">0个</span>
                  </div>
                  <div class="daily-item">
                    <span class="daily-label">完成整改工单</span>
                    <span class="daily-value">0个</span>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 建设改造 -->
        <div class="panel-section">
          <div class="section-header">
            <Tools class="section-icon" />
            <span>建设改造</span>
          </div>
          <div class="construction-info">
            <div class="construction-item">
              <span>计划建设改造管网长度</span>
              <span class="construction-value">1539.23km</span>
            </div>
            <div class="construction-item">
              <span>已完成建设改造长度</span>
              <span class="construction-value">141.89km</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- 中央地图区域 -->
      <main class="center-panel">
        <!-- 监测指标 -->
        <div class="monitor-indicators">
          <div class="indicator-item">
            <span class="indicator-label">隐患整改率</span>
            <span class="indicator-value">99.87%</span>
            <span class="indicator-target">目标值 100%</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">感知设备覆盖率</span>
            <span class="indicator-value">85.73%</span>
            <span class="indicator-target">目标值 100%</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">预警命中率</span>
            <span class="indicator-value">98.57%</span>
            <span class="indicator-target">目标值 100%</span>
          </div>
          <div class="indicator-item">
            <span class="indicator-label">闭环处置率</span>
            <span class="indicator-value">100.00%</span>
            <span class="indicator-target">目标值 100%</span>
          </div>
        </div>

        <!-- 地图区域 -->
        <div class="map-container">
          <div class="map-legend">
            <div class="legend-item">
              <span class="legend-color" style="background: #2d5a3d"></span>
              <span>低风险</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #3d7a4d"></span>
              <span>中风险</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #5d9a6d"></span>
              <span>高风险</span>
            </div>
            <div class="legend-item">
              <span class="legend-color" style="background: #7db88d"></span>
              <span>极高风险</span>
            </div>
          </div>
          <div ref="mapRef" class="map-content">
            <svg viewBox="0 0 600 400" class="map-svg">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#1a4d3a" />
                  <stop offset="100%" stop-color="#0d2d1f" />
                </linearGradient>
              </defs>
              <!-- 地图区域 -->
              <path
                d="M350,100 Q380,80 400,120 L420,140 Q440,160 430,180 L410,200 Q390,220 370,200 L350,180 Q330,160 340,140 Z"
                fill="url(#areaGradient)"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="380" y="155" fill="#a8e6cf" font-size="12">渝北区</text>

              <path
                d="M380,200 Q420,180 450,220 L470,260 Q450,280 430,260 L400,240 Q380,220 390,200 Z"
                fill="#2d5a3d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="420" y="235" fill="#a8e6cf" font-size="12">两江新区</text>

              <path
                d="M280,150 Q320,130 350,160 L370,190 Q350,210 320,190 L290,170 Q270,150 280,150 Z"
                fill="#3d7a4d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="315" y="175" fill="#a8e6cf" font-size="11">沙坪坝区</text>

              <path
                d="M320,200 Q350,180 380,210 L400,240 Q370,260 340,240 L310,220 Q290,200 320,200 Z"
                fill="#3d7a4d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="345" y="225" fill="#a8e6cf" font-size="11">高新区</text>

              <path
                d="M350,260 Q380,240 410,270 L430,300 Q400,320 370,300 L340,280 Q320,260 350,260 Z"
                fill="#5d9a6d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="375" y="285" fill="#a8e6cf" font-size="11">九龙坡区</text>

              <path
                d="M400,280 Q430,260 460,290 L480,320 Q450,340 420,320 L390,300 Q370,280 400,280 Z"
                fill="#2d5a3d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="430" y="305" fill="#a8e6cf" font-size="11">南岸区</text>

              <path
                d="M420,320 Q450,300 480,330 L500,360 Q470,380 440,360 L410,340 Q390,320 420,320 Z"
                fill="#2d5a3d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="455" y="345" fill="#a8e6cf" font-size="12">巴南区</text>

              <path
                d="M260,220 Q290,200 320,230 L340,260 Q310,280 280,260 L250,240 Q230,220 260,220 Z"
                fill="#5d9a6d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="285" y="245" fill="#a8e6cf" font-size="11">大渡口区</text>

              <path
                d="M220,180 Q250,160 280,190 L300,220 Q270,240 240,220 L210,200 Q190,180 220,180 Z"
                fill="#5d9a6d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="245" y="205" fill="#a8e6cf" font-size="11">江北区</text>

              <path
                d="M180,150 Q210,130 240,160 L260,190 L230,210 Q200,230 170,200 L150,170 Q160,150 180,150 Z"
                fill="#3d7a4d"
                stroke="#4ade80"
                stroke-width="1.5"
                class="map-area"
              />
              <text x="200" y="180" fill="#a8e6cf" font-size="10">渝中区</text>

              <!-- 风险点标记 -->
              <circle cx="250" cy="195" r="6" fill="#ef4444" class="risk-point">
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="380" cy="225" r="5" fill="#f97316" class="risk-point">
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="2.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="420" cy="285" r="4" fill="#eab308" class="risk-point">
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="320" cy="245" r="5" fill="#ef4444" class="risk-point">
                <animate
                  attributeName="opacity"
                  values="1;0.5;1"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </div>
          <div class="layer-control">
            <el-button type="text" @click="toggleLayer">
              <Files />
              图层管理
            </el-button>
          </div>
        </div>

        <!-- 底部功能按钮 -->
        <div class="bottom-controls">
          <div class="left-controls">
            <el-button type="primary" @click="exportData">
              <Download />
              组件中心
            </el-button>
            <el-button type="primary" @click="reportCenter">
              <Document />
              事件中心
            </el-button>
          </div>
          <div class="right-controls">
            <el-button type="success" @click="smartAssist">
              <Cpu />
              智能助手
            </el-button>
            <el-button type="success" @click="smartAnalysis">
              <DataLine />
              智能分析
            </el-button>
            <el-button type="primary" @click="exportReport">
              <Printer />
              导出报告
            </el-button>
          </div>
        </div>
      </main>

      <!-- 右侧面板 -->
      <aside class="right-panel">
        <!-- 内涝预警 -->
        <div class="panel-section">
          <div class="section-header">
            <Bell class="section-icon" />
            <span>内涝预警</span>
            <div class="header-right">
              <span>预警等级</span>
              <el-select v-model="warningLevel" size="small">
                <el-option label="最低等级" value="low" />
                <el-option label="一般等级" value="normal" />
                <el-option label="最高等级" value="high" />
              </el-select>
            </div>
          </div>
          <div class="warning-stats">
            <div class="warning-stat-item">
              <span class="stat-icon">📡</span>
              <span>感知设备</span>
              <span class="stat-num">3144个</span>
            </div>
            <div class="warning-stat-item">
              <span class="stat-icon">⚠️</span>
              <span>感知设备告警</span>
              <span class="stat-num alert">0个</span>
            </div>
          </div>
          <div class="region-tabs">
            <el-tabs v-model="activeRegionTab" type="card" :tab-position="'left'">
              <el-tab-pane label="区域(10)" name="region1">
                <div class="region-content">
                  <div class="region-item">
                    <span>轨道交通站点</span>
                    <span class="region-status normal">正常运行</span>
                  </div>
                  <div class="region-item">
                    <span>万州区站前路隧道</span>
                    <span class="region-status normal">正常运行</span>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="区域(11)" name="region2">
                <div class="region-content">
                  <div class="region-item">
                    <span>两江新区出入口</span>
                    <span class="region-status normal">正常运行</span>
                  </div>
                </div>
              </el-tab-pane>
              <el-tab-pane label="轻轨(6)" name="region3">
                <div class="region-content">
                  <div class="region-item">
                    <span>一号线隧道</span>
                    <span class="region-status normal">正常运行</span>
                  </div>
                  <div class="region-item">
                    <span>六号线隧道</span>
                    <span class="region-status normal">正常运行</span>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 泵站信息 -->
        <div class="panel-section">
          <div class="section-header">
            <Setting class="section-icon" />
            <span>泵站信息</span>
          </div>
          <div class="pump-tabs">
            <el-tabs v-model="activePumpTab" type="card">
              <el-tab-pane label="一级(0)" name="level1">
                <div class="pump-empty">暂无一级泵站</div>
              </el-tab-pane>
              <el-tab-pane label="二级(0)" name="level2">
                <div class="pump-empty">暂无二级泵站</div>
              </el-tab-pane>
              <el-tab-pane label="三级(3)" name="level3">
                <div class="pump-content">
                  <div class="pump-item">
                    <span>两江新区某泵站</span>
                    <span class="pump-status normal">正常运行</span>
                  </div>
                  <div class="pump-item">
                    <span>南岸区某泵站</span>
                    <span class="pump-status normal">正常运行</span>
                  </div>
                  <div class="pump-item">
                    <span>渝北区某泵站</span>
                    <span class="pump-status normal">正常运行</span>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </div>

        <!-- 内涝溯源 -->
        <div class="panel-section">
          <div class="section-header">
            <Search class="section-icon" />
            <span>内涝溯源</span>
          </div>
          <div class="trace-stats">
            <div class="trace-stat">
              <span>截流设施</span>
              <span class="trace-value">27/28个</span>
            </div>
            <div class="trace-stat">
              <span>调蓄点位</span>
              <span class="trace-value">124/124个</span>
            </div>
            <div class="trace-stat">
              <span>调蓄中点位</span>
              <span class="trace-value alert">0个</span>
            </div>
          </div>
        </div>

        <!-- 城市道路 -->
        <div class="panel-section">
          <div class="section-header">
            <MapLocation class="section-icon" />
            <span>城市道路</span>
          </div>
          <div class="road-info">
            <div class="road-item">
              <img
                src="https://neeko-copilot.bytedance.net/api/text2image?prompt=urban%20road%20flood%20monitoring%20camera%20view&image_size=portrait_4_3"
                alt="道路监控"
                class="road-image"
              />
              <div class="road-desc">
                <span>两江新区石门马河沟道路监控</span>
                <span class="road-time">更新时间: 2024-07-27 15:25:18</span>
              </div>
            </div>
            <div class="road-item">
              <img
                src="https://neeko-copilot.bytedance.net/api/text2image?prompt=urban%20street%20camera%20view%20clear%20weather&image_size=portrait_4_3"
                alt="道路监控"
                class="road-image"
              />
              <div class="road-desc">
                <span>两江新区南桥寺道路监控</span>
                <span class="road-time">更新时间: 2024-07-27 15:24:59</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 内涝处置 -->
        <div class="panel-section">
          <div class="section-header">
            <Operation class="section-icon" />
            <span>内涝处置</span>
          </div>
          <div class="disposal-stats">
            <div class="disposal-item">
              <span class="disposal-icon">📊</span>
              <span>积水告警事件</span>
              <span class="disposal-value">0件</span>
            </div>
            <div class="disposal-item">
              <span class="disposal-icon">✅</span>
              <span>已消除积点</span>
              <span class="disposal-value">0件</span>
            </div>
            <div class="disposal-item">
              <span class="disposal-icon">🚨</span>
              <span>紧急处置中</span>
              <span class="disposal-value">0件</span>
            </div>
          </div>
        </div>

        <!-- 事件详情 -->
        <div class="panel-section">
          <div class="section-header">
            <InfoFilled class="section-icon" />
            <span>事件详情</span>
          </div>
          <div class="event-content">
            <div class="event-empty">暂无事件</div>
          </div>
        </div>

        <!-- 雨天数据 -->
        <div class="panel-section">
          <div class="section-header">
            <Cloudy class="section-icon" />
            <span>雨天数据</span>
          </div>
          <div class="rainy-content">
            <div class="rainy-item">
              <span>点位: 总1864个</span>
            </div>
            <div class="rainy-item">
              <span>在线: 1840个</span>
            </div>
            <div class="rainy-item">
              <span>离线: 24个</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
// Element Plus 图标已在 main.js 全局注册（PascalCase），模板直接用 <Bell /> 即可

// 当前时间
const currentTime = ref('')

// 标签页状态
const activeMonitorTab = ref('progress')
const activeDailyTab = ref('today')
const activeRegionTab = ref('region1')
const activePumpTab = ref('level1')
const warningLevel = ref('normal')

// 数据列表
const projectList = ref([
  {
    name: '巴南区花溪河沿线排水管网整治工程(一期)',
    region: '巴南区',
    person: '王五',
  },
  {
    name: '南岸区茶园大道管网二期雨污分流改造',
    region: '南岸区',
    person: '赵六',
  },
  {
    name: '江北区五里店雨污分流管网改造工程',
    region: '江北区',
    person: '钱七',
  },
  { name: '渝北区空港新城雨污分流管网改造', region: '渝北区', person: '孙八' },
  { name: '北碚区同兴园区雨污分流改造工程', region: '北碚区', person: '周九' },
])

const hiddenList = ref([
  { name: '沙坪坝区某路段积水隐患', region: '沙坪坝区', status: '整治中' },
  { name: '九龙坡区某小区排水问题', region: '九龙坡区', status: '整治中' },
  { name: '大渡口区某道路管网堵塞', region: '大渡口区', status: '已完工' },
])

const historyList = ref([
  { name: '渝中区解放碑区域管网改造', region: '渝中区', time: '2024-06-15' },
  { name: '南岸区南坪商圈排水整治', region: '南岸区', time: '2024-06-10' },
  { name: '江北区观音桥管网修复', region: '江北区', time: '2024-06-05' },
])

// 更新时间
const updateTime = () => {
  const now = new Date()

  currentTime.value = now
    .toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(/\//g, '-')
}

// 刷新数据
const refreshData = () => {
  updateTime()
}

// 切换图层
const toggleLayer = () => {
  // 图层管理逻辑
}

// 导出数据
const exportData = () => {
  // 导出数据逻辑
}

// 事件中心
const reportCenter = () => {
  // 事件中心逻辑
}

// 智能助手
const smartAssist = () => {
  // 智能助手逻辑
}

// 智能分析
const smartAnalysis = () => {
  // 智能分析逻辑
}

// 导出报告
const exportReport = () => {
  // 导出报告逻辑
}

// 切换监控标签
const handleMonitorTabChange = (tab) => {
  activeMonitorTab.value = tab
}

// 挂载时初始化时间
onMounted(() => {
  updateTime()
  const timer = setInterval(updateTime, 1000)

  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<style scoped>
.flood-monitor-container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #0a1628 0%, #0d1f35 50%, #0a1628 100%);
  color: #e0e6ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部样式 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 30px;
  background: linear-gradient(
    90deg,
    rgb(0 64 128 / 60%) 0%,
    rgb(0 80 160 / 40%) 50%,
    rgb(0 64 128 / 60%) 100%
  );
  border-bottom: 1px solid rgb(45 180 255 / 30%);
}

.header-left {
  display: flex;
  flex-direction: column;
}

.title {
  font-size: 28px;
  font-weight: bold;
  color: #00d4ff;
  text-shadow: 0 0 20px rgb(0 212 255 / 50%);
}

.subtitle {
  font-size: 14px;
  color: #8892a6;
  margin-top: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.time {
  font-size: 16px;
  color: #a8e6cf;
  font-family: 'Courier New', monospace;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

/* 面板区域 */
.panel-section {
  background: rgb(0 40 80 / 50%);
  border-radius: 8px;
  border: 1px solid rgb(45 180 255 / 20%);
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgb(0 64 128 / 50%);
  border-bottom: 1px solid rgb(45 180 255 / 20%);
}

.section-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
  color: #00d4ff;
}

.section-header .header-right {
  margin-left: auto;
  gap: 10px;
}

/* 风险指标 */
.risk-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
}

.risk-item {
  background: rgb(0 80 120 / 40%);
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.risk-value {
  font-size: 24px;
  font-weight: bold;
  color: #00d4ff;
}

.risk-label {
  font-size: 12px;
  color: #8892a6;
  margin-top: 4px;
  display: block;
}

.risk-details {
  padding: 10px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-icon {
  font-size: 14px;
}

.detail-value {
  color: #00d4ff;
  font-weight: bold;
}

/* 监控表格 */
.monitor-tabs,
.daily-tabs {
  padding: 8px;
}

.progress-stats,
.hidden-stats {
  display: flex;
  gap: 20px;
  padding: 8px;
  color: #8892a6;
}

.progress-stats strong,
.hidden-stats strong {
  color: #00d4ff;
}

/* 日常巡查 */
.daily-stat {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.stat-value {
  color: #00d4ff;
  font-weight: bold;
  font-size: 16px;
}

.daily-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 10px;
}

.daily-item {
  background: rgb(0 80 120 / 30%);
  border-radius: 4px;
  padding: 8px;
}

.daily-label {
  font-size: 12px;
  color: #8892a6;
  display: block;
}

.daily-value {
  font-size: 16px;
  color: #a8e6cf;
  font-weight: bold;
}

/* 建设改造 */
.construction-info {
  padding: 10px;
}

.construction-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.construction-item:last-child {
  border-bottom: none;
}

.construction-value {
  color: #00d4ff;
  font-weight: bold;
}

/* 中央面板 */
.center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 监测指标 */
.monitor-indicators {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.indicator-item {
  background: rgb(0 40 80 / 50%);
  border-radius: 8px;
  border: 1px solid rgb(45 180 255 / 20%);
  padding: 15px;
  text-align: center;
}

.indicator-label {
  font-size: 14px;
  color: #8892a6;
  display: block;
}

.indicator-value {
  font-size: 28px;
  font-weight: bold;
  color: #00d4ff;
  display: block;
  margin: 8px 0;
}

.indicator-target {
  font-size: 12px;
  color: #5a9a6d;
}

/* 地图区域 */
.map-container {
  flex: 1;
  background: rgb(0 40 80 / 50%);
  border-radius: 8px;
  border: 1px solid rgb(45 180 255 / 20%);
  position: relative;
  overflow: hidden;
}

.map-legend {
  position: absolute;
  top: 15px;
  left: 15px;
  display: flex;
  gap: 20px;
  z-index: 10;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #a8e6cf;
}

.legend-color {
  width: 16px;
  height: 12px;
  border-radius: 2px;
}

.map-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px 80px;
}

.map-svg {
  width: 100%;
  max-width: 700px;
  height: auto;
}

.map-area {
  cursor: pointer;
  transition: all 0.3s ease;
}

.map-area:hover {
  fill: rgb(74 222 128 / 30%) !important;
}

.risk-point {
  cursor: pointer;
}

.layer-control {
  position: absolute;
  top: 15px;
  right: 15px;
}

/* 底部控制按钮 */
.bottom-controls {
  display: flex;
  justify-content: space-between;
}

.left-controls,
.right-controls {
  display: flex;
  gap: 10px;
}

/* 右侧面板 */
.right-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  overflow-y: auto;
}

/* 预警统计 */
.warning-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  border-bottom: 1px solid rgb(45 180 255 / 20%);
}

.warning-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.stat-num {
  font-size: 18px;
  font-weight: bold;
  color: #00d4ff;
}

.stat-num.alert {
  color: #ef4444;
}

/* 区域标签 */
.region-tabs {
  padding: 8px;
}

.region-content {
  padding: 10px;
}

.region-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.region-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.region-status.normal {
  background: rgb(34 197 94 / 20%);
  color: #22c55e;
}

/* 泵站信息 */
.pump-tabs {
  padding: 8px;
}

.pump-empty {
  text-align: center;
  padding: 20px;
  color: #5a6a7a;
}

.pump-content {
  padding: 10px;
}

.pump-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.pump-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.pump-status.normal {
  background: rgb(34 197 94 / 20%);
  color: #22c55e;
}

/* 溯源统计 */
.trace-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
}

.trace-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trace-value {
  font-size: 16px;
  font-weight: bold;
  color: #00d4ff;
}

.trace-value.alert {
  color: #ef4444;
}

/* 城市道路 */
.road-info {
  padding: 10px;
}

.road-item {
  margin-bottom: 12px;
}

.road-item:last-child {
  margin-bottom: 0;
}

.road-image {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
}

.road-desc {
  margin-top: 6px;
}

.road-desc span {
  font-size: 12px;
  color: #8892a6;
  display: block;
}

.road-time {
  font-size: 10px !important;
  margin-top: 4px;
}

/* 内涝处置 */
.disposal-stats {
  display: flex;
  justify-content: space-around;
  padding: 15px;
}

.disposal-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.disposal-icon {
  font-size: 20px;
  margin-bottom: 6px;
}

.disposal-value {
  font-size: 18px;
  font-weight: bold;
  color: #00d4ff;
}

/* 事件详情 */
.event-content {
  padding: 20px;
}

.event-empty {
  text-align: center;
  color: #5a6a7a;
}

/* 雨天数据 */
.rainy-content {
  padding: 15px;
}

.rainy-item {
  padding: 8px 0;
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.rainy-item:last-child {
  border-bottom: none;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgb(0 40 80 / 30%);
}

::-webkit-scrollbar-thumb {
  background: rgb(45 180 255 / 30%);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgb(45 180 255 / 50%);
}

/* 自定义Element Plus样式 */
.el-button {
  --el-button-text-color: #e0e6ed;
  --el-button-bg-color: rgb(0 100 180 / 50%);
  --el-button-border-color: rgb(45 180 255 / 50%);
}

.el-button:hover {
  --el-button-bg-color: rgb(0 120 200 / 60%);
  --el-button-border-color: rgb(45 180 255 / 80%);
}

.el-button--primary {
  --el-button-primary-bg-color: rgb(0 120 200 / 60%);
  --el-button-primary-border-color: rgb(45 180 255 / 80%);
}

.el-button--success {
  --el-button-success-bg-color: rgb(0 150 120 / 60%);
  --el-button-success-border-color: rgb(74 222 128 / 80%);
}

.el-tabs {
  --el-tabs-header-text-color: #8892a6;
  --el-tabs-active-text-color: #00d4ff;
  --el-tabs-header-bg-color: transparent;
}

.el-tab-pane {
  color: #e0e6ed;
}

.el-table {
  --el-table-bg-color: transparent;
  --el-table-text-color: #e0e6ed;

  font-size: 12px;
}

.el-table td,
.el-table th {
  border-bottom: 1px solid rgb(45 180 255 / 10%);
}

.el-table th {
  background: rgb(0 60 100 / 50%);
}

.el-table tr:hover > td {
  background: rgb(0 80 140 / 40%);
}
</style>
