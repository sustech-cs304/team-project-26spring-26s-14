<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getItems } from '../api/items'

const router = useRouter()
const mapContainer = ref<HTMLDivElement | null>(null)
const map = ref<any>(null)
const infoWindow = ref<any>(null)
const loading = ref(true)
const errorMsg = ref('')

// const TENCENT_MAP_KEY = import.meta.env.VITE_TENCENT_MAP_KEY || ''
const TENCENT_MAP_KEY = import.meta.env.VITE_TENCENT_MAP_KEY || 'CTKBZ-OYTO7-BUSX4-HBESY-OH7PJ-WSFFJ'


const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).TMap) { resolve(); return }
    const script = document.createElement('script')
    script.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('地图脚本加载失败，请检查 Key 是否正确'))
    document.head.appendChild(script)
  })
}

const initMap = async () => {
  if (!mapContainer.value) return
  try {
    await loadScript(`https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`)

    const TMap = (window as any).TMap
    map.value = new TMap.Map(mapContainer.value, {
      center: new TMap.LatLng(22.595, 113.996),
      zoom: 16,
      pitch: 0,
      rotation: 0
    })

    const items = await getItems({ type: 'all' })
    const geoItems = items.filter((item: any) => item.location_lat && item.location_lng)

    if (geoItems.length === 0) {
      errorMsg.value = '暂无带位置信息的商品，先去发布几个吧'
      loading.value = false
      return
    }

    // 按坐标聚合
    const locationMap = new Map<string, any[]>()
    geoItems.forEach((item: any) => {
      const key = `${item.location_lat},${item.location_lng}`
      if (!locationMap.has(key)) locationMap.set(key, [])
      locationMap.get(key)!.push(item)
    })

    const locationEntries = Array.from(locationMap.entries())

    // 标记样式：统一尺寸
    const styles = {
      sale: new TMap.MarkerStyle({ width: 28, height: 38, color: '#2563eb', anchor: { x: 14, y: 38 } }),
      skill: new TMap.MarkerStyle({ width: 28, height: 38, color: '#9333ea', anchor: { x: 14, y: 38 } }),
      lost: new TMap.MarkerStyle({ width: 28, height: 38, color: '#ea580c', anchor: { x: 14, y: 38 } }),
      cluster: new TMap.MarkerStyle({ width: 28, height: 38, color: '#dc2626', anchor: { x: 14, y: 38 } })
    }

    // 创建 Marker
    const markerGeometries = locationEntries.map(([key, items], index) => {
      const isCluster = items.length > 1
      return {
        id: `marker-${index}`,
        styleId: isCluster ? 'cluster' : items[0].type,
        position: new TMap.LatLng(items[0].location_lat, items[0].location_lng),
        properties: { items, index }
      }
    })

    const marker = new TMap.MultiMarker({
      map: map.value,
      styles,
      geometries: markerGeometries
    })

    // 数字标签：所有点都显示，黑色粗体 + 白色背景气泡，最醒目
    const labelGeometries = locationEntries.map(([key, items], idx) => {
      const isCluster = items.length > 1
      const styleId = isCluster ? 'clusterNum' : `${items[0].type}Num`
      return {
        id: `label-${idx}`,
        styleId,
        position: new TMap.LatLng(items[0].location_lat, items[0].location_lng),
        content: ` ${items.length} `,
        properties: {}
      }
    })

    new TMap.MultiLabel({
      map: map.value,
      styles: {
        saleNum: new TMap.LabelStyle({
          color: '#111827', size: 14, weight: 'bold',
          offset: { x: 0, y: -50 },
          backgroundColor: '#ffffff', borderColor: '#2563eb', borderWidth: 2, borderRadius: 12
        }),
        skillNum: new TMap.LabelStyle({
          color: '#111827', size: 14, weight: 'bold',
          offset: { x: 0, y: -50 },
          backgroundColor: '#ffffff', borderColor: '#9333ea', borderWidth: 2, borderRadius: 12
        }),
        lostNum: new TMap.LabelStyle({
          color: '#111827', size: 14, weight: 'bold',
          offset: { x: 0, y: -50 },
          backgroundColor: '#ffffff', borderColor: '#ea580c', borderWidth: 2, borderRadius: 12
        }),
        clusterNum: new TMap.LabelStyle({
          color: '#111827', size: 14, weight: 'bold',
          offset: { x: 0, y: -50 },
          backgroundColor: '#ffffff', borderColor: '#dc2626', borderWidth: 2, borderRadius: 12
        })
      },
      geometries: labelGeometries
    })

    // InfoWindow
    infoWindow.value = new TMap.InfoWindow({
      map: map.value,
      position: new TMap.LatLng(22.595, 113.996),
      offset: { x: 0, y: -32 },
      content: ''
    })
    infoWindow.value.close()

    // 点击 Marker
    marker.on('click', (e: any) => {
      const { items } = e.geometry.properties
      const count = items.length

      if (count === 1) {
        const item = items[0]
        const content = `
          <div style="padding:10px;min-width:170px;font-family:system-ui,sans-serif">
            <div style="font-weight:700;margin-bottom:6px;color:#111827;font-size:15px">${item.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:8px">
              ${item.type === 'sale' ? '🔵 出售' : item.type === 'skill' ? '🟣 技能交换' : '🟠 失物招领'}
              ${item.price ? ' · ¥' + item.price : ''}
            </div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:10px">📍 ${item.location_name || item.seller?.nickname || '未知地点'}</div>
            <button onclick="window.__navigateToItem('${item.id}')" style="background:#2563eb;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;width:100%">查看详情</button>
          </div>
        `
        infoWindow.value.setPosition(e.geometry.position)
        infoWindow.value.setContent(content)
        infoWindow.value.open()
      } else {
        const listHtml = items.map((item: any) => `
          <div onclick="window.__navigateToItem('${item.id}')" style="padding:8px 0;border-bottom:1px solid #f0f0f0;cursor:pointer">
            <div style="font-weight:600;font-size:14px;color:#111827">${item.title}</div>
            <div style="font-size:12px;color:#6b7280;margin-top:2px">
              ${item.type === 'sale' ? '🔵 出售' : item.type === 'skill' ? '🟣 技能交换' : '🟠 失物招领'}
              ${item.price ? ' · ¥' + item.price : ''}
            </div>
          </div>
        `).join('')

        const content = `
          <div style="padding:12px;min-width:220px;max-width:260px;font-family:system-ui,sans-serif">
            <div style="font-weight:700;margin-bottom:4px;color:#111827;font-size:15px">📍 ${items[0].location_name || '该位置'}</div>
            <div style="font-size:12px;color:#6b7280;margin-bottom:10px">共 ${count} 个商品</div>
            <div style="max-height:200px;overflow-y:auto">
              ${listHtml}
            </div>
          </div>
        `
        infoWindow.value.setPosition(e.geometry.position)
        infoWindow.value.setContent(content)
        infoWindow.value.open()
      }
    })

    ;(window as any).__navigateToItem = (id: string) => {
      router.push(`/items/${id}`)
    }

    loading.value = false
  } catch (err: any) {
    errorMsg.value = err.message || '地图初始化失败'
    loading.value = false
  }
}

