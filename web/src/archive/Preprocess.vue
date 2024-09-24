<template>
  <a-flex class="preprocessContainer" gap="middle" vertical>
    <a-spin size="large" :spinning="tip" style="margin-top: 20%" :indicator="indicator" :tip="tip">
      <a-flex gap="large" vertical>
        <!-- Input Section -->
        <a-card hoverable>
          <a-flex vertical gap="middle">
            <h2><span class="bi bi-folder2-open"> </span> Select Input Folder:</h2>
            <a-tabs size="small">
              <!-- Select Local Folder Section-->
              <a-tab-pane :key="1">
                <template #tab>
                  <!-- <FolderOpenTwoTone class="iconStyle" :two-tone-color="themeColor" /> -->
                  Local Folder
                </template>
                <a-flex vertical gap="middle">
                  <h3>File count: {{ preprocessInfo.preprocess.length }}</h3>
                  <h3>File types:</h3>
                  <a-select
                    size="large"
                    v-model:value="preprocessInfo.preprocess.inputType"
                    mode="multiple"
                    style="width: 85%"
                    placeholder="Select file type"
                    :options="typeOptions"
                    :disabled="preprocessInfo.preprocess.loading"
                  />
                  <br />
                  <h3>Input directory:</h3>
                  <a-flex horizontal justify="start" align="center">
                    <a-tree-select
                      size="large"
                      v-model:value="preprocessInfo.preprocess.folderPath"
                      @select="updateFileCount"
                      :disabled="preprocessInfo.preprocess.loading"
                      show-search
                      style="width: 85%; margin-right: 30px"
                      :height="233"
                      placeholder="Select folder"
                      allow-clear
                      tree-line
                      treeIcon
                      :tree-data="API.inputTree"
                      :field-names="{
                        children: 'children',
                        value: 'value',
                        label: 'title'
                      }"
                      tree-node-filter-prop="title"
                    >
                    </a-tree-select>
                    <a-button
                      size="large"
                      @click="handleGoToFolder(preprocessInfo.preprocess.folderPath)"
                      ><i class="bi bi-aspect-ratio" style="margin-right: 5px"></i> view</a-button
                    >
                  </a-flex>
                  <br />
                  <h3>Match File Name Pattern:</h3>
                  <a-input
                    size="large"
                    v-model:value="preprocessInfo.scan.name"
                    placeholder="Example: face (this will match any filename containing the word 'face')."
                  >
                    <template #prefix> Contain String: </template>
                  </a-input>
                  <a-alert
                    v-if="showError"
                    message="Error"
                    :description="errorMessage"
                    type="error"
                    show-icon
                    closable
                  />
                </a-flex>
              </a-tab-pane>
              <!-- Upload Folder Section -->
              <a-tab-pane :key="2">
                <template #tab> Upload to Server </template>
                <h3>File count: {{ preprocessInfo.preprocess.length }}</h3>
                <a-flex vertical gap="middle">
                  <h3>
                    File types:
                    <a-select
                      size="middle"
                      v-model:value="preprocessInfo.preprocess.inputType"
                      mode="multiple"
                      style="width: 430px"
                      placeholder="Select file type"
                      :options="typeOptions"
                      :disabled="preprocessInfo.preprocess.loading"
                    />
                  </h3>

                  <a-upload-dragger
                    name="file"
                    :showUploadList="false"
                    accept=".zip,.tar,.gz"
                    :action="API.api + '/dataset'"
                    @change="uploadZip"
                  >
                    <p class="ant-upload-drag-icon">
                      <inbox-outlined></inbox-outlined>
                    </p>
                    <p class="ant-upload-text">
                      Click here, or drag a folder here to upload the samples zip folder.
                    </p>
                    <p class="ant-upload-hint">
                      Please do not leave the current page when uploading the directory.
                    </p>
                    <h3 v-if="preprocessInfo.preprocess.folderPath" style="align-self: center">
                      Selected Server Folder:
                      {{ preprocessInfo.preprocess.folderPath }}
                      <a-button
                        size="middle"
                        style="margin-left: 5px"
                        @click="handleGoToFolder(preprocessInfo.preprocess.folderPath)"
                        ><i class="bi bi-aspect-ratio" style="margin-right: 5px"></i> view</a-button
                      >
                    </h3>
                  </a-upload-dragger>
                </a-flex>
              </a-tab-pane>
            </a-tabs>
          </a-flex>
        </a-card>

        <!-- Resize Section -->
        <a-card hoverable>
          <a-flex vertical gap="middle">
            <h2 style="margin-bottom: 10px">
              <span class="bi bi-aspect-ratio"></span> Resize Input Files:
            </h2>
            <a-flex align="left" gap="large" class="resizeStyle">
              <a-row>
                <a-radio
                  size="large"
                  @click="updateSelect('ratio')"
                  :checked="preprocessInfo.preprocess.selectedRadio == 'ratio'"
                  style="font-size: 18px; align-self: center"
                  >Rescale:</a-radio
                >
                <a-input-number
                  style="width: 65%"
                  size="large"
                  v-model:value="preprocessInfo.preprocess.ratio"
                  addon-before="Ratio:"
                  addon-after="%"
                ></a-input-number>
              </a-row>
              <a-row>
                <a-radio
                  size="large"
                  style="font-size: 18px; margin-left: 5px; align-self: center"
                  @click="updateSelect('size')"
                  :checked="preprocessInfo.preprocess.selectedRadio == 'size'"
                  >Resize:
                </a-radio>
                <a-input-number
                  style="width: 75%"
                  size="large"
                  v-model:value="preprocessInfo.preprocess.size"
                  addon-before="Width (maintain aspect ratio):"
                  addon-after="px"
                ></a-input-number>
              </a-row>
            </a-flex>
          </a-flex>
        </a-card>

        <!-- Output Format Section -->
        <a-card hoverable>
          <a-flex vertical gap="middle">
            <h2 style="margin-block: 10px">
              <span class="bi bi-transparency"></span> Configure Output Format:
            </h2>
            <h3>Colour space:</h3>
            <a-flex align="center" gap="large">
              <a-radio-group
                v-model:value="preprocessInfo.preprocess.color"
                style="
                  width: 100%;
                  display: flex;
                  flex-direction: row;
                  flex-wrap: wrap;
                  justify-content: space-around;
                "
              >
                <a-radio value="Grayscale" size="large" style="font-size: 18px">Grayscale</a-radio>
                <a-radio value="RGB" size="large" style="font-size: 18px">RGB</a-radio>
                <a-radio value="BW" size="large" style="font-size: 18px">BW</a-radio>
                <a-radio value="HSV" size="large" style="font-size: 18px">HSV</a-radio>
                <a-radio value="RGBA" size="large" style="font-size: 18px">RGBA</a-radio>
                <a-radio value="CMYK" size="large" style="font-size: 18px">CMYK</a-radio>
                <a-radio value="YCbCr" size="large" style="font-size: 18px">YCbCr</a-radio>
              </a-radio-group>
            </a-flex>
            <br />
            <h3>File format:</h3>
            <a-flex align="center" gap="large">
              <a-select
                style="width: 100%"
                size="large"
                v-model:value="preprocessInfo.preprocess.type"
                :options="typeOptions"
              >
              </a-select>
            </a-flex>
          </a-flex>
        </a-card>

        <!-- Preview Section -->
        <a-card hoverable>
          <a-flex vertical gap="middle">
            <div style="display: flex; flex-direction: row; justify-content: space-between">
              <h2><span class="bi bi-clock-history"></span> Previous Tasks:</h2>
              <a-auto-complete
                v-if="preprocessInfo.preprocess.log.length > 0"
                v-model:value="searchItem"
                :options="searchOptions"
                style="width: 60%"
                auto-size
                :filter-option="filterOption"
              >
                <a-input-search
                  enter-button
                  @search="handleSearch"
                  placeholder="Search proprecess folder"
                  size="large"
                ></a-input-search>
              </a-auto-complete>
            </div>
            <br />
            <a-collapse v-model:activeKey="preprocessInfo.preprocess.activeKeys" :bordered="false">
              <a-collapse-panel :key="5" class="customStyle1" header="Preprocessing task logs">
                <div class="resPreprocessItem" v-if="preprocessInfo.preprocess.log.length == 0">
                  <a-empty />
                </div>
                <div v-else>
                  <div class="res-preprocess-container">
                    <div
                      v-if="showItem && searchItem"
                      class="preprocessContainerStyle"
                      v-for="(item, index) in showItem"
                    >
                      <a-card size="small">
                        <template #cover>
                          <span
                            style="
                              display: flex;
                              z-index: 10;
                              flex-direction: row-reverse;
                              padding: 5px;
                            "
                            class="bi bi-x-square"
                            @click="deletePreprocess(item)"
                          ></span>
                          <a-tooltip title="Click to check folder">
                            <img
                              style="z-index: 3; margin-top: -25px"
                              @click="handleGoToFolder(item.target)"
                              src="../assets/folder.png"
                              alt="folder image"
                            />
                          </a-tooltip>
                        </template>
                        <template #actions>
                          <a-button
                            style="margin: 0px; padding-inline: 0%"
                            @click="checkPreprocessInfo(item)"
                            ><span
                              class="bi bi-info-square"
                              style="margin-right: 5px; font-size: 15px"
                            ></span
                            >Info</a-button
                          >
                          <a-button style="margin: 0px; padding-inline: 0%" @click="GoToScan(item)"
                            ><span
                              class="bi bi-person-bounding-box"
                              style="margin-right: 5px; font-size: 15px"
                            ></span
                            >Scan</a-button
                          >
                        </template>
                        <a-card-meta
                          style="
                            margin-top: -25px;
                            margin-bottom: 0px;
                            margin-left: -10px;
                            text-align: top;
                            line-height: 16px;
                          "
                        >
                          <template #description>
                            <a-tooltip :title="item.target">
                              <p
                                style="
                                  font-weight: bold;
                                  text-align: center;
                                  padding-inline: 3px;
                                  height: 15px;
                                "
                              >
                                {{ item.target }}
                              </p>
                            </a-tooltip>
                          </template>
                        </a-card-meta>
                      </a-card>
                    </div>
                    <div
                      v-else
                      v-for="(item, index) in preprocessInfo.preprocess.log"
                      class="preprocessContainerStyle"
                    >
                      <a-card size="small" :key="index">
                        <template #cover>
                          <i
                            style="display: flex; flex-direction: row-reverse; padding: 5px"
                            class="bi bi-x-square"
                            @click="deletePreprocess(item)"
                          ></i>
                          <a-tooltip title="Click to check folder">
                            <img
                              style="z-index: 3; margin-top: -25px"
                              @click="handleGoToFolder(item.target)"
                              src="../assets/folder.png"
                              alt="folder image"
                            />
                          </a-tooltip>
                        </template>

                        <template #actions>
                          <a-button
                            style="margin: 0px; padding-inline: 8%"
                            @click="checkPreprocessInfo(item)"
                            ><i
                              class="bi bi-info-square"
                              style="margin-right: 5px; font-size: 15px"
                            ></i
                            >Info</a-button
                          >
                          <a-button style="margin: 0px; padding-inline: 8%" @click="GoToScan(item)"
                            ><i
                              class="bi bi-person-bounding-box"
                              style="margin-right: 5px; font-size: 15px"
                            ></i
                            >Scan</a-button
                          >
                        </template>
                        <a-card-meta
                          style="
                            margin-top: -25px;
                            margin-bottom: 0px;
                            margin-left: -10px;
                            text-align: top;
                            line-height: 16px;
                          "
                        >
                          <template #description>
                            <a-tooltip :title="item.target">
                              <p
                                style="
                                  font-weight: bold;
                                  text-align: center;
                                  padding-inline: 3px;
                                  height: 15px;
                                "
                              >
                                {{ item.target }}
                              </p>
                            </a-tooltip>
                          </template>
                        </a-card-meta>
                      </a-card>
                    </div>
                  </div>
                </div>
              </a-collapse-panel>
              <!-- the build-in style of this component affect customise style. have to add one more tag to mkae it looks right -->
              <p></p>
            </a-collapse>
          </a-flex>
        </a-card>

        <!-- Submit Section -->
        <a-row justify="center" gutter="40" style="margin-block: 2rem">
          <a-col :span="12">
            <a-button
              :disabled="!preprocessInfo.preprocess.loading"
              style="width: 100%; padding: 0"
              size="large"
              type="primary"
              danger
              @click="clearTask"
            >
              <span class="bi bi-stop-circle" style="font-size: 18px; margin-inline: 5px"></span>
              Stop
            </a-button>
          </a-col>
          <a-col :span="12">
            <a-button
              style="width: 100%"
              size="large"
              type="primary"
              @click="submitPreprocess"
              :loading="preprocessInfo.preprocess.loading"
              :disabled="preprocessInfo.preprocess.length == 0"
            >
              <span v-if="eta > 0">ETA: {{ eta }} s</span>
              <span v-else class="bi bi-play" style="font-style: normal; margin-inline: 5px"></span>
              Start
            </a-button></a-col
          >
        </a-row>

        <!-- Result section -->
        <a-alert v-if="outputPath" message="Finished" type="success" show-icon closable>
          <template #description>
            <p>
              Output:<a @click="handleGoToFolder(outputPath)">{{ outputPath }}</a>
            </p>
            <!-- :description="'Output is under your work directory:'+linkToFolder"  -->
          </template>
        </a-alert>
        <!-- <h3 style="text-align: center">
          Current status is :
          {{
            preprocessStatus.preprocess == 0
              ? 'Not started'
              : preprocessStatus.preprocess == 1
                ? 'Ongoing'
                : preprocessStatus.preprocess == 2
                  ? 'Success'
                  : 'Error'
          }}
        </h3> -->
      </a-flex>
    </a-spin>
  </a-flex>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { message } from 'ant-design-vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import { h } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { notification } from 'ant-design-vue'
