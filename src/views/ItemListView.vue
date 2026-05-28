<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { getItems } from '../api/items'
import { toggleFavorite, isFavorited } from '../api/favorites'

const router = useRouter()
const userStore = useUserStore()

const items = ref<any[]>([])
const loading = ref(false)
const activeType = ref('all')
const searchKeyword = ref('')
const minPrice = ref('')
const maxPrice = ref('')
const sortBy = ref<'newest' | 'price_asc' | 'price_desc'>('newest')
const favStatus = ref<Record<string, boolean>>({})
const favLoadingSet = ref<Set<string>>(new Set())

const typeFilters = [
  { label: '全部', value: 'all' },
  { label: '出售', value: 'sale' },
  { label: '技能交换', value: 'skill' },
  { label: '失物招领', value: 'lost' }
]

const sortOptions = [
  { label: '最新发布', value: 'newest' },
  { label: '价格从低到高', value: 'price_asc' },
  { label: '价格从高到低', value: 'price_desc' }
]

const fetchItems = async () => {
  loading.value = true
  try {
    const filters: any = {
      type: activeType.value,
      keyword: searchKeyword.value || undefined,
      sortBy: sortBy.value
    }
    if (activeType.value === 'sale' || activeType.value === 'all') {
      if (minPrice.value) filters.minPrice = parseFloat(minPrice.value)
      if (maxPrice.value) filters.maxPrice = parseFloat(maxPrice.value)
    }

    items.value = await getItems(filters)

    if (userStore.user) {
      for (const item of items.value) {
        favStatus.value[item.id] = await isFavorited(item.id)
      }
    }
  } catch (err: any) {
    alert('获取商品失败：' + err.message)
  } finally {
    loading.value = false
  }
}

const toggleFav = async (itemId: string, event: Event) => {
  event.stopPropagation()
  if (!userStore.user) { alert('请先登录'); router.push('/auth'); return }
  if (favLoadingSet.value.has(itemId)) return
  favLoadingSet.value.add(itemId)
  try {
    const result = await toggleFavorite(itemId)
    favStatus.value[itemId] = result
  } catch (err: any) {
    alert('操作失败：' + err.message)
  } finally {
    favLoadingSet.value.delete(itemId)
  }
}

const resetFilters = () => {
  searchKeyword.value = ''
  minPrice.value = ''
  maxPrice.value = ''
  sortBy.value = 'newest'
  activeType.value = 'all'
  fetchItems()
}

onMounted(fetchItems)
watch([activeType, sortBy], fetchItems)
const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🏫 校园社交市场</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-5xl mx-auto mt-6 p-4">
      <!-- 筛选面板 -->
      <div class="bg-white rounded-xl shadow p-4 mb-6 space-y-4">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in typeFilters"
            :key="t.value"
            @click="activeType = t.value"
            :class="activeType === t.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            class="px-4 py-1.5 rounded-full text-sm transition"
          >
            {{ t.label }}
          </button>
        </div>

        <div class="flex flex-wrap gap-3 items-end">
          <div class="flex-1 min-w-[200px]">
            <input
              v-model="searchKeyword"
              @keyup.enter="fetchItems"
              placeholder="搜索商品标题..."
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <template v-if="activeType === 'sale' || activeType === 'all'">
            <div class="flex items-center gap-2">
              <input v-model="minPrice" type="number" min="0" placeholder="最低价" class="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              <span class="text-gray-400">-</span>
              <input v-model="maxPrice" type="number" min="0" placeholder="最高价" class="w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
            </div>
          </template>

          <select v-model="sortBy" class="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white">
            <option v-for="s in sortOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>

          <button @click="fetchItems" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">筛选</button>
          <button @click="resetFilters" class="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">重置</button>
        </div>
      </div>

      <!-- 加载 -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="items.length === 0" class="text-center py-16 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">暂无商品</h3>
        <p class="text-sm text-gray-400 mb-6">还没有符合条件的商品，换个筛选条件试试</p>
        <div class="flex justify-center gap-3">
          <button @click="resetFilters" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm">重置筛选</button>
          <button @click="router.push('/publish')" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">立即发布</button>
        </div>
      </div>

      <!-- 商品网格 -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="item in items"
          :key="item.id"
          @click="router.push(`/items/${item.id}`)"
          class="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer overflow-hidden flex flex-col h-full"
        >
          <!-- 封面图 + 收藏按钮 -->
          <div class="h-40 bg-gray-100 relative flex-shrink-0">
            <img v-if="item.image_urls && item.image_urls.length > 0" :src="item.image_urls[0]" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <span class="text-4xl">📷</span>
            </div>
            <button
              @click="toggleFav(item.id, $event)"
              class="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition transform active:scale-90 shadow-sm"
              :class="favStatus[item.id] ? 'bg-red-500 text-white' : 'bg-white/90 backdrop-blur text-gray-400 hover:bg-red-50 hover:text-red-500'"
            >
              <svg v-if="favStatus[item.id]" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <div class="p-5 flex flex-col flex-1">
            <div class="flex justify-between items-start mb-2">
              <span :class="item.type === 'sale' ? 'bg-blue-100 text-blue-700' : item.type === 'skill' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ item.type === 'sale' ? '出售' : item.type === 'skill' ? '技能交换' : '失物招领' }}
              </span>
              <span v-if="item.type === 'sale' && item.price !== null" class="text-red-500 font-bold">¥{{ item.price }}</span>
            </div>

            <h3 class="font-bold text-gray-800 mb-1">{{ item.title }}</h3>
            <p class="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{{ item.description || '暂无描述' }}</p>
            <p v-if="item.location_name" class="text-xs text-gray-400 mb-2">📍 {{ item.location_name }}</p>

            <div class="flex items-center justify-between text-xs text-gray-400 border-t pt-3 mt-auto">
              <div class="flex items-center gap-1">
                <span>👤 {{ item.seller?.nickname || '未知用户' }}</span>
                <span v-if="item.seller?.reputation_score" class="text-yellow-500">⭐ {{ item.seller.reputation_score }}</span>
              </div>
              <span>{{ new Date(item.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
