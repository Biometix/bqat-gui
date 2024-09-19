<template>
  <a-flex class="scanContainer" gap="middle" vertical>
    <div v-if="tip" class="fixed-center-spin">
      <a-spin
        size="large"
        :indicator="indicator"
        :spinning="tip"
        :tip="tip"
        class="centered-spin"
      />
    </div>
    <a-tabs v-model:activeKey="scanInfo.scan.tabKey" animated size="large">
      <!-- Select Local Folder Section -->
      <a-tab-pane :key="1">
        <template #tab> Local Files </template>
        <a-flex gap="large" vertical>
          <!-- Input Section -->
          <a-card hoverable>
            <h2><span class="bi bi-folder2-open"> </span> Select Input Folder:</h2>
            <br>
            <h3>Import folder to the backend:</h3>
            <a-collapse v-model:activeKey="activeKey">
              <a-collapse-panel key="1" header="Import zip">
                <a-flex justify="flex-start" horizontal>
                  <a-upload-dragger
                    style="width: 100%; min-width: 400px"
                    name="file"
                    :showUploadList="false"
                    accept=".zip,.tar,.gz"
                    :action="API.api + '/dataset'"
                    @change="uploadZip"
                    >Select zip file (Click or Drag here)</a-upload-dragger
                  >
                </a-flex>
              </a-collapse-panel>
            </a-collapse>
            <a-divider />
            <h3>Select folder from the backend:</h3>
            <a-flex horizontal justify="start" align="center">
              <!-- <h3 style="padding-top: 5px; min-width: 100px">Input folder:</h3> -->
              <a-tree-select
                size="large"
                v-model:value="scanInfo.scan.folderPath"
                @select="handleFiles"
                show-search
                style="width: 100%; margin-right: 10px"
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

              <a-button size="large" @click="handleGotToFolder(scanInfo.scan.folderPath)"
                ><i class="bi bi-aspect-ratio" style="margin-right: 5px"></i> view</a-button
              >
              <a-tooltip title="Refresh Input Directory">
                <a-button shape="circle" style="margin-left: 10px">
                  <span
                    class="bi bi-arrow-clockwise"
                    style="font-size: 15px"
                    @click="refreshDirectory"
                  ></span>
                </a-button>
              </a-tooltip>
            </a-flex>
          </a-card>

          <a-card hoverable>
            <h2>Filter input files:</h2>
            <br />
            <h3>File types:</h3>
            <a-select
              size="large"
              v-model:value="scanInfo.scan.inputType"
              mode="multiple"
              style="width: 100%; min-width: 490px; margin-bottom: 20px"
              placeholder="Select file type"
              :options="typeOptions"
            />
            <a-divider />

            <h3>File names:</h3>
            <a-input
              size="large"
              style="width: 100%; min-width: 490px; margin-bottom: 20px"
              @input="debouncedSearch"
              v-model:value="scanInfo.scan.name"
              placeholder=" xyz* | *xyz | *xyz*"
              allowClear
            >
            </a-input>
            <ul>
              <li>To match filenames which start with "Face": [Face*]</li>
              <li>To match filenames which end with "left": [*left]</li>
              <li>To match filenames which contain "sample": [*sample*]</li>
            </ul>
            <a-divider />
            <!-- <a-flex horizontal justify="space-between" align="center">-->

            <a-alert
              v-if="showError"
              message="Error"
              :description="errorMessage"
              type="error"
              show-icon
              closable
            />
          </a-card>
          <a-card hoverable>
            <!-- Preprocess Image Section -->
            <a-collapse :bordered="false" style="padding: 5px">
              <!-- upload section -->
              <a-collapse-panel header="Preprocess" class="customStyle1">
                <!-- Resize Section -->
                <a-card hoverable style="margin-bottom: 20px">
                  <a-flex vertical gap="middle">
                    <h2 style="margin-bottom: 10px">
                      <span class="bi bi-aspect-ratio"></span> Resize Images:
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
                          style="width: 73%"
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
                      <span class="bi bi-transparency"></span> Configure Output:
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
                        <a-radio value="Grayscale" size="large" style="font-size: 18px"
                          >Grayscale</a-radio
                        >
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
                        :options="
                          typeOptions.filter((item) => {
                            return item.label != 'WAV'
                          })
                        "
                      >
                      </a-select>
                    </a-flex>
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
                      <span
                        class="bi bi-stop-circle"
                        style="font-size: 18px; margin-inline: 5px"
                      ></span>
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
                      <span
                        v-else
                        class="bi bi-play"
                        style="font-style: normal; margin-inline: 5px"
                      ></span>
                      Start
                    </a-button></a-col
                  >
                </a-row>
                <!-- Result section -->
                <a-alert
                  v-if="outputPath"
                  message="Preporcess Finished"
                  type="success"
                  show-icon
                  closable
                >
                  <template #description>
                    <p>
                      Output:<a @click="handleGotToFolder(outputPath)">{{ outputPath }}</a>
                    </p>
                    <!-- :description="'Output is under your work directory:'+linkToFolder"  -->
                  </template>
                </a-alert>
              </a-collapse-panel>
              <p></p>
            </a-collapse>
          </a-card>

          <a-card hoverable>
            <h3>Input file count: <span style="font-weight: bold;">{{ scanInfo.scan.length }}</span></h3>
          </a-card>
          
          <!-- Modality section  -->
          <a-card hoverable>
            <a-flex gap="middle" vertical>
              <h2 style="margin-block: 10px">
                <span class="bi bi-check2-square"></span> Select Biometircs Modality / Engine:
              </h2>

              <a-cascader
                popupClassName="popupClass"
                style="width: 100%; margin-block: 10px"
                v-model:value="scanInfo.scan.modality"
                change-on-select
                :allowClear="false"
                placeholder="Please select"
                size="large"
                :options="cascadeModalityOptions"
                @change="updateModality"
              />
            </a-flex>
          </a-card>

          <!-- Match section -->
          <!-- <a-card hoverable>
              <a-flex gap="middle" vertical>
                <h2 style="margin-block: 10px">
                  <span class="bi bi-funnel"></span> Match File Name Pattern:
                </h2>
                <a-input size="large" v-model:value="scanInfo.scan.name" placeholder="Example: face (this will match any filename containing the word 'face').">
                  <template #prefix> Contain String: </template>
                </a-input>
              </a-flex>
            </a-card> -->

          <!-- Submit section  -->
          <a-row justify="center" style="margin-block: 2rem">
            <!-- <a-col :span="12"
              ><a-button style="width: 100%" size="large" danger @click="clearScan">
                Clear Page</a-button
              ></a-col
            >
            <a-col :span="12"> -->
            <a-button
              style="width: 100%;"
              type="primary"
              size="large"
              @click="submitScan2"
              :loading="scanInfo.process.taskStatus.filter((item) => item.status != 2).length > 0"
              :disabled="scanStatus.process == 1 || scanInfo.scan.length == 0"
            >
              <span class="bi bi-play" style="font-style: normal; margin-inline: 5px"></span>
              Start Task</a-button
            >
            <!-- </a-col> -->
          </a-row>
        </a-flex>
      </a-tab-pane>

      <!-- Upload Folder Section -->
      <a-tab-pane :key="2">
        <template #tab> Remote Files </template>
        <a-flex gap="large" vertical>
          <!-- Upload Section -->
          <a-card hoverable>
            <a-flex vertical gap="middle">
              <h2><span class="bi bi-cloud-arrow-up"></span> Upload Files:</h2>
              <h3>The files uploaded won't be saved.</h3>
              <a-collapse v-model:activeKey="scanInfo.scan.activeKeys" :bordered="false">
                <!-- upload section -->
                <a-collapse-panel
                  :key="3"
                  :header="'Uploaded: ' + scanInfo.scan.fileList.length"
                  class="customStyle1"
                >
                  <!-- :max-count="scanInfo.scan.limit" not work for directory -->
                  <a-upload-dragger
                    name="file"
                    style="margin-top: 20px"
                    directory
                    @change="handleChange"
                    :before-upload="beforeUpload"
                    :disabled="scanInfo.scan.disableUploader || scanInfo.scan.inputType.length == 0"
                    :showUploadList="false"
                  >
                    <p class="ant-upload-drag-icon">
                      <inbox-outlined></inbox-outlined>
                    </p>
                    <p class="ant-upload-text">
                      Click here, or drag a folder here to upload the samples/ Maximum of a 1000
                      files.
                    </p>
                    <p class="ant-upload-hint">
                      Please do not leave the current page when uploading the directory.
                    </p>
                  </a-upload-dragger>

                  <a-progress
                    style="width: 100%; margin-top: 2rem"
                    :percent="scanInfo.scan.percent"
                  />
                </a-collapse-panel>
                <p></p>
              </a-collapse>
              <a-flex gap="middle" vertical>
                <h3>File Types:</h3>
                <a-select
                  v-model:value="scanInfo.scan.inputType"
                  size="large"
                  mode="multiple"
                  placeholder="Select file type"
                  :options="typeOptions"
                  style="width: 100%; min-width: 490px"
                  ><template #suffixIcon><i class="bi bi-file-earmark-break"></i></template
                ></a-select>

                <h3>File Name:</h3>
                <a-input
                  size="large"
                  style="width: 100%; min-width: 490px"
                  @input="debouncedSearch"
                  v-model:value="scanInfo.scan.name"
                  placeholder=" xyz* | *xyz | *xyz*"
                  allowClear
                >
                </a-input>
                <ul>
                  <li>To match filenames which start with "Face": [Face*]</li>
                  <li>To match filenames which end with "left": [*left]</li>
                  <li>To match filenames which contain "sample": [*sample*]</li>
                </ul>
              </a-flex>
            </a-flex>
          </a-card>

          <!-- Preview Section -->
          <a-card hoverable>
            <a-flex vertical gap="middle">
              <h2><span class="bi bi-card-image"></span> Uploaded Files:</h2>
              <h3>
                File types:
                {{
                  scanInfo.scan.validFileList[0]
                    ? scanInfo.scan.validFileList[0].type &&
                      scanInfo.scan.validFileList[0].type != ''
                      ? scanInfo.scan.validFileList[0].type
                      : scanInfo.scan.validFileList[0].name.includes('wav')
                        ? 'audio'
                        : 'image'
                    : 'NA'
                }}
              </h3>

              <a-collapse v-model:activeKey="scanInfo.scan.activeKeys" :bordered="false">
                <a-collapse-panel :key="4" header="Preview" class="customStyle1">
                  <div class="emptyPreview" v-if="scanInfo.scan.validFileList.length == 0">
                    <a-empty />
                  </div>

                  <div v-else class="image-card-container" @scroll="handleScroll">
                    <a-card
                      v-if="scanInfo.scan.validFileList.length > 100"
                      hoverable
                      v-for="(item, index) in displayedFiles"
                      :style="previewStyle"
                      :key="index"
                      style="margin: 5px"
                    >
                      <template #cover>
                        <a-tooltip :title="item.name">
                          <div v-if="item.name.includes('.wsq') || item.name.includes('.jp2')">
                            <img
                              v-if="
                                scanInfo.scan.converted &&
                                scanInfo.scan.converted.find(
                                  (convert) => convert.name === item.name
                                )
                              "
                              :style="previewStyle"
                              :src="
                                scanInfo.scan.converted.find(
                                  (convert) => convert.name === item.name
                                ).data
                              "
                              :alt="'🖼️' + item.name"
                              class="hover-zoom"
                            />
                          </div>
                          <div v-else>
                            <img
                              :src="fileUrl(item.originFileObj)"
                              :alt="
                                item.type.includes('audio') ? '🔉' + item.name : '🖼️' + item.name
                              "
                              :style="previewStyle"
                              class="hover-zoom"
                            />
                          </div>
                        </a-tooltip>
                      </template>
                    </a-card>

                    <a-card
                      v-else
                      hoverable
                      v-for="(item1, index1) in scanInfo.scan.validFileList"
                      :style="previewStyle"
                      :key="index1"
                      style="margin: 5px"
                    >
                      <template #cover>
                        <a-tooltip :title="item1.name">
                          <div v-if="item1.name.includes('.wsq') || item1.name.includes('.jp2')">
                            <img
                              v-if="
                                scanInfo.scan.converted &&
                                scanInfo.scan.converted.find(
                                  (convert) => convert.name === item1.name
                                )
                              "
                              :style="previewStyle"
                              :src="
                                scanInfo.scan.converted.find((item) => item.name === item1.name)
                                  .data
                              "
                              :alt="'🖼️' + item1.name"
                              class="hover-zoom"
                            />
                          </div>
                          <div v-else>
                            <img
                              :src="fileUrl(item1.originFileObj)"
                              :alt="
                                item1.type.includes('audio') ? '🔉' + item1.name : '🖼️' + item1.name
                              "
                              :style="previewStyle"
                              class="hover-zoom"
                            />
                          </div>
                        </a-tooltip>
                      </template>
                    </a-card>
                  </div>
                </a-collapse-panel>
                <!-- the build-in style of this component affect customise style. have to add one more tag to mkae it looks right -->
                <p></p>
              </a-collapse>
            </a-flex>
          </a-card>

          <a-card hoverable>
            <h3>Input file count: <span style="font-weight: bold;">{{ scanInfo.scan.validFileList.length }}</span></h3>
          </a-card>

          <!-- Modality Section  -->
          <a-card hoverable>
            <a-flex vertical gap="middle">
              <h2 style="margin-bottom: 10px">
                <span class="bi bi-check2-square"></span> Select Biometrics Modality / Engine:
              </h2>
              <a-cascader
                popupClassName="popupClass"
                style="width: 100%; margin-block: 0px"
                v-model:value="scanInfo.scan.modality"
                change-on-select
                :allowClear="false"
                placeholder="Please select"
                size="large"
                :options="cascadeModalityOptions"
                @change="updateModality"
              />
            </a-flex>
          </a-card>

          <!-- Match section -->
          <!-- <a-card hoverable>
              <a-flex gap="middle" vertical>
                <h2 style="margin-block: 10px">
                  <span class="bi bi-funnel"></span> Match File Name Pattern:
                </h2>
                <a-input size="large" v-model:value="scanInfo.scan.name" placeholder="*String*">
                  <template #prefix> Contain String: </template>
                </a-input>
              </a-flex>
            </a-card> -->

          <!-- Submit Section -->
          <a-row justify="center" style="margin-block: 2rem">
            <a-button
              style="width: 100%"
              type="primary"
              size="large"
              @click="submitScan1"
              :loading="scanInfo.process.taskStatus.filter((item) => item.status != 2).length > 0"
              :disabled="scanStatus.process == 1 || scanInfo.scan.validFileList.length == 0"
            >
              <span class="bi bi-play" style="font-style: normal; margin-inline: 5px"></span>
              Start Task</a-button
            >
          </a-row>
        </a-flex>
      </a-tab-pane>
    </a-tabs>

  </a-flex>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message} from 'ant-design-vue'
