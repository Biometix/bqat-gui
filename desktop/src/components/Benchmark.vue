<script setup>
import { InboxOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useApi } from '../stores/dataStore'
import { getFusionCode } from './utils'
import { ref, computed, watch } from 'vue'

const API = useApi()
const token = API.accessKey
const websocketUrl = `ws://localhost:8848/task/benchmark?token=${btoa(token)}` // Adjust if necessary
const { messages, isConnected, isStarted, connect, sendMessage, stop, close } =
  useWebSocket(websocketUrl)

// const engine = ref(6)
const replica = ref(1)
const batch_size = ref(30)
// const modality = ref('face')
const activeKey = ref(['0'])

const fileToUpload = ref(null)
const fileList = ref([])
const uploadSize = ref('')
const uploadSpeed = ref('')
const uploadTime = ref('')

const testItem = ref({ modal: 'Face', engine: ['bqat'] })
const testItems = ref([])
// const todoItems = ref([])
// const doneItems = ref([])
// const currentData = ref({})
const modalityOptions = computed(() => {
  if (testItem.value.modal == 'Face') {
    return [
      {
        value: 'bqat',
        label: 'BQAT'
      },
      {
        value: 'ofiq',
        label: 'OFIQ'
      },
      {
        value: 'biqt',
        label: 'BIQT'
      }
    ]
  } else if (
    testItem.value.modal == 'Iris' ||
    testItem.value.modal == 'Fingerprint' ||
    testItem.value.modal == 'Speech'
  ) {
    return [
      {
        value: 'default',
        label: 'Default'
      }
    ]
  }
})

const allItems = ref([
  {
    modal: 'Face',
    engine: ['bqat'],
    status: 'running',
    fusionCode: 4,
    replica: 100
  },
  {
    modal: 'Face',
    engine: ['ofiq'],
    status: 'todo',
    fusionCode: 2,
    replica: 10
  },
  {
    modal: 'Face',
    engine: ['biqt'],
    status: 'todo',
    fusionCode: 1,
    replica: 50
  },
  {
    modal: 'Face',
    engine: ['bqat', 'ofiq'],
    fusionCode: 6,
    status: 'todo',
    fusionCode: getFusionCode(['bqat', 'ofiq']),
    batch_size: 30,
    replica: 10
  },
  {
    modal: 'Iris',
    engine: ['default'],
    status: 'todo',
    replica: 200
  },
  {
    modal: 'Fingerprint',
    engine: ['default'],
    status: 'todo',
    replica: 100
  }
])

const startTime = ref(0)
const elapsedTime = ref(0)
let timer = null
const graceTime = ref(false)

const startTimer = () => {
  if (!timer) {
    // Prevent multiple intervals
    startTime.value = Date.now()
    timer = setInterval(() => {
      elapsedTime.value = Date.now() - startTime.value
    }, 10)
  }
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    elapsedTime.value = 0
    startTime.value = 0
    timer = null
  }
}

watch(isStarted, (val) => {
  if (val) {
    startTimer()
  } else {
    stopTimer()
  }
})

const formatTime = (ms) => {
  let hours = String(Math.floor(ms / 3600000)).padStart(2, '0')
  let minutes = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0')
  let seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')
  // let milliseconds = String(ms % 1000).padStart(3, '0')

  return `${hours}:${minutes}:${seconds}`
}

const beforeUpload = (file) => {
  fileToUpload.value = file
  fileList.value = [file]
  return false // prevent auto upload
}

const handleRemove = () => {
  fileToUpload.value = null
  fileList.value = []
}

const msgLatency = ref('')
const latencyStart = ref(0)
const isCheckingLatency = ref(false)

function checkLatency() {
  isCheckingLatency.value = true
  msgLatency.value = 'Waiting...'

  setTimeout(() => {
    if (isCheckingLatency.value) {
      msgLatency.value = 'Timeout'
      isCheckingLatency.value = false
    }
  }, 5000)

  if (!isConnected.value) {
    connect()
    msgLatency.value = 'Connecting...'
  } else {
    latencyStart.value = Date.now()
    sendMessage('latency')
  }
}

watch(messages, (val) => {
  const lastMsg = val[val.length - 1]
  if (isCheckingLatency.value && lastMsg === 'latency') {
    msgLatency.value = Date.now() - latencyStart.value + ' ms'
    isCheckingLatency.value = false
  }
}, { deep: true })

watch(isConnected, (val) => {
  if (val && isCheckingLatency.value) {
    msgLatency.value = 'Waiting for response...'
    latencyStart.value = Date.now()
    sendMessage('latency')
  }
})

