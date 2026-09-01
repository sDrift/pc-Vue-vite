// ========== 1. 定义原始大对象 ==========
interface User {
  id: number
  name: string
  age: number
  password: string // 敏感字段，不能传给前端
  email: string
}

// ========== 2. 场景：父组件传参，所有字段都可选（用 Partial） ==========
// 父组件可能只传 name，也可能全传，Partial 把所有属性变可选
type UserProps = Partial<User> 
// 等价于：{ id?: number; name?: string; age?: number; password?: string; email?: string }

// ========== 3. 场景：剔除敏感字段（用 Omit） ==========
// 给前端展示的用户信息，坚决不要 password
type PublicUser = Omit<User, 'password'> 
// 结果：{ id: number; name: string; age: number; email: string }

// ========== 4. 场景：只取部分字段（用 Pick） ==========
// 列表页只展示姓名和年龄
type UserListItem = Pick<User, 'name' | 'age'>
// 结果：{ name: string; age: number }

// ========== 5. 场景：字典映射（用 Record） ==========
// 缓存多个用户：key 是 id，value 是 PublicUser
type UserCache = Record<string, PublicUser>
// 使用：
const cache: UserCache = {
  '1': { id: 1, name: '张三', age: 18, email: 'zhang@qq.com' },
  '2': { id: 2, name: '李四', age: 20, email: 'li@qq.com' }
}