import type { UploadChangeParam, UploadProps } from 'ant-design-vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { CascaderProps } from 'ant-design-vue'
import { h } from 'vue'
import { SyncOutlined } from '@ant-design/icons-vue'
import mime from 'mime'
import { notification } from 'ant-design-vue'

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
  } else if (type === 'input') {
    notification['success']({
      message: 'Update Input Directory',
      description: 'Upload input directory successful.',
      placement: 'top'
    })
  }
}
let checkInternalStatus = null

const activeKey = ref(['0'])

const preprocessStatus = useStatus()
//0:not started / 1:ongoing / 2:finished /-1:failed
const preprocessInfo = ref(useInfo())

const outputPath = ref('')

const eta = ref(-1)

// const hasLimit = ref(false)
const scanStatus = useStatus()
const API = useApi()
//0:not started / 1:ongoing / 2:finished /-1:failed
const scanInfo = ref(useInfo())
const router = useRouter()
const showError = ref(false)
const errorMessage = ref('')

const indicator = h(SyncOutlined, {
  style: {
    fontSize: '50px',
    // color:'red',
    fontWeight: 'bold',
    marginLeft: '-25px',
    marginTop: '-40px'
  },
  spin: true
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
  },
  {
    label: 'WAV',
    value: 'WAV'
  }
]

