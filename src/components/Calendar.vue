<template>
  <div class="calendar-container">
    <!-- 日历头部 -->
    <div class="calendar-header">
      <button class="nav-btn" @click="previousYear">上一年</button>
      <button class="nav-btn" @click="previousMonth">上一月</button>
      <div class="header-center">
        <h3>{{ currentYear }}年 {{ currentMonth }}月</h3>
        <button class="today-btn" @click="goToToday">今天</button>
      </div>
      <button class="nav-btn" @click="nextMonth">下一月</button>
      <button class="nav-btn" @click="nextYear">下一年</button>
    </div>
    
    <!-- 星期标题行 -->
    <div class="calendar-weekdays">
      <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
    </div>
    
    <!-- 日期网格 -->
    <div class="calendar-days">
      <div 
        v-for="(day, index) in calendarDays" 
        :key="index"
        class="day"
        :class="{
          'other-month': !day.isCurrentMonth,
          'today': day.isToday,
          'selected': day.isSelected
        }"
        @click="selectDate(day)"
      >
        {{ day.date }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Calendar',
  props: {
    // 允许从父组件传入初始选中的日期
    value: {
      type: Date,
      default: null
    }
  },
  data() {
    return {
      currentDate: new Date(),
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth() + 1,
      selectedDate: this.value || null,
      weekdays: ['日', '一', '二', '三', '四', '五', '六'],
      calendarDays: []
    }
  },

    methods: {
      // 生成日历数据
      generateCalendarDays() {
        const daysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        const firstDayOfMonth = new Date(this.currentYear, this.currentMonth - 1, 1).getDay();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth - 1, 0).getDate();
        
        const days = [];
        
        // 添加上个月的日期
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
          const date = daysInPrevMonth - i;
          const fullDate = new Date(this.currentYear, this.currentMonth - 2, date);
          days.push({
            date,
            isCurrentMonth: false,
            isToday: this.isSameDay(fullDate, new Date()),
            isSelected: this.isSameDay(fullDate, this.selectedDate),
            fullDate
          });
        }
        
        // 添加当月的日期
        for (let i = 1; i <= daysInMonth; i++) {
          const fullDate = new Date(this.currentYear, this.currentMonth - 1, i);
          days.push({
            date: i,
            isCurrentMonth: true,
            isToday: this.isSameDay(fullDate, new Date()),
            isSelected: this.isSameDay(fullDate, this.selectedDate),
            fullDate
          });
        }
        
        // 添加下个月的日期以填满网格
        const remainingDays = 42 - days.length; // 6行7列 = 42个日期
        for (let i = 1; i <= remainingDays; i++) {
          const fullDate = new Date(this.currentYear, this.currentMonth, i);
          days.push({
            date: i,
            isCurrentMonth: false,
            isToday: this.isSameDay(fullDate, new Date()),
            isSelected: this.isSameDay(fullDate, this.selectedDate),
            fullDate
          });
        }
        
        this.calendarDays = days;
        console.log(this.calendarDays);
      },
      
      // 检查两个日期是否是同一天
      isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      },
      
      // 切换到上一个月
      previousMonth() {
        if (this.currentMonth === 1) {
          this.currentMonth = 12;
          this.currentYear -= 1;
        } else {
          this.currentMonth -= 1;
        }
      },
      
      // 切换到下一个月
      nextMonth() {
        if (this.currentMonth === 12) {
          this.currentMonth = 1;
          this.currentYear += 1;
        } else {
          this.currentMonth += 1;
        }
      },
      
      // 切换到上一年
      previousYear() {
        this.currentYear -= 1;
      },
      
      // 切换到下一年
      nextYear() {
        this.currentYear += 1;
      },
      
      // 选择日期
      selectDate(day) {
        this.selectedDate = new Date(day.fullDate);
        // 触发input事件，允许使用v-model
        this.$emit('input', this.selectedDate);
        // 触发change事件，提供更多灵活性
        this.$emit('change', this.selectedDate);
      },
      
      // 跳转到今天
      goToToday() {
        const today = new Date();
        this.currentYear = today.getFullYear();
        this.currentMonth = today.getMonth() + 1;
        this.selectedDate = today;
        this.$emit('input', this.selectedDate);
        this.$emit('change', this.selectedDate);
      }
    },
    created() {
      this.generateCalendarDays();
    },
  watch: {
    // 监听父组件传入的value变化
    value(newVal) {
      this.selectedDate = newVal;
      this.generateCalendarDays();
    },
    currentYear() {
      this.generateCalendarDays();
    },
    currentMonth() {
      this.generateCalendarDays();
    }
  }
}
</script>

<style scoped>
.calendar-container {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
}

.calendar-container:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.header-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.header-center h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.nav-btn {
  padding: 6px 12px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  transition: all 0.2s ease;
}

.nav-btn:hover {
  background-color: #e8e8e8;
  border-color: #d9d9d9;
  color: #333;
  transform: translateY(-1px);
}

.nav-btn:active {
  transform: translateY(0);
}

.today-btn {
  padding: 4px 10px;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.today-btn:hover {
  background-color: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.today-btn:active {
  transform: translateY(0);
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
  margin-bottom: 10px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  padding: 10px 0;
  color: #666;
  font-size: 14px;
}

.weekday:first-child, .weekday:last-child {
  color: #ff4d4f;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}

.day {
  text-align: center;
  padding: 12px 0;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  position: relative;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day:hover:not(.other-month) {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  transform: translateY(-1px);
}

.day:active:not(.other-month) {
  transform: translateY(0);
}

.day.other-month {
  color: #ccc;
  cursor: default;
  opacity: 0.6;
}

.day.today {
  background-color: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.day.selected {
  background-color: #1890ff;
  color: white;
  border-color: #1890ff;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.day.selected:hover {
  background-color: #40a9ff;
  border-color: #40a9ff;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .calendar-container {
    padding: 15px;
    margin: 0 10px;
  }
  
  .nav-btn {
    padding: 5px 8px;
    font-size: 11px;
  }
  
  .header-center h3 {
    font-size: 16px;
  }
  
  .day {
    padding: 8px 0;
    font-size: 13px;
    min-height: 35px;
  }
  
  .weekday {
    padding: 8px 0;
    font-size: 12px;
  }
}

/* 添加一些微妙的动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.calendar-days {
  animation: fadeIn 0.3s ease-out;
}
</style>