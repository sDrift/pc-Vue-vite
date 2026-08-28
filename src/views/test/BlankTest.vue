<template>
  <div class="blank-test">
    <div class="number-input-wrapper">
      <h2>Element Select 同时展开和焦点控制</h2>
      
      <!-- 两个Select同时展开并控制焦点的示例 -->
      <div class="select-pair-container">
        
        <div class="select-controls">
          <el-button type="primary" @click="openBothSelects" class="control-btn">同时打开两个选择器</el-button>
          <el-button @click="focusSelect1" class="control-btn">聚焦到第一个选择器</el-button>
          <el-button @click="focusSelect2" class="control-btn">聚焦到第二个选择器</el-button>
          <el-button @click="closeBothSelects" class="control-btn">关闭两个选择器</el-button>
        </div>
        
        <div class="select-status">
          <h4>选择器状态信息：</h4>
          <div class="status-item">选择器1值: {{ select1Value || '未选择' }}</div>
          <div class="status-item">选择器2值: {{ select2Value || '未选择' }}</div>
          <div class="status-item">选择器1状态: {{ select1Visible ? '展开' : '收起' }}</div>
          <div class="status-item">选择器2状态: {{ select2Visible ? '展开' : '收起' }}</div>
        </div>
      </div>
      <div class="select-wrapper">
          <el-select 
            v-model="select1Value"
            ref="select1Ref"
            placeholder="请选择选项1"
            :popper-class="'custom-popper select1-popper'"
            @visible-change="handleSelect1VisibleChange"
            @change="handleSelect1Change"
            class="select-item"
          >
            <el-option
              v-for="option in options1"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          
          <el-select 
            v-model="select2Value"
            ref="select2Ref"
            placeholder="请选择选项2"
            :popper-class="'custom-popper select2-popper'"
            @visible-change="handleSelect2VisibleChange"
            @change="handleSelect2Change"
            class="select-item"
          >
            <el-option
              v-for="option in options2"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      
      <div class="section-divider"></div>
      
      <h2>数字输入测试</h2>
      <el-input
        v-model.number="inputNumber"
        placeholder="请输入数字"
        type="number"
        :min="0"
        :step="1"
        clearable
        @input="handleInput"
      />
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <div v-if="inputNumber !== null" class="input-value">
        输入的值: {{ inputNumber }}
      </div>
      
      <!-- 单选框组件 -->
      <div class="radio-group-wrapper">
        <h3>选择测试</h3>
        <el-radio-group v-model="radioValue" @change="handleRadioChange">
          <el-radio label="option1">选项一</el-radio>
          <el-radio label="option2">选项二</el-radio>
          <el-radio label="option3">选项三</el-radio>
        </el-radio-group>
        <div v-if="radioValue" class="radio-value">
        选择的值: {{ radioValue }}
      </div>
      
      <!-- 打印功能 -->
      <div class="print-wrapper">
        <el-button type="primary" @click="handlePrint" class="print-button">
          打印测试div
        </el-button>
      </div>
      
      <!-- 测试div - 只打印这个区域 -->
      <div id="print-test-div" ref="printDivRef" class="print-test-div">
        <h2>测试打印区域</h2>
        <div class="print-content">
          <p>这是一个用于测试打印功能的专用区域。</p>
          <p>当您点击打印按钮时，只会打印这个div的内容，而不会打印页面上的其他元素。</p>
          <div v-if="inputNumber !== null" class="print-input-info">
            您输入的数字是: {{ inputNumber }}
          </div>
          <div v-if="radioValue" class="print-radio-info">
            您选择的选项是: {{ radioValue }}
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { ElMessage } from 'element-plus';

// Select相关状态和数据
const select1Ref = ref(null);
const select2Ref = ref(null);
const select1Value = ref('');
const select2Value = ref('');
const select1Visible = ref(false);
const select2Visible = ref(false);

// 选项数据
const options1 = [
  { value: 'option1-1', label: '选项1-1' },
  { value: 'option1-2', label: '选项1-2' },
  { value: 'option1-3', label: '选项1-3' },
  { value: 'option1-4', label: '选项1-4' },
  { value: 'option1-5', label: '选项1-5' }
];