import { SyncOutlined } from '@ant-design/icons-vue'

const openNotificationWithIcon = (type: string) => {
  if (type === 'stop') {
    notification['success']({
      message: 'Stop Task',
      description: 'Stop current running task successful.',
      placement: 'top'
    })
  } else if (type === 'delete') {
    notification['success']({
      message: 'Delete Item',
      description: 'Delete selected item successful.',
      placement: 'top'
    })
  } else if (type === 'error') {
    notification['error']({
      message: 'Action Failed',
      description: 'Current operation failed. Please check your input and try again.',
      placement: 'top'
    })
  } else if (type === 'upload') {
    notification['success']({
      message: 'Upload Zip Folder To Server',
      description: 'Upload zip folder to server successful.',
      placement: 'top'
    })
  }
}
const router = useRouter()
const searchItem = ref(null)
const showItem = ref(null)
const searchOptions = computed(() => {
  return preprocessInfo.value.preprocess.log.map((item) => {
    return {
      value: item.target,
      label: item.target
    }
  })
})

const indicator = h(SyncOutlined, {
  style: {
    fontSize: '50px',
    fontWeight: 'bold',
    marginLeft: '-25px',
    marginTop: '-40px'
  },
  spin: true
})
const tip = computed(() => {
  if (
    preprocessStatus.result == 1 ||
    preprocessStatus.process == 1 ||
    preprocessStatus.outlier == 1
  ) {
    return 'Task is running...'
  } else {
    return false
  }
})
const typeOptions = [
  {
    label: 'PNG',
    value: 'PNG'
  },
  {
    label: 'JPG',
    value: 'JPG'
  },
  {
    label: 'JPEG',
    value: 'JPEG'
  },
  {
    label: 'JP2',
    value: 'JP2'
  },
  {
    label: 'WSQ',
    value: 'WSQ'
  },
  {
    label: 'BMP',
    value: 'BMP'
  }
]
const API = useApi()
const preprocessStatus = useStatus()
//0:not started / 1:ongoing / 2:finished /-1:failed
const preprocessInfo = ref(useInfo())