onMounted(initMap)
onUnmounted(() => {
  if (map.value) map.value.destroy()
  delete (window as any).__navigateToItem
})

const goBack = () => router.push('/')
</script>

<<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <nav class="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-10">
      <h1 class="text-xl font-bold text-gray-800">🗺️ 校园地图</h1>
      <button @click="goBack" class="text-gray-600 hover:text-gray-800">← 返回首页</button>
    </nav>

    <div class="relative flex-1">
      <div ref="mapContainer" class="w-full h-full min-h-[calc(100vh-72px)]"></div>

      <div v-if="loading" class="absolute inset-0 bg-white/80 flex items-center justify-center z-20">
        <div class="text-gray-600">地图加载中...</div>
      </div>

      <div v-if="errorMsg" class="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
        <div class="text-center">
          <div class="text-gray-500 mb-3">{{ errorMsg }}</div>
          <button @click="router.push('/items')" class="text-blue-600 hover:underline text-sm">去商品列表看看</button>
        </div>
      </div>

      <div class="absolute bottom-20 left-6 bg-white/90 backdrop-blur rounded-xl shadow p-3 z-10 text-sm space-y-2">
        <div class="font-medium text-gray-700 mb-1">图例</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-blue-600"></span> 出售</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-purple-600"></span> 技能交换</div>
        <div class="flex items-center gap-2"><span class="w-3 h-3 rounded-full bg-orange-600"></span> 失物招领</div>
      </div>
    </div>
  </div>
</template>
