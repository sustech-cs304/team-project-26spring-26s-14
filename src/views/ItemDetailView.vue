<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemById, deleteItem } from '../api/items'
import { hasReviewedRecently, hasChattedWith } from '../api/reviews'
import { toggleFavorite, isFavorited } from '../api/favorites'
import { useUserStore } from '../stores/user'
import ReviewModal from '../components/ReviewModal.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const item = ref<any>(null)
const loading = ref(true)
const showReviewModal = ref(false)
const alreadyReviewed = ref(false)
const hasChatted = ref(false)
const isFav = ref(false)
const favLoading = ref(false)

onMounted(async () => {
  try {
    item.value = await getItemById(route.params.id as string)
    if (userStore.user && item.value) {
      isFav.value = await isFavorited(item.value.id)
      if (item.value.seller_id !== userStore.user.id) {
        const [reviewed, chatted] = await Promise.all([
          hasReviewedRecently(item.value.seller_id),
          hasChattedWith(item.value.seller_id)
        ])
        alreadyReviewed.value = reviewed
        hasChatted.value = chatted
      }
    }
  } catch (err: any) {
    alert('获取商品详情失败：' + err.message)
    router.push('/items')
  } finally {
    loading.value = false
  }
})

const goBack = () => router.push('/items')

const contactSeller = () => {
  if (!userStore.user) { alert('请先登录'); router.push('/auth'); return }
  if (item.value.seller_id === userStore.user.id) { alert('这是您自己发布的商品，无需联系自己'); return }
  router.push(`/chat/${item.value.seller_id}?itemId=${item.value.id}`)
}

const toggleFavDetail = async () => {
  if (!userStore.user) { alert('请先登录'); router.push('/auth'); return }
  if (favLoading.value) return
  favLoading.value = true
  try {
    isFav.value = await toggleFavorite(item.value.id)
  } catch (err: any) {
    alert('操作失败：' + err.message)
  } finally {
    favLoading.value = false
  }
}

const handleDelete = async () => {
  if (!confirm('确定下架该商品？下架后其他人将无法查看。')) return
  try {
    await deleteItem(item.value.id)
    alert('已下架')
    router.push('/items')
  } catch (err: any) {
    alert('下架失败：' + err.message)
  }
}