const options2 = [
  { value: 'option2-1', label: '选项2-1' },
  { value: 'option2-2', label: '选项2-2' },
  { value: 'option2-3', label: '选项2-3' },
  { value: 'option2-4', label: '选项2-4' },
  { value: 'option2-5', label: '选项2-5' }
];

// 创建自定义的下拉框显示方法
const showSelectDropdown = async (selectRef, isFirst = false) => {
  try {
    // 严格的安全检查
    if (!selectRef || !selectRef.value || !selectRef.value.$el) {
      console.warn('选择器引用不存在或无效');
      return false;
    }
    
    const selectInstance = selectRef.value;
    const isFirstSelect = selectRef === select1Ref;
    const popperClass = isFirstSelect ? 'select1-popper' : 'select2-popper';
    
    // 直接添加保持展开的类
    selectInstance.$el.classList.add('keep-dropdown-open');
    
    // 强制更新内部状态
    try {
      if (selectInstance.$data) {
        selectInstance.$data.menuVisible = true;
      }
      // 尝试访问内部属性
      if (selectInstance.toggleMenu) {
        // 不调用toggleMenu，避免触发表单重置逻辑
        // 而是直接设置内部状态
        try {
          selectInstance.menuVisible = true;
        } catch (e) {
          console.warn('设置menuVisible失败:', e);
        }
      }
    } catch (e) {
      console.warn('更新内部状态失败:', e);
    }
    
    // 等待DOM更新
    await nextTick();
    
    // 多重选择器查找策略，确保找到下拉框元素
    let popperElement = null;
    const selectId = selectInstance.$el.id || selectInstance.$el.getAttribute('data-select-id');
    
    // 策略1: 根据popper-class查找
    popperElement = document.querySelector(`.${popperClass}`);
    
    // 策略2: 如果找不到，查找所有el-popper
    if (!popperElement) {
      const allPoppers = document.querySelectorAll('.el-popper');
      for (const popper of allPoppers) {
        // 检查是否与当前选择器关联
        const relatedSelect = popper.getAttribute('x-placement') || popper.getAttribute('data-select');
        if (relatedSelect && selectInstance.$el.contains && selectInstance.$el.contains(popper)) {
          popperElement = popper;
          break;
        }
      }
    }
    
    // 策略3: 最后使用实例的popperElm
    if (!popperElement && selectInstance.popperElm) {
      popperElement = selectInstance.popperElm;
    }
    
    // 找到后强制设置样式
    if (popperElement) {
      // 添加标识类，方便后续查找
      popperElement.classList.add(popperClass);
      
      // 强制样式，确保下拉框在所有情况下都保持可见
      Object.assign(popperElement.style, {
        display: 'block',
        opacity: '1',
        position: 'fixed',
        zIndex: '2055',
        transform: 'none',
        pointerEvents: 'all',
        animation: 'none',
        transition: 'none',
        visibility: 'visible',
        left: `${selectInstance.$el.getBoundingClientRect().left}px`,
        top: `${selectInstance.$el.getBoundingClientRect().bottom + 5}px`
      });
    }
    
    // 额外的直接DOM操作，确保下拉框可见
    await nextTick();
    
    // 强制重绘
    if (selectInstance.$el) {
      const display = selectInstance.$el.style.display;
      selectInstance.$el.style.display = 'none';
      selectInstance.$el.offsetHeight; // 触发重绘
      selectInstance.$el.style.display = display;
    }
    
    return true;
  } catch (error) {
    console.error('显示下拉框时发生严重错误:', error);
    return false;
  }
};

// 创建一个持续保持下拉框可见的函数
const keepDropdownsVisible = () => {
  // 获取所有保持展开的下拉框并确保它们可见
  const popperElements = document.querySelectorAll('.el-popper.select1-popper, .el-popper.select2-popper');
  popperElements.forEach(popper => {
    Object.assign(popper.style, {
      display: 'block',
      opacity: '1',
      pointerEvents: 'all'
    });
  });
};

// 监听选择器点击事件，防止关闭
const preventSelectClose = (event) => {
  // 检查是否点击了选择器或其下拉框内部
  const isSelectArea = event.target.closest('.el-select.keep-dropdown-open') || 
                       event.target.closest('.select1-popper') || 
                       event.target.closest('.select2-popper');
  
  if (isSelectArea) {
    // 阻止事件冒泡，防止关闭
    event.stopPropagation();
  }
};

