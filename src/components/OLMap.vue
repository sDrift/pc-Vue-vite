<template>
  <div class="ol-map-container">
    <div ref="mapRef" class="ol-map"></div>
  </div>
</template>

<script setup>
import { onMounted, ref, onUnmounted } from 'vue'
import View from 'ol/View'
import OSM from 'ol/source/OSM'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'
import Circle from 'ol/geom/Circle'
import LineString from 'ol/geom/LineString'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import Map from 'ol/Map'
import { Style, Stroke, Fill, Circle as CircleStyle, Text } from 'ol/style'
import Overlay from 'ol/Overlay'
import { fromLonLat } from 'ol/proj'

const mapRef = ref(null)
let mapInstance = null
let flightPathSource = null
let flightPathLayer = null
let animationFrameId = null
let sichuanLayer = null
let sichuanSource = null
// 点位相关
let markerSource = null
let markerLayer = null
let markers = {}
// 事件监听器存储
let eventListeners = {}

// 初始化地图
const initMap = () => {
  if (!mapRef.value) return

  try {
    // 创建飞线路径的数据源
    flightPathSource = new VectorSource()

    // 创建飞线路径的图层
    flightPathLayer = new VectorLayer({
      source: flightPathSource,
      zIndex: 10,
    })

    // 创建点位数据源
    markerSource = new VectorSource()

    // 创建点位图层
    markerLayer = new VectorLayer({
      source: markerSource,
      zIndex: 15,
    })

    // 创建地图实例
    mapInstance = new Map({
      target: mapRef.value,
      layers: [
        new TileLayer({
          // 使用国内高德地图瓦片源
          source: new OSM({
            url: 'https://wprd0{1-4}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
            attributions: '© 高德地图',
          }),
        }),
        flightPathLayer, // 添加飞线路径图层
        markerLayer, // 添加点位图层
      ],
      view: new View({
        center: fromLonLat([104.07, 30.67]), // 成都的经纬度（四川中心）
        zoom: 7, // 缩放级别
      }),
    })

    // 添加地图事件监听
    mapInstance.on('click', handleMapClick)

    // 监听窗口大小变化，调整地图大小
    window.addEventListener('resize', handleResize)
  } catch (error) {
    console.error('地图初始化失败', error)
  }
}

