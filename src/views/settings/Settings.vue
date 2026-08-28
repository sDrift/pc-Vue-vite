<template>
  <div class="settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本设置" name="basic">
          <el-form ref="basicFormRef" :model="basicSettings" :rules="basicRules" label-width="120px" style="max-width: 600px">
            <el-form-item label="系统名称" prop="systemName">
              <el-input v-model="basicSettings.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统Logo" prop="systemLogo">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :before-upload="beforeUpload"
                :on-success="handleLogoUpload"
              >
                <img v-if="basicSettings.systemLogo" :src="basicSettings.systemLogo" class="avatar" />
                <i v-else class="el-icon-plus avatar-uploader-icon"></i>
              </el-upload>
              <div class="upload-tip">点击上传Logo图片，支持JPG、PNG格式，大小不超过2MB</div>
            </el-form-item>
            <el-form-item label="系统描述" prop="systemDescription">
              <el-input v-model="basicSettings.systemDescription" type="textarea" :rows="4" placeholder="请输入系统描述" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleBasicSubmit">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <el-form ref="securityFormRef" :model="securitySettings" :rules="securityRules" label-width="120px" style="max-width: 600px">
            <el-form-item label="密码复杂度" prop="passwordComplexity">
              <el-select v-model="securitySettings.passwordComplexity" placeholder="请选择密码复杂度">
                <el-option label="低 (至少6位)" value="low" />
                <el-option label="中 (至少8位，包含字母和数字)" value="medium" />
                <el-option label="高 (至少10位，包含大小写字母、数字和特殊字符)" value="high" />
              </el-select>
            </el-form-item>
            <el-form-item label="密码过期时间" prop="passwordExpiryDays">
              <el-input v-model.number="securitySettings.passwordExpiryDays" placeholder="请输入密码过期天数" />
              <div class="form-tip">设置为0表示永不过期</div>
            </el-form-item>
            <el-form-item label="登录失败次数限制" prop="loginAttempts">
              <el-input v-model.number="securitySettings.loginAttempts" placeholder="请输入登录失败次数限制" />
              <div class="form-tip">连续登录失败达到此次数，账号将被锁定</div>
            </el-form-item>
            <el-form-item label="是否开启双因素认证" prop="twoFactorAuth">
              <el-switch v-model="securitySettings.twoFactorAuth" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleSecuritySubmit">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="邮件设置" name="email">
          <el-form ref="emailFormRef" :model="emailSettings" :rules="emailRules" label-width="120px" style="max-width: 600px">
            <el-form-item label="SMTP服务器" prop="smtpServer">
              <el-input v-model="emailSettings.smtpServer" placeholder="请输入SMTP服务器地址" />
            </el-form-item>
            <el-form-item label="SMTP端口" prop="smtpPort">
              <el-input v-model.number="emailSettings.smtpPort" placeholder="请输入SMTP端口" />
            </el-form-item>
            <el-form-item label="发送邮箱" prop="senderEmail">
              <el-input v-model="emailSettings.senderEmail" placeholder="请输入发送邮箱地址" />
            </el-form-item>
            <el-form-item label="邮箱密码" prop="emailPassword">
              <el-input v-model="emailSettings.emailPassword" type="password" placeholder="请输入邮箱密码或授权码" />
            </el-form-item>
            <el-form-item label="是否启用SSL/TLS" prop="useSSL">
              <el-switch v-model="emailSettings.useSSL" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleEmailSubmit">保存设置</el-button>
              <el-button @click="sendTestEmail">发送测试邮件</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 测试邮件对话框 -->
    <el-dialog v-model="testEmailVisible" title="发送测试邮件" width="400px">
      <el-form ref="testEmailFormRef" :model="testEmailForm" :rules="testEmailRules" label-width="80px">
        <el-form-item label="收件人" prop="recipient">
          <el-input v-model="testEmailForm.recipient" placeholder="请输入测试邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="testEmailVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmSendTestEmail">发送</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 当前激活的标签页
