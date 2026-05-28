<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getConversations, markAllMessagesAsRead } from '../api/messages'

const router = useRouter()
const userStore = useUserStore()

const conversations = ref<any[]>([])
const loading = ref(true)
let pollInterval: any

const loadConversations = async () => {
  try { conversations.value = await getConversations() }
  catch (err: any) {}
}

onMounted(async () => {
  if (!userStore.user) { router.push('/auth'); return }
  await markAllMessagesAsRead()
  userStore.unreadMsgCount = 0
  await loadConversations()
  loading.value = false
  pollInterval = setInterval(loadConversations, 3000)
})

onUnmounted(() => { clearInterval(pollInterval) })

const goToChat = (otherUserId: string) => router.push(`/chat/${otherUserId}`)
const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">💬 消息中心</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-2xl mx-auto mt-6 p-4">
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="conversations.length === 0" class="text-center py-16 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">💬</div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">暂无消息</h3>
        <p class="text-sm text-gray-400 mb-6">去商品列表联系卖家，开始聊天吧</p>
        <button @click="router.push('/items')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">浏览商品</button>
      </div>

      <div v-else class="space-y-3">
        <div v-for="conv in conversations" :key="conv.otherUserId" @click="goToChat(conv.otherUserId)"
          class="bg-white rounded-xl shadow p-4 hover:shadow-md transition cursor-pointer flex justify-between items-center"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold flex-shrink-0">{{ conv.nickname?.[0] || '?' }}</div>
            <div class="min-w-0">
              <p class="font-medium text-gray-800">{{ conv.nickname || '未知用户' }}</p>
              <p class="text-sm text-gray-500 truncate max-w-[200px]">{{ conv.lastMessage }}</p>
            </div>
          </div>
          <div class="text-right flex-shrink-0 ml-3">
            <p class="text-xs text-gray-400">{{ new Date(conv.lastTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