// 添加全局点击监听，防止选择器意外关闭
document.addEventListener('click', preventSelectClose, true);

// 同时打开两个选择器
const openBothSelects = async () => {
  try {
    // 重置状态
    select1Visible.value = false;
    select2Visible.value = false;
    
    // 清除所有可能的自定义样式
    try {
      document.querySelectorAll('.el-popper').forEach(popper => {
        try {
          popper.style.display = '';
          popper.style.position = '';
          popper.style.zIndex = '';
        } catch (e) {
          console.warn('清除下拉框样式失败:', e);
        }
      });
      
      // 清除选择器上的类
      document.querySelectorAll('.el-select.keep-dropdown-open').forEach(select => {
        select.classList.remove('keep-dropdown-open');
      });
    } catch (styleCleanError) {
      console.warn('清除样式时出错:', styleCleanError);
    }
    
    // 等待DOM更新
    await nextTick();
    
    // 尝试使用简化的方式依次打开选择器，避免复杂的交互
    let success = true;
    
    // 先显示第一个选择器
    if (success && select1Ref.value) {
      success = await showSelectDropdown(select1Ref, true);
      select1Visible.value = success;
    }
    
    // 等待一点时间再显示第二个选择器，避免事件冲突
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // 显示第二个选择器
      if (select2Ref.value) {
        success = await showSelectDropdown(select2Ref, false);
        select2Visible.value = success;
      }
    }
    
    // 等待DOM更新后调整位置
    if (success) {
      await nextTick();
      adjustPopperPositions();
      ElMessage.success('两个选择器已同时打开');
    } else {
      ElMessage.warning('部分选择器未能正常打开');
    }
  } catch (error) {
    console.error('打开选择器失败:', error);
    ElMessage.error('操作失败，请重试');
  }
};

// 调整下拉框位置，避免重叠
const adjustPopperPositions = () => {
  const popper1 = document.querySelector('.select1-popper');
  const popper2 = document.querySelector('.select2-popper');
  
  if (popper1 && popper2) {
    // 获取第一个下拉框的位置和尺寸
    const popper1Rect = popper1.getBoundingClientRect();
    
    // 调整第二个下拉框的位置，放在第一个下拉框下方
    popper2.style.top = `${popper1Rect.bottom + 10}px`;
    popper2.style.left = `${popper1Rect.left}px`;
    popper2.style.zIndex = '2055'; // 确保两个下拉框都在最上层
    popper1.style.zIndex = '2055';
  }
};

// 聚焦到第一个选择器
const focusSelect1 = async () => {
  if (select1Ref.value) {
    try {
      // 先聚焦
      select1Ref.value.focus();
      
      // 显示并保持第一个选择器打开
      const firstOpened = await showSelectDropdown(select1Ref);
      select1Visible.value = true;
      
      // 如果第二个选择器之前也是打开的，确保它保持打开
      if (select2Visible.value && select2Ref.value) {
        await showSelectDropdown(select2Ref);
      }
      
      // 调整位置
      await nextTick();
      adjustPopperPositions();
      
      ElMessage.info('已聚焦到第一个选择器并展开');
    } catch (error) {
      console.error('聚焦到第一个选择器失败:', error);
      ElMessage.error('聚焦操作失败');
    }
  }
};

// 聚焦到第二个选择器
const focusSelect2 = async () => {
  if (select2Ref.value) {
    try {
      // 先聚焦
      select2Ref.value.focus();
      
      // 显示并保持第二个选择器打开
      const secondOpened = await showSelectDropdown(select2Ref);
      select2Visible.value = true;
      
      // 如果第一个选择器之前也是打开的，确保它保持打开
      if (select1Visible.value && select1Ref.value) {
        await showSelectDropdown(select1Ref);
      }
      
      // 调整位置
      await nextTick();
      adjustPopperPositions();
      
      ElMessage.info('已聚焦到第二个选择器并展开');
    } catch (error) {
      console.error('聚焦到第二个选择器失败:', error);
      ElMessage.error('聚焦操作失败');
    }
  }
};

// 关闭两个选择器
const closeBothSelects = () => {
  if (select1Ref.value && select1Visible.value) {
    select1Ref.value.toggleMenu();
    select1Visible.value = false;
  }
  
  if (select2Ref.value && select2Visible.value) {
    select2Ref.value.toggleMenu();
    select2Visible.value = false;
  }
  
  ElMessage.info('已关闭所有选择器');
};