const onReviewSubmitted = async () => {
  alreadyReviewed.value = true
  try {
    item.value = await getItemById(route.params.id as string)
  } catch (e) {}
}
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🏫 校园社交市场</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回列表</button>
    </nav>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else-if="item" class="max-w-2xl mx-auto mt-8 p-4">
      <div class="bg-white rounded-xl shadow p-8">
        <!-- 类型与日期 -->
        <div class="flex items-center gap-3 mb-4">
          <span
            :class="item.type === 'sale' ? 'bg-blue-100 text-blue-700' : item.type === 'skill' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'"
            class="text-sm px-3 py-1 rounded-full font-medium"
          >
            {{ item.type === 'sale' ? '出售' : item.type === 'skill' ? '技能交换' : '失物招领' }}
          </span>
          <span class="text-gray-400 text-sm">{{ new Date(item.created_at).toLocaleDateString() }} 发布</span>
        </div>

        <!-- 图片画廊 -->
        <div v-if="item.image_urls && item.image_urls.length > 0" class="mb-6">
          <div
            class="grid gap-2"
            :class="item.image_urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'"
          >
            <img
              v-for="(url, idx) in item.image_urls"
              :key="idx"
              :src="url"
              class="w-full h-56 object-cover rounded-lg"
              :class="item.image_urls.length === 1 ? 'h-72' : ''"
            />
          </div>
        </div>

        <!-- 标题与收藏 -->
        <div class="flex items-start justify-between mb-4">
          <h1 class="text-2xl font-bold text-gray-800">{{ item.title }}</h1>
          <button
            @click="toggleFavDetail"
            :disabled="favLoading"
            class="w-10 h-10 rounded-full flex items-center justify-center transition transform active:scale-90 disabled:opacity-50"
            :class="isFav ? 'bg-red-500 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'"
            title="收藏"
          >
            <svg v-if="isFav" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        <!-- 价格 -->
        <div v-if="item.type === 'sale'" class="text-3xl text-red-500 font-bold mb-6">¥{{ item.price }}</div>
        <div v-else-if="item.type === 'skill'" class="text-lg text-purple-600 font-medium mb-6">💡 技能交换</div>
        <div v-else class="text-lg text-orange-600 font-medium mb-6">🔍 失物招领</div>

        <!-- 描述 -->
        <div class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">描述</h3>
          <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ item.description || '暂无描述' }}</p>
        </div>

        <!-- 地点 -->
        <div v-if="item.location_name" class="mb-6">
          <h3 class="text-sm font-medium text-gray-500 mb-2">{{ item.type === 'lost' ? '发现/存放地点' : '建议交易地点' }}</h3>
          <p class="text-gray-700">📍 {{ item.location_name }}</p>
        </div>

        <!-- 卖家信息（可点击跳转主页） -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 cursor-pointer hover:bg-gray-100 transition" @click="router.push(`/profile/${item.seller_id}`)">
          <h3 class="text-sm font-medium text-gray-500 mb-2">卖家信息（点击查看主页）</h3>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
              <img v-if="item.seller?.avatar_url" :src="item.seller.avatar_url" class="w-full h-full object-cover" />
              <span v-else class="text-blue-600 font-bold">{{ item.seller?.nickname?.[0] || '?' }}</span>
            </div>
            <div>
              <p class="font-medium text-gray-800">{{ item.seller?.nickname || '未知用户' }}</p>
              <p class="text-sm text-gray-500">
                学号：{{ item.seller?.student_id || '-' }} | 信誉分：⭐ {{ item.seller?.reputation_score || '5.00' }}
              </p>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex gap-3 flex-wrap">
          <!-- 卖家自己 -->
          <template v-if="userStore.user && item.seller_id === userStore.user.id">
            <button @click="router.push(`/items/${item.id}/edit`)" class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium min-w-[120px]">
              ✏️ 编辑
            </button>
            <button @click="handleDelete" class="flex-1 bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 font-medium min-w-[120px]">
              🗑️ 下架
            </button>
            <button @click="goBack" class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium min-w-[120px]">
              返回列表
            </button>
          </template>

          <!-- 买家 -->
          <template v-else>
            <button
              @click="contactSeller"
              class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium min-w-[120px]"
            >💬 联系卖家</button>

            <button
              v-if="userStore.user && hasChatted && !alreadyReviewed"
              @click="showReviewModal = true"
              class="flex-1 bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 font-medium min-w-[120px]"
            >⭐ 评价卖家</button>

            <button
              v-else-if="userStore.user && !hasChatted"
              disabled
              class="flex-1 bg-gray-100 text-gray-400 py-3 rounded-lg font-medium min-w-[120px] cursor-not-allowed"
              title="需先与卖家聊天才能评价"
            >💬 需先聊天</button>

            <button
              v-else-if="alreadyReviewed"
              disabled
              class="flex-1 bg-gray-100 text-gray-400 py-3 rounded-lg font-medium min-w-[120px] cursor-not-allowed"
              title="30天内已评价过该卖家"
            >✅ 已评价</button>

            <button
              @click="goBack"
              class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 font-medium min-w-[120px]"
            >返回列表</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 评价弹窗 -->
    <ReviewModal
      v-if="item"
      :show="showReviewModal"
      :reviewee-id="item.seller_id"
      :item-id="item.id"
      :reviewee-name="item.seller?.nickname || '卖家'"
      @close="showReviewModal = false"
      @submitted="onReviewSubmitted"
    />
  </div>
</template>