// 创建从成都到各区县的飞线
const createFlightPath = () => {
  if (!flightPathSource) return

  // 清除现有飞线
  flightPathSource.clear()

  // 保持四川图层可见
  if (sichuanLayer) {
    sichuanLayer.setVisible(true)
  }

  // 成都坐标作为起点
  const chengdu = fromLonLat([104.07, 30.67])

  // 四川主要区县坐标列表（部分示例）
  const districts = [
    { name: '自贡', coords: fromLonLat([104.77, 29.34]) },
    { name: '泸州', coords: fromLonLat([105.38, 28.86]) },
    { name: '德阳', coords: fromLonLat([104.38, 31.12]) },
    { name: '绵阳', coords: fromLonLat([104.72, 31.47]) },
    { name: '遂宁', coords: fromLonLat([105.56, 30.53]) },
    { name: '内江', coords: fromLonLat([105.07, 29.59]) },
    { name: '乐山', coords: fromLonLat([103.76, 29.56]) },
    { name: '宜宾', coords: fromLonLat([104.65, 28.79]) },
  ]

  // 为每个区县创建飞线
  districts.forEach((district, index) => {
    // 计算起点到终点的方向向量
    const dx = district.coords[0] - chengdu[0]
    const dy = district.coords[1] - chengdu[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    // 计算中点
    const midX = (chengdu[0] + district.coords[0]) / 2
    const midY = (chengdu[1] + district.coords[1]) / 2

    // 垂直于方向向量的单位向量（用于生成控制点）
    const normalX = -dy / distance
    const normalY = dx / distance

    // 减小偏移因子，使弧度更加适中
    const offsetFactor = 0.3 // 减小到0.3，使弧度更加适中
    const curveDirection = index % 2 === 0 ? 1 : -1 // 相邻飞线使用不同方向的弯曲
    const offsetDistance = distance * offsetFactor * curveDirection

    // 使用三次贝塞尔曲线的两个控制点，创建更平滑、更明显的弧形
    // 第一个控制点在起点到中点的25%处
    const cp1X = chengdu[0] + dx * 0.25 + normalX * offsetDistance * 0.7
    const cp1Y = chengdu[1] + dy * 0.25 + normalY * offsetDistance * 0.7

    // 第二个控制点在中点到终点的75%处
    const cp2X = chengdu[0] + dx * 0.75 + normalX * offsetDistance * 0.7
    const cp2Y = chengdu[1] + dy * 0.75 + normalY * offsetDistance * 0.7

    // 创建三次贝塞尔曲线路径，使用四个点：起点、两个控制点、终点
    // 但由于LineString只支持直线连接，我们需要生成多点来模拟曲线
    const points = []
    const numSegments = 50 // 生成50个点来模拟平滑曲线

    for (let t = 0; t <= numSegments; t++) {
      const ratio = t / numSegments
      // 三次贝塞尔曲线公式
      const x =
        Math.pow(1 - ratio, 3) * chengdu[0] +
        3 * Math.pow(1 - ratio, 2) * ratio * cp1X +
        3 * (1 - ratio) * Math.pow(ratio, 2) * cp2X +
        Math.pow(ratio, 3) * district.coords[0]

      const y =
        Math.pow(1 - ratio, 3) * chengdu[1] +
        3 * Math.pow(1 - ratio, 2) * ratio * cp1Y +
        3 * (1 - ratio) * Math.pow(ratio, 2) * cp2Y +
        Math.pow(ratio, 3) * district.coords[1]

      points.push([x, y])
    }

    // 创建多点LineString来表示平滑的弧形曲线
    const flightPath = new LineString(points)

    // 创建飞线路径的样式，使用不同颜色区分不同区县
    const hue = (index * 30) % 360 // 不同色相
    // 使用更深的颜色（降低亮度值，增加不透明度）
    const flightPathStyle = new Style({
      stroke: new Stroke({
        color: `hsla(${hue}, 80%, 30%, 0.9)`, // 更深的颜色，增加不透明度
        width: 4, // 增加线宽使飞线更明显
        lineDash: [10, 5],
      }),
    })

    // 创建飞线路径的Feature
    const pathFeature = new Feature({
      geometry: flightPath,
      name: district.name,
    })

    pathFeature.setStyle(flightPathStyle)

    // 添加到数据源
    flightPathSource.addFeature(pathFeature)

    // 创建飞机标记 - 使用更大的半径和更强的对比度
    const planeFeature = new Feature({
      geometry: new Circle(chengdu, 8), // 增大飞机标记尺寸
      name: district.name,
    })

    // 飞机标记样式，与飞线颜色匹配但更醒目
    const planeStyle = new Style({
      image: new CircleStyle({
        radius: 8,
        fill: new Fill({ color: `hsla(${hue}, 100%, 80%, 1)` }), // 使用亮色填充使飞机更明显
        stroke: new Stroke({ color: `hsla(${hue}, 100%, 20%, 1)`, width: 3 }), // 深色边框增加对比度
      }),
      // 添加飞机图标文字
      text: new Text({
        text: '✈',
        font: '16px sans-serif',
        fill: new Fill({ color: `hsla(${hue}, 100%, 10%, 1)` }),
        textAlign: 'center',
        textBaseline: 'middle',
      }),
    })

    planeFeature.setStyle(planeStyle)
    flightPathSource.addFeature(planeFeature)

    // 为每个飞机设置不同的延迟开始动画
    setTimeout(() => {
      animateFlight(planeFeature, points, 4000)
    }, index * 1000)
  })
}

// 飞行动画（使用路径点数组进行动画）
const animateFlight = (planeFeature, pathPoints, duration = 3000) => {
  let startTime = null
  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp
    const progress = Math.min((timestamp - startTime) / duration, 1)

    // 计算当前应该在哪个段
    const totalPoints = pathPoints.length
    const targetIndex = Math.min(Math.floor(progress * totalPoints), totalPoints - 1)

    // 获取当前位置
    const currentPoint = pathPoints[targetIndex]

    // 更新飞机位置
    planeFeature.getGeometry().setCenter(currentPoint)

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate)
    } else {
      // 动画结束后，重置飞机位置并重新开始动画
      setTimeout(() => {
        if (flightPathSource && planeFeature) {
          planeFeature.getGeometry().setCenter(pathPoints[0])
          animateFlight(planeFeature, pathPoints, duration)
        }
      }, 1000)
    }
  }

  // 开始动画
  animationFrameId = requestAnimationFrame(animate)
}