const mimeTypeToFormat = {
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/jpg': 'JPG',
  jp2: 'JP2',
  wsq: 'WSQ',
  'image/bmp': 'BMP',
  'audio/x-wav': 'WAV',
  'audio/wav': 'WAV'
}
const tip = computed(() => {
  if (
    scanStatus.result == 1 ||
    scanStatus.process == 1 ||
    scanStatus.preprocess == 1 ||
    scanStatus.outlier == 1
  ) {
    return 'Task is running...'
  } else {
    return false
  }
})

// const disableWsq = computed(() => {
//   return scanInfo.value.scan.modality[0] == 'Fingerprint' ? false : true
// })

const fileUrl = (file) => {
  return URL.createObjectURL(file)
}

const loading = ref(false)
const displayedFiles = ref(
  computed(() => scanInfo.value.scan.validFileList.slice(0, loadedFiles.value))
)
const loadedFiles = ref(100)

const cascadeModalityOptions = ref<CascaderProps['options']>([
  {
    value: 'Face',
    label: 'Face',
    children: [
      {
        value: 'BQAT',
        label: 'BQAT'
      },
      {
        value: 'OFIQ-file',
        label: 'OFIQ'
      },
      // {
      //   value: 'OFIQ',
      //   label: 'OFIQ  (folder)'
      // },
      {
        value: 'BIQT',
        label: 'BIQT'
      }
    ]
  },
  {
    value: 'Fingerprint',
    label: 'Fingerprint'
  },
  {
    value: 'Iris',
    label: 'Iris'
  },
  {
    value: 'Speech',
    label: 'Voice'
  }
])