// 处理第一个选择器的显示状态变化
const handleSelect1VisibleChange = (visible) => {
  // 不再根据visible事件更新状态，始终保持打开
  console.log('选择器1状态变化事件:', visible ? '展开' : '收起');
};

// 处理第二个选择器的显示状态变化
const handleSelect2VisibleChange = (visible) => {
  // 不再根据visible事件更新状态，始终保持打开
  console.log('选择器2状态变化事件:', visible ? '展开' : '收起');
};

// 处理选择器1的值变化，确保选择后仍保持展开
const handleSelect1Change = async () => {
  try {
    // 使用宏任务延迟执行，确保DOM更新完成
    setTimeout(async () => {
      // 强制重新打开并保持选择器1
      if (select1Ref.value) {
        await showSelectDropdown(select1Ref);
        select1Visible.value = true;
      }
      
      // 同时确保选择器2也保持打开
      if (select2Ref.value) {
        await showSelectDropdown(select2Ref);
        select2Visible.value = true;
      }
      
      // 调整位置
      await nextTick();
      adjustPopperPositions();
      
      // 额外的保险措施，确保下拉框可见
      setTimeout(() => {
        keepDropdownsVisible();
      }, 50);
    }, 0);
  } catch (error) {
    console.error('处理选择器1值变化时出错:', error);
  }
};

// 处理选择器2的值变化，确保选择后仍保持展开
const handleSelect2Change = async () => {
  try {
    // 使用宏任务延迟执行，确保DOM更新完成
    setTimeout(async () => {
      // 强制重新打开并保持选择器2
      if (select2Ref.value) {
        await showSelectDropdown(select2Ref);
        select2Visible.value = true;
      }
      
      // 同时确保选择器1也保持打开
      if (select1Ref.value) {
        await showSelectDropdown(select1Ref);
        select1Visible.value = true;
      }
      
      // 调整位置
      await nextTick();
      adjustPopperPositions();
      
      // 额外的保险措施，确保下拉框可见
      setTimeout(() => {
        keepDropdownsVisible();
      }, 50);
    }, 0);
  } catch (error) {
    console.error('处理选择器2值变化时出错:', error);
  }
};

// 输入数字的响应式数据
const inputNumber = ref(null);
// 错误信息
const errorMessage = ref('');
// 单选框选中值
const radioValue = ref('');

// 处理输入事件，确保只接受数字
const handleInput = (value) => {
  errorMessage.value = '';
  
  // 检查是否为有效数字
  if (value && isNaN(value)) {
    errorMessage.value = '请输入有效的数字';
  }
};

// 处理单选框变化
const handleRadioChange = (value) => {
  console.log('选择的选项:', value);
};

// 监听输入值变化
watch(inputNumber, (newValue) => {
  console.log('输入的数字:', newValue);
});

// 创建一个ref来引用要打印的元素
const printDivRef = ref(null);

// 处理打印功能 - 直接通过元素引用打印
const handlePrint = () => {
  if (!printDivRef.value) {
    console.error('未找到要打印的元素引用');
    ElMessage.error('未找到要打印的元素');
    return;
  }
  
  try {
    ElMessage.info('正在准备打印内容...');
    
    // 方法1: 尝试使用vue-easy-print插件（如果可用）
    if (typeof window.$easyPrint === 'function') {
      window.$easyPrint.print(printDivRef.value, {
        title: '打印测试内容',
        showHeader: false,
        showFooter: false
      });
    } 
    // 方法2: 如果插件不可用，使用更可靠的原生方式
    else {
      printElementDirectly(printDivRef.value);
    }
    
  } catch (error) {
    console.error('打印失败，使用备用方案:', error);
    // 发生错误时自动回退到备用方法
    printElementDirectly(printDivRef.value);
  }
};