// 处理地图点击事件
const handleMapClick = (event) => {
  // 获取点击位置的坐标
  const coordinate = event.coordinate

  console.log('地图点击坐标:', coordinate)

  // 检查点击位置是否有区县要素
  let clickedFeature = null

  mapInstance.forEachFeatureAtPixel(
    event.pixel,
    (feature) => {
      if (feature.get('level') === 'city' || feature.get('level') === 'district') {
        clickedFeature = feature

        return true
      }

      return false
    },
    {
      layerFilter(layer) {
        return layer === sichuanLayer
      },
    },
  )

  // 只有点击遮罩层才显示弹窗，点击空白区域不显示
  if (!clickedFeature) {
    return
  }

  // 创建或获取弹窗覆盖层
  if (!popupOverlay) {
    createPopupOverlay()
  }

  // 如果点击的是当前显示弹窗的区县，则关闭弹窗
  if (currentPopupFeature && currentPopupFeature === clickedFeature) {
    popupOverlay.setPosition(undefined)
    currentPopupFeature = null

    return
  }

  // 转换坐标为经纬度格式
  const lonlat = mapInstance.getCoordinateFromPixel(event.pixel)
  const lonlat4326 =
    mapInstance.getView().getProjection().getUnits() === 'm'
      ? olProj.transform(lonlat, 'EPSG:3857', 'EPSG:4326')
      : lonlat

  // 更新弹窗内容
  const name = clickedFeature.get('name') || '未知区域'

  popupContent.innerHTML = `<div class="popup-content">
      <div class="popup-title">${name}</div>
      <div class="popup-info">
        <p>经度: ${lonlat4326[0].toFixed(6)}</p>
        <p>纬度: ${lonlat4326[1].toFixed(6)}</p>
      </div>
    </div>`

  // 显示弹窗
  popupOverlay.setPosition(coordinate)
  // 更新当前显示弹窗的区县要素
  currentPopupFeature = clickedFeature
}

// 全局变量用于弹窗
let popupOverlay = null
let popupContent = null

import * as olProj from 'ol/proj'

// 记录当前显示弹窗的区县要素
let currentPopupFeature = null

// 创建弹窗覆盖层
const createPopupOverlay = () => {
  // 创建弹窗容器
  const popupContainer = document.createElement('div')

  popupContainer.className = 'map-popup'
  popupContainer.style.position = 'relative'
  popupContainer.style.backgroundColor = 'white'
  popupContainer.style.borderRadius = '8px'
  popupContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  popupContainer.style.padding = '0'
  popupContainer.style.minWidth = '200px'
  popupContainer.style.maxWidth = '300px'
  popupContainer.style.pointerEvents = 'auto'

  // 添加关闭按钮
  const closeButton = document.createElement('button')

  closeButton.className = 'popup-close'
  closeButton.innerHTML = '×'
  closeButton.style.position = 'absolute'
  closeButton.style.top = '4px'
  closeButton.style.right = '4px'
  closeButton.style.width = '24px'
  closeButton.style.height = '24px'
  closeButton.style.border = 'none'
  closeButton.style.borderRadius = '50%'
  closeButton.style.backgroundColor = 'rgba(0,0,0,0.1)'
  closeButton.style.color = 'black'
  closeButton.style.fontSize = '16px'
  closeButton.style.lineHeight = '1'
  closeButton.style.cursor = 'pointer'
  closeButton.style.display = 'flex'
  closeButton.style.alignItems = 'center'
  closeButton.style.justifyContent = 'center'
  closeButton.addEventListener('click', () => {
    popupOverlay.setPosition(undefined)
  })

  // 创建内容容器
  popupContent = document.createElement('div')

  // 组装弹窗
  popupContainer.appendChild(closeButton)
  popupContainer.appendChild(popupContent)

  // 创建覆盖层
  popupOverlay = new Overlay({
    element: popupContainer,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
    positioning: 'bottom-center',
    offset: [0, -10],
  })

  // 添加到地图
  mapInstance.addOverlay(popupOverlay)
}

