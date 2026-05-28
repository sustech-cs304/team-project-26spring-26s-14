<script setup lang="ts">
import { onMounted } from 'vue'
import { useUserStore } from '../stores/user'
import { useRouter } from 'vue-router'

const userStore = useUserStore()
const router = useRouter()

const goToAuth = () => router.push('/auth')
const goToItems = () => router.push('/items')
const goToPublish = () => {
  if (!userStore.user) { alert('请先登录'); router.push('/auth'); return }
  router.push('/publish')
}
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🏫 校园社交市场</h1>
      <div class="flex items-center">
        <span v-if="userStore.user" class="text-sm text-gray-600 mr-4">
          👤 {{ userStore.profile?.nickname || userStore.user.email }}
        </span>
        <button v-if="!userStore.user" @click="goToAuth" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          登录 / 注册
        </button>
        <template v-else>
          <button @click="router.push('/chats')" class="relative bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 mr-2">
            💬 消息
            <span v-if="userStore.unreadMsgCount > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {{ userStore.unreadMsgCount > 99 ? '99+' : userStore.unreadMsgCount }}
            </span>
          </button>
          <button @click="router.push('/notifications')" class="relative bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 mr-2">
            🔔 通知
            <span v-if="userStore.unreadNotifCount > 0" class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {{ userStore.unreadNotifCount > 99 ? '99+' : userStore.unreadNotifCount }}
            </span>
          </button>
          <button @click="router.push('/profile')" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 mr-2">
            👤 我的
          </button>
          <button @click="userStore.signOut" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">退出</button>
        </template>
      </div>
    </nav>
    <div class="max-w-4xl mx-auto mt-8 p-6">
      <div class="bg-white rounded-xl shadow p-8 text-center">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">欢迎来到校园社交市场</h2>
        <p class="text-gray-600 mb-6">在这里你可以发布二手物品、寻找失物、交换技能...</p>
        <div v-if="!userStore.user" class="text-sm text-gray-400 mb-6">请先登录以使用全部功能</div>
        <div v-else class="text-green-600 font-medium mb-6">✅ 已登录，可以开始使用了！</div>
        <div class="flex justify-center gap-4 flex-wrap">
          <button @click="goToItems" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium">📦 浏览商品</button>
          <button @click="goToPublish" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium">➕ 发布商品</button>
          <button @click="router.push('/map')" class="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-300 hover:bg-gray-50 font-medium">🗺️ 校园地图</button>
          <button @click="router.push('/wishlist')" class="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-300 hover:bg-gray-50 font-medium">🎯 愿望清单</button>
          <button @click="router.push('/favorites')" class="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:border-gray-300 hover:bg-gray-50 font-medium">❤️ 我的收藏</button>
        </div>
      </div>
    </div>
  </div>
</template>