function testUpload() {
  if (!isConnected.value) {
    connect()
  }
  if (isStarted.value) {
    alert('Please wait until the current task is finished.')
    return
  }
  uploadSize.value = ''
  uploadSpeed.value = ''
  uploadTime.value = ''

  let file = fileToUpload.value

  let timer = Date.now()
  let offset = 0
  function uploadFile(file) {
    const chunkSize = 1024 * 1024 // 1MB per chunk
    let chunkCount = Math.ceil(file.size / chunkSize)

    function sendNextChunk() {
      if (offset < file.size) {
        const chunk = file.slice(offset, offset + chunkSize)
        const reader = new FileReader()

        reader.onload = function (e) {
          const data = {
            fileName: file.name,
            chunkNumber: Math.floor(offset / chunkSize) + 1,
            totalChunks: chunkCount,
            chunkData: e.target.result
          }
          sendMessage(JSON.stringify(data)) // Send chunk data to server

          offset += chunkSize
          sendNextChunk() // Send next chunk
        }

        reader.readAsArrayBuffer(chunk) // Read the chunk as ArrayBuffer
        uploadSize.value =
          (offset / (1024 * 1024)).toFixed(2) +
          ' / ' +
          (file.size / (1024 * 1024)).toFixed(2) +
          ' MB (' +
          Math.floor((offset / file.size) * 100) +
          '%)'
        uploadSpeed.value =
          (offset / (1024 * 1024) / ((Date.now() - timer) / 1000)).toFixed(2) + ' MB/s'
        uploadTime.value =
          ((Date.now() - timer) / 1000).toFixed(2) +
          ' s / ' +
          ((file.size - offset) / (offset / (Date.now() - timer)) / 1000).toFixed(2) +
          ' s'
      } else {
        uploadSize.value = (file.size / (1024 * 1024)).toFixed(2) + ' MB'
        // console.log('File upload complete')
        // close() // Let the server close the connection after processing
      }
    }

    sendNextChunk()
    // console.log('File upload started')
  }
  if (file) {
    uploadFile(file)
  } else {
    alert('Please select a file to upload.')
  }
}

const startBenchmark = (item) => {
  sendMessage('benchmark')
  var msg = {
    Modality: item.modal,
    'Engine Code': item.fusionCode,
    Runs: item.replica
  }
  if (item.batch_size != 30) {
    msg = { ...msg, 'Batch Size': item.batch_size }
  }
  sendMessage(msg)
}

const startOneTest = (index) => {
  activeKey.value = [index]
  if (isConnected.value) {
    close()
  }
  testItems.value[index].status = 'running'
  testItems.value[index].feature = null
  testItems.value[index].progress = null
  setTimeout(() => {
    connect(index, testItems)
    const unwatch = watch(isConnected, (val) => {
      if (val) {
        startBenchmark(testItems.value[index])
        unwatch()
      }
    })
  }, 100)
}

const addOneTest = () => {
  // console.log(item)
  if (isStarted.value) {
    alert('Please wait for current test complete!')
  } else {
    const item = {
      ...testItem.value,
      fusionCode: getFusionCode(testItem.value.engine),
      batch_size: testItem.value.engine.includes('ofiq') ? batch_size.value : 30,
      replica: replica.value,
      status: 'running'
    }
    testItems.value.push(item)
    startOneTest(testItems.value.length - 1)
  }
}

const deleteOneTest = (index) => {
  testItems.value.splice(index, 1) // Removes the item at the found index
}

const stopOneTest = (index) => {
  graceTime.value = true
  stop()
  close()
  testItems.value.splice(index, 1) // Removes the item at the found index
  setTimeout(() => {
    graceTime.value = false
  }, 3000)
}

const addAllTest = () => {
  if (isStarted.value) {
    alert('Please wait for current test complete!')
  } else {
    const allItemsCopy = [...allItems.value]
    testItems.value = testItems.value.concat(allItemsCopy)
    // console.log(allItemsCopy[0], allItemsCopy) // Log the array of items to be added
    startOneTest(testItems.value.length - 6)
  }
}

watch(isConnected, (val) => {
  if (val == false) {
    setTimeout(() => {
      const todoItems = testItems.value.filter((item) => item?.status == 'todo')
      // console.log(testItems.value)
      if (todoItems.length > 0) {
        const runningitem = testItems.value.filter((item) => item?.status == 'running')
        if (runningitem.length == 0) {
          // console.log(todoItems[0].status)
          const nextIndex = testItems.value.findIndex((item) => item === todoItems[0])
          startOneTest(nextIndex)
          // console.log('do next', todoItems[0])
        }
      }
    }, 3000)
  }
})
</script>