// 导入四川省的完整JSON数据
import sichuanGeoJSON from './json/四川省.json'

// 添加四川地区的遮罩层
const addSichuanMask = () => {
  if (!mapInstance) return

  // 创建四川地区数据源
  sichuanSource = new VectorSource()

  // 解析GeoJSON数据并添加到数据源
  const geojsonFormat = new GeoJSON({
    defaultDataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })

  const features = geojsonFormat.readFeatures(sichuanGeoJSON)

  sichuanSource.addFeatures(features)

  // 创建四川地区图层
  sichuanLayer = new VectorLayer({
    source: sichuanSource,
    style(feature) {
      const level = feature.get('level')

      if (level === 'province') {
        return new Style({
          fill: new Fill({ color: 'rgba(255, 165, 0, 0.2)' }),
          stroke: new Stroke({ color: '#ff8c00', width: 2 }),
        })
      } else {
        return new Style({
          fill: new Fill({ color: 'rgba(0, 128, 0, 0.1)' }),
          stroke: new Stroke({ color: '#008000', width: 1 }),
        })
      }
    },
    zIndex: 5,
  })

  // 添加图层到地图
  mapInstance.addLayer(sichuanLayer)

  // 添加鼠标高亮效果
  addHighlightInteraction()
}

// 添加鼠标高亮交互和名称显示
const addHighlightInteraction = () => {
  if (!mapInstance || !sichuanLayer) return

  let highlightFeature = null
  let previousStyle = null
  let nameOverlay = null

  // 创建名称显示的覆盖层
  const createNameOverlay = () => {
    // 清理旧的覆盖层
    if (nameOverlay) {
      mapInstance.removeOverlay(nameOverlay)
    }

    // 创建新的覆盖层
    nameOverlay = new Overlay({
      element: document.createElement('div'),
      stopEvent: false,
      offset: [15, 0],
    })
    mapInstance.addOverlay(nameOverlay)

    // 设置覆盖层样式
    const element = nameOverlay.getElement()

    element.className = 'city-name-overlay'
    element.style.backgroundColor = 'rgba(0, 0, 0, 0.7)'
    element.style.color = 'white'
    element.style.padding = '4px 8px'
    element.style.borderRadius = '4px'
    element.style.fontSize = '14px'
    element.style.pointerEvents = 'none'
  }

  // 初始化名称覆盖层
  createNameOverlay()

  // 鼠标移动事件处理
  mapInstance.on('pointermove', (evt) => {
    if (!sichuanLayer) return

    // 获取鼠标所在位置的要素
    const feature = mapInstance.forEachFeatureAtPixel(
      evt.pixel,
      (feature) => {
        if (feature.get('level') === 'city') {
          return feature
        }

        return null
      },
      {
        layerFilter(layer) {
          return layer === sichuanLayer
        },
      },
    )

    // 处理高亮状态
    if (feature !== highlightFeature) {
      // 恢复之前高亮要素的样式
      if (highlightFeature) {
        highlightFeature.setStyle(previousStyle)
        previousStyle = null
      }

      // 设置新要素的高亮样式
      if (feature) {
        previousStyle = feature.getStyle()
        feature.setStyle(
          new Style({
            fill: new Fill({ color: 'rgba(255, 215, 0, 0.4)' }),
            stroke: new Stroke({ color: '#ffd700', width: 3 }),
          }),
        )

        // 显示市名称
        if (nameOverlay) {
          const element = nameOverlay.getElement()

          element.textContent = feature.get('name')
          nameOverlay.setPosition(evt.coordinate)
        }
      } else {
        // 隐藏名称
        if (nameOverlay) {
          nameOverlay.setPosition(undefined)
        }
      }

      // 更新鼠标样式
      mapInstance.getTargetElement().style.cursor = feature ? 'pointer' : ''

      // 更新当前高亮要素
      highlightFeature = feature
    }
  })

  // 鼠标离开地图时清除高亮
  mapInstance.getViewport().addEventListener('mouseout', () => {
    if (highlightFeature) {
      highlightFeature.setStyle(previousStyle)
      highlightFeature = null
      previousStyle = null
    }
    if (nameOverlay) {
      nameOverlay.setPosition(undefined)
    }
    mapInstance.getTargetElement().style.cursor = ''
  })
}

