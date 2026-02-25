<template>
  <a-flex vertical class="viewContainer" gap="middle">
    <div v-if="dataType.type">
      <a-select
        mode="tags"
        :options="optionsNum"
        v-model:value="optionsValue"
        placeholder="Select a column"
        style="width: 40%; min-width: 400px; margin-bottom: 20px"
        @change="handleSelect"
      />
      <a-carousel arrows>
        <template #prevArrow>
          <div class="custom-slick-arrow" style="left: 20px; z-index: 1">
            <left-circle-outlined />
          </div>
        </template>
        <template #nextArrow>
          <div class="custom-slick-arrow" style="right: 20px; z-index: 1">
            <right-circle-outlined />
          </div>
        </template>
        <div id="myDiv1"></div>
        <div id="myDiv2"></div>
        <div><h2 style="color: black">Not Available</h2></div>
      </a-carousel>
    </div>
    <div v-else>
      <a-select
        mode="tags"
        v-model:value="optionsOutlierValue"
        :options="optionsOutlierNum"
        placeholder="Select a column"
        style="width: 40%; min-width: 400px; margin: 10px"
        @change="handleOutlierSelect"
      />
      <a-spin :spinning="Info.dataview?.restData.length == 0" size="large">
        <div style="height: 700px; width: 100%" id="myDiv"></div>
        <!-- <a-slider
          style="margin-top: 15px"
          v-model:value="dotSize"
          :min="5"
          :max="20"
          @change="updateOutlierDiagram"
        /> -->
      </a-spin>
    </div>
  </a-flex>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue'
import { LeftCircleOutlined, RightCircleOutlined } from '@ant-design/icons-vue'
import { onMounted } from 'vue'
import Plotly from 'plotly.js-dist-min'
import { useInfo, useApi } from '../stores/dataStore.js'
import { drawBar, drawBox, drawHist, drawOutlierHist, drawScatter } from '../components/utils.ts'

const dataType = defineProps({
  type: {
    type: Boolean,
    required: true
  }
})

const Info = ref(useInfo())
const API = useApi()

// const restData = ref([])
const dotSize = ref(12)

// const data = [...Info.value.dataview.restData, ...Info.value.dataview.outlier]

const options = computed(() => {
  return dataType.type
    ? Info.value.dataview.dataMenus?.filter(
        (item) => item.value != 'index' && item.value != 'label'
      )
    : Info.value.dataview.outlierMenus?.filter(
        (item) => item.value != 'key' && item.value != 'label'
      )
})

const optionsNum = computed(() => {
  return dataType.type
    ? Info.value.dataview.dataMenus?.filter(
        (item) => item.value != 'index' && item.value != 'label' && item.type == 'number'
      )
    : []
})

const optionsOutlierNum = computed(() => {
  return !dataType.type
    ? Info.value.dataview.outlierMenus?.filter(
        (item) => item.value != 'key' && item.value != 'label' && item.type == 'number'
      )
    : []
})

const optionsValue = ref([optionsNum.value[0]?.item])

const optionsOutlierValue = ref([optionsOutlierNum.value[0]?.item])

const config = {
  toImageButtonOptions: {
    format: 'jpeg', // one of png, svg, jpeg, webp
    height: 500,
    width: 700,
    scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
  },
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['reset', 'resetViews', 'autoScale', 'lasso', 'pan', 'select'],
  modeBarButtonsToAdd: ['toggleHover']
}
const calculatePercentile = (arr, percentile) => {
  arr.sort((a, b) => a - b)
  const index = (percentile / 100) * (arr.length - 1)
  if (Math.floor(index) === index) {
    return arr[index]
  }
  const lower = arr[Math.floor(index)]
  const upper = arr[Math.ceil(index)]
  return lower + (upper - lower) * (index - Math.floor(index))
}

