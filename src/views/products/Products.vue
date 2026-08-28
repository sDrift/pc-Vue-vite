<template>
  <div class="products-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>产品管理</span>
          <el-button type="primary" @click="handleAddProduct">新增产品</el-button>
        </div>
      </template>
      
      <div class="search-container">
        <el-input v-model="searchKeyword" placeholder="请输入产品名称或编号" style="width: 200px; margin-right: 10px" />
        <el-select v-model="searchCategory" placeholder="选择分类" style="width: 120px; margin-right: 10px">
          <el-option label="全部" value="" />
          <el-option label="电子产品" value="electronics" />
          <el-option label="服装鞋帽" value="clothing" />
          <el-option label="食品饮料" value="food" />
          <el-option label="家居用品" value="home" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>
      
      <el-table :data="filteredProducts" style="width: 100%" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="产品ID" width="80" />
        <el-table-column prop="name" label="产品名称" width="180" />
        <el-table-column prop="code" label="产品编号" width="120" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">{{ getCategoryName(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.status" @change="handleStatusChange(row.id, $event)" :active-value="1" :inactive-value="0" />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="handleEditProduct(row)" style="margin-right: 5px">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDeleteProduct(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredProducts.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 添加/编辑产品对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑产品' : '新增产品'" width="500px">
      <el-form ref="productFormRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="产品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="产品编号" prop="code">
          <el-input v-model="formData.code" placeholder="请输入产品编号" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类">
            <el-option label="电子产品" value="electronics" />
            <el-option label="服装鞋帽" value="clothing" />
            <el-option label="食品饮料" value="food" />
            <el-option label="家居用品" value="home" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input v-model.number="formData.price" placeholder="请输入价格" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input v-model.number="formData.stock" placeholder="请输入库存" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 模拟产品数据
const products = ref([
  { id: 1, name: '笔记本电脑', code: 'P001', category: 'electronics', price: 5999.00, stock: 50, status: 1, createdAt: '2024-01-01 10:00:00' },
  { id: 2, name: '智能手机', code: 'P002', category: 'electronics', price: 3999.00, stock: 100, status: 1, createdAt: '2024-01-02 11:30:00' },
  { id: 3, name: 'T恤衫', code: 'P003', category: 'clothing', price: 99.00, stock: 200, status: 1, createdAt: '2024-01-03 14:20:00' },
  { id: 4, name: '牛仔裤', code: 'P004', category: 'clothing', price: 299.00, stock: 150, status: 1, createdAt: '2024-01-04 09:45:00' },
  { id: 5, name: '咖啡', code: 'P005', category: 'food', price: 29.90, stock: 300, status: 1, createdAt: '2024-01-05 16:10:00' },
  { id: 6, name: '运动鞋', code: 'P006', category: 'clothing', price: 499.00, stock: 80, status: 0, createdAt: '2024-01-06 13:25:00' },
  { id: 7, name: '水杯', code: 'P007', category: 'home', price: 49.00, stock: 120, status: 1, createdAt: '2024-01-07 11:15:00' }
]);

// 搜索参数
const searchKeyword = ref('');
const searchCategory = ref('');

// 分页参数
const currentPage = ref(1);
const pageSize = ref(10);

// 对话框参数
const dialogVisible = ref(false);
const isEdit = ref(false);
const productFormRef = ref();

// 表单数据
const formData = ref({
  id: '',
  name: '',
  code: '',
  category: 'electronics',
  price: 0,
  stock: 0
});

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '产品名称长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入产品编号', trigger: 'blur' },
    { pattern: /^[A-Za-z0-9]+$/, message: '产品编号只能包含字母和数字', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ],
  price: [
    { required: true, message: '请输入价格', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '价格必须大于0', trigger: 'blur' }
  ],
  stock: [
    { required: true, message: '请输入库存', trigger: 'blur' },
    { type: 'number', min: 0, message: '库存不能小于0', trigger: 'blur' },
    { validator: (rule, value, callback) => {
      if (!Number.isInteger(value)) {
        callback(new Error('库存必须是整数'));
      } else {
        callback();
      }
    }, trigger: 'blur' }
  ]
};

// 获取分类名称
const getCategoryName = (category) => {
  const categoryMap = {
    'electronics': '电子产品',
    'clothing': '服装鞋帽',
    'food': '食品饮料',
    'home': '家居用品'
  };
  return categoryMap[category] || category;
};

// 获取分类对应的标签类型
const getCategoryType = (category) => {
  const typeMap = {
    'electronics': 'primary',
    'clothing': 'success',
    'food': 'warning',
    'home': 'info'
  };
  return typeMap[category] || 'default';
};

// 过滤后的产品列表
const filteredProducts = computed(() => {
  let result = [...products.value];
  
  // 根据关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase();
    result = result.filter(product => 
      product.name.toLowerCase().includes(keyword) || 
      product.code.toLowerCase().includes(keyword)
    );
  }
  
  // 根据分类过滤
  if (searchCategory.value) {
    result = result.filter(product => product.category === searchCategory.value);
  }
  
  return result;
});

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
};

// 重置
const handleReset = () => {
  searchKeyword.value = '';
  searchCategory.value = '';
  currentPage.value = 1;
};

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

// 当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current;
};

// 新增产品
const handleAddProduct = () => {
  isEdit.value = false;
  formData.value = {
    id: '',
    name: '',
    code: '',
    category: 'electronics',
    price: 0,
    stock: 0
  };
  dialogVisible.value = true;
};

// 编辑产品
const handleEditProduct = (row) => {
  isEdit.value = true;
  formData.value = {
    id: row.id,
    name: row.name,
    code: row.code,
    category: row.category,
    price: row.price,
    stock: row.stock
  };
  dialogVisible.value = true;
};

// 删除产品
const handleDeleteProduct = (id) => {
  ElMessageBox.confirm('确定要删除这个产品吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = products.value.findIndex(product => product.id === id);
    if (index > -1) {
      products.value.splice(index, 1);
      ElMessage.success('删除成功');
    }
  }).catch(() => {
    ElMessage.info('已取消删除');
  });
};

// 状态改变
const handleStatusChange = (id, status) => {
  const product = products.value.find(product => product.id === id);
  if (product) {
    product.status = status;
    ElMessage.success(`产品状态已更新为${status === 1 ? '上架' : '下架'}`);
  }
};

// 提交表单
const handleSubmit = async () => {
  try {
    await productFormRef.value.validate();
    
    if (isEdit.value) {
      // 编辑产品
      const index = products.value.findIndex(product => product.id === formData.value.id);
      if (index > -1) {
        products.value[index] = {
          ...products.value[index],
          name: formData.value.name,
          code: formData.value.code,
          category: formData.value.category,
          price: formData.value.price,
          stock: formData.value.stock
        };
        ElMessage.success('产品信息更新成功');
      }
    } else {
      // 新增产品
      const newProduct = {
        id: Math.max(...products.value.map(product => product.id), 0) + 1,
        name: formData.value.name,
        code: formData.value.code,
        category: formData.value.category,
        price: formData.value.price,
        stock: formData.value.stock,
        status: 1,
        createdAt: new Date().toLocaleString('zh-CN')
      };
      products.value.unshift(newProduct);
      ElMessage.success('产品添加成功');
    }
    
    dialogVisible.value = false;
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
</script>

<style scoped>
.products-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>