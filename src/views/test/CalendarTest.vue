<template>
  <div class="calendar-test-container">
    <h1>日历组件测试</h1>

    <div class="calendar-wrapper">
      <h2>基本日历</h2>
      <Calendar @change="handleDateChange" />
    </div>

    <div class="calendar-wrapper">
      <h2>带初始选中日期的日历</h2>
      <Calendar v-model="selectedDate" @change="handleDateChange" />
    </div>

    <div v-if="selectedDate" class="selected-date-info">
      <h3>选中的日期：</h3>
      <p>{{ formatDate(selectedDate) }}</p>
    </div>
  </div>
</template>

<script>
import Calendar from '@/components/Calendar.vue'

export default {
  name: 'CalendarTest',
  components: {
    Calendar,
  },
  data() {
    return {
      // 设置默认选中日期为一周后
      selectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }
  },
  methods: {
    handleDateChange(date) {
      console.log('选中的日期:', date)
    },
    formatDate(date) {
      if (!date) return ''
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')

      return `${year}-${month}-${day}`
    },
  },
}
</script>

<style scoped>
.calendar-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.calendar-wrapper {
  margin-bottom: 40px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
}

.calendar-wrapper h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.selected-date-info {
  margin-top: 30px;
  padding: 20px;
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
}

.selected-date-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #1890ff;
  font-size: 16px;
}

.selected-date-info p {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 500;
}
</style>