const updateModality = () => {
  scanInfo.value.outlier.columns = [scanInfo.value.scan.modality[0]]
  scanInfo.value.scan.type = []
  // console.log('modality updated, so do outlier:', scanInfo.value.outlier.columns)
}
const handleGotToFolder = (item) => {
  const linkToFolder = API.api + '/' + item + '/'
  window.open(linkToFolder, '_blank')
}
//do not claim two value in one const
const previewStyle = ref(
  computed(() => {
    if (scanInfo.value.scan.fileList.length < 100) {
      return 'width: 100px; height: 100px; object-fit: contain;'
    } else {
      return 'width: 50px; height: 50px; object-fit: contain; '
    }
  })
)

const handleFiles = (event) => {
  preprocessInfo.value.preprocess.folderPath = event
}

const checkInputFolder = async () => {
  const exts = scanInfo.value.scan.inputType.map((ext) => `exts=${ext.toLowerCase()}`).join('&')
  const pattern = scanInfo.value.scan.name ? `&pattern=${scanInfo.value.scan.name}` : ''
  const myRequest = new Request(`${API.api}/task/inputs?${exts}${pattern}`, {
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
        // console.log(data)
        API.updateInputFolder(data)
        API.updateInputTree(data)
      }
    })
    .catch((error) => {
      console.error('the API can not be reach', error)
    })
}