<template>
  <div style="display: flex; flex-direction: column; height: calc(95vh - 48px);">
    <h1 style="text-align: center; margin: 10px">System Benchmark</h1>
    <!-- <div style="text-align: center; margin-bottom: 10px">
      <a-tag :color="isConnected ? 'success' : 'error'"
        >Status: {{ isConnected ? 'Connected' : 'Disconnected' }}</a-tag
      >
    </div> -->
    <div style="flex: 1; overflow: auto;">
      <a-flex vertical width="100%" gap="middle">
        <a-card title="Transmission Test" style="width: 100%" hoverable>
          <a-row :gutter="20">
            <a-col :span="16">
              <div style="text-align: center">
                <a-upload-dragger :file-list="fileList" :before-upload="beforeUpload" @remove="handleRemove">
                  <p class="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p class="ant-upload-text">Click or drag file to this area to select</p>
                </a-upload-dragger>
                <a-button type="primary" style="margin-top: 15px;" @click="testUpload"
                  :disabled="!fileToUpload || isStarted">
                  Upload
                </a-button>
              </div>
            </a-col>
            <a-col :span="8">
              <a-descriptions title="" bordered :column="1" size="large">
                <a-descriptions-item label="Size">{{ uploadSize || 'N/A' }}</a-descriptions-item>
                <a-descriptions-item label="Speed">{{ uploadSpeed || 'N/A' }}</a-descriptions-item>
                <a-descriptions-item label="Time">{{ uploadTime || 'N/A' }}</a-descriptions-item>
              </a-descriptions>
            </a-col>
          </a-row>
        </a-card>
        <a-card title="Latency Test" style="width: 100%" hoverable>
          <a-row :gutter="20">
            <a-col :span="16">
              <div style="text-align: center">
                <p class="ant-upload-drag-icon">
                  <ThunderboltOutlined />
                </p>
                <a-button type="primary" @click="checkLatency" :loading="isCheckingLatency">Check</a-button>
              </div>
            </a-col>
            <a-col :span="8">
              <a-descriptions title="" bordered :column="1" size="large">
                <a-descriptions-item label="Latency">{{ msgLatency || 'N/A' }}</a-descriptions-item>
              </a-descriptions>
            </a-col>
          </a-row>
        </a-card>
        <a-card title="Processing Test" style="width: 100%" hoverable>
          <a-row gutter="10">
            <a-col :span="15">
              <a-radio-group size="large" style="width: 100%" v-model:value="testItem.modal" @change="
                testItem.modal == 'Face'
                  ? (testItem.engine = ['bqat'])
                  : (testItem.engine = ['default'])
                ">
                <a-radio-button value="Face">Face</a-radio-button>
                <a-radio-button value="Fingerprint">Fingerprint</a-radio-button>
                <a-radio-button value="Iris">Iris</a-radio-button>
                <a-radio-button value="Speech" disabled>Voice</a-radio-button>
              </a-radio-group>
              <a-row style="margin-block: 10px">
                <a-input-number :value="replica" @change="(e) => (replica = e)" :min="1" :max="100"
                  addon-before="Replica" style="width: 45%"></a-input-number>

                <a-input-number style="width: 45%" :value="batch_size" @change="(e) => (batch_size = e)" :min="1"
                  :disabled="!testItem.engine.includes('ofiq')" addon-before="Batch"></a-input-number>
              </a-row>
              <a-select style="width: 90%" v-model:value="testItem.engine" mode="multiple" :allowClear="true"
                placeholder="Please select" size="large" :options="modalityOptions" />
              <a-row align="space-around" style="margin-block: 10px; padding-right: 10%">
                <a-button type="default" @click="addOneTest()" :disabled="graceTime || testItem.engine.length == 0">Run
                  Single</a-button>
                <a-button type="primary" @click="addAllTest()" :disabled="graceTime">Run All</a-button>
              </a-row>
            </a-col>
            <a-col :span="8" align="right" justify="center">
              <a-progress type="circle" :percent="100 *
                (
                  testItems.filter((item) => item.status == 'done').length / testItems.length
                ).toFixed(2)
                " :size="180" :format="(percent) => `${percent}%`" />
              <!-- <a-row align="center" justify="center" style="margin-top: 5px">
              <h3>Similarity</h3></a-row
            > -->
            </a-col>
          </a-row>
        </a-card>
        <a-card style="width: 100%; height: 58vh; overflow-y: scroll" hoverable>
          <a-col v-if="testItems.length > 0" v-for="(item, index) in testItems" gutter="10">
            <a-card v-if="item.status" :bordered="true" :key="index" hoverable style="width: 100%; margin-block: 10px">
              <div>
                <a-collapse v-model:activeKey="activeKey" expand-icon-position="end" ghost>
                  <a-collapse-panel :key="index" :showArrow="false">
                    <template #header>
                      <a-badge :status="isStarted && item?.status == 'running'
                          ? 'processing'
                          : item?.status == 'done'
                            ? 'success'
                            : item?.status == 'todo'
                              ? 'default'
                              : 'error'
                        " :text="'Test ' + (index + 1) + ' : ' + item?.status" />
                    </template>
                    <template #extra>
                      <a-button v-if="item?.status == 'done'" style="align-self: center; margin-right: 5px"
                        @click="startOneTest(index)"
                        :disabled="testItems.filter((item) => item.status == 'running').length > 0">Restart</a-button>
                      <a-button style="align-self: center"
                        @click="item?.status == 'running' ? stopOneTest(index) : deleteOneTest(index)">{{ item?.status
                          == 'running' ? 'Stop' : 'Delete' }}</a-button>
                    </template>
                    <a-row>
                      <a-col :span="18" align="center">
                        <a-descriptions layout="vertical" bordered :column="4">
                          <a-descriptions-item label="Modality | Engine(s)" span="1">{{ item.modal }} {{ item.engine
                            }}</a-descriptions-item>
                          <!-- <a-descriptions-item label="Replica | Batch" :span="1"
                          >{{ item.replica }} | {{ item.batch_size }}</a-descriptions-item
                        > -->
                          <a-descriptions-item label="Output" :span="1">{{ item?.feature?.Output
                            }}</a-descriptions-item>
                          <a-descriptions-item label="Validation" :span="1">{{
                            item?.feature?.Discrepancy.split('%')[1].replace(/[()]/g, '')
                            }}</a-descriptions-item>
                          <a-descriptions-item label="Throughput" :span="1">
                            {{ item?.feature?.Throughput.split('(')[0] }}</a-descriptions-item>
                          <a-descriptions-item v-if="item?.error" label="Error Info:" :span="3">
                            <a-card :loading="!item?.error" size="small" :bordered="false">
                              <a-descriptions size="small" bordered>
                                {{ item.error }}
                              </a-descriptions>
                            </a-card>
                          </a-descriptions-item>
                          <a-descriptions-item v-else label="System Info:" :span="4">
                            <a-card :loading="!item?.spec" size="small" :bordered="false">
                              <a-descriptions size="small" bordered :column="4">
                                <a-descriptions-item label="CPU" :span="4">{{
                                  item?.spec.CPU
                                  }}</a-descriptions-item>
                                <a-descriptions-item label="Physical Cores" :span="2">{{
                                  item?.spec['Physical Cores']
                                  }}</a-descriptions-item>
                                <a-descriptions-item label="Total Threads" :span="2">{{
                                  item?.spec['Total Threads']
                                  }}</a-descriptions-item>
                                <a-descriptions-item label="CPU Frequency" :span="2">{{
                                  item?.spec['CPU Frequency']
                                  }}</a-descriptions-item>
                                <a-descriptions-item label="Total Memory" :span="2">{{
                                  item?.spec['Total Memory']
                                  }}</a-descriptions-item>
                              </a-descriptions>
                            </a-card>
                          </a-descriptions-item>
                        </a-descriptions>
                        <a-row>
                          <a-col :span="24" align="left">
                            <a-card :loading="!item?.spec" size="large"> </a-card>
                          </a-col>
                        </a-row>
                      </a-col>
                      <a-col :span="6" align="center">
                        <a-progress type="circle" style="margin-top: 10%" :size="150"
                          :percent="100 - item?.feature?.Discrepancy.split('%')[0]" :format="(percent) => (item?.status == 'running' ? formatTime(item?.progress?.eta * 1000) : percent + '%')
                            " />
                        <!-- <a-row align="center" justify="center" style="margin-block: 5px">
                        <h3>Similarity</h3></a-row
                      > -->
                        <a-divider></a-divider>
                        <a-statistic title="Time elapsed" :value="item?.status == 'running' ? formatTime(elapsedTime) : item?.feature?.Time
                          " format="HH:mm:ss:SSS" style="margin-top: 10%" />
                      </a-col>
                    </a-row>
                    <a-row style="margin-top: 3%" align="center">
                      <a-progress style="width: 100%" :percent="item?.feature ? 100 : ((item?.progress?.done / item?.progress?.total) * 100).toFixed(2)
                        " />
                    </a-row>
                  </a-collapse-panel>
                </a-collapse>
              </div>
            </a-card>
          </a-col>
          <a-empty v-else></a-empty>
        </a-card>
      </a-flex>
    </div>
  </div>
</template>
