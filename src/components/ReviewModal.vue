<script setup lang="ts">
import { ref } from 'vue'
import { submitReview } from '../api/reviews'

const props = defineProps<{
  show: boolean
  revieweeId: string
  itemId: string
  revieweeName: string
}>()

const emit = defineEmits(['close', 'submitted'])

const rating = ref(5)
const comment = ref('')
const loading = ref(false)
const errorMsg = ref('')

const stars = [1, 2, 3, 4, 5]

const handleSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await submitReview(props.revieweeId, props.itemId, rating.value, comment.value)
    emit('submitted')
    emit('close')
  } catch (err: any) {
    errorMsg.value = err.message || '评价失败'
  } finally {
    loading.value = false
  }
}
</script>

<<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 mx-4">
      <h3 class="text-lg font-bold text-gray-800 mb-4">评价 {{ revieweeName }}</h3>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">评分</label>
        <div class="flex gap-2">
          <button
            v-for="s in stars"
            :key="s"
            @click="rating = s"
            class="text-2xl transition"
            :class="s <= rating ? 'text-yellow-400' : 'text-gray-200'"
          >
            ★
          </button>
        </div>
      </div>

      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-1">评价内容（可选）</label>
        <textarea
          v-model="comment"
          rows="3"
          placeholder="交易体验如何？"
          class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <div v-if="errorMsg" class="text-red-500 text-sm mb-3">{{ errorMsg }}</div>

      <div class="flex gap-3">
        <button
          @click="emit('close')"
          class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
        >取消</button>
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? '提交中...' : '提交评价' }}
        </button>
      </div>
    </div>
  </div>
</template>
