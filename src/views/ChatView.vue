<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { supabase } from '../supabase'
import { getMessages, sendMessage, markMessagesAsRead } from '../api/messages'
import { getItemById } from '../api/items'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const otherUserId = route.params.userId as string
const itemId = route.query.itemId as string | undefined

const messages = ref<any[]>([])
const newMessage = ref('')
const loading = ref(true)
const otherUser = ref<any>(null)
const itemInfo = ref<any>(null)
const messagesContainer = ref(null)
const currentUserId = ref('')

let pollInterval: any

const loadData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('请先登录')
      router.push('/auth')
      return
    }
    currentUserId.value = user.id

    if (currentUserId.value === otherUserId) {
      alert('不能和自己聊天')
      router.push('/items')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname, student_id, reputation_score')
      .eq('id', otherUserId)
      .single()
    otherUser.value = profile

    if (itemId) {
      itemInfo.value = await getItemById(itemId)
    }

    messages.value = await getMessages(otherUserId)
    await markMessagesAsRead(otherUserId)
    userStore.unreadCount = 0
    nextTick(scrollToBottom)
  } catch (err: any) {
    alert('加载失败：' + err.message)
  } finally {
    loading.value = false
  }
}

const handleSend = async () => {
  if (!newMessage.value.trim()) return

  try {
    const msg = await sendMessage(otherUserId, newMessage.value.trim(), itemId)
    messages.value.push(msg)
    newMessage.value = ''
    nextTick(scrollToBottom)
  } catch (err: any) {
    alert('发送失败：' + err.message)
  }
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    (messagesContainer.value as any).scrollTop = (messagesContainer.value as any).scrollHeight
  }
}

// 格式化时间：显示年月日 时分
const formatTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadData()

  pollInterval = setInterval(async () => {
    try {
      const fresh = await getMessages(otherUserId)
      if (fresh.length > messages.value.length) {
        messages.value = fresh
        nextTick(scrollToBottom)
      }
    } catch (e) {}
  }, 3000)
})

onUnmounted(() => {
  clearInterval(pollInterval)
})

const goBack = () => router.back()
</script>

<<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white shadow-sm px-4 py-3 flex items-center gap-3">
      <button @click="goBack" class="text-gray-600 hover:text-gray-800 text-lg">←</button>
      <div>
        <h1 class="font-bold text-gray-800">{{ otherUser?.nickname || '聊天' }}</h1>
        <p v-if="itemInfo" class="text-xs text-gray-500">关联商品：{{ itemInfo.title }}</p>
      </div>
    </nav>

    <div v-if="loading" class="flex-1 flex items-center justify-center text-gray-500">加载中...</div>

    <div v-else ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-3">
      <div v-if="messages.length === 0" class="text-center text-gray-400 py-12">
        暂无消息，开始聊天吧！
      </div>

      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="msg.sender_id === currentUserId ? 'flex justify-end' : 'flex justify-start'"
      >
        <div
          :class="msg.sender_id === currentUserId ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 border'"
          class="max-w-[70%] rounded-2xl px-4 py-2 shadow-sm"
        >
          <p class="text-sm">{{ msg.content }}</p>
          <p
            :class="msg.sender_id === currentUserId ? 'text-blue-200' : 'text-gray-400'"
            class="text-xs mt-1 text-right"
          >
            {{ formatTime(msg.created_at) }}
          </p>
        </div>
      </div>
    </div>

    <div class="bg-white border-t p-3">
      <div class="flex gap-2">
        <input
          v-model="newMessage"
          @keyup.enter="handleSend"
          placeholder="输入消息..."
          class="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          @click="handleSend"
          :disabled="!newMessage.trim()"
          class="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>
