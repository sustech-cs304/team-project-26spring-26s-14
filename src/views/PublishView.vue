<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { publishItem } from '../api/items'
import { uploadItemImages } from '../api/storage'
import { campusLocations } from '../constants/campusLocations'

const router = useRouter()
const userStore = useUserStore()

const title = ref('')
const description = ref('')
const price = ref('')
const category = ref('教材')
const type = ref('sale')
const locationName = ref('')
const locationLat = ref<number | null>(null)
const locationLng = ref<number | null>(null)
const useCustomLocation = ref(false)
const categories = ['教材', '电子产品', '生活用品', '其他']
const loading = ref(false)
const errorMsg = ref('')

const imageFiles = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])
const uploadingImages = ref(false)

const locationLabel = computed(() => type.value === 'lost' ? '发现/存放地点' : '建议交易地点（可选）')
const showPrice = computed(() => type.value === 'sale')
const showCategory = computed(() => type.value === 'sale')

const handleImageSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const newFiles = Array.from(files).slice(0, 6 - imageFiles.value.length)
  imageFiles.value.push(...newFiles)
  imagePreviewUrls.value.push(...newFiles.map(f => URL.createObjectURL(f)))
}

const removeImage = (index: number) => {
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  imageFiles.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

const onLocationSelect = (e: Event) => {
  const name = (e.target as HTMLSelectElement).value
  if (!name) {
    locationLat.value = null
    locationLng.value = null
    return
  }
  const loc = campusLocations.find(l => l.name === name)
  if (loc) {
    locationName.value = loc.name
    locationLat.value = loc.lat
    locationLng.value = loc.lng
  }
}

const onCustomLocationInput = () => {
  locationLat.value = null
  locationLng.value = null
}

const handlePublish = async () => {
  if (!userStore.user) { alert('请先登录'); router.push('/auth'); return }
  loading.value = true; errorMsg.value = ''
  try {
    let imageUrls: string[] = []
    if (imageFiles.value.length > 0) {
      uploadingImages.value = true
      imageUrls = await uploadItemImages(imageFiles.value)
      uploadingImages.value = false
    }

    const itemData: any = {
      title: title.value,
      description: description.value,
      type: type.value,
      location_name: locationName.value || null,
      location_lat: locationLat.value,
      location_lng: locationLng.value,
      image_urls: imageUrls
    }
    if (type.value === 'sale') {
      itemData.price = parseFloat(price.value) || 0
      itemData.category = category.value
    }
    await publishItem(itemData)
    alert('发布成功！'); router.push('/items')
  } catch (err: any) {
    errorMsg.value = err.message || '发布失败'
  } finally {
    loading.value = false
    uploadingImages.value = false
  }
}

const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">🏫 校园社交市场</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="max-w-2xl mx-auto mt-8 p-4">
      <div class="bg-white rounded-xl shadow p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">发布商品/服务</h2>

        <form @submit.prevent="handlePublish" class="space-y-4">
          <!-- 类型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">类型</label>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="type" value="sale" class="text-blue-600" />
                <span class="text-sm">出售</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="type" value="skill" class="text-blue-600" />
                <span class="text-sm">技能交换</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="type" value="lost" class="text-blue-600" />
                <span class="text-sm">失物招领</span>
              </label>
            </div>
          </div>

          <!-- 标题 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input
              v-model="title"
              required
              :placeholder="type === 'lost' ? '例如：在图书馆捡到校园卡' : type === 'skill' ? '例如：1小时Python辅导换吉他课' : '例如：二手微积分教材'"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 分类 -->
          <div v-if="showCategory">
            <label class="block text-sm font-medium text-gray-700 mb-1">分类（可选）</label>
            <select v-model="category" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option v-for="c in categories" :key="c">{{ c }}</option>
            </select>
          </div>

          <!-- 价格 -->
          <div v-if="showPrice">
            <label class="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
            <input
              v-model="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <!-- 图片上传 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">图片（最多6张）</label>
            <div class="flex flex-wrap gap-3 mb-2">
              <div v-for="(url, idx) in imagePreviewUrls" :key="idx" class="relative w-24 h-24">
                <img :src="url" class="w-full h-full object-cover rounded-lg border" />
                <button
                  @click="removeImage(idx)"
                  type="button"
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600"
                >×</button>
              </div>
              <label
                v-if="imageFiles.length < 6"
                class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              >
                <span class="text-2xl text-gray-400">+</span>
                <input type="file" accept="image/*" multiple @change="handleImageSelect" class="hidden" />
              </label>
            </div>
            <p v-if="uploadingImages" class="text-sm text-blue-600">图片上传中...</p>
          </div>

          <!-- 描述 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              v-model="description"
              rows="4"
              :placeholder="type === 'lost' ? '描述物品特征、发现时间、存放位置等...' : '描述一下物品状况、交易时间地点要求等...'"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          <!-- 地点选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ locationLabel }}</label>
            
            <div class="flex gap-2 mb-2">
              <button
                type="button"
                @click="useCustomLocation = false"
                :class="!useCustomLocation ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200'"
                class="flex-1 py-2 border rounded-lg text-sm font-medium transition"
              >
                选择常用地点
              </button>
              <button
                type="button"
                @click="useCustomLocation = true"
                :class="useCustomLocation ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-50 text-gray-600 border-gray-200'"
                class="flex-1 py-2 border rounded-lg text-sm font-medium transition"
              >
                自定义地点
              </button>
            </div>

            <!-- 常用地点 -->
            <div v-if="!useCustomLocation">
              <select
                @change="onLocationSelect"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">请选择地点...</option>
                <option v-for="loc in campusLocations" :key="loc.name" :value="loc.name">{{ loc.name }}</option>
              </select>
              <p v-if="locationLat && locationLng" class="text-xs text-gray-400 mt-1">
                坐标：{{ locationLat.toFixed(4) }}, {{ locationLng.toFixed(4) }}（将在地图显示）
              </p>
            </div>

            <!-- 自定义地点 -->
            <div v-else>
              <input
                v-model="locationName"
                @input="onCustomLocationInput"
                :placeholder="type === 'lost' ? '例如：图书馆二楼、一食堂前台' : '例如：图书馆门口（买卖双方可再协商）'"
                class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p class="text-xs text-gray-400 mt-1">自定义地点仅显示名称，不会在地图上显示精确标记</p>
            </div>
          </div>

          <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>

          <button
            type="submit"
            :disabled="loading || uploadingImages"
            class="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {{ loading || uploadingImages ? '处理中...' : '立即发布' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
