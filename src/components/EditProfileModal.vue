<script setup lang="ts">
import { ref, watch } from 'vue'
import { supabase } from '../supabase'

const props = defineProps<{
  show: boolean
  profile: any
}>()

const emit = defineEmits(['close', 'updated'])

const nickname = ref('')
const avatarUrl = ref('')
const major = ref('')
const loading = ref(false)
const errorMsg = ref('')

watch(() => props.show, (val) => {
  if (val && props.profile) {
    nickname.value = props.profile.nickname || ''
    avatarUrl.value = props.profile.avatar_url || ''
    major.value = props.profile.major || ''
    errorMsg.value = ''
  }
})

const handleSave = async () => {
  if (!nickname.value.trim()) {
    errorMsg.value = '昵称不能为空'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('未登录')

    const { error } = await supabase
      .from('profiles')
      .update({
        nickname: nickname.value.trim(),
        avatar_url: avatarUrl.value.trim() || null,
        major: major.value.trim() || null
      })
      .eq('id', user.id)

    if (error) throw error
    emit('updated')
    emit('close')
  } catch (err: any) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    loading.value = false
  }
}
</script>

<<template>
  <div v-if="show" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="emit('close')">
    <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6 mx-4">
      <h3 class="text-lg font-bold text-gray-800 mb-4">编辑个人资料</h3>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">昵称 *</label>
          <input
            v-model="nickname"
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="你的昵称"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">头像 URL（可选）</label>
          <input
            v-model="avatarUrl"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://example.com/avatar.jpg"
          />
          <p class="text-xs text-gray-400 mt-1">粘贴图片链接，留空使用默认头像</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">专业（可选）</label>
          <input
            v-model="major"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例如：计算机科学与技术"
          />
        </div>

        <div v-if="errorMsg" class="text-red-500 text-sm">{{ errorMsg }}</div>

        <div class="flex gap-3 pt-2">
          <button
            @click="emit('close')"
            class="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
          >取消</button>
          <button
            @click="handleSave"
            :disabled="loading"
            class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
