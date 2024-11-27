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
            <br />
            <h3>Import folder to the backend:</h3>
            <a-collapse v-model:activeKey="activeKey">
              <a-collapse-panel key="1" header="Import zip">
                <a-spin :spinning="showUploadSpinner">
                  <a-flex justify="flex-start" horizontal>
                    <a-upload-dragger
                      style="width: 100%; min-width: 400px"
                      name="file"
                      :showUploadList="false"
                      accept=".zip,.tar,.gz"
                      :action="API.api + '/dataset'"
                      :withCredentials="true"
                      @change="uploadZip"
                      @drop="dropZip"
                      >Select zip file (Click or Drag here)</a-upload-dragger
                    >
                  </a-flex>
                </a-spin>
              </a-collapse-panel>
            </a-collapse>
            <a-divider />
            <h3>Select folder from the backend:</h3>
            <a-flex horizontal justify="start" align="center">
              <a-tree-select
                size="large"
                v-model:value="scanInfo.scan.folderPath"
                @select="handleFiles"
                show-search
                style="width: 80%; margin-right: 10px"
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

              <a-button size="large" @click="handleGoToFolder(scanInfo.scan.folderPath)"
                ><i class="bi bi-aspect-ratio" style="margin-right: 5px"></i> View</a-button
              >
              <a-tooltip title="Larger dataset may take longer time to refresh)">
                <a-button shape="circle" style="margin-inline: 10px">
                  <span
                    class="bi bi-arrow-clockwise"
                    style="font-size: 16px; margin-top: -2px"
                    @click="refreshDirectory"
                  ></span>
                </a-button>
              </a-tooltip>
              <div v-if="!requestFolder">
                <CheckCircleTwoTone
                  v-if="loadInputFolder"
                  style="font-size: 23px; margin-top: 3px"
                  twoToneColor="#52c41a"
                />
                <CloseCircleTwoTone
                  v-else
                  style="font-size: 23px; margin-top: 3px"
                  twoToneColor="#9b2015"
                />
              </div>
              <div v-else>
                <SyncOutlined style="font-size: 23px; margin-top: 3px" spin />
              </div>
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
            <h3>
              Input file count: <span style="font-weight: bold">{{ scanInfo.scan.length }}</span>
              <a-button
                v-if="scanInfo.scan.tabKey == 1"
                shape="circle"
                style="margin-inline: 10px"
                @click="refreshMetadata"
              >
                <div v-if="requestFolderMeta">
                  <SyncOutlined style="font-size: 15px" spin />
                </div>
                <div v-else>
                  <ReloadOutlined style="font-size: 14px" />
                </div>
              </a-button>
            </h3>
          </a-card>

          <a-card hoverable>
            <!-- Preprocess Image Section -->
            <a-collapse :bordered="false" style="padding: 5px">
              <!-- upload section -->
              <a-collapse-panel header="Preprocess" class="customStyle1">
                <!-- Resize Section -->
                <a-spin
                  size="large"
                  :indicator="indicator"
                  :spinning="scanStatus.preprocess == 1"
                  tip="Task is running..."
                >
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
                          <a-radio value="YCbCr" size="large" style="font-size: 18px"
                            >YCbCr</a-radio
                          >
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
                </a-spin>
                <!-- Submit Section -->
                <a-row justify="center" gutter="40" style="margin-block: 0rem; margin-top: 1rem">
                  <a-col :span="12">
                    <a-button
                      :loading="submittedStop"
                      :disabled="!preprocessInfo.preprocess.progress"
                      style="width: 100%; padding: 0"
                      size="large"
                      type="primary"
                      danger
                      @click="clearTask"
                    >
                      <span
                        v-if="!submittedStop"
                        class="bi bi-stop-circle"
                        style="font-size: 18px; margin-inline: 5px"
                      ></span>
                      Cancel
                    </a-button>
                  </a-col>
                  <a-col :span="12">
                    <a-button
                      style="width: 100%"
                      size="large"
                      type="primary"
                      @click="submitPreprocess"
                      :loading="preprocessInfo.preprocess.progress"
                      :disabled="!preprocessInfo.scan.folderPath"
                    >
                      <span v-if="eta > 0">ETA: {{ eta }} s</span>

                      <span v-else>
                        <span
                          v-if="!preprocessInfo.preprocess.progress"
                          class="bi bi-play"
                          style="font-style: normal; margin-inline: 5px"
                        ></span
                        >Convert</span
                      >
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
                      Output:<a @click="handleGoToFolder(outputPath)">{{ outputPath }}</a>
                    </p>
                  </template>
                </a-alert>
              </a-collapse-panel>
              <p></p>
            </a-collapse>
          </a-card>

          <!-- Modality section  -->
          <a-card hoverable>
            <a-flex gap="middle" vertical>
              <h2 style="margin-block: 10px">
                <span class="bi bi-check2-square"></span> Select Biometircs Modality / Engine:
              </h2>
              <a-radio-group
                size="large"
                v-model:value="scanInfo.scan.modality"
                @change="
                  scanInfo.scan.modality == 'face'
                    ? (scanInfo.scan.engine = ['bqat'])
                    : (scanInfo.scan.engine = ['default'])
                "
              >
                <a-radio-button value="face">Face</a-radio-button>
                <a-radio-button value="fingerprint">Fingerprint</a-radio-button>
                <a-radio-button value="iris">Iris</a-radio-button>
                <a-radio-button value="speech">Voice</a-radio-button>
              </a-radio-group>
              <a-select
                style="width: 100%; margin-block: 10px"
                v-model:value="scanInfo.scan.engine"
                mode="multiple"
                :allowClear="true"
                placeholder="Please select"
                size="large"
                :options="modalityOptions"
              />
              <!-- <a-select
                style="width: 100%; margin-block: 10px"
                v-model:value="scanInfo.scan.modality"
                mode="multiple"
                :allowClear="true"
                placeholder="Please select"
                size="large"
                :options="cascadeModalityOptions"
                @change="updateModality"
              /> -->
            </a-flex>
          </a-card>

          <!-- Submit section  -->
          <a-row justify="center" style="margin-block: 0rem; margin-bottom: 2rem">
            <a-button
              style="width: 100%"
              type="primary"
              size="large"
              @click="submitScan2"
              :loading="scanStatus.process == 1 || submittedScan"
              :disabled="
                scanStatus.process == 1 ||
                scanStatus.preprocess == 1 ||
                scanInfo.scan.length == 0 ||
                submittedScan ||
                !scanInfo.scan.modality ||
                scanInfo.scan.engine.length == 0
              "
            >
              <span
                v-if="scanStatus.process != 1 && !submittedScan"
                class="bi bi-play"
                style="font-style: normal; margin-inline: 5px"
              ></span>
              Start Task</a-button
            >
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
                  <!-- Note: :max-count="scanInfo.scan.limit" not work for directory -->
                  <a-upload-dragger
                    name="file"
                    style="margin-top: 20px"
                    directory
                    @change="handleChange"
                    @drop="handleDrop"
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

          <a-card hoverable>
            <h3>
              Input file count:
              <span style="font-weight: bold">{{ scanInfo.scan.validFileList.length }}</span>
            </h3>
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
                <a-collapse-panel
                  :key="4"
                  header="Preview"
                  class="customStyle1"
                  @scroll="handleScroll"
                >
                  <div class="emptyPreview" v-if="scanInfo.scan.validFileList.length == 0">
                    <a-empty />
                  </div>

                  <div v-else class="image-card-container">
                    <a-card
                      v-if="scanInfo.scan.validFileList.length > 100"
                      hoverable
                      v-for="(item, index) in displayedFiles"
                      :style="previewStyle"
                      :key="index"
                      style="margin: 5px"
                      class="hover-zoom"
                    >
                      <template #cover>
                        <a-tooltip :title="item.name.toUpperCase()">
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
                            />
                          </div>
                          <div v-else-if="item.type.includes('audio')" class="smallCard">
                            <vue-sound
                              :show-download="false"
                              :file="fileUrl(item.originFileObj)"
                              :alt="'🔉' + item.name"
                              :style="previewStyle"
                            />
                          </div>
                          <div v-else>
                            <img
                              :src="fileUrl(item.originFileObj)"
                              :alt="'🖼️' + item.name"
                              :style="previewStyle"
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
                      class="hover-zoom"
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
                            />
                          </div>
                          <div
                            v-else-if="item1.type.includes('audio')"
                            style="background-color: white"
                          >
                            <vue-sound
                              :show-download="false"
                              :file="fileUrl(item1.originFileObj)"
                              :alt="'🔉' + item1.name"
                              :style="previewStyle"
                            />
                          </div>
                          <div v-else>
                            <img
                              :src="fileUrl(item1.originFileObj)"
                              :alt="'🖼️' + item1.name"
                              :style="previewStyle"
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

          <!-- Modality Section  -->
          <a-card hoverable>
            <a-flex vertical gap="middle">
              <h2 style="margin-bottom: 10px">
                <span class="bi bi-check2-square"></span> Select Biometrics Modality / Engine:
              </h2>
              <a-radio-group
                size="large"
                v-model:value="scanInfo.scan.modality"
                @change="
                  scanInfo.scan.modality == 'face'
                    ? (scanInfo.scan.engine = ['bqat'])
                    : (scanInfo.scan.engine = ['default'])
                "
              >
                <a-radio-button value="face">Face</a-radio-button>
                <a-radio-button value="fingerprint">Fingerprint</a-radio-button>
                <a-radio-button value="iris">Iris</a-radio-button>
                <a-radio-button value="speech">Voice</a-radio-button>
              </a-radio-group>
              <a-select
                style="width: 100%; margin-block: 10px"
                v-model:value="scanInfo.scan.engine"
                mode="multiple"
                :allowClear="true"
                placeholder="Please select"
                size="large"
                :options="modalityOptions"
              />
              <!-- <a-select
                style="width: 100%; margin-block: 10px"
                v-model:value="scanInfo.scan.modality"
                mode="multiple"
                :allowClear="true"
                placeholder="Please select"
                size="large"
                :options="cascadeModalityOptions"
                @change="updateModality"
              /> -->
            </a-flex>
          </a-card>

          <!-- Submit Section -->
          <a-row justify="center" style="margin-block: 2rem">
            <a-button
              style="width: 100%"
              type="primary"
              size="large"
              @click="submitScan1"
              :loading="scanStatus.process == 1 || submittedScan"
              :disabled="
                scanStatus.process == 1 ||
                scanInfo.scan.validFileList.length == 0 ||
                submittedScan ||
                !scanInfo.scan.modality ||
                scanInfo.scan.engine.length == 0
              "
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
import { message, Cascader } from 'ant-design-vue'
import type { UploadChangeParam, UploadProps } from 'ant-design-vue'
import { onBeforeRouteLeave, useRouter } from 'vue-router'
import type { CascaderProps } from 'ant-design-vue'
import { h } from 'vue'
import {
  SyncOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  ReloadOutlined
} from '@ant-design/icons-vue'
import mime from 'mime'
import { notification } from 'ant-design-vue'
import { VueSound } from 'vue-sound'
import { getFusionCode, parseFusionCode } from '../components/utils.ts'

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
      message: 'Reload Input Directory',
      description: 'Reload input directory successful.',
      placement: 'top'
    })
  } else if (type === 'notZip') {
    notification['error']({
      message: 'Dropped File Is Not Zip File',
      description: 'Please select Zip file.',
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

const scanStatus = useStatus()
const API = useApi()

const scanInfo = ref(useInfo())
const router = useRouter()
const showError = ref(false)
const errorMessage = ref('')
const submittedScan = ref(false)

const indicator = h(SyncOutlined, {
  style: {
    fontSize: '50px',
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
  'image/jp2': 'JP2',
  wsq: 'WSQ',
  'image/wsq': 'JP2',
  'image/bmp': 'BMP',
  'audio/x-wav': 'WAV',
  'audio/wav': 'WAV'
}

const typeInvalid = ref(false)
const tip = computed(() => {
  if (scanStatus.result == 1 || scanStatus.process == 1 || scanStatus.outlier == 1) {
    return 'Task is running...'
  } else {
    return false
  }
})

const fileUrl = (file) => {
  return URL.createObjectURL(file)
}

const loading = ref(false)
const displayedFiles = ref(
  computed(() => scanInfo.value.scan.validFileList.slice(0, loadedFiles.value))
)
const loadedFiles = ref(100)

const modalityOptions = computed(() => {
  if (scanInfo.value.scan.modality == 'face') {
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
    scanInfo.value.scan.modality == 'iris' ||
    scanInfo.value.scan.modality == 'fingerprint' ||
    scanInfo.value.scan.modality == 'speech'
  ) {
    return [
      {
        value: 'default',
        label: 'Default'
      }
    ]
  }
})
// const cascadeModalityOptions = ref<CascaderProps['options']>([
//   {
//     disabled: false,
//     value: 'face-bqat',
//     label: 'Face (BQAT)'
//   },
//   {
//     disabled: false,
//     value: 'face-ofiq',
//     label: 'Face (OFIQ)'
//   },
//   {
//     disabled: false,
//     value: 'face-biqt',
//     label: 'Face (BIQT)'
//   },
//   {
//     disabled: true,
//     value: 'fingerprint',
//     label: 'Fingerprint'
//   },
//   {
//     disabled: true,
//     value: 'iris',
//     label: 'Iris'
//   },
//   {
//     disabled: true,
//     value: 'speech',
//     label: 'Voice'
//   }
// ])

// const updateModality = (selectedValues) => {
//   const faceType = selectedValues.filter((item) => item.includes('face')).length > 0 ? true : false
//   // console.log(selectedValues, faceType)
//   if (faceType) {
//     console.log('select face engines')
//     cascadeModalityOptions.value.filter((item) =>
//       item.value.toString().includes('face') ? (item.disabled = false) : (item.disabled = true)
//     )
//   } else {
//     console.log('select other engines')
//     cascadeModalityOptions.value.filter((item) => (item.disabled = false))
//     if (selectedValues.length > 0) {
//       console.log(cascadeModalityOptions.value)
//       cascadeModalityOptions.value.map((item) =>
//         item.value !== selectedValues[0] ? (item.disabled = true) : (item.disabled = false)
//       )
//     }
//   }
//   scanInfo.value.scan.modality = selectedValues
// }

const handleGoToFolder = async (item) => {
  const linkToFolder = API.api + '/warehouse/' + item + '/'
  window.open(linkToFolder, '_blank')
  // const linkToFolder = `${API.api}/warehouse/${item}/`
  // const response = await API.authFetch(linkToFolder, {
  //   method: 'GET',
  // })

  // const resultHTML = await response.text()
  //     // Create a new Blob with the HTML content
  //     const blob = new Blob([resultHTML], { type: 'text/html' });
  //   const blobUrl = URL.createObjectURL(blob); // Create a URL for the Blob

  //   // Open the Blob URL in a new tab
  //   window.open(blobUrl, '_blank');
}

//Note: do not claim two value in one const
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

const loadInputFolder = ref(true)
const requestFolder = ref(false)
const requestFolderMeta = ref(false)

const checkInputFolderMetaData = async () => {
  requestFolderMeta.value = true
  const exts = scanInfo.value.scan.inputType.map((ext) => `exts=${ext.toLowerCase()}`).join('&')
  const pattern = scanInfo.value.scan.name ? `&pattern=${scanInfo.value.scan.name}` : ''
  const path = scanInfo.value.scan.folderPath ? `&path=${scanInfo.value.scan.folderPath}` : ''
  const url = `${API.api}/task/inputs/metadata?${exts}${pattern}${path}`

  try {
    const data = await API.authFetch(url, {
      method: 'GET'
    })
    if (data) {
      console.log('total num of folder', data)
      scanInfo.value.scan.length = data.count
    }
    requestFolderMeta.value = false
  } catch (error) {
    console.error('the API can not be reach', error)
    requestFolderMeta.value = false
  }
}

const checkInputFolder = async () => {
  requestFolder.value = true
  // const exts = scanInfo.value.scan.inputType.map((ext) => `exts=${ext.toLowerCase()}`).join('&')
  // const pattern = scanInfo.value.scan.name ? `&pattern=${scanInfo.value.scan.name}` : ''
  try {
    const data = await API.authFetch(`${API.api}/task/inputs/folders`, {
      method: 'GET'
    })

    if (data) {
      // console.log(data)
      loadInputFolder.value = true
      requestFolder.value = false
      API.updateInputFolder(data)
      API.updateInputTree(data)
    }
  } catch (error) {
    loadInputFolder.value = false
    requestFolder.value = false
    console.error('the API can not be reach', error)
  }
}

const debounceDelay = 1000 // Delay in milliseconds
let debounceTimer
const debouncedSearch = (event) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(async () => {
    //prevent reload the local direcotry when the inputType is changed on remote uploading
    if (scanInfo.value.scan.tabKey == 1) {
      // checkInputFolder()
      await refreshMetadata()
      console.log('no update on file num for local scan')
    } else {
      scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList.filter((item) =>
        validateFile(item)
      )
    }
  }, debounceDelay)
}
watch(
  () => scanInfo.value.scan.inputType,
  async () => {
    //prevent reload the local direcotry when the inputType is changed on remote uploading
    if (scanInfo.value.scan.tabKey == 1) {
      // checkInputFolder()
      await refreshMetadata()
    } else {
      scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList.filter((item) =>
        validateFile(item)
      )
    }
  }
)

// watch(
//   () => API.inputFolder,
//   (newVal) => {
//     if (newVal.length > 0 && scanInfo.value.scan.folderPath) {
//       const item = newVal.filter((item) => item.dir == scanInfo.value.scan.folderPath)[0]
//       const count = item ? item.count : 0
//       // console.log(count)
//       scanInfo.value.scan.length = count
//       preprocessInfo.value.preprocess.length = count
//     }
//   }
// )

watch(
  () => scanInfo.value.scan.folderPath,
  async (newVal, oldVal) => {
    if (!newVal) {
      scanInfo.value.scan.length = 0
      preprocessInfo.value.preprocess.length = 0
    } else {
      await refreshMetadata()
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
}

const refreshMetadata = async () => {
  console.log('refresh metadata')
  if (scanInfo.value.scan.folderPath) {
    await checkInputFolderMetaData()
  } else {
    console.log('No selected folder')
  }
}

watch(
  () => scanStatus.scan,
  (val) => {
    if (val == 2 && uploadRemote.value) {
      message.success(`All scan files uploaded successfully.`)
      scanInfo.value.scan.percent = 100
    }
  }
)
const count = ref(0)
const drop = ref(false)
const handleChange = async (info: UploadChangeParam) => {
  if (
    !drop.value &&
    info.file.name == info.fileList[info.fileList.length - 1].name &&
    info.fileList.length == scanInfo.value.scan.validFileList.length
  ) {
    scanInfo.value.scan.percent == 100
    console.log('Select finished')
    scanStatus.updateStatus('scan', 2)
  }
}
const handleDrop = (e) => {
  console.log(e)
  drop.value = true
  setTimeout(() => {
    if (scanInfo.value.scan.fileList.length == scanInfo.value.scan.validFileList.length) {
      scanInfo.value.scan.percent == 100
      console.log('Drop finished')
      scanStatus.updateStatus('scan', 2)
    }
    drop.value = false
  }, 10000)
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
  uploadRemote.value = true
  if (count.value == 0) {
    // console.log('scanning on going-------')
    scanStatus.updateStatus('scan', 1)
  }
  count.value = count.value + 1
  if (scanInfo.value.scan.percent < 95 && !typeInvalid.value) {
    scanInfo.value.scan.percent += 1
  }

  let type = file.type
    ? file.type
    : mime.getType(file.name)
      ? mime.getType(file.name)
      : file.name.split('.')[1]

  const format = mimeTypeToFormat[type]

  if (format) {
    let newfile = {
      name: file.name,
      type: type,
      originFileObj: file
    }
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
      setTimeout(() => {
        scanInfo.value.scan.percent = 100
        scanStatus.updateStatus('scan', 2)
        scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList
      }, 5000)
      const res = await convertToBase64(file)
      convertImageBackend(res, file.name)
    } else {
      scanInfo.value.scan.validFileList = scanInfo.value.scan.fileList
    }
  } else {
    typeInvalid.value = true
    message.error(`${file.name} is not a valid file type`)
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
    file: file,
    format: 'webp'
  }
  const url = API.api + '/convert'
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    scanInfo.value.scan.converted.push({ name: name, data: data })
  } catch (error) {
    console.error('Failed to convert Image')
  }
}

//Get whether it is scolling to the bottom of the file list
const handleScroll = (e) => {
  const container = e.target
  if (container.scrollHeight - container.scrollTop === container.clientHeight && !loading.value) {
    loadMoreFiles()
    // console.log('loading------')
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
  const engine = scanInfo.value.scan.engine
  scanInfo.value.initialiseScan()
  scanInfo.value.scan.tabKey = temp
  scanInfo.value.scan.modality = model
  scanInfo.value.scan.engine = engine
  scanStatus.updateStatus('scan', 0)
  loadedFiles.value = 100
  submittedScan.value = false
  drop.value = false
  console.log('Clear Scan')
}

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
const uploadRemote = ref(false)
const submitScan1 = async () => {
  uploadRemote.value = false
  submittedScan.value = true
  const formData = new FormData()
  scanInfo.value.scan.validFileList.forEach((file) => {
    formData.append(`files`, file.originFileObj, file.name)
  })
  let modality = scanInfo.value.scan.modality
  let engine =
    modality == 'face' && scanInfo.value.scan.engine.length > 1
      ? 'fusion'
      : modality == 'face'
        ? scanInfo.value.scan.engine[0]
        : ''
  let fusionEngines = modality == 'face' ? scanInfo.value.scan.engine : []
  let fusionCode = fusionEngines.length > 1 ? getFusionCode(fusionEngines) : 0
  console.log(modality, engine, fusionEngines, fusionCode)
  const url = `${API.api}/scan/remote?modality=${modality}${engine ? '&engine=' + engine : ''}${fusionCode != 0 ? '&fusion=' + fusionCode : ''}`

  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      body: formData
    })

    const input = `temp/+${data.tid}`
    const newTaskStatus = {
      tid: data.tid,
      collection: '',
      name: data.tid.substring(0, 5),
      status: 1,
      percent: 0,
      eta: 0,
      num: 0,
      total: scanInfo.value.scan.validFileList.length,
      mode: modality,
      engine: engine,
      input: input,
      modified: '',
      elapse: 0,
      logs: [],
      options: {
        mode: modality,
        engine: engine,
        source: [],
        target: null,
        confidence: null,
        pattern: null,
        type: null,
        batch: null,
        fusion: fusionCode
      }
    }

    const timeStamp = Date.now()
    scanInfo.value.process.timer = 0
    scanInfo.value.process.timeRecord = 0

    scanInfo.value.process.taskStatus.unshift(newTaskStatus)
    scanStatus.updateStatus('process', 1)
    clearScan()
    scanStatus.updateStatus('scan', 2)
    router.push({ path: '/tasks', query: { timeStamp } })
  } catch (error) {
    console.error('Error submitting task:', error)
    submittedScan.value = false
  }
}

//submit the scan task, update status & taskIDs, start a new process timer, redirect to process page
const submitScan2 = async () => {
  let modality = scanInfo.value.scan.modality
  let engine =
    modality == 'face' && scanInfo.value.scan.engine.length > 1
      ? 'fusion'
      : modality == 'face'
        ? scanInfo.value.scan.engine[0]
        : ''
  let fusionEngines = modality == 'face' ? scanInfo.value.scan.engine : []
  let fusionCode = fusionEngines.length > 1 ? getFusionCode(fusionEngines) : 0

  console.log(modality, engine, fusionEngines, fusionCode)
  submittedScan.value = true
  const input = scanInfo.value.scan.folderPath
  let requestBody = {}
  if (modality != 'face') {
    requestBody = {
      options: {
        source: scanInfo.value.scan.inputType.map((item) => item.toLowerCase()),
        pattern: scanInfo.value.scan.name ? transferPatterns(scanInfo.value.scan.name) : null
      },
      input: input
    }
  } else {
    requestBody = {
      options: {
        source: scanInfo.value.scan.inputType.map((item) => item.toLowerCase()),
        engine: engine,
        pattern: scanInfo.value.scan.name ? transferPatterns(scanInfo.value.scan.name) : null,
        fusion: fusionCode
      },
      input: input
    }
  }
  const url = `${API.api}/scan/local?modality=${modality}`
  const timeoutId = setTimeout(() => {
    message.error('Request time out, refresh later to get updated taskList!')
    submittedScan.value = false
  }, 60000)
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    if (data) {
      clearTimeout(timeoutId) // Clear timeout when request completes
      //do status check
    }
    const newTaskStatus = {
      tid: data.tid,
      collection: '',
      name: data.tid.substring(0, 5),
      status: 1,
      percent: 0,
      eta: 0,
      num: 0,
      total: scanInfo.value.scan.length,
      mode: modality,
      engine: engine,
      input: input,
      modified: '',
      elapse: 0,
      logs: [],
      options: {
        mode: modality,
        engine: engine,
        source: [],
        target: null,
        confidence: null,
        pattern: null,
        type: null,
        batch: null,
        fusion: fusionCode
      }
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
    router.push({ path: '/tasks', query: { timeStamp } })
  } catch (error) {
    console.log(error)
    errorMessage.value = error?.detail[0]?.msg
    showError.value = true
    submittedScan.value = false
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
  if (API.inputFolder.length == 0) {
    checkInputFolder()
  }
})

// Preprocess
const updateSelect = (item) => {
  preprocessInfo.value.preprocess.selectedRadio = item
}

const submittedStop = ref(false)
const clearTask = async () => {
  submittedStop.value = true
  // const url = `${API.api}/task/cancel/${preprocessInfo.value.preprocess.id}?type=preprocessing`
  const url = `${API.api}/task/cancel`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
    clearInterval(checkInternalStatus)
    preprocessInfo.value.preprocess.progress = false
    preprocessStatus.updateStatus('preprocess', 2)
    preprocessInfo.value.preprocess.id = ''
    eta.value = -1
    submittedStop.value = false
    openNotificationWithIcon('stop')
  } catch (error) {
    openNotificationWithIcon('error')
    console.error('Error cancel task:', error)
  }
}
const dropZip = (e) => {
  e.preventDefault() // Prevent default behavior (e.g., opening the file)
  // Access the dragged files
  const file = e.dataTransfer.files[0]

  if (file.name.includes('.zip') || file.type == 'application/zip') {
  } else {
    openNotificationWithIcon('notZip')
  }
}

const showUploadSpinner = ref(false)
const uploadZip = async (e) => {
  uploadRemote.value = false
  if (e.file.status == 'uploading') {
    showUploadSpinner.value = true
  }
  if (e.file.status !== 'uploading') {
    const res = await e.file.response
    showUploadSpinner.value = false
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
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    // if (!response.ok) {
    //   const res = await response.json()
    //   errorMessage.value = res.detail[0].msg
    //   showError.value = true
    //   throw new Error('Failed to submit preprocessing task')
    // }
    // const data = await response.json()
    console.log(data)
    preprocessStatus.updateStatus('preprocess', 1)
    preprocessInfo.value.preprocess.progress = true
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
    errorMessage.value = error.detail[0].msg
    showError.value = true
    console.error('Error submitting preprocessing task:', error)
  }
}

const checkPreprocess = async () => {
  if (preprocessInfo.value.preprocess.id != '') {
    const url2 = `${API.api}/scan/preprocessing/${preprocessInfo.value.preprocess.id}`
    try {
      const data = await API.authFetch(url2, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      console.log(data)
      outputPath.value = data.target
      if (data.status == 2 || data.status == -1) {
        if (data.status == -1) {
          preprocessStatus.updateStatus('preprocess', -1)
          console.error('preprocessing task failed')
        }
        preprocessStatus.updateStatus('preprocess', 2)
        preprocessInfo.value.preprocess.id = ''
        preprocessInfo.value.preprocess.progress = false
        const index = scanInfo.value.scan.inputType.indexOf(preprocessInfo.value.preprocess.type)
        if (index === -1) {
          scanInfo.value.scan.inputType.push(preprocessInfo.value.preprocess.type)
        }
        checkInputFolder()
        preprocessInfo.value.scan.folderPath = outputPath.value
      }
    } catch (error) {
      console.error('Error check preprocessing task status:', error)
    }
  }
}

// let debounceTimeout
// const getETA = async (tid) => {
//   clearTimeout(debounceTimeout)
//   const url = `${API.api}/task/${tid}/status`
//   debounceTimeout = setTimeout(() => {
//     API.authFetch(url, {
//       method: 'GET',
//       headers: { accept: 'application/json' }
//     })
//       .then((response) => {
//         if (!response.ok) {
//           console.log('can not find task progress')
//           console.log(eta.value)
//         }
//         return response.json()
//       })
//       .then((data) => {
//         if (data.done != 0) {
//           eta.value = data.eta
//           if (data.eta == 0) {
//             eta.value = -1
//             checkPreprocess()
//             clearInterval(checkInternalStatus)
//           }
//         }
//       })
//       .catch((e) => {
//         console.error('Error getting task status:', e)
//       })
//   }, 2000)
// }

const getETA = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    // if (!response.ok) {
    //   console.log('can not find task progress')
    //   console.log(eta.value)
    // }
    // const data = await response.json()
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
  z-index: 2;
  transition: transform 0.3s ease; /* Smooth transition effect */
}

.hover-zoom:hover {
  transform: scale(2); /* Scales the image to 110% of its original size */
  z-index: 10;
}
.emptyPreview {
  margin-top: 1rem;
  height: 350px;
  display: flex;
  flex-wrap: wrap;
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.scanContainer {
  width: 80%;
  max-width: 1200px;
  margin-top: 10px;
}

.customStyle1 {
  border-radius: 10px;
  margin: 30px;
  border: solid lightgrey 0.5px;
  height: auto;
  max-height: 400px;
  overflow-y: scroll;
  overflow-x: hidden;
}

.customStyle1:hover {
  border: solid gray 0.5px;
}

.image-card-container {
  display: flex;
  flex-wrap: wrap;
  /* height: 350px; */
  position: relative;
  overflow: visible;
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
  z-index: 5;
  width: 100%;
  height: 100%;
  background-color: rgba(242, 242, 242, 0.3);
  border-radius: 10px;
  cursor: not-allowed;
  pointer-events: auto;
}

.centered-spin {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.vue-sound {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 240, 240, 1);
}

.vue-sound .player-back-15-icon,
.player-ahead-15-icon,
.player-volume {
  display: none;
}
.vue-sound .player-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.smallCard .vue-sound .play-icon,
.pause-icon {
  height: 25px;
  width: 25px;
}

.smallCard .vue-sound .player-track {
  display: none;
}

[data-theme='dark'] {
  .customStyle1:hover {
    border: solid orange 0.5px;
  }
  .fixed-center-spin {
    background-color: rgba(20, 20, 20, 0.2);
  }
  .vue-sound .play-icon,
  .pause-icon {
    fill: #f8f8f8;
  }
  .vue-sound {
    background-color: rgba(20, 20, 20, 1);
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.6);
    border-radius: 10px;
    border: 1px solid rgba(0, 0, 0, 0.5);
  }

  ::-webkit-scrollbar-track {
    background: rgba(50, 50, 50, 0.3);
  }
}
@media (min-width: 1024px) {
  .scanContainer {
    margin-top: 0px;
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
