<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyWishes, addWish, deleteWish, toggleWish } from '../api/wishlist'

const router = useRouter()
const wishes = ref<any[]>([])
const loading = ref(true)
const keyword = ref('')
const type = ref('all')
const maxPrice = ref('')
const adding = ref(false)

const types = [
  { label: '全部类型', value: 'all' },
  { label: '出售', value: 'sale' },
  { label: '技能交换', value: 'skill' },
  { label: '失物招领', value: 'lost' }
]

const loadWishes = async () => {
  loading.value = true
  try { wishes.value = await getMyWishes() } catch (e) {}
  finally { loading.value = false }
}

onMounted(loadWishes)

const handleAdd = async () => {
  if (!keyword.value.trim()) return
  adding.value = true
  try {
    await addWish(keyword.value.trim(), type.value, maxPrice.value ? parseFloat(maxPrice.value) : undefined)
    keyword.value = ''; type.value = 'all'; maxPrice.value = ''
    await loadWishes()
  } catch (err: any) { alert('添加失败：' + err.message) }
  finally { adding.value = false }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定删除这条愿望？')) return
  await deleteWish(id)
  await loadWishes()
}

const handleToggle = async (wish: any) => {
  await toggleWish(wish.id, !wish.is_active)
  wish.is_active = !wish.is_active
}

const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🎯 我的愿望清单</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-2xl mx-auto mt-6 p-4">
      <!-- 添加愿望 -->
      <div class="bg-white rounded-xl shadow p-6 mb-6">
        <h2 class="font-bold text-gray-800 mb-4">添加新愿望</h2>
        <div class="space-y-3">
          <input v-model="keyword" placeholder="关键词（如：微积分、吉他、校园卡）" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div class="flex gap-3">
            <select v-model="type" class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option v-for="t in types" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
            <input v-model="maxPrice" type="number" placeholder="最高预算（可选）" class="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button @click="handleAdd" :disabled="adding || !keyword.trim()" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ adding ? '添加中...' : '添加愿望' }}
          </button>
        </div>
      </div>

      <!-- 愿望列表 -->
      <div v-if="loading" class="text-center py-16">
        <div class="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mb-3"></div>
        <p class="text-gray-500">加载中...</p>
      </div>

      <div v-else-if="wishes.length === 0" class="text-center py-16 bg-white rounded-xl shadow">
        <div class="text-6xl mb-4">🎯</div>
        <h3 class="text-lg font-medium text-gray-700 mb-2">暂无愿望清单</h3>
        <p class="text-sm text-gray-400 mb-6">添加关键词，有新商品匹配时会通知你</p>
      </div>

      <div v-else class="space-y-3">
        <div v-for="wish in wishes" :key="wish.id" class="bg-white rounded-xl shadow p-4 flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-bold text-gray-800">{{ wish.keyword }}</span>
              <span :class="wish.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-0.5 rounded-full">
                {{ wish.is_active ? '进行中' : '已暂停' }}
              </span>
            </div>
            <div class="text-sm text-gray-500">
              类型：{{ wish.type === 'all' ? '全部' : wish.type === 'sale' ? '出售' : wish.type === 'skill' ? '技能交换' : '失物招领' }}
              <span v-if="wish.max_price"> | 最高 ¥{{ wish.max_price }}</span>
            </div>
          </div>
          <div class="flex gap-2 ml-4">
            <button @click="handleToggle(wish)" class="text-sm px-3 py-1 rounded-lg border hover:bg-gray-50">
              {{ wish.is_active ? '暂停' : '开启' }}
            </button>
            <button @click="handleDelete(wish.id)" class="text-sm px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
