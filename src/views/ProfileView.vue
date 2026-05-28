<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getItemsByUser } from '../api/items'
import { getReviewsForUser } from '../api/reviews'
import { deleteItem } from '../api/items'
import { supabase } from '../supabase'
import EditProfileModal from '../components/EditProfileModal.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const userId = ref(route.params.userId as string || userStore.user?.id || '')
const profile = ref<any>(null)
const availableItems = ref<any[]>([])
const unavailableItems = ref<any[]>([])
const reviews = ref<any[]>([])
const loading = ref(true)
const isMe = ref(false)
const activeTab = ref<'available' | 'unavailable'>('available')
const showEditModal = ref(false)

const load = async () => {
  loading.value = true
  try {
    const targetId = userId.value || userStore.user?.id
    if (!targetId) { router.push('/auth'); return }

    isMe.value = userStore.user?.id === targetId

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single()
    profile.value = p

    const [avail, unavail] = await Promise.all([
      getItemsByUser(targetId, 'available'),
      getItemsByUser(targetId, 'unavailable')
    ])
    availableItems.value = avail
    unavailableItems.value = unavail

    reviews.value = await getReviewsForUser(targetId)
  } catch (err: any) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.userId, () => {
  userId.value = route.params.userId as string || userStore.user?.id || ''
  load()
})

const handleDel = async (itemId: string) => {
  if (!confirm('确定下架该商品？')) return
  try {
    const { error } = await supabase
      .from('items')
      .update({ status: 'unavailable' })
      .eq('id', itemId)
      .eq('seller_id', userStore.user.id)
    if (error) throw error
    const item = availableItems.value.find(i => i.id === itemId)
    if (item) {
      availableItems.value = availableItems.value.filter(i => i.id !== itemId)
      unavailableItems.value.unshift({ ...item, status: 'unavailable' })
    }
  } catch (err: any) {
    alert('下架失败：' + err.message)
  }
}

const handleRelist = async (itemId: string) => {
  if (!confirm('确定重新上架该商品？')) return
  try {
    const { error } = await supabase
      .from('items')
      .update({ status: 'available' })
      .eq('id', itemId)
      .eq('seller_id', userStore.user.id)
    if (error) throw error
    const item = unavailableItems.value.find(i => i.id === itemId)
    if (item) {
      unavailableItems.value = unavailableItems.value.filter(i => i.id !== itemId)
      availableItems.value.unshift({ ...item, status: 'available' })
    }
  } catch (err: any) {
    alert('上架失败：' + err.message)
  }
}

const onProfileUpdated = async () => {
  const targetId = userId.value || userStore.user?.id
  if (targetId) {
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .single()
    profile.value = p
    if (isMe.value) {
      await userStore.fetchUser()
    }
  }
}