// 处理窗口大小变化
const handleResize = () => {
  if (mapInstance) {
    mapInstance.updateSize()
  }
}

// ========== 点位上图共用方法 ==========

const addMarker = (options) => {
  if (!mapInstance || !markerSource) return null

  const { id, longitude, latitude, title, color = '#FF5722', size = 12, icon } = options

  if (markers[id]) {
    removeMarker(id)
  }

  const coordinates = fromLonLat([longitude, latitude])

  let markerStyle

  if (icon) {
    markerStyle = new Style({
      image: new CircleStyle({
        radius: size,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
      text: icon
        ? new Text({
            text: icon,
            font: `${size + 4}px sans-serif`,
            fill: new Fill({ color: '#fff' }),
            textAlign: 'center',
            textBaseline: 'middle',
          })
        : undefined,
    })
  } else {
    markerStyle = new Style({
      image: new CircleStyle({
        radius: size,
        fill: new Fill({ color }),
        stroke: new Stroke({ color: '#fff', width: 2 }),
      }),
    })
  }

  const marker = new Feature({
    geometry: new Circle(coordinates, size),
    name: title || `Marker_${id}`,
    markerId: id,
  })

  marker.setStyle(markerStyle)
  markerSource.addFeature(marker)
  markers[id] = marker

  return id
}

const removeMarker = (id) => {
  if (markers[id]) {
    markerSource.removeFeature(markers[id])
    delete markers[id]
  }
}

const clearMarkers = () => {
  markerSource.clear()
  markers = {}
}

// ========== 遮罩层共用方法 ==========

const addMaskLayer = (geoJsonData, options = {}) => {
  if (!mapInstance) return null

  const {
    fillColor = 'rgba(255, 165, 0, 0.2)',
    strokeColor = '#ff8c00',
    strokeWidth = 2,
    zIndex = 5,
    layerName = 'maskLayer',
  } = options

  const maskSource = new VectorSource()
  const geojsonFormat = new GeoJSON({
    defaultDataProjection: 'EPSG:4326',
    featureProjection: 'EPSG:3857',
  })

  const features = geojsonFormat.readFeatures(geoJsonData)

  maskSource.addFeatures(features)

  const maskLayer = new VectorLayer({
    source: maskSource,
    style: new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    }),
    zIndex,
  })

  mapInstance.addLayer(maskLayer)

  return { layer: maskLayer, source: maskSource }
}

const removeMaskLayer = (maskLayer) => {
  if (mapInstance && maskLayer) {
    mapInstance.removeLayer(maskLayer)
  }
}

const toggleMask = (maskLayer, visible) => {
  if (maskLayer) {
    maskLayer.setVisible(visible)
  }
}

// ========== 飞线共用方法 ==========

