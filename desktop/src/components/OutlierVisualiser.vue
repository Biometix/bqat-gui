<template>
  <a-flex vertical class="viewContainer" gap="middle">
    <a-select
      mode="tags"
      v-model:value="optionsValue"
      :options="optionsNum"
      placeholder="Select a column"
      style="width: 40%; min-width: 400px; margin: 10px"
      @change="handleSelect"
    />
    <a-spin :spinning="restData.length == 0" size="large'">
      <div style="height: 700px" id="myDiv"></div>
      <a-slider
        style="margin-top: 15px"
        v-model:value="dotSize"
        :min="5"
        :max="20"
        @change="updateDiagram"
      />
    </a-spin>
    <!-- <div style="height: 700px" id="myDiv"></div> -->
  </a-flex>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { onMounted } from 'vue'
import Plotly from 'plotly.js-dist-min'
import { useInfo, useApi } from '../stores/dataStore.js'
const API = useApi()
const Info = ref(useInfo())

const restData = ref([])
const dotSize = ref(10)
const optionsNum = computed(() => {
  return Info.value.dataview.outlierMenus?.filter(
    (item) => item.value != 'key' && item.type == 'number'
  )
})

const optionsValue = ref([
  optionsNum.value[0]?.item,
  optionsNum.value[1] ? optionsNum.value[1].item : null
])

const handleSelect = async (value) => {
  if (optionsValue.value.length > 3) {
    optionsValue.value.shift()
  }
  await updateDiagramData()
  updateDiagram()
}

const config = {
  hovermode: false,
  toImageButtonOptions: {
    format: 'svg', // one of png, svg, jpeg, webp
    height: 500,
    width: 700,
    scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
  },
  responsive: true,
  displaylogo: false,
  modeBarButtonsToRemove: ['reset', 'resetViews', 'autoScale', 'lasso', 'pan', 'select'],
  modeBarButtonsToAdd: ['toggleHover']
}

const getColumnData = (columnKey, type) => {
  const columnData = Info.value.dataview.outlier.map((item) => item[columnKey])
  return columnData
}

const drawScatter = () => {
  const normal = restData.value
  const outlier = Info.value.dataview.outlier
  console.log(optionsValue.value)
  const columnKey = [optionsValue.value[0], optionsValue.value[1]]
  console.log(columnKey)
  var trace1 = {
    y: normal.map((item) => item[columnKey[1]]) ? normal.map((item) => item[columnKey[1]]) : [],
    x: normal.map((item) => item[columnKey[0]]),
    mode: 'markers',
    type: 'scatter',
    name: 'Normals',
    text: normal.map((item) => item['file']),
    marker: { size: dotSize.value }
  }

  var trace2 = {
    y: outlier.map((item) => item[columnKey[1]]) ? outlier.map((item) => item[columnKey[1]]) : [],
    x: outlier.map((item) => item[columnKey[0]]),
    mode: 'markers',
    type: 'scatter',
    name: 'Outliers',
    text: outlier.map((item) => item['file']),
    marker: { size: dotSize.value }
  }

  var data = [trace1, trace2]

  var layout = {
    hovermode: false,
    font: { size: 18 },
    title: { text: 'Outlier Distribution' },
    xaxis: {
      title: {
        text: 'Outlier_' + columnKey[0]
      }
    },

    yaxis: {
      title: {
        text: 'Outlier_' + columnKey[1]
      }
    }
  }

  Plotly.newPlot('myDiv', data, layout, config)
}

const draw3DScatter = () => {
  const normal = restData.value
  const outlier = Info.value.dataview.outlier
  // console.log(optionsValue.value)
  const columnKey = [optionsValue.value[0], optionsValue.value[1], optionsValue.value[2]]
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
    hovermode: false,
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
        title: columnKey[0]
      },

      yaxis: {
        title: columnKey[1]
      },
      zaxis: {
        title: columnKey[2]
      }
    }
  }

  Plotly.newPlot('myDiv', data, layout)
}

const updateDiagramData = async () => {
  console.log(Info.value.dataview.outlier)
  if (Info.value.process.result.length == 0) {
    await getWholeDataSet()
    console.log(Info.value.process.result)
  }
  restData.value = Info.value.process.result
    .filter((item) => !Info.value.dataview.outlier.some((outlier) => outlier.file === item.file))
    .map((item) => {
      const filteredItem = { score: 0 }
      Object.keys(Info.value.dataview.outlier[0]).forEach((key) => {
        const tempkey = key.substring(key.indexOf('.') + 1)
        if (item.hasOwnProperty(tempkey)) {
          filteredItem[key] = item[tempkey]
        }
      })
      return filteredItem
    })
}

const updateDiagram = () => {
  if (optionsValue.value.length == 2) drawScatter()
  if (optionsValue.value.length == 3) draw3DScatter()
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

onMounted(async () => {
  await updateDiagramData()
  updateDiagram()
})
</script>

<style scoped>
.viewContainer {
  min-width: 800px;
  margin: auto 20px;
  /* height: calc(100vh-200px); */
  height: 800px;
}
/* For demo */
:deep(.slick-slide) {
  text-align: center;
  align-content: center;
  min-height: 740px;
  border: 5px solid #fff;
  display: block;
  margin: auto;
  max-width: 80%;
  height: 800px;
  /* background: #364d79; */
  background: white;
  overflow: hidden;
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

:deep(.slick-slide h3) {
  color: #fff;
}
</style>