const outputPath = ref('')
const showError = ref(false)
const errorMessage = ref('')
const eta = ref(-1)
let checkInternalStatus = null

interface Option {
  value: string
}
const filterOption = (input: string, option: Option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}
//Name could not be duplicated
const uploadZip = async (e) => {
  if (e.file.status !== 'uploading') {
    const res = await e.file.response
    if (res.detail) {
      console.log(res)
      openNotificationWithIcon('error')
    }
    if (res.message) {
      openNotificationWithIcon('upload')
      const startIndex = res.message.indexOf('data/')
      preprocessInfo.value.preprocess.folderPath = res.message.substring(startIndex)
      await checkInputFolder()
      updateFileCount()
    }
  }
}

const handleSearch = () => {
  const newitem = preprocessInfo.value.preprocess.log.filter((item) =>
    item.target.includes(searchItem.value)
  )
  console.log(newitem)
  if (newitem) {
    showItem.value = newitem
  }
}

const checkPreprocessInfo = (item) => {
  Modal.info({
    title: h('div', { style: 'font-size:20px' }, [h('h3', 'Info:' + item.target)]),
    content: h('div', {}, [
      h('h3', 'Modified: ' + item.modified.toString()),
      h('h3', 'Input_format: ' + '[' + item.input_format.toString() + ']'),
      h('h3', 'Options: ' + JSON.stringify(item.options).toString()),
      h('h3', 'Source: ' + item.source.toString()),
      h('h3', 'TaskId: ' + item.tid.toString())
    ]),
    closable: true,
    centered: true,
    width: '50%'
  })
}