const createCustomFlightPath = (startCoords, endPoints, options = {}) => {
  if (!flightPathSource) return

  const { duration = 3000, lineWidth = 4, offsetFactor = 0.3, animate = true } = options

  const start = fromLonLat(startCoords)

  endPoints.forEach((endPoint, index) => {
    const end = fromLonLat(endPoint.coords)
    const dx = end[0] - start[0]
    const dy = end[1] - start[1]
    const distance = Math.sqrt(dx * dx + dy * dy)

    const midX = (start[0] + end[0]) / 2
    const midY = (start[1] + end[1]) / 2

    const normalX = -dy / distance
    const normalY = dx / distance

    const curveDirection = index % 2 === 0 ? 1 : -1
    const offsetDistance = distance * offsetFactor * curveDirection

    const cp1X = start[0] + dx * 0.25 + normalX * offsetDistance * 0.7
    const cp1Y = start[1] + dy * 0.25 + normalY * offsetDistance * 0.7
    const cp2X = start[0] + dx * 0.75 + normalX * offsetDistance * 0.7
    const cp2Y = start[1] + dy * 0.75 + normalY * offsetDistance * 0.7

    const points = []
    const numSegments = 50

    for (let t = 0; t <= numSegments; t++) {
      const ratio = t / numSegments
      const x =
        Math.pow(1 - ratio, 3) * start[0] +
        3 * Math.pow(1 - ratio, 2) * ratio * cp1X +
        3 * (1 - ratio) * Math.pow(ratio, 2) * cp2X +
        Math.pow(ratio, 3) * end[0]

      const y =
        Math.pow(1 - ratio, 3) * start[1] +
        3 * Math.pow(1 - ratio, 2) * ratio * cp1Y +
        3 * (1 - ratio) * Math.pow(ratio, 2) * cp2Y +
        Math.pow(ratio, 3) * end[1]

      points.push([x, y])
    }

    const flightPath = new LineString(points)
    const hue = (index * 30) % 360

    const pathFeature = new Feature({
      geometry: flightPath,
      name: endPoint.name,
    })

    pathFeature.setStyle(
      new Style({
        stroke: new Stroke({
          color: `hsla(${hue}, 80%, 30%, 0.9)`,
          width: lineWidth,
          lineDash: [10, 5],
        }),
      }),
    )

    flightPathSource.addFeature(pathFeature)

    if (animate) {
      const planeFeature = new Feature({
        geometry: new Circle(start, 8),
        name: endPoint.name,
      })

      planeFeature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: `hsla(${hue}, 100%, 80%, 1)` }),
            stroke: new Stroke({ color: `hsla(${hue}, 100%, 20%, 1)`, width: 3 }),
          }),
          text: new Text({
            text: '✈',
            font: '16px sans-serif',
            fill: new Fill({ color: `hsla(${hue}, 100%, 10%, 1)` }),
            textAlign: 'center',
            textBaseline: 'middle',
          }),
        }),
      )

      flightPathSource.addFeature(planeFeature)

      setTimeout(() => {
        animateFlight(planeFeature, points, duration)
      }, index * 1000)
    }
  })
}

const removeFlightPath = () => {
  if (flightPathSource) {
    flightPathSource.clear()
  }
}

// ========== 地图事件共用方法 ==========

const onMapClick = (callback) => {
  if (!mapInstance) return

  const handler = (event) => {
    const coordinate = event.coordinate
    const pixel = event.pixel
    const lonlat = mapInstance.getCoordinateFromPixel(pixel)
    const lonlat4326 =
      mapInstance.getView().getProjection().getUnits() === 'm'
        ? olProj.transform(lonlat, 'EPSG:3857', 'EPSG:4326')
        : lonlat

    callback({
      coordinate,
      pixel,
      longitude: lonlat4326[0],
      latitude: lonlat4326[1],
      originalEvent: event,
    })
  }

  mapInstance.on('click', handler)
  eventListeners['click'] = handler

  return () => {
    // 卸载顺序「子先父后」：本组件 onUnmounted 已 dispose 并置 mapInstance=null，
    // 之后父组件才调 unsubscribe，此时 mapInstance 为 null，直接跳过即可
    // （地图已销毁，事件随之消失，无需再 un）
    if (!mapInstance) return
    mapInstance.un('click', handler)
    delete eventListeners['click']
  }
}

const onMapMove = (callback) => {
  if (!mapInstance) return

  const handler = (event) => {
    const coordinate = event.coordinate
    const pixel = event.pixel
    const lonlat = mapInstance.getCoordinateFromPixel(pixel)
    const lonlat4326 =
      mapInstance.getView().getProjection().getUnits() === 'm'
        ? olProj.transform(lonlat, 'EPSG:3857', 'EPSG:4326')
        : lonlat

    callback({
      coordinate,
      pixel,
      longitude: lonlat4326[0],
      latitude: lonlat4326[1],
      originalEvent: event,
    })
  }

  mapInstance.on('pointermove', handler)
  eventListeners['pointermove'] = handler

  return () => {
    if (!mapInstance) return
    mapInstance.un('pointermove', handler)
    delete eventListeners['pointermove']
  }
}

