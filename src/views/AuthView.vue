<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const isLogin = ref(true) // true=登录, false=注册
const email = ref('')
const password = ref('')
const studentId = ref('')
const nickname = ref('')
const errorMsg = ref('')
const loading = ref(false)

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    if (isLogin.value) {
      await userStore.signIn(email.value, password.value)
    } else {
      await userStore.signUp(email.value, password.value, studentId.value, nickname.value)
      alert('注册成功！请检查邮箱验证（如需要），然后登录。')
      isLogin.value = true
      return
    }
    router.push('/')
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败'
  } finally {
    loading.value = false
  }
}
</script>

<<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-6">
        {{ isLogin ? '登录' : '注册' }}
      </h2>
      
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- 注册时显示 -->
        <div v-if="!isLogin">
          <input 
            v-model="studentId" 
            placeholder="学号" 
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input 
            v-model="nickname" 
            placeholder="昵称" 
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
          />
        </div>
        
        <input 
          v-model="email" 
          type="email" 
          placeholder="校园邮箱（@sustech.edu.cn）" 
          required
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input 
          v-model="password" 
          type="password" 
          placeholder="密码（至少6位）" 
          required
          minlength="6"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>
        
        <button 
          type="submit" 
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
      </form>
      
      <p class="text-center mt-4 text-sm text-gray-600">
        {{ isLogin ? '还没有账号？' : '已有账号？' }}
        <button @click="toggleMode" class="text-blue-600 hover:underline">
          {{ isLogin ? '去注册' : '去登录' }}
        </button>
      </p>
      
      <button 
        @click="router.push('/')" 
        class="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
      >
        ← 返回首页
      </button>
    </div>
  </div>
</template>