const deletePreprocess = async (item) => {
  const url = `${API.api}/scan/preprocessing/${item.tid}`
  // const url2 = `${API.api}/scan/preprocessing/${item.tid}/log`
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    })
    if (!response.ok) {
      openNotificationWithIcon('error')
      throw new Error('Failed to delete preprocess')
    }
    const data = await response.json()
    // console.log(data)
    openNotificationWithIcon('delete')
    checkPreprocessLog()
  } catch (error) {
    message.error('Error on deleting preprocess')
    console.error('Error deleting preprocess:', error)
  }
}

const GoToScan = (item) => {
  preprocessInfo.value.scan.folderPath = item.target
  router.push({ path: '/scan' })
}

const handleGoToFolder = (item) => {
  const linkToFolder = API.api + '/warehouse/' + item + '/'
  window.open(linkToFolder, '_blank')
}

const updateSelect = (item) => {
  preprocessInfo.value.preprocess.selectedRadio = item
}

const updateFileCount = () => {
  const selectedItem = API.inputFolder.filter(
    (item) => item.dir == preprocessInfo.value.preprocess.folderPath
  )[0]
  if (selectedItem && preprocessInfo.value.preprocess.inputType.length > 0) {
    preprocessInfo.value.preprocess.length = selectedItem.count
  } else {
    preprocessInfo.value.preprocess.length = 0
  }
}