const debounceDelay = 300 // Delay in milliseconds
let debounceTimer
const debouncedSearch = (event) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    //prevent reload the local direcotry when the inputType is changed on remote uploading
    if (scanInfo.value.scan.tabKey == 1) {
      checkInputFolder()
    } else {
      scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList.filter((item) =>
        validateFile(item)
      )
    }
  }, debounceDelay)
}
watch(
  () => scanInfo.value.scan.inputType,
  () => {
    //prevent reload the local direcotry when the inputType is changed on remote uploading
    if (scanInfo.value.scan.tabKey == 1) {
      checkInputFolder()
    } // Assuming you want to call your updateFiles function
    else {
      scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList.filter((item) =>
        validateFile(item)
      )
    }
  }
)

watch(
  () => API.inputFolder,
  (newVal) => {
    if (newVal.length > 0 && scanInfo.value.scan.folderPath) {
      const item = newVal.filter((item) => item.dir == scanInfo.value.scan.folderPath)[0]
      const count = item ? item.count : 0
      console.log(count)
      scanInfo.value.scan.length = count
      preprocessInfo.value.preprocess.length = count
    }
  }
)

watch(
  () => scanInfo.value.scan.folderPath,
  (newVal, oldVal) => {
    if (!newVal) {
      scanInfo.value.scan.length = 0
      preprocessInfo.value.preprocess.length = 0
    } else {
      const selectedItem = API.inputFolder.filter(
        (item) => item.dir == scanInfo.value.scan.folderPath
      )[0]
      if (selectedItem && scanInfo.value.scan.inputType.length > 0) {
        scanInfo.value.scan.length = selectedItem.count
        preprocessInfo.value.preprocess.length = selectedItem.count
      } else {
        scanInfo.value.scan.length = 0
        preprocessInfo.value.preprocess.length = 0
      }
    }
  }
)

watch(
  () => scanInfo.value.scan.validFileList,
  (newVal) => {
    if (newVal.length > 0) {
      scanInfo.value.scan.disableUploader = true
      scanInfo.value.scan.activeKeys = [4]
    } else {
      scanInfo.value.scan.disableUploader = false
      scanInfo.value.scan.activeKeys = [3]
    }
  }
)

const refreshDirectory = async () => {
  await checkInputFolder()
  scanInfo.value.scan.folderPath = null
  openNotificationWithIcon('input')
}

const count = ref(0)
const handleChange = async (info: UploadChangeParam) => {
  if (scanInfo.value.scan.validFileList.length <= 0) {
    if (scanInfo.value.scan.percent < 90) {
      scanInfo.value.scan.percent += 1
    }
  } else {
    scanInfo.value.scan.percent == 100
  }
}

