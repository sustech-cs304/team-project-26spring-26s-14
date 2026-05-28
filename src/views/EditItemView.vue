<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItemById, updateItem } from '../api/items'
import { uploadItemImages } from '../api/storage'
import { useUserStore } from '../stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const item = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const errorMsg = ref('')

const title = ref('')
const description = ref('')
const price = ref('')
const locationName = ref('')
const imageFiles = ref<File[]>([])
const imagePreviewUrls = ref<string[]>([])
const existingImages = ref<string[]>([])
const uploadingImages = ref(false)

onMounted(async () => {
  try {
    item.value = await getItemById(route.params.id as string)
    if (!userStore.user || item.value.seller_id !== userStore.user.id) {
      alert('无权编辑该商品')
      router.push('/items')
      return
    }
    title.value = item.value.title
    description.value = item.value.description || ''
    price.value = item.value.price?.toString() || ''
    locationName.value = item.value.location_name || ''
    existingImages.value = item.value.image_urls || []
  } catch (err: any) {
    alert('加载失败：' + err.message)
    router.push('/items')
  } finally {
    loading.value = false
  }
})

const handleImageSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const newFiles = Array.from(files).slice(0, 6 - existingImages.value.length - imageFiles.value.length)
  imageFiles.value.push(...newFiles)
  imagePreviewUrls.value.push(...newFiles.map(f => URL.createObjectURL(f)))
}

const removeNewImage = (index: number) => {
  URL.revokeObjectURL(imagePreviewUrls.value[index])
  imageFiles.value.splice(index, 1)
  imagePreviewUrls.value.splice(index, 1)
}

const removeExistingImage = (index: number) => {
  existingImages.value.splice(index, 1)
}

const handleSave = async () => {
  saving.value = true
  errorMsg.value = ''
  try {
    let allImageUrls = [...existingImages.value]
    if (imageFiles.value.length > 0) {
      uploadingImages.value = true
      const newUrls = await uploadItemImages(imageFiles.value)
      allImageUrls.push(...newUrls)
      uploadingImages.value = false
    }

    const updates: any = {
      title: title.value,
      description: description.value || null,
      location_name: locationName.value || null,
      image_urls: allImageUrls
    }
    if (item.value.type === 'sale') {
      updates.price = parseFloat(price.value) || 0
    }

    await updateItem(item.value.id, updates)
    alert('修改成功！')
    router.push(`/items/${item.value.id}`)
  } catch (err: any) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    saving.value = false
    uploadingImages.value = false
  }
}

const goBack = () => router.back()
</script>

<<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-800">✏️ 编辑商品</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回</button>
    </nav>

    <div v-if="loading" class="text-center py-12 text-gray-500">加载中...</div>

    <div v-else class="max-w-2xl mx-auto mt-8 p-4">
      <div class="bg-white rounded-xl shadow p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">编辑商品信息</h2>

        <form @submit.prevent="handleSave" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">标题</label>
            <input v-model="title" required class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div v-if="item.type === 'sale'">
            <label class="block text-sm font-medium text-gray-700 mb-1">价格（元）</label>
            <input v-model="price" type="number" min="0" step="0.01" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">图片（最多6张）</label>
            <div class="flex flex-wrap gap-3 mb-2">
              <!-- 已有图片 -->
              <div v-for="(url, idx) in existingImages" :key="'exist-' + idx" class="relative w-24 h-24">
                <img :src="url" class="w-full h-full object-cover rounded-lg border" />
                <button @click="removeExistingImage(idx)" type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600">×</button>
              </div>
              <!-- 新图片预览 -->
              <div v-for="(url, idx) in imagePreviewUrls" :key="'new-' + idx" class="relative w-24 h-24">
                <img :src="url" class="w-full h-full object-cover rounded-lg border" />
                <button @click="removeNewImage(idx)" type="button" class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center hover:bg-red-600">×</button>
              </div>
              <label v-if="existingImages.length + imageFiles.length < 6" class="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
                <span class="text-2xl text-gray-400">+</span>
                <input type="file" accept="image/*" multiple @change="handleImageSelect" class="hidden" />
              </label>
            </div>
            <p v-if="uploadingImages" class="text-sm text-blue-600">图片上传中...</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea v-model="description" rows="4" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">地点</label>
            <input v-model="locationName" class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>

          <button type="submit" :disabled="saving || uploadingImages" class="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
            {{ saving || uploadingImages ? '保存中...' : '保存修改' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