const checkInputFolder = async () => {
  const exts = preprocessInfo.value.preprocess.inputType
    .map((ext) => `exts=${ext.toLowerCase()}`)
    .join('&')
  const myRequest = new Request(`${API.api}/task/inputs?${exts}`, {
    method: 'GET'
  })
  await fetch(myRequest)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Mounted folder is not exist')
      }
      return response.json()
    })
    .then((data) => {
      if (data) {
        console.log(data)
        API.updateInputFolder(data)
        API.updateInputTree(data)
      }
    })
    .catch((error) => {
      console.error('the API can not be reach', error)
    })
}

watch(
  () => preprocessInfo.value.preprocess.inputType,
  () => {
    ;(preprocessInfo.value.preprocess.length = 0),
      (preprocessInfo.value.preprocess.folderPath = null)
    checkInputFolder()
  }
)

watch(
  () => preprocessInfo.value.preprocess.folderPath,
  (newVal, oldVal) => {
    if (!newVal) {
      preprocessInfo.value.preprocess.length = 0
    }
  }
)
// const loading = ref(false)
// const loadedFiles = ref(100)
// const displayedFiles = ref(
//   computed(() => preprocessInfo.value.preprocess.fileList.slice(0, loadedFiles.value))
// )
//update the preview size based on quantity of files
// const previewStyle = ref(
//   computed(() => {
//     if (preprocessInfo.value.preprocess.fileList.length < 100) {
//       return 'width: 100px; height: 100px; object-fit: contain;'
//     } else {
//       return 'width: 50px; height: 50px; object-fit: contain; '
//     }
//   })
// )
//Get whether it is scolling to the bottom of the file list
// const handleScroll = (e) => {
//   const container = e.target
//   if (container.scrollHeight - container.scrollTop === container.clientHeight && !loading.value) {
//     loadMoreFiles()
//     console.log('loading------')
//   }
// }

