<template>
  <div class="users-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAddUser">新增用户</el-button>
        </div>
      </template>

      <div class="search-container">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入用户名或邮箱"
          style="width: 200px; margin-right: 10px"
        />
        <el-select
          v-model="searchRole"
          placeholder="选择角色"
          style="width: 120px; margin-right: 10px"
        >
          <el-option label="全部" value="" />
          <el-option label="管理员" value="admin" />
          <el-option label="编辑" value="editor" />
          <el-option label="普通用户" value="user" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <el-table :data="filteredUsers" style="width: 100%" stripe>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="primary">管理员</el-tag>
            <el-tag v-else-if="row.role === 'editor'" type="success">编辑</el-tag>
            <el-tag v-else type="info">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="handleStatusChange(row.id, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              style="margin-right: 5px"
              @click="handleEditUser(row)"
            >
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="handleDeleteUser(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="filteredUsers.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="userFormRef" :model="formData" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="formData.role" placeholder="请选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="编辑" value="editor" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="formData.password" type="password" placeholder="请输入密码" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ref, computed } from 'vue'

// 模拟用户数据
const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    status: 1,
    createdAt: '2024-01-01 10:00:00',
  },
  {
    id: 2,
    username: 'editor1',
    email: 'editor1@example.com',
    role: 'editor',
    status: 1,
    createdAt: '2024-01-02 11:30:00',
  },
  {
    id: 3,
    username: 'user1',
    email: 'user1@example.com',
    role: 'user',
    status: 1,
    createdAt: '2024-01-03 14:20:00',
  },
  {
    id: 4,
    username: 'user2',
    email: 'user2@example.com',
    role: 'user',
    status: 0,
    createdAt: '2024-01-04 09:45:00',
  },
  {
    id: 5,
    username: 'user3',
    email: 'user3@example.com',
    role: 'user',
    status: 1,
    createdAt: '2024-01-05 16:10:00',
  },
])

// 搜索参数
const searchKeyword = ref('')
const searchRole = ref('')

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)

// 对话框参数
const dialogVisible = ref(false)
const isEdit = ref(false)
const userFormRef = ref()

// 表单数据
const formData = ref({
  id: '',
  username: '',
  email: '',
  role: 'user',
  password: '',
})

// 表单验证规则
const formRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
}

// 过滤后的用户列表
const filteredUsers = computed(() => {
  let result = [...users.value]

  // 根据关键词过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()

    result = result.filter(
      (user) =>
        user.username.toLowerCase().includes(keyword) || user.email.toLowerCase().includes(keyword),
    )
  }

  // 根据角色过滤
  if (searchRole.value) {
    result = result.filter((user) => user.role === searchRole.value)
  }

  return result
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  searchRole.value = ''
  currentPage.value = 1
}

// 分页大小变化
const handleSizeChange = (size) => {
  pageSize.value = size
  currentPage.value = 1
}

// 当前页变化
const handleCurrentChange = (current) => {
  currentPage.value = current
}

// 新增用户
const handleAddUser = () => {
  isEdit.value = false
  formData.value = {
    id: '',
    username: '',
    email: '',
    role: 'user',
    password: '',
  }
  dialogVisible.value = true
}

// 编辑用户
const handleEditUser = (row) => {
  isEdit.value = true
  formData.value = {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    password: '', // 编辑时不显示密码
  }
  dialogVisible.value = true
}

// 删除用户
const handleDeleteUser = (id) => {
  ElMessageBox.confirm('确定要删除这个用户吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      const index = users.value.findIndex((user) => user.id === id)

      if (index > -1) {
        users.value.splice(index, 1)
        ElMessage.success('删除成功')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}

// 状态改变
const handleStatusChange = (id, status) => {
  const user = users.value.find((user) => user.id === id)

  if (user) {
    user.status = status
    ElMessage.success(`用户状态已更新为${status === 1 ? '启用' : '禁用'}`)
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await userFormRef.value.validate()

    if (isEdit.value) {
      // 编辑用户
      const index = users.value.findIndex((user) => user.id === formData.value.id)

      if (index > -1) {
        users.value[index] = {
          ...users.value[index],
          username: formData.value.username,
          email: formData.value.email,
          role: formData.value.role,
        }
        ElMessage.success('用户信息更新成功')
      }
    } else {
      // 新增用户
      const newUser = {
        id: Math.max(...users.value.map((user) => user.id), 0) + 1,
        username: formData.value.username,
        email: formData.value.email,
        role: formData.value.role,
        status: 1,
        createdAt: new Date().toLocaleString('zh-CN'),
      }

      users.value.unshift(newUser)
      ElMessage.success('用户添加成功')
    }

    dialogVisible.value = false
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}
</script>

<style scoped>
.users-container {
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
