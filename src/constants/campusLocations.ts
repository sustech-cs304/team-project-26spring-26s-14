export interface CampusLocation {
  name: string
  lat: number
  lng: number
}

// 深圳科技大学常用地点（坐标为示例，可根据实际调整）
export const campusLocations: CampusLocation[] = [
  { name: '一丹图书馆', lat: 22.59746, lng: 113.998275 },
  { name: '中心食堂', lat: 22.597389, lng: 113.998101 },
  { name: '工学院北楼', lat: 22.601693, lng: 113.996148 },
  { name: '学生宿舍13栋', lat: 22.601634, lng: 113.999439 },
  { name: '商学院', lat: 22.594994, lng: 114.000333 },
  { name: '第一教学楼', lat: 22.59586, lng: 113.997183 },
]