//To lazy load more files when scrolling to the bottom of the file list
// const loadMoreFiles = () => {
//   if (loading.value) return // Prevent multiple requests
//   loading.value = true
//   setTimeout(() => {
//     loadedFiles.value += 100
//     loading.value = false
//   }, 100)
// }

const clearTask = async () => {
  preprocessInfo.value.preprocess.loading = false
  const url = `${API.api}/task/${preprocessInfo.value.preprocess.id}/cancel?type=preprocessing`
  await fetch(url, {
    method: 'POST',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        openNotificationWithIcon('error')
        throw new Error('Failed to cancel task')
      }
      return response.json()
    })
    .then((data) => {
      clearInterval(checkInternalStatus)
      preprocessStatus.updateStatus('preprocess', 2)
      preprocessInfo.value.preprocess.id = ''
      eta.value = -1
      // console.log(data)
      openNotificationWithIcon('stop')
    })
    .catch((error) => {
      console.error('Error cancel task:', error)
    })
}

//submit the preprocess task, update status & taskIDs, start a new process timer, redirect to process page
const submitPreprocess = async () => {
  const requestBody = {
    source: preprocessInfo.value.preprocess.folderPath,
    options: {
      convert: preprocessInfo.value.preprocess.type
        ? preprocessInfo.value.preprocess.type.toLowerCase()
        : null,
      // grayscale: preprocessInfo.value.preprocess.grayscale,
      mode: preprocessInfo.value.preprocess.color
        ? preprocessInfo.value.preprocess.color.toLowerCase()
        : null,
      scale:
        preprocessInfo.value.preprocess.selectedRadio == 'ratio'
          ? preprocessInfo.value.preprocess.ratio / 100
          : null,
      resize:
        preprocessInfo.value.preprocess.selectedRadio == 'size'
          ? preprocessInfo.value.preprocess.size
          : null,
      pattern:preprocessInfo.value.scan.name ? '.*' + preprocessInfo.value.scan.name + '.*' : null
    },
    input_format: preprocessInfo.value.preprocess.inputType.map((type) => type.toLowerCase()),
    status: 0
  }
  const url = `${API.api}/scan/preprocessing`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    if (!response.ok) {
      const res = await response.json()
      errorMessage.value = res.detail[0].msg
      showError.value = true
      throw new Error('Failed to submit preprocessing task')
    }
    const data = await response.json()
    console.log(data)
    preprocessStatus.updateStatus('preprocess', 1)
    preprocessInfo.value.preprocess.loading = true
    preprocessInfo.value.preprocess.id = data['Preprocessing task in progress']
    eta.value = -1
    checkInternalStatus = setInterval(async () => {
      if (preprocessInfo.value.preprocess.id != '' && preprocessStatus.preprocess == 1) {
        // Note: if the task propcessing fast, can not get ETA
        getETA(preprocessInfo.value.preprocess.id)
        if (eta.value <= 0 || eta.value == null) {
          checkPreprocess()
        }
      } else {
        clearInterval(checkInternalStatus)
      }
    }, 1000)
  } catch (error) {
    console.error('Error submitting preprocessing task:', error)
  }
}