const activeTab = ref('basic');

// 表单引用
const basicFormRef = ref();
const securityFormRef = ref();
const emailFormRef = ref();
const testEmailFormRef = ref();

// 基本设置
const basicSettings = ref({
  systemName: '后台管理系统',
  systemLogo: '',
  systemDescription: '这是一个基于Vue 3和Element Plus开发的后台管理系统'
});

// 安全设置
const securitySettings = ref({
  passwordComplexity: 'medium',
  passwordExpiryDays: 90,
  loginAttempts: 5,
  twoFactorAuth: false
});

// 邮件设置
const emailSettings = ref({
  smtpServer: '',
  smtpPort: 465,
  senderEmail: '',
  emailPassword: '',
  useSSL: true
});

// 测试邮件表单
const testEmailVisible = ref(false);
const testEmailForm = ref({
  recipient: ''
});

// 表单验证规则
const basicRules = {
  systemName: [
    { required: true, message: '请输入系统名称', trigger: 'blur' }
  ]
};

const securityRules = {
  passwordComplexity: [
    { required: true, message: '请选择密码复杂度', trigger: 'change' }
  ],
  passwordExpiryDays: [
    { required: true, message: '请输入密码过期天数', trigger: 'blur' },
    { type: 'number', min: 0, message: '过期天数不能小于0', trigger: 'blur' }
  ],
  loginAttempts: [
    { required: true, message: '请输入登录失败次数限制', trigger: 'blur' },
    { type: 'number', min: 1, message: '失败次数限制不能小于1', trigger: 'blur' }
  ]
};

const emailRules = {
  smtpServer: [
    { required: true, message: '请输入SMTP服务器地址', trigger: 'blur' }
  ],
  smtpPort: [
    { required: true, message: '请输入SMTP端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在1-65535之间', trigger: 'blur' }
  ],
  senderEmail: [
    { required: true, message: '请输入发送邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  emailPassword: [
    { required: true, message: '请输入邮箱密码或授权码', trigger: 'blur' }
  ]
};

const testEmailRules = {
  recipient: [
    { required: true, message: '请输入测试邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
};

// 上传Logo前的校验
const beforeUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  
  if (!isJPG) {
    ElMessage.error('只能上传JPG/PNG格式的图片!');
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!');
  }
  
  // 模拟上传成功，实际项目中应该上传到服务器
  return false;
};

// 处理Logo上传
const handleLogoUpload = (response, file, fileList) => {
  // 模拟上传成功后的处理
  // 实际项目中应该使用服务器返回的图片URL
  basicSettings.value.systemLogo = URL.createObjectURL(file.raw);
  ElMessage.success('Logo上传成功');
};

// 保存基本设置
const handleBasicSubmit = async () => {
  try {
    await basicFormRef.value.validate();
    // 模拟保存设置
    ElMessage.success('基本设置保存成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 保存安全设置
const handleSecuritySubmit = async () => {
  try {
    await securityFormRef.value.validate();
    // 模拟保存设置
    ElMessage.success('安全设置保存成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 保存邮件设置
const handleEmailSubmit = async () => {
  try {
    await emailFormRef.value.validate();
    // 模拟保存设置
    ElMessage.success('邮件设置保存成功');
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};

// 发送测试邮件
const sendTestEmail = () => {
  testEmailVisible.value = true;
};

// 确认发送测试邮件
const confirmSendTestEmail = async () => {
  try {
    await testEmailFormRef.value.validate();
    
    // 模拟发送邮件
    ElMessageBox.showLoading('正在发送测试邮件...');
    
    setTimeout(() => {
      ElMessageBox.closeLoading();
      ElMessage.success('测试邮件发送成功');
      testEmailVisible.value = false;
    }, 2000);
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 头像上传样式 */
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409eff;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.upload-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}

.form-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>