const onMapZoom = (callback) => {
  if (!mapInstance) return

  const handler = (event) => {
    const zoom = mapInstance.getView().getZoom()

    callback({ zoom, originalEvent: event })
  }

  mapInstance.getView().on('change:resolution', handler)
  eventListeners['zoom'] = handler

  return () => {
    if (!mapInstance) return
    mapInstance.getView().un('change:resolution', handler)
    delete eventListeners['zoom']
  }
}

const onMapDragEnd = (callback) => {
  if (!mapInstance) return

  const handler = (event) => {
    const center = mapInstance.getView().getCenter()
    const lonlat4326 =
      mapInstance.getView().getProjection().getUnits() === 'm'
        ? olProj.transform(center, 'EPSG:3857', 'EPSG:4326')
        : center

    callback({
      center,
      longitude: lonlat4326[0],
      latitude: lonlat4326[1],
      originalEvent: event,
    })
  }

  mapInstance.on('moveend', handler)
  eventListeners['moveend'] = handler

  return () => {
    if (!mapInstance) return
    mapInstance.un('moveend', handler)
    delete eventListeners['moveend']
  }
}

// 清理地图资源
const cleanup = () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }

  if (mapInstance) {
    window.removeEventListener('resize', handleResize)
    mapInstance.dispose()
    mapInstance = null
  }

  flightPathSource = null
  flightPathLayer = null
  sichuanLayer = null
  sichuanSource = null
  markerSource = null
  markerLayer = null
  markers = {}
  eventListeners = {}
}

// 组件挂载时初始化地图
onMounted(() => {
  initMap()

  // 地图初始化完成后，创建飞线和四川遮罩
  setTimeout(() => {
    createFlightPath()
    addSichuanMask()

    // 设置地图中心点为四川成都
    if (mapInstance) {
      mapInstance.getView().setCenter(fromLonLat([104.07, 30.67]))
      mapInstance.getView().setZoom(7)
    }
  }, 500)
})

// 组件卸载时清理资源
onUnmounted(() => {
  cleanup()
})

// 导出方法供父组件调用
defineExpose({
  cleanup,
  isReady: () => !!mapInstance,
  setCenter: (longitude, latitude) => {
    if (mapInstance) {
      mapInstance.getView().setCenter(fromLonLat([longitude, latitude]))
    }
  },
  setZoom: (zoom) => {
    if (mapInstance) {
      mapInstance.getView().setZoom(zoom)
    }
  },
  toggleFlightPath: (show) => {
    if (flightPathLayer) {
      flightPathLayer.setVisible(show)
    }
    if (sichuanLayer) {
      sichuanLayer.setVisible(!show)
    }
  },
  // ========== 点位上图方法 ==========
  addMarker,
  removeMarker,
  clearMarkers,
  // ========== 遮罩层方法 ==========
  addMaskLayer,
  removeMaskLayer,
  toggleMask,
  // ========== 飞线方法 ==========
  createCustomFlightPath,
  removeFlightPath,
  // ========== 地图事件方法 ==========
  onMapClick,
  onMapMove,
  onMapZoom,
  onMapDragEnd,
  // 导出地图实例
  mapInstance,
})
</script>

<style scoped>
.ol-map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.ol-map {
  width: 100%;
  height: 600px;
  background: #f5f5f5;
}

:deep(.map-popup) {
  z-index: 1000;
}

:deep(.popup-content) {
  padding: 12px;
}

:deep(.popup-title) {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  color: #333;
}

:deep(.popup-info p) {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

:deep(.popup-close) {
  transition: background-color 0.2s;
}

:deep(.popup-close:hover) {
  background-color: rgb(0 0 0 / 20%);
}
</style>