const validatePatterns = (name, pattern) => {
  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    return name.includes(pattern.slice(1, -1))
  }
  if (pattern.startsWith('*')) {
    return name.endsWith(pattern.substring(1))
  }
  if (pattern.endsWith('*')) {
    return name.startsWith(pattern.substring(0, pattern.length - 1))
  }
  return name === pattern
}

const validateFile = (file) => {
  const baseName = file.name.substring(0, file.name.lastIndexOf('.'))
  if (
    scanInfo.value.scan.name &&
    scanInfo.value.scan.name.length > 0 &&
    !validatePatterns(baseName, scanInfo.value.scan.name)
  ) {
    return false
  }
  const format = mimeTypeToFormat[file.type]
  if (!scanInfo.value.scan.inputType.includes(format)) {
    return false
  }
  return true
}

//get type & convertImageBackend
const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
  if (count.value == 0) {
    console.log('scanning on going-------')
    scanStatus.updateStatus('scan', 1)
  }
  count.value = count.value + 1

  let type = file.type

  if (file.name.includes('.wsq') || file.name.includes('.jp2')) {
    type = file.name.includes('.wsq') ? 'wsq' : 'jp2'
  } else {
    if (type == '') {
      type = mime.getType(file.name)
    }
  }

  let newfile = {
    name: file.name,
    type: type,
    originFileObj: file
  }

  const format = mimeTypeToFormat[type]

  if (format) {
    const index = scanInfo.value.scan.fileList.findIndex((item) => item.name === file.name)

    // Check if the file name already exists in the list
    if (index === -1) {
      // If the file name doesn't exist, add it directly
      scanInfo.value.scan.fileList = [...(scanInfo.value.scan.fileList || []), newfile]
    } else {
      // If the file name exists, append the counter to make it unique
      newfile.name = file.name.split('.')[0] + '(1).' + format.toLowerCase()
      scanInfo.value.scan.fileList = [...(scanInfo.value.scan.fileList || []), newfile]
    }
    if (format == 'WSQ' || format == 'JP2') {
      if (count.value == 1) {
        setTimeout(() => {
          scanInfo.value.scan.percent = 100
          message.success(`All scan files uploaded successfully.`)
          scanStatus.updateStatus('scan', 2)
          scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList
        }, 5000)
      }
      const res = await convertToBase64(file)
      convertImageBackend(res, file.name)
    } else {
      //setup mock progress
      if (count.value == 1) {
        setTimeout(() => {
          scanInfo.value.scan.percent = 100
          message.success(`All scan files uploaded successfully.`)
          scanStatus.updateStatus('scan', 2)
          scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList
        }, 1000)
      }
    }
  }

  return false
}

const convertToBase64 = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      let base64String: string
      if (typeof result === 'string') {
        base64String = result
      } else if (result instanceof ArrayBuffer) {
        base64String = new TextDecoder('utf-8').decode(result)
      }
      // Remove Base64 metadata
      let base64WithoutMetadata = base64String.split(',')[1]
      const requiredPadding = (4 - (base64WithoutMetadata.length % 4)) % 4
      let res = base64WithoutMetadata.padEnd(base64WithoutMetadata.length + requiredPadding, '=')
      resolve(res)
    }
    reader.onerror = (error) => {
      reject(error)
    }
    reader.readAsDataURL(file)
  })
}

const convertImageBackend = async (file, name) => {
  const requestBody = {
    file: file, // Base64-encoded image string
    format: 'webp' // Desired format (adjust as needed)
  }
  const url = API.api + '/convert'
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Specify content type as JSON
    },
    body: JSON.stringify(requestBody)
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to convert Image')
      }
      return response.json()
    })
    .then((data) => {
      scanInfo.value.scan.converted.push({ name: name, data: data })
    })
    .catch((error) => {
      console.error('Failed to convert Image')
    })
}

//Get whether it is scolling to the bottom of the file list
const handleScroll = (e) => {
  const container = e.target
  if (container.scrollHeight - container.scrollTop === container.clientHeight && !loading.value) {
    loadMoreFiles()
    console.log('loading------')
  }
}

//To lazy load more files when scrolling to the bottom of the file list
const loadMoreFiles = () => {
  if (loading.value) return // Prevent multiple requests
  loading.value = true
  setTimeout(() => {
    loadedFiles.value += 100
    loading.value = false
  }, 100)
}