// 直接使用元素引用的打印方法（更可靠的实现）
const printElementDirectly = (element) => {
  // 创建打印样式
  const style = document.createElement('style');
  style.id = 'print-temp-style';
  style.textContent = `
    @media print {
      body > *:not(#print-temp-container) {
        display: none !important;
      }
      #print-temp-container {
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 20px !important;
        background: white !important;
        visibility: visible !important;
      }
      .print-test-div {
        border: none !important;
        padding: 0 !important;
      }
      .no-print {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(style);
  
  // 创建打印容器
  const printContainer = document.createElement('div');
  printContainer.id = 'print-temp-container';
  printContainer.style.position = 'fixed';
  printContainer.style.top = '0';
  printContainer.style.left = '0';
  printContainer.style.width = '100%';
  printContainer.style.height = '100%';
  printContainer.style.backgroundColor = 'white';
  printContainer.style.padding = '20px';
  printContainer.style.boxSizing = 'border-box';
  printContainer.style.zIndex = '9999';
  printContainer.style.visibility = 'hidden'; // 屏幕上隐藏，打印时可见
  
  // 克隆元素以保留所有样式和内容
  const clonedElement = element.cloneNode(true);
  printContainer.appendChild(clonedElement);
  document.body.appendChild(printContainer);
  
  // 打印函数
  const doPrint = () => {
    window.print();
    
    // 清理函数
    setTimeout(() => {
      // 移除临时容器和样式
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    
      const tempStyle = document.getElementById('print-temp-style');
      if (tempStyle && document.head.contains(tempStyle)) {
        document.head.removeChild(tempStyle);
      }
    
      // 移除事件监听器
      window.removeEventListener('afterprint', cleanup);
    }, 100);
  };
  
  // 打印后清理
  const cleanup = () => {
    // 确保清理临时元素
    const container = document.getElementById('print-temp-container');
    const tempStyle = document.getElementById('print-temp-style');
    
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
    
    if (tempStyle && document.head.contains(tempStyle)) {
      document.head.removeChild(tempStyle);
    }
    
    window.removeEventListener('afterprint', cleanup);
  };
  
  // 监听打印完成事件
  window.addEventListener('afterprint', cleanup);
  
  // 执行打印
  setTimeout(doPrint, 100);
};
</script>

<style scoped>
.blank-test {
  width: 100%;
  min-height: 100vh;
  background-color: #f5f7fa;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.number-input-wrapper {
  width: 100%;
  /* max-width: 400px; */
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  text-align: center;
}

h2 {
  margin-bottom: 20px;
  color: #303133;
  font-size: 20px;
}

h3 {
  margin-top: 30px;
  margin-bottom: 15px;
  color: #303133;
  font-size: 18px;
  text-align: left;
}

.el-input {
  margin-bottom: 15px;
}

.radio-group-wrapper {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.el-radio {  
  margin-right: 20px;
  margin-bottom: 10px;
}

/* Select相关样式 */
.select-pair-container {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.select-wrapper {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.select-item {
  flex: 1;
  min-width: 200px;
}

.select-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.control-btn {
  flex: 1;
  min-width: 150px;
}

.select-status {
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  border: 1px solid #ebeef5;
  text-align: left;
}

.select-status h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
}

.status-item {
  margin-bottom: 5px;
  color: #606266;
  font-size: 14px;
}

.section-divider {
  height: 2px;
  background-color: #ebeef5;
  margin: 30px 0;
}

/* 自定义下拉框样式 */
:deep(.custom-popper) {
  z-index: 2055 !important;
}

/* 确保两个下拉框可以同时显示 */
:deep(.el-select.open .el-input__wrapper) {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 选择器下拉框基础样式 - 最高优先级 */
:deep(.select1-popper),
:deep(.select2-popper) {
  display: block !important;
  position: fixed !important;
  z-index: 2055 !important;
  opacity: 1 !important;
  transform: none !important;
  pointer-events: all !important;
  animation: none !important;
  transition: none !important;
  visibility: visible !important;
  left: auto !important;
  top: auto !important;
}

/* 保持下拉框打开的类 - 最高优先级 */
:deep(.el-select.keep-dropdown-open) .el-popper,
:deep(.el-select.keep-dropdown-open) .el-select-dropdown {
  display: block !important;
  position: fixed !important;
  z-index: 2055 !important;
  opacity: 1 !important;
  transform: none !important;
  pointer-events: all !important;
  animation: none !important;
  transition: none !important;
  visibility: visible !important;
  left: auto !important;
  top: auto !important;
}

/* 确保下拉框在所有状态下都保持可见 */
:deep(.el-select.keep-dropdown-open) .el-popper.is-enter,
:deep(.el-select.keep-dropdown-open) .el-popper.is-leave,
:deep(.el-select.keep-dropdown-open) .el-select-dropdown.is-enter,
:deep(.el-select.keep-dropdown-open) .el-select-dropdown.is-leave {
  display: block !important;
  opacity: 1 !important;
  transform: none !important;
  pointer-events: all !important;
  visibility: visible !important;
}

/* 防止点击选项时关闭 - 阻止冒泡 */
:deep(.el-select.keep-dropdown-open) .el-select-dropdown__item {
  pointer-events: all;
  cursor: pointer;
  /* 阻止事件冒泡到父级 */
  position: relative;
}

/* 覆盖Element内部的关闭逻辑 */
:deep(.el-select.keep-dropdown-open).el-select .el-input.is-focus .el-input__wrapper {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

/* 确保选择器输入框正常工作 */
:deep(.el-select.keep-dropdown-open) .el-select__tags,
:deep(.el-select.keep-dropdown-open) .el-select__input-wrapper {
  pointer-events: all;
}

/* 确保下拉框内容始终可见 */
:deep(.el-select.keep-dropdown-open) .el-select-dropdown__wrap {
  pointer-events: all;
}

/* 防止选择器容器上的点击事件导致关闭 */
:deep(.el-select.keep-dropdown-open) {
  pointer-events: all;
  position: relative;
  z-index: 2050;
}

/* 阻止Element默认的关闭行为 */
:deep(.el-select) .el-select__caret {
  pointer-events: none;
}

/* 确保下拉框在选择后不消失 */
:deep(.el-select-dropdown.is-multiple .el-select-dropdown__item.selected) {
  background-color: #f0f9eb;
  color: #67c23a;
}

/* 防止选择器内部事件触发表单重置 */
:deep(.el-select.keep-dropdown-open) * {
  pointer-events: all;
}

/* 确保选择器和下拉框在DOM中始终保持最高优先级 */
.select-wrapper {
  position: relative;
  z-index: 2049;
}

/* 阻止点击其他地方时关闭 */
.select-pair-container {
  position: relative;
  z-index: 2048;
  pointer-events: none;
}

.select-pair-container * {
  pointer-events: all;
}

/* 阻止点击事件冒泡 */
.select-pair-container {
  position: relative;
  z-index: 1;
}

/* 确保内部元素可以正常交互 */
.select-pair-container * {
  position: relative;
  z-index: 2;
}

.radio-value {
  margin-top: 15px;
  color: #606266;
  font-size: 14px;
  text-align: left;
}

.print-wrapper {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.print-button {
  width: 100%;
}

.print-test-div {
  margin-top: 30px;
  padding: 30px;
  border: 2px dashed #409eff;
  border-radius: 8px;
  background-color: #f0f9ff;
}

.print-test-div h2 {
  margin-top: 0;
  color: #409eff;
  font-size: 18px;
  text-align: center;
}

.print-content {
  margin-top: 20px;
  line-height: 1.6;
}

.print-input-info,
.print-radio-info {
  margin-top: 15px;
  padding: 10px;
  background-color: white;
  border-radius: 4px;
  border-left: 4px solid #409eff;
}

/* 打印样式优化 */
@media print {
  #print-container {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }
  
  #print-container .print-test-div {
    border: none !important;
    background-color: white !important;
    padding: 20px !important;
    margin: 0 !important;
    width: 100% !important;
    height: auto !important;
  }
  
  #print-container .print-test-div h2 {
    color: black !important;
    text-align: center !important;
    margin-top: 0 !important;
  }
  
  #print-container .print-content {
    font-size: 12pt !important;
    line-height: 1.5 !important;
  }
  
  #print-container .print-input-info,
  #print-container .print-radio-info {
    background-color: #f8f8f8 !important;
    border: 1px solid #ddd !important;
    border-left: 4px solid #409eff !important;
    padding: 10px !important;
    margin-top: 15px !important;
  }
}

.error-message {
  color: #f56c6c;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: left;
}

.input-value {
  color: #606266;
  font-size: 14px;
  text-align: left;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .number-input-wrapper {
    padding: 20px;
  }
  
  h2 {
    font-size: 18px;
  }
}
</style>
