<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyFavorites, toggleFavorite } from '../api/favorites'

const router = useRouter()
const favorites = ref<any[]>([])
const loading = ref(true)

const load = async () => {
  loading.value = true
  try { favorites.value = await getMyFavorites() } catch (e) {}
  finally { loading.value = false }
}

onMounted(load)

const handleToggle = async (itemId: string, index: number) => {
  try {
    await toggleFavorite(itemId)
    favorites.value.splice(index, 1)
  } catch (err: any) { alert('操作失败：' + err.message) }
}

const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">❤️ 我的收藏</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-5xl mx-auto mt-6 p-4">
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="favorites.length === 0" class="text-center py-16 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">❤️</div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">暂无收藏</h3>
        <p class="text-sm text-gray-400 mb-6">去商品列表点击红心，收藏喜欢的商品</p>
        <button @click="router.push('/items')" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">浏览商品</button>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="(fav, idx) in favorites" :key="fav.id" class="bg-white rounded-xl shadow hover:shadow-md transition overflow-hidden flex flex-col h-full">
          <div v-if="fav.item?.image_urls?.length > 0" class="h-40 bg-gray-100 relative flex-shrink-0">
            <img :src="fav.item.image_urls[0]" class="w-full h-full object-cover" />
            <button @click="handleToggle(fav.item.id, idx)" class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm">❤️</button>
          </div>
          <div v-else class="h-40 bg-gray-100 flex items-center justify-center text-gray-300 relative flex-shrink-0">
            <span class="text-4xl">📷</span>
            <button @click="handleToggle(fav.item.id, idx)" class="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm">❤️</button>
          </div>
          <div class="p-5 cursor-pointer flex flex-col flex-1" @click="router.push(`/items/${fav.item.id}`)">
            <div class="flex justify-between items-start mb-2">
              <span :class="fav.item.type === 'sale' ? 'bg-blue-100 text-blue-700' : fav.item.type === 'skill' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'" class="text-xs px-2 py-1 rounded-full font-medium">
                {{ fav.item.type === 'sale' ? '出售' : fav.item.type === 'skill' ? '技能交换' : '失物招领' }}
              </span>
              <span v-if="fav.item.type === 'sale' && fav.item.price !== null" class="text-red-500 font-bold">¥{{ fav.item.price }}</span>
            </div>
            <h3 class="font-bold text-gray-800 mb-1">{{ fav.item.title }}</h3>
            <p class="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{{ fav.item.description || '暂无描述' }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400 border-t pt-3 mt-auto">
              <span>👤 {{ fav.item.seller?.nickname || '未知用户' }}</span>
              <span>{{ new Date(fav.item.created_at).toLocaleDateString() }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