//Clear curent page, set status back to unscan, clear fileList
const clearScan = () => {
  const temp = scanInfo.value.scan.tabKey
  const model = scanInfo.value.scan.modality
  scanInfo.value.initialiseScan()
  scanInfo.value.scan.tabKey = temp
  scanInfo.value.scan.modality = model
  scanStatus.updateStatus('scan', 0)
  loadedFiles.value = 100
  console.log('Clear Scan')
}

// const startNewTask = async (tid) => {
//   const url = `${API.api}/scan/resume/${tid}`
//   try {
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: { accept: 'application/json' }
//     })

//     if (!response.ok) {
//       throw new Error('Failed to get task status')
//     }
//     const data = await response.json()
//     scanStatus.updateStatus('process', 1)
//   } catch (error) {
//     console.error('Error getting task status:', error)
//   }
// }

const transferPatterns = (pattern) => {
  let regexPattern = null

  if (pattern.startsWith('*') && pattern.endsWith('*')) {
    // Pattern like *substring*
    regexPattern = '.*' + pattern.slice(1, -1) + '.*' // Add .* at both ends and create regex
  } else if (pattern.startsWith('*')) {
    // Pattern like *substring
    regexPattern = '.*' + pattern.slice(1) + '$' // Add .* at the beginning and $ at the end
  } else if (pattern.endsWith('*')) {
    // Pattern like substring*
    regexPattern = '^' + pattern.slice(0, -1) + '.*' // Add ^ at the beginning and .* at the end
  }
  console.log(regexPattern)
  return regexPattern
}
//Notes: reason for bloacking resend the task, it's some engine can not be responsed when running task(for default engine, the engine would respond with delay)
//submit the scan task, update status & taskIDs, start a new process timer, redirect to process page
const submitScan1 = async () => {
  const formData = new FormData()
  scanInfo.value.scan.validFileList.forEach((file) => {
    formData.append(`files`, file.originFileObj, file.name)
  })
  const modality = scanInfo.value.scan.modality[0]
  const engine = scanInfo.value.scan.modality[1]
    ? '&engine=' + scanInfo.value.scan.modality[1].split('-')[0].toLowerCase()
    : ''
  const url = `${API.api}/scan/remote?modality=${modality.toLowerCase()}${engine}`
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    })
    if (!response.ok) {
      throw new Error('Failed to submit task')
    }

    const data = await response.json()
    const input = `temp/+${data.tid}`
    const newTaskStatus = {
      tid: data.tid,
      collection: '',
      name: data.tid.substring(data.tid.length - 4),
      status: 0,
      percent: 0,
      eta: 0,
      num: 0,
      mode: '',
      engine: '',
      input: input,
      modified: ''
    }

    const timeStamp = Date.now()
    scanInfo.value.process.timer = 0
    scanInfo.value.process.timeRecord = 0

    scanInfo.value.process.taskStatus.unshift(newTaskStatus)
    // await startNewTask(data.tid)
    scanStatus.updateStatus('process', 1)
    clearScan()
    scanStatus.updateStatus('scan', 2)

    router.push({ path: '/task', query: { timeStamp } })
  } catch (error) {
    console.error('Error submitting task:', error)
  }
}

//submit the scan task, update status & taskIDs, start a new process timer, redirect to process page
const submitScan2 = async () => {
  const modality = scanInfo.value.scan.modality[0]
  const input = scanInfo.value.scan.folderPath
  let requestBody = {}
  if (!scanInfo.value.scan.modality[1]) {
    requestBody = {
      options: {
        source: scanInfo.value.scan.inputType.map((item) => item.toLowerCase()),
        pattern: scanInfo.value.scan.name ? transferPatterns(scanInfo.value.scan.name) : null
      },
      input: input
    }
  } else {
    let type = null
    if (scanInfo.value.scan.modality[1].includes('file')) {
      type = scanInfo.value.scan.modality[1].split('-')[1]
    }
    requestBody = {
      options: {
        source: scanInfo.value.scan.inputType.map((item) => item.toLowerCase()),
        engine: scanInfo.value.scan.modality[1].split('-')[0].toLowerCase(),
        pattern: scanInfo.value.scan.name ? transferPatterns(scanInfo.value.scan.name) : null,
        type: type ? type : null
      },
      input: input
    }
  }
  // console.log(requestBody)
  const url = `${API.api}/scan/local?modality=${modality.toLowerCase()}`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    console.log(response)

    if (!response.ok) {
      const res = await response.json()
      errorMessage.value = res.detail[0].msg
      showError.value = true
      throw new Error('Failed to submit task')
    }

    const data = await response.json()
    const newTaskStatus = {
      tid: data.tid,
      collection: '',
      name: data.tid.substring(data.tid.length - 4),
      status: 0,
      percent: 0,
      eta: 0,
      num: 0,
      mode: '',
      engine: '',
      input: input,
      modified: ''
    }
    //push item to the top of array
    scanInfo.value.process.taskStatus.unshift(newTaskStatus)

    const timeStamp = Date.now()
    scanInfo.value.process.timer = 0
    scanInfo.value.process.timeRecord = 0

    // await startNewTask(data.tid)
    scanStatus.updateStatus('process', 1)
    clearScan()
    scanStatus.updateStatus('scan', 2)
    router.push({ path: '/task', query: { timeStamp } })
  } catch (error) {
    console.error('Error submitting task:', error)
  }
}