const checkPreprocess = async () => {
  // console.log('get')
  if (preprocessInfo.value.preprocess.id != '') {
    const url2 = `${API.api}/scan/preprocessing/${preprocessInfo.value.preprocess.id}`
    await fetch(url2, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          console.log('preprocessing task can not found')
        }
        const data = response.json()
        return data
      })
      .then((data) => {
        console.log(data)
        outputPath.value = data.target
        if (data.status == 2 || data.status == -1) {
          if (data.status == -1) {
            preprocessStatus.updateStatus('preprocess', -1)
            console.error('preprocessing task failed')
          }
          preprocessStatus.updateStatus('preprocess', 2)
          preprocessInfo.value.preprocess.id = ''
          preprocessInfo.value.preprocess.loading = false
          checkInputFolder()
          preprocessInfo.value.scan.folderPath = outputPath.value
          checkPreprocessLog()
        }
      })
      .catch((error) => {
        console.error('Error check preprocessing task status:', error)
      })
  }
}

const getETA = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (!response.ok) {
      console.log('can not find task progress')
      console.log(eta.value)
    }
    const data = await response.json()
    // console.log(data)
    if (data.done != 0) {
      eta.value = data.eta
      if (data.eta == 0) {
        eta.value = -1
        checkPreprocess()
        clearInterval(checkInternalStatus)
      }
    }
  } catch (error) {
    console.error('Error getting task status:', error)
  }
}

//prevent leave page when uploading files
onBeforeRouteLeave((to, from, next) => {
  if (preprocessStatus.preprocess == 0.5) {
    message.warning(`files are uploading, please do not leave current page.`)
    next(false)
  } else {
    next()
  }
})

const checkPreprocessLog = async () => {
  const url = `${API.api}/task/logs/preprocessing`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to get preprocessing log')
    }
    const data = await response.json()
    if (data) {
      console.log(data)
      preprocessInfo.value.preprocess.log = data.filter((item) => item.status !== 0)
    }
  } catch (error) {
    console.error('Error getting preprocessing log:', error)
  }
}

onMounted(async () => {
  await checkPreprocessLog()
})
</script>

<style>
.resizeStyle {
  flex-direction: column;
}
.preprocessContainer {
  /* min-height: 100vh; */
  margin-top: 1rem;
  width: 80%;
  max-width: 1200px;
}

.resPreprocessItem {
  margin-top: 1rem;
  height: 350px;
  display: flex;
  flex-wrap: wrap;
  /* background-color: lightgrey; */
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.3);
}

.res-preprocess-container {
  display: flex;
  flex-wrap: wrap;
  /* justify-content: space-around; */
  margin-top: 1rem;
  /* padding:2px; */
  height: 100%;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.3);
  /* opacity: 0.5;  */
}

.preprocessContainerStyle {
  margin: 10px;
  border-radius: 10px;
  border: solid lightgrey 0.5px;
  width: 20%;
  height: 100%;
  min-width: 165px;
  overflow: hidden;
  justify-content: center;
}
.customStyle1 {
  border-radius: 10px;
  margin: 10px;
  border: solid lightgrey 0.5px;
  overflow: scroll;
  max-height: 400px;
}

i {
  transition: opacity 0.3s ease;
}
@media (max-width: 1024px) {
  i {
    display: none;
  }
}
@media (min-width: 1400px) {
  .resizeStyle {
    flex-direction: row;
  }
}
@media (min-width: 1024px) {
  .resPreprocessItem {
    min-height: 300px;
  }

  .res-preprocess-container {
    min-height: 300px;
  }
  .preprocessContainer {
    margin-top: 2rem;
  }
}
[data-theme='dark'] {
  .customStyle1:hover {
    border: solid orange 0.5px;
  }
}
</style>
