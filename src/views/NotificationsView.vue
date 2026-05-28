<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getNotifications, markNotificationsAsRead } from '../api/notifications'

const router = useRouter()
const userStore = useUserStore()
const notifications = ref<any[]>([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try {
    notifications.value = await getNotifications()
    await markNotificationsAsRead()
    userStore.unreadNotifCount = 0
  } catch (e) {}
  finally { loading.value = false }
}

onMounted(load)

const goToItem = (itemId: string) => router.push(`/items/${itemId}`)
const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🔔 通知中心</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-2xl mx-auto mt-6 p-4">
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-16 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">🔔</div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">暂无通知</h3>
        <p class="text-sm text-gray-400 mb-6">添加愿望清单，有新商品匹配时会收到通知</p>
        <button @click="router.push('/wishlist')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">添加愿望</button>
      </div>

      <div v-else class="space-y-3">
        <div v-for="n in notifications" :key="n.id" @click="n.item?.id && goToItem(n.item.id)"
          class="bg-white rounded-xl shadow p-4 hover:shadow-md transition cursor-pointer"
          :class="n.is_read ? 'opacity-70' : 'border-l-4 border-blue-500'"
        >
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg flex-shrink-0">🎉</div>
            <div class="flex-1 min-w-0">
              <p class="font-bold text-gray-800">{{ n.title }}</p>
              <p class="text-sm text-gray-600 mt-1">{{ n.content }}</p>
              <div v-if="n.item" class="mt-2 text-sm text-blue-600 font-medium truncate">
                查看商品：{{ n.item.title }}
                <span v-if="n.item.price">（¥{{ n.item.price }}）</span>
              </div>
              <p class="text-xs text-gray-400 mt-2">{{ new Date(n.created_at).toLocaleString() }}</p>
            </div>
            <span v-if="!n.is_read" class="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
