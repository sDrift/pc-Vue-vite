<template>
  <div class="waterlogging-table-page">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-select
        v-model="searchForm.pointName"
        placeholder="点位名称查询"
        clearable
        class="search-select"
      >
        <el-option label="选项1" value="1" />
        <el-option label="选项2" value="2" />
      </el-select>
      <el-select
        v-model="searchForm.district"
        placeholder="区县查询"
        clearable
        class="search-select"
      >
        <el-option label="渝中区" value="yuzhong" />
        <el-option label="江北区" value="jiangbei" />
        <el-option label="九龙坡区" value="jiulongpo" />
        <el-option label="沙坪坝区" value="shapingba" />
      </el-select>
      <el-select v-model="searchForm.level" placeholder="等级查询" clearable class="search-select">
        <el-option label="一级预警" value="1" />
        <el-option label="二级预警" value="2" />
        <el-option label="三级预警" value="3" />
        <el-option label="四级预警" value="4" />
      </el-select>
      <el-button type="primary" class="search-btn" @click="handleSearch">查询</el-button>
    </div>

    <!-- 数据表格 -->
    <el-table :data="tableData" border class="data-table">
      <el-table-column prop="index" label="序号" width="80" align="center" />
      <el-table-column prop="district" label="区县" width="120" align="center" />
      <el-table-column prop="level" label="等级" width="120" align="center">
        <template #default="{ row }">
          <span :class="['level-tag', 'level-' + row.level]">
            {{ row.levelText }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="rainfall" label="降雨量" width="120" align="center" />
      <el-table-column prop="threshold" label="阈值" width="120" align="center" />
      <el-table-column prop="warningTime" label="预警时段" min-width="200" align="center" />
      <el-table-column label="操作" width="140" align="center">
        <template #default>
          <el-button type="primary" link size="small" @click="handleLocate">定位</el-button>
          <el-button type="primary" link size="small" @click="handleDetail">详情</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 底部按钮栏 -->
    <div class="bottom-bar">
      <div class="bottom-left">
        <el-button type="primary" class="bottom-btn">
          <el-icon><Document /></el-icon>
          最新事态
        </el-button>
        <el-button type="primary" class="bottom-btn">
          <el-icon><MapLocation /></el-icon>
          区域预警
        </el-button>
        <el-button type="primary" class="bottom-btn">
          <el-icon><Location /></el-icon>
          点位预警
        </el-button>
        <el-button type="primary" class="bottom-btn">
          <el-icon><Bell /></el-icon>
          点位告警
        </el-button>
      </div>
      <div class="bottom-right">
        <el-button type="primary" class="bottom-btn">
          <el-icon><Setting /></el-icon>
          组件
        </el-button>
        <el-button type="success" class="bottom-btn">
          <el-icon><Cpu /></el-icon>
          智能巡检
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Document, MapLocation, Location, Bell, Setting, Cpu } from '@element-plus/icons-vue'
import { ref, reactive } from 'vue'

const searchForm = reactive({
  pointName: '',
  district: '',
  level: '',
})

const tableData = ref([
  {
    index: 1,
    district: '渝中区',
    level: 1,
    levelText: '一级预警',
    rainfall: '36.2mm',
    threshold: '29mm',
    warningTime: '5/23 15:00-5/24 15:00',
  },
  {
    index: 2,
    district: '渝中区',
    level: 2,
    levelText: '二级预警',
    rainfall: '36.2mm',
    threshold: '29mm',
    warningTime: '5/23 15:00-5/24 15:00',
  },
  {
    index: 3,
    district: '渝中区',
    level: 3,
    levelText: '三级预警',
    rainfall: '36.2mm',
    threshold: '29mm',
    warningTime: '5/23 15:00-5/24 15:00',
  },
  {
    index: 4,
    district: '渝中区',
    level: 4,
    levelText: '四级预警',
    rainfall: '36.2mm',
    threshold: '29mm',
    warningTime: '5/23 15:00-5/24 15:00',
  },
])

const handleSearch = () => {
  console.log('查询条件:', searchForm)
}

const handleLocate = () => {
  console.log('定位')
}

const handleDetail = () => {
  console.log('详情')
}
</script>

<style scoped lang="scss">
.waterlogging-table-page {
  width: 100%;
  height: 100%;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background: transparent;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.search-select {
  width: 200px;

  :deep(.el-input__wrapper) {
    background: rgba(10, 40, 70, 0.8);
    border: 1px solid rgba(0, 150, 255, 0.4);
    border-radius: 2px;
  }

  :deep(.el-input__inner) {
    color: #fff;
  }

  :deep(.el-input__placeholder) {
    color: rgba(255, 255, 255, 0.5);
  }
}

.search-btn {
  background: linear-gradient(180deg, #1a8cff 0%, #0055cc 100%);
  border: none;
  color: #fff;
  border-radius: 2px;
  padding: 8px 24px;
}

/* 数据表格 */
.data-table {
  flex: 1;
  overflow: auto;

  :deep(.el-table) {
    background: transparent;
    color: #fff;
  }

  :deep(.el-table th) {
    background: rgba(10, 50, 90, 0.9);
    color: #fff;
    border-color: rgba(0, 150, 255, 0.3);
    font-weight: normal;
  }

  :deep(.el-table td) {
    background: rgba(10, 40, 70, 0.6);
    color: #fff;
    border-color: rgba(0, 150, 255, 0.2);
  }

  :deep(.el-table--border) {
    border-color: rgba(0, 150, 255, 0.3);
  }

  :deep(.el-table__row:hover > td) {
    background: rgba(0, 100, 200, 0.3) !important;
  }

  :deep(.el-table__body-wrapper) {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 150, 255, 0.5) transparent;
  }
}

/* 等级标签 */
.level-tag {
  display: inline-block;
  padding: 2px 12px;
  border-radius: 2px;
  font-size: 12px;
  color: #fff;
}

.level-1 {
  background: #e74c3c;
}

.level-2 {
  background: #e67e22;
}

.level-3 {
  background: #f1c40f;
  color: #333;
}

.level-4 {
  background: #2ecc71;
}

/* 底部按钮栏 */
.bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding: 0 4px;
}

.bottom-left,
.bottom-right {
  display: flex;
  gap: 10px;
}

.bottom-btn {
  background: linear-gradient(180deg, #1a8cff 0%, #0055cc 100%);
  border: none;
  color: #fff;
  border-radius: 2px;
  padding: 8px 16px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    background: linear-gradient(180deg, #3399ff 0%, #0066dd 100%);
  }
}

.bottom-right .bottom-btn:last-child {
  background: linear-gradient(180deg, #2ecc71 0%, #27ae60 100%);

  &:hover {
    background: linear-gradient(180deg, #3ddb80 0%, #2ecc71 100%);
  }
}
</style>