const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">👤 用户主页</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div v-if="loading" class="text-center py-16">
      <div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
      <p class="text-gray-500">加载中...</p>
    </div>

    <div v-else-if="profile" class="max-w-3xl mx-auto mt-6 p-4 space-y-6">
      <!-- 用户信息卡片（美化版） -->
      <div class="bg-white rounded-xl shadow-lg p-6 flex items-center gap-5 border border-gray-100 relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-8 -mt-8"></div>
        <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold overflow-hidden shadow-inner ring-4 ring-white relative z-10">
          <img v-if="profile.avatar_url" :src="profile.avatar_url" class="w-full h-full object-cover" />
          <span v-else>{{ profile.nickname?.[0] || '?' }}</span>
        </div>
        <div class="flex-1 relative z-10">
          <h2 class="text-xl font-bold text-gray-800">{{ profile.nickname || '未知用户' }}</h2>
          <p class="text-sm text-gray-500 mt-1">学号：{{ profile.student_id || '-' }}</p>
          <p v-if="profile.major" class="text-sm text-gray-500 mt-0.5">专业：{{ profile.major }}</p>
          <div class="flex items-center gap-2 mt-3 bg-yellow-50 px-3 py-1.5 rounded-full w-fit border border-yellow-100">
            <span class="text-yellow-500 text-lg">⭐</span>
            <span class="text-yellow-700 font-bold text-lg">{{ profile.reputation_score || '5.00' }}</span>
            <span class="text-yellow-600 text-sm">信誉分</span>
          </div>
        </div>
        <button v-if="isMe" @click="showEditModal = true" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm relative z-10 shadow-sm">
          ✏️ 编辑资料
        </button>
      </div>

      <!-- 发布的商品 -->
      <div class="bg-white rounded-xl shadow p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex gap-4">
            <button @click="activeTab = 'available'" :class="activeTab === 'available' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'" class="pb-2 text-sm transition">
              📦 在售中 ({{ availableItems.length }})
            </button>
            <button @click="activeTab = 'unavailable'" :class="activeTab === 'unavailable' ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500 hover:text-gray-700'" class="pb-2 text-sm transition">
              🗑️ 已下架 ({{ unavailableItems.length }})
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'available'">
          <div v-if="availableItems.length === 0" class="text-center py-8">
            <div class="text-4xl mb-2">📦</div>
            <p class="text-gray-400 text-sm">暂无在售商品</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in availableItems" :key="item.id" @click="router.push(`/items/${item.id}`)" class="flex gap-4 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition">
              <div v-if="item.image_urls?.length > 0" class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img :src="item.image_urls[0]" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">📷</div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-800 truncate">{{ item.title }}</h4>
                <p class="text-sm text-gray-500 line-clamp-1 mt-1">{{ item.description || '暂无描述' }}</p>
                <div class="flex items-center gap-3 mt-2 text-sm">
                  <span :class="item.type === 'sale' ? 'text-blue-600' : item.type === 'skill' ? 'text-purple-600' : 'text-orange-600'">
                    {{ item.type === 'sale' ? '出售' : item.type === 'skill' ? '技能交换' : '失物招领' }}
                  </span>
                  <span v-if="item.price !== null" class="text-red-500 font-bold">¥{{ item.price }}</span>
                  <span class="text-gray-400">{{ new Date(item.created_at).toLocaleDateString() }}</span>
                </div>
                <div v-if="isMe" class="flex gap-3 mt-2">
                  <button @click.stop="router.push(`/items/${item.id}/edit`)" class="text-blue-600 hover:underline text-sm">编辑</button>
                  <button @click.stop="handleDel(item.id)" class="text-red-500 hover:underline text-sm">下架</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'unavailable'">
          <div v-if="unavailableItems.length === 0" class="text-center py-8">
            <div class="text-4xl mb-2">🗑️</div>
            <p class="text-gray-400 text-sm">暂无已下架商品</p>
          </div>
          <div v-else class="space-y-3">
            <div v-for="item in unavailableItems" :key="item.id" class="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition opacity-60">
              <div v-if="item.image_urls?.length > 0" class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                <img :src="item.image_urls[0]" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300 flex-shrink-0">📷</div>
              <div class="flex-1 min-w-0">
                <h4 class="font-bold text-gray-800 truncate">{{ item.title }}</h4>
                <p class="text-sm text-gray-500 line-clamp-1 mt-1">{{ item.description || '暂无描述' }}</p>
                <div class="flex items-center gap-3 mt-2 text-sm">
                  <span :class="item.type === 'sale' ? 'text-blue-600' : item.type === 'skill' ? 'text-purple-600' : 'text-orange-600'">
                    {{ item.type === 'sale' ? '出售' : item.type === 'skill' ? '技能交换' : '失物招领' }}
                  </span>
                  <span v-if="item.price !== null" class="text-red-500 font-bold">¥{{ item.price }}</span>
                  <span class="text-gray-400">{{ new Date(item.created_at).toLocaleDateString() }}</span>
                </div>
                <div v-if="isMe" class="flex gap-3 mt-2">
                  <button @click.stop="handleRelist(item.id)" class="text-green-600 hover:underline text-sm font-medium">重新上架</button>
                  <button @click.stop="router.push(`/items/${item.id}/edit`)" class="text-blue-600 hover:underline text-sm">编辑</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 收到的评价 -->
      <div class="bg-white rounded-xl shadow p-6">
        <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
          ⭐ 收到的评价 <span class="text-sm font-normal text-gray-400">({{ reviews.length }})</span>
        </h3>
        <div v-if="reviews.length === 0" class="text-center py-8">
          <div class="text-4xl mb-2">⭐</div>
          <p class="text-gray-400 text-sm">暂无评价</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="r in reviews" :key="r.id" class="border-b last:border-0 pb-3 last:pb-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-yellow-500 font-bold">{{ '★'.repeat(r.rating) }}{{ '☆'.repeat(5 - r.rating) }}</span>
              <span class="text-sm text-gray-500">来自 {{ r.reviewer?.nickname || '匿名' }}</span>
            </div>
            <p v-if="r.comment" class="text-gray-700 text-sm">{{ r.comment }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ new Date(r.created_at).toLocaleDateString() }}</p>
          </div>
        </div>
      </div>
    </div>

    <EditProfileModal :show="showEditModal" :profile="profile" @close="showEditModal = false" @updated="onProfileUpdated" />
  </div>
</template>