//prevent leave page when uploading files
onBeforeRouteLeave((to, from, next) => {
  if (scanStatus.scan == 1) {
    message.warning(`files are uploading, please do not leave current page.`)
    next(false)
  } else {
    next()
  }
})

onMounted(async () => {
  if (API.inputFolder && scanInfo.value.scan.folderPath) {
    const selectedItem = API.inputFolder.filter(
      (item) => item.dir == scanInfo.value.scan.folderPath
    )
    if (selectedItem) {
      console.log(selectedItem)
      scanInfo.value.scan.length = selectedItem[0].count
    }
  }
})

// Preprocess
const updateSelect = (item) => {
  preprocessInfo.value.preprocess.selectedRadio = item
}
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
      scanInfo.value.scan.folderPath = res.message.substring(startIndex)
      await checkInputFolder()
    }
  }
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
      pattern: scanInfo.value.scan.name ? scanInfo.value.scan.name : null
    },
    input_format: scanInfo.value.scan.inputType.map((type) => type.toLowerCase()),
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
          const index = scanInfo.value.scan.inputType.indexOf(preprocessInfo.value.preprocess.type)
          if (index === -1) {
            scanInfo.value.scan.inputType.push(preprocessInfo.value.preprocess.type)
          }
          checkInputFolder()
          preprocessInfo.value.scan.folderPath = outputPath.value
          // checkPreprocessLog()
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
</script>

<style>
.hover-zoom {
  position: relative;
  z-index: 2; /* Default z-index */
  transition: transform 0.3s ease; /* Smooth transition effect */
}

.hover-zoom:hover {
  transform: scale(2); /* Scales the image to 110% of its original size */
  z-index: 3;
}
.emptyPreview {
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
  background-color: rgba(245, 245, 245, 0.4);
}

.popupClass {
  width: 65%;
  max-width: 1000px;
  min-width: 600px;
}

.scanContainer {
  /* min-height: 100vh; */
  width: 80%;
  max-width: 1200px;
  margin-top: 1rem;
}

.customStyle1 {
  border-radius: 10px;
  margin: 30px;
  border: solid lightgrey 0.5px;
  height: auto;
}

.customStyle1:hover {
  /* border: solid #1677ff 0.5px; */
  border: solid gray 0.5px;
}

.image-card-container {
  display: flex;
  flex-wrap: wrap;
  /* justify-content: space-around; */
  height: 350px;
  overflow-y: scroll;
}
.iconStyle {
  font-size: 30;
  margin: 2px;
}

/* Preprocess */
.resizeStyle {
  flex-direction: column;
}

i {
  transition: opacity 0.3s ease;
}
.fixed-center-spin {
  position: fixed;
  left: 0%;
  top: 0%;
  z-index: 5; /* Ensure it stays above other content */
  width: 100%; /* Optional: To ensure full coverage */
  height: 100%;
  background-color: rgba(242, 242, 242, 0.3);
  border-radius: 15px; /* Adds rounded corners */
  cursor: not-allowed; /* Shows stop cursor */
  pointer-events: auto;
}

.centered-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

[data-theme='dark'] {
  .customStyle1:hover {
    border: solid orange 0.5px;
  }
  .fixed-center-spin {
    background-color: rgba(20, 20, 20, 0.2);
  }
}
@media (min-width: 1024px) {
  .scanContainer {
    margin-top: 2rem;
  }
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
</style>