const calculateHeatmapData = (columnData1, columnData2, numBins = 20) => {
  columnData1 = columnData1.filter((item) => item !== undefined)
  columnData2 = columnData2.filter((item) => item !== undefined)
  if (
    !Array.isArray(columnData1) ||
    !Array.isArray(columnData2) ||
    !columnData1.length ||
    !columnData2.length
  ) {
    console.error('Input arrays are empty or not arrays.')
    return { z: [], x: [], y: [] }
  }
  const minX = Math.min(...columnData1)
  const maxX = Math.max(...columnData1)
  const minY = Math.min(...columnData2)
  const maxY = Math.max(...columnData2)

  if (minX === maxX || minY === maxY) {
    console.warn('All values in one axis are identical. Creating a single bin heatmap.')
    return {
      z: [[columnData1.length]], // Single bin with all counts
      x: [minX], // Single unique X value
      y: [minY] // Single unique Y value
    }
  }

  const binSizeX = maxX !== minX ? (maxX - minX) / numBins : 1
  const binSizeY = maxX !== minX ? (maxY - minY) / numBins : 1

  // Create bins safely
  const heatmapData = Array.from({ length: numBins }, () => Array(numBins).fill(0))

  columnData1.forEach((x, index) => {
    const y = columnData2[index]

    // Ensure x and y are valid numbers
    if (isNaN(x) || isNaN(y)) {
      console.warn(`Invalid data point: x=${x}, y=${y}`)
      return
    }

    // Ensure indices are within range
    let xBin = Math.floor((x - minX) / binSizeX)
    let yBin = Math.floor((y - minY) / binSizeY)

    // Clamp values to stay within bounds
    xBin = Math.max(0, Math.min(xBin, numBins - 1))
    yBin = Math.max(0, Math.min(yBin, numBins - 1))

    heatmapData[yBin][xBin] += 1
  })

  // Generate bin edges
  const xEdges = Array.from({ length: numBins }, (_, i) => minX + i * binSizeX)
  const yEdges = Array.from({ length: numBins }, (_, i) => minY + i * binSizeY)

  return { z: heatmapData, x: xEdges, y: yEdges }
}

// const drawScatter = () => {
//   const normal_reduced = Info.value.dataview.restData.map((item) => item.data_reduced)
//   const outlier_reduced = Info.value.dataview.outlier.map((item) => item.data_reduced)
//   // console.log(data.score)
//   const columnKey = [optionsOutlierValue.value[0], optionsOutlierValue.value[1]]
//   var inliersData = {
//     y: normal_reduced.map((item) => item[1]),
//     x: normal_reduced.map((item) => item[0]),
//     mode: 'markers',
//     type: 'scatter',
//     name: 'Normals',
//     text: normal_reduced.map((item) => item['file']),
//     marker: { size: dotSize.value, color: 'rgb(35,35,35)' }
//   }
//   var outliersData = {
//     y: outlier_reduced.map((item) => item[1]),
//     x: outlier_reduced.map((item) => item[0]),
//     mode: 'markers',
//     type: 'scatter',
//     name: 'Outliers',
//     text: outlier_reduced.map((item) => item['file']),
//     marker: { size: dotSize.value }
//   }

//   const threshold = calculatePercentile(
//     data.map((ITEM) => ITEM.score),
//     100 - Info.value.outlier.contamination
//   )
//   // console.log(threshold)

//   var contourTrace2 = {
//     x: Array.from({ length: 100 }, (_, i) => i / 99),
//     y: Array.from({ length: 100 }, (_, i) => i / 99),
//     z: Info.value.dataview.outlierHeatmap,
//     showscale: false,
//     type: 'contour',
//     line: {
//       width: 2,
//       color: 'red',
//       dash: 'solid'
//     },
//     contours: {
//       start: threshold,
//       end: threshold,
//       size: 0.01,
//       coloring: 'lines', // Ensure only lines are drawn
//       showlines: true // Show the contour lines
//     }
//   }

//   var contourTrace1 = {
//     x: Array.from({ length: 100 }, (_, i) => i / 99),
//     y: Array.from({ length: 100 }, (_, i) => i / 99),
//     z: Info.value.dataview.outlierHeatmap,
//     type: 'contour',
//     colorscale: 'Blues',
//     reversescale: true,
//     contours: {
//       showlines: false,
//       start: 0,
//       end: (Math.max(...Info.value.dataview.outlierHeatmap.flat()) * dotSize.value) / 10,
//       size: (Math.max(...Info.value.dataview.outlierHeatmap.flat()) * dotSize.value) / 200
//     }
//   }
//   var layout = {
//     font: { size: 18 },
//     hovermode: false,
//     title: { text: 'Outlier Distribution' },
//     xaxis: {
//       title: {
//         text: columnKey[0],
//       },
//       spikesides: false,
//       spikethickness: 6,
//       spikecolor: '#1fe5bd'
//     },

//     yaxis: {
//       title: {
//         text: columnKey[1],
//       },
//       spikesides: false,
//       spikethickness: 6,
//       spikecolor: '#1fe5bd'
//     },
//     legend: {
//       x: 1.1, // Move legend to the right
//       y: 1
//     }
//   }
//   var plotData = [inliersData, outliersData, contourTrace1, contourTrace2]

//   Plotly.newPlot('myDiv', plotData, layout, config)
// }

const draw3DScatter = () => {
  // console.log(optionsOutlierValue.value)
  const normal = Info.value.dataview.restData
  const outlier = Info.value.dataview.outlier
  const columnKey = [
    optionsOutlierValue.value[0],
    optionsOutlierValue.value[1],
    optionsOutlierValue.value[2]
  ]
  var trace1 = {
    x: normal.map((item) => item[columnKey[0]]),
    y: normal.map((item) => item[columnKey[1]]),
    z: normal.map((item) => item[columnKey[2]]),
    mode: 'markers',
    name: 'Normals',
    text: outlier.map((item) => item['file']),
    marker: {
      size: Math.floor(dotSize.value / 2), //5-20 slide
      line: {
        color: 'rgba(217, 217, 217, 0.14)',

        width: 0.5
      },

      opacity: 0.7
    },

    type: 'scatter3d'
  }

  var trace2 = {
    x: outlier.map((item) => item[columnKey[0]]),
    y: outlier.map((item) => item[columnKey[1]]),
    z: outlier.map((item) => item[columnKey[2]]),

    mode: 'markers',
    name: 'Outliers',
    text: outlier.map((item) => item['file']),
    marker: {
      // color: 'rgb(127, 127, 127)',
      size: Math.floor(dotSize.value / 2),
      symbol: 'circle',
      line: {
        color: 'rgb(204, 204, 204)',

        width: 1
      },

      opacity: 0.7
    },

    type: 'scatter3d'
  }

  var data = [trace1, trace2]

  var layout = {
    hovermode: true,
    font: { size: 18 },
    title: { text: 'Outlier Distribution' },
    margin: {
      l: 0,

      r: 0,

      b: 0,

      t: 0
    },
    scene: {
      xaxis: {
        title: columnKey[0],
        spikesides: false,
        spikethickness: 6,
        spikecolor: '#1fe5bd'
      },

      yaxis: {
        title: columnKey[1],
        spikesides: false,
        spikethickness: 6,
        spikecolor: '#1fe5bd'
      },
      zaxis: {
        title: columnKey[2],
        spikesides: false,
        spikethickness: 6,
        spikecolor: '#1fe5bd'
      }
    }
  }

  Plotly.newPlot('myDiv', data, layout)
}

const drawHeatmap = (columnKey1, columnKey2) => {
  const columnData1 = getColumnData(columnKey1, dataType.type)
  const columnData2 = getColumnData(columnKey2, dataType.type)
  const { z, x, y } = calculateHeatmapData(columnData1, columnData2)
  console.log(z, x, y)
  var data = [
    {
      z: z,
      x: x,
      y: y,
      type: 'heatmap',
      colorscale: 'Viridis'
    }
  ]

  var layout = {
    title: {
      text: 'Heatmap'
    },
    font: { size: 18 },
    hovermode: false,
    xaxis: {
      title: columnKey1 // Add x-axis label
    },
    yaxis: {
      title: columnKey2 // Add y-axis label
    }
  }

  Plotly.newPlot('myDiv1', data, layout, config)
}

const updateDiagram = () => {
  if (!document.getElementById('myDiv2')) {
    const parentDiv = document.getElementById('myDiv1')?.parentElement
    if (parentDiv) {
      const newDiv = document.createElement('div')
      newDiv.id = 'myDiv2'
      newDiv.style.height = '700px'
      parentDiv.appendChild(newDiv)
    }
  }
  const columnName1 = optionsValue.value[0]
  if (optionsValue.value.length == 1) {
    const columnData = getColumnData(columnName1, dataType.type)
    console.log(columnData, typeof columnData[0] == 'number')
    if (typeof columnData[0] == 'number') {
      drawHist(columnData, columnName1, 1)
    } else {
      drawBar(columnData, columnName1, 1)
    }

    drawBox(columnData, columnName1, 2)
  }
  if (optionsValue.value.length == 2) {
    const columnName2 = optionsValue.value[1]
    drawHeatmap(columnName1, columnName2)
    const removeItem = document.getElementById('myDiv2')
    if (removeItem) {
      removeItem.innerHTML =
        '<h2 style="color: black; text-align: center; line-height: 750px;">Not Available</h2>'
    }
  }
}

// const updateOutlierData = async () => {
//   await getWholeDataSet()
//   // console.log(Info.value.process.result)
//   const restData = Info.value.process.result
//     .filter((item) => !Info.value.dataview.outlier.some((outlier) => outlier.file === item.file))
//     .map((item) => {
//       const filteredItem = { score: 0 }
//       Object.keys(Info.value.dataview.outlier[0]).forEach((key) => {
//         const tempkey = key.substring(key.indexOf('.') + 1)
//         if (item.hasOwnProperty(tempkey)) {
//           filteredItem[key] = item[tempkey]
//         }
//       })
//       return filteredItem
//     })
//   Info.value.updateData('dataview', {
//     ...Info.value.dataview,
//     restData: restData
//   })
// }

const updateOutlierDiagram = () => {
  if (optionsOutlierValue.value.length == 1) {
    drawOutlierHist(Info, optionsOutlierValue.value[0], '')
  }
  if (optionsOutlierValue.value.length == 2) {
    drawScatter(Info, dotSize, '')
  }
  if (optionsOutlierValue.value.length == 3) {
    draw3DScatter()
  }
}

const getWholeDataSet = async () => {
  const item = Info.value.process.selectedItems[0]
  const url = `${API.api}/scan/${item.collection}/profiles?skip=0`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data) {
      Info.value.process.result = data
    }
  } catch (e) {
    console.log('retrive result error', e)
  }
}

const getColumnData = (columnKey, type) => {
  const columnData = dataType.type
    ? Info.value.dataview.data.map((item) => item[columnKey])
    : Info.value.dataview.outlier.map((item) => item[columnKey])
  return columnData
}

const handleOutlierSelect = async (value) => {
  if (optionsOutlierValue.value.length > 3) {
    optionsOutlierValue.value.shift()
  }
  updateOutlierDiagram()
}

const handleSelect = async (value) => {
  if (optionsValue.value.length > 2) {
    optionsValue.value.shift()
  }
  updateDiagram()
}

watch(
  () => Info.value.dataview.dataMenus,
  () => {
    if (dataType.type) updateDiagram()
  }
)

watch(
  () => Info.value.dataview.outlierMenus,
  async () => {
    if (!dataType.type) {
      // await updateOutlierData()
      updateOutlierDiagram()
    }
  }
)

onMounted(async () => {
  if (dataType.type) updateDiagram()
  else {
    // await updateOutlierData()
    updateOutlierDiagram()
  }
})
</script>

<style scoped>
.viewContainer {
  min-width: 800px;
  margin: auto 20px;
  /* height: calc(100vh-200px); */
  height: 800px;
}
:deep(.slick-slide) {
  text-align: center;
  align-content: center;
  height: 750px;
  line-height: 160px;
  background: white;
  overflow: hidden;
}

:deep(.slick-slide #myDiv1) {
  height: 750px;
  width: 100%;
  display: block;
  z-index: inherit;
}
:deep(.slick-slide #myDiv2) {
  height: 750px;
  width: 100%;
  display: block;
  z-index: inherit;
}
:deep(.slick-slide #myDiv3) {
  height: 750px;
  width: 100%;
  display: block;
  z-index: inherit;
}

:deep(.slick-arrow.custom-slick-arrow) {
  width: 25px;
  height: 25px;
  font-size: 25px;
  color: black;
  background-color: rgba(31, 45, 61, 0.11);
  transition: ease all 0.3s;
  opacity: 0.5;
  z-index: 1;
}
:deep(.slick-arrow.custom-slick-arrow:before) {
  display: none;
}
:deep(.slick-arrow.custom-slick-arrow:hover) {
  opacity: 1;
}
</style>
