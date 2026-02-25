<template>
  <a-flex vertical class="filesContainer" gap="middle">
    <a-spin size="large" :spinning="status.files == 1" tip="Refreshing data from server..." style="margin-top: 10rem">
      <a-card hoverable class="filesCard">
        <!-- Search Section -->
        <a-row justify="center">
          <a-auto-complete v-model:value="searchItem" style="width: 90%; padding-block: 10px;" auto-size
            :filter-option="filterOption" :options="searchOptions">
            <a-input-search enter-button placeholder="Search dataset folder" size="large"
              allow-clear></a-input-search></a-auto-complete>

        </a-row>
        <!-- Files Section -->
        <!-- Files Board -->
        <div class="filesTab" ref="scrollableDiv" @dragover.prevent @drop.prevent="handleFileDrop">
          <a-back-top :target="getScrollTarget" :visibility-height="30" class="custom-back-top" />

          <div v-if="API?.inputTree" class="file-container">
            <div v-if="showItem?.length > 0 && searchItem" class="cardContainerStyle"
              v-for="(item1, index1) in showItem" :key="index1">
              <a-card size="small" hoverable bordered
                :style="info.preprocess.folderPath == item1.value ? { opacity: 0.7, border: 'solid lightgray 1px' } : { opacity: 1 }">
                <template #cover>
                  <a-button style="
                      position: absolute;
                      top: 5px;
                      right: 5px;
                      z-index: 10;
                      display: flex;
                      padding: 5px;
                      width: fit-content;
                      height: fit-content;
                      font-size: 15px;
                      align-items: center;
                      justify-content: center;
                    " @click="showDeleteConfirm(item1.value)">
                    <CloseOutlined />
                  </a-button>

                  <a-checkbox class="checkbox-hidden2" :checked="info.preprocess.folderPath == item1.value"
                    @change="(e) => select(e, item1.value)">
                    <a-badge :count="Object.keys(info.preprocess.folderInfo).includes(item1.title) &&
                        info.preprocess.folderInfo[item1.title]?.num
                        ? info.preprocess.folderInfo[item1.title]?.num
                        : 0
                      " :overflow-count="20000" :offset="[-25, 30]">
                      <span v-if="
                        Object.keys(info.preprocess.folderInfo).includes(item1.title) &&
                        info.preprocess.folderInfo[item1.title].duplicate.length > 0 && info.preprocess.folderInfo[item1.title].duplicate != 'false'
                      " style="
                            z-index: 10;
                            position: absolute;
                            top: -10%;
                            /* left: 3%; */
                            font-size:17px
                            /* transform: translateX(-50%); */
                          " class="bi bi-file-earmark-text"></span>
                      <a-tooltip :title="item1?.title">
                        <img v-if="
                          Object.keys(info.preprocess.folderInfo).includes(item1.title) &&
                          info.preprocess.folderInfo[item1.title]?.empty
                        " style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                          src="../assets/folder_empty.png" alt="folder image" />
                        <img v-else style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                          src="../assets/folder_default.png" alt="folder image" />
                        <div v-if="
                          Object.keys(info.preprocess.folderInfo).includes(item1.title) &&
                          info.preprocess.folderInfo[item1.title]?.modal.length >= 1
                        " style="
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          gap: 10px;
                          position: absolute;
                          top: 55%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          z-index: 10;
                          flex-wrap: wrap;
                          width: 140px;
                          word-wrap: break-word;
                          ">
                          <img v-for="(i, index) in info.preprocess.folderInfo[item1.title]?.modal" :key="index"
                            :width="info.preprocess.folderInfo[item1.title]?.modal.length <= 3 ? '40px' : '30px'"
                            :src="getFolderImage(i)" style="font-size: 24px; color: black;"></img>
                        </div>
                      </a-tooltip>
                    </a-badge>
                  </a-checkbox>
                </template>
                <template #actions>
                  <a-tooltip title="View Files">
                    <FundViewOutlined key="open" @click="handleGoToFolder(item1.value)" style="font-size: 18px;" />
                  </a-tooltip>
                  <a-tooltip title="Folder Info">
                    <LoadingOutlined v-if="spinInfo == index1" style="font-size: 17px;" />
                    <InfoCircleOutlined v-else key="info" @click="getInfo(item1.title, index1)"
                      style="font-size: 17px;" />
                  </a-tooltip>
                  <a-tooltip title="Detect Duplication">
                    <LoadingOutlined v-if="spinDuplicate == index1" style="font-size: 17px;" />
                    <SnippetsOutlined v-else key="detect" @click="detectDuplicate(item1.title, index1)"
                      style="font-size: 17px;" />
                  </a-tooltip>
                </template>
                <a-card-meta style="
                    height: 45px;
                    margin-top: -5px;
                    margin-bottom: -5px;
                    padding-inline: 5px;
                    text-align: center;
                    line-height: 40px;
                  ">
                  <template #title>
                    <!-- :bordered="false" -->
                    <a-input style="margin-top: -5px; text-align: center; font-size: large" v-if="editable == index1"
                      :defaultValue="item1.title" autofocus :placeholder="item1.title" @pressEnter="updateName(item1)"
                      @change="inputValue = $event.target.value" />
                    <p v-else style="display: flex; align-items: center; justify-content: center">
                      <span style="
                          display: inline-block;
                          max-width: 140px;
                          white-space: nowrap;
                          overflow: hidden;
                          font-size: large;
                          text-overflow: ellipsis;
                        " @click="editName(index1)" class="folder-title" :title="item1.title">
                        {{ item1.title }}
                      </span>
                      <span class="bi bi-pencil-square" style="margin-left: 5px; font-size: 16px; cursor: context-menu"
                        @click="editName(index1)"></span>
                    </p>
                  </template>
                </a-card-meta>
              </a-card>
            </div>

            <div v-else class="cardContainerStyle" v-for="(item, index) in API.inputTree" :key="index">
              <a-card size="small" hoverable bordered
                :style="info.preprocess.folderPath == item.value ? { opacity: 0.7, border: 'solid lightgray 1px' } : { opacity: 1 }">
                <template #cover>
                  <a-button style="
                      position: absolute;
                      top: 5px;
                      right: 5px;
                      z-index: 10;
                      display: flex;
                      padding: 5px;
                      width: fit-content;
                      height: fit-content;
                      font-size: 15px;
                      align-items: center;
                      justify-content: center;
                    " @click="showDeleteConfirm(item.value)" class="close-button">
                    <CloseOutlined />
                  </a-button>

                  <a-tooltip :title="item?.title">
                    <a-checkbox class="checkbox-hidden2" :checked="info.preprocess.folderPath == item.value"
                      @change="(e) => select(e, item.value)">
                      <a-badge :count="Object.keys(info.preprocess.folderInfo).includes(item.title) &&
                          info.preprocess.folderInfo[item.title]?.num
                          ? info.preprocess.folderInfo[item.title]?.num
                          : 0
                        " :overflow-count="20000" :offset="[-25, 30]">
                        <span v-if="
                          Object.keys(info.preprocess.folderInfo).includes(item.title) &&
                          info.preprocess.folderInfo[item.title]?.duplicate.length > 0 && info.preprocess.folderInfo[item.title].duplicate !== 'false'
                        " style="
                            z-index: 10;
                            position: absolute;
                            top: -10%;
                            /* left: 3%; */
                            font-size:17px
                            /* transform: translateX(-50%); */
                          " class="bi bi-file-earmark-text"></span>
                        <img v-if="
                          Object.keys(info.preprocess.folderInfo).includes(item.title) &&
                          info.preprocess.folderInfo[item.title]?.empty
                        " style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                          src="../assets/folder_empty.png" alt="folder image" />
                        <img v-else style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                          class="folder-icon" src="../assets/folder_default.png" alt="folder image" />
                        <div v-if="
                          Object.keys(info.preprocess.folderInfo).includes(item.title) &&
                          info.preprocess.folderInfo[item.title]?.modal.length >= 1
                        " style="
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          gap: 10px;
                          position: absolute;
                          top: 55%;
                          left: 50%;
                          transform: translate(-50%, -50%);
                          z-index: 10;
                          flex-wrap: wrap;
                          width: 140px;
                          word-wrap: break-word;
                          ">
                          <img v-for="(i, index) in info.preprocess.folderInfo[item.title]?.modal" :key="index"
                            :width="info.preprocess.folderInfo[item.title]?.modal.length <= 3 ? '40px' : '30px'"
                            :src="getFolderImage(i)"></img>
                        </div>
                        <!-- <i
                          v-for="(i, index) in info.preprocess.folderInfo[item.title]?.modal"
                          :key="index"
                          :class="
                            i == 'face'
                            ? 'bi bi-person-bounding-box'
                            : i == 'iris'
                              ? 'bi bi-eye'
                              : i == 'fingerprint'
                              ? 'bi bi-fingerprint'
                              : i == 'speech'
                                ? 'bi bi-soundwave'
                                : 'bi bi-file-earmark-text'
                          "
                          style="font-size: 24px; color: black;"
                          ></i> -->
                      </a-badge>
                    </a-checkbox>
                  </a-tooltip>
                </template>
                <template #actions>
                  <!-- <a-button @click="getInfo(item)"
              ><i class="bi bi-info-square" style="margin-right: 5px; font-size: 15px"></i>
              Info</a-button
            >
            <a-button @click="handleGoToFolder(item.value)">
              <i class="bi bi-eye" style="margin-right: 5px; font-size: 15px"></i
              >View</a-button
            > -->
                  <a-tooltip title="View Files">
                    <FundViewOutlined key="open" @click="handleGoToFolder(item.value)" style="font-size: 17px;" />
                  </a-tooltip>
                  <a-tooltip title="Folder Info">
                    <LoadingOutlined v-if="spinInfo == index" style="font-size: 17px;" />
                    <InfoCircleOutlined v-else key="info" @click="getInfo(item.title, index)"
                      style="font-size: 17px;" />
                  </a-tooltip>
                  <a-tooltip title="Detect Duplication">
                    <LoadingOutlined v-if="spinDuplicate == index" style="font-size: 17px;" />
                    <SnippetsOutlined v-else key="detect" @click="detectDuplicate(item.title, index)"
                      style="font-size: 17px;" />
                  </a-tooltip>
                </template>

                <a-card-meta style="
                    height: 45px;
                    margin-top: -5px;
                    margin-bottom: -5px;
                    padding-inline: 5px;
                    text-align: center;
                    line-height: 40px;
                  ">
                  <template #title>
                    <!-- :bordered="false" -->
                    <a-input id="inputComponent" style="margin-top: -5px; text-align: center; font-size: large"
                      v-if="editable == index" :defaultValue="item.title" autofocus :placeholder="item.title"
                      @change="inputValue = $event.target.value" @pressEnter="updateName(item)" />
                    <p v-else style="display: flex; align-items: center; justify-content: center">
                      <span style="
                          display: inline-block;
                          max-width: 140px;
                          white-space: nowrap;
                          overflow: hidden;
                          text-overflow: ellipsis;
                          font-size: large;
                        " class="folder-title" :title="item.title" @click="editName(index)">
                        {{ item.title }}
                      </span>
                      <span class="bi bi-pencil-square" style="margin-left: 5px; font-size: 16px; cursor: context-menu"
                        @click="editName(index)"></span>
                    </p>
                  </template>
                </a-card-meta>
              </a-card>
            </div>
            <!-- </input> -->
          </div>

          <!-- Empty Board -->
          <div v-else class="resItem">
            <a-spin size="large" :spinning="tip" :tip="tip">
              <a-input style="display: none; z-index: 1" type="file">
                <a-empty />
              </a-input>
            </a-spin>
          </div>

          <!-- size="large" -->
          <a-button type="dashed" shape="circle" style="
            width: 80px;
            height: 80px;
              position: absolute;
              bottom: 350px;
              right: 60px;
              z-index: 1000;
            " @click="API.uploaderModal = true">
            <template #icon>
              <!-- <UploadOutlined style="font-size: 25px;"/> -->
              <CloudUploadOutlined style="font-size: 28px;" />
            </template>
          </a-button>
        </div>

        <a-card justify="center" hoverable>
          <a-spin size="large" :indicator="indicator" :spinning="status.preprocess == 1" tip="Task is running...">
            <a-flex vertical gap="small">
              <h2 id="preprocess"><span class="bi bi-aspect-ratio"></span> Preprocess Images:</h2>
              <a-flex gap="middle">
                <p style="font-size: 16px; padding-top: 5px">Resize</p>
                <a-col span="10">
                  <a-radio size="large" @click="updateSelect('ratio')"
                    :checked="info.preprocess.selectedRadio == 'ratio'">
                    <a-input-number size="large" v-model:value="info.preprocess.ratio" style="font-size: 18px"
                      addon-after="%" addon-before="Ratio">
                    </a-input-number></a-radio>
                </a-col>

                <a-col span="10">
                  <a-radio size="large" @click="updateSelect('size')"
                    :checked="info.preprocess.selectedRadio == 'size'">
                    <a-input-number size="large" v-model:value="info.preprocess.size" addon-before="Width"
                      addon-after="px"></a-input-number>
                  </a-radio>
                </a-col>
              </a-flex>

              <!-- <h2 style="margin-top: 5px">
                <span class="bi bi-aspect-ratio"></span> Configure Output:
              </h2> -->
              <a-flex align="center" gap="middle">
                <p style="font-size: 16px; padding-top: 8px">Format</p>
                <a-select style="width: 100%" size="large" v-model:value="info.preprocess.color"
                  :options="colourOptions">
                </a-select>

                <a-select style="width: 100%" size="large" v-model:value="info.preprocess.type" :options="typeOptions.filter((item) => {
                  return item.label != 'WAV'
                })
                  ">
                </a-select>
              </a-flex>
            </a-flex>
          </a-spin>

          <a-row justify="center" gutter="40" style="margin-block: 0rem; margin-top: 1rem">
            <a-col :span="12">
              <a-button :loading="submittedStop" :disabled="!info.preprocess.progress" style="width: 100%; padding: 0"
                size="large" type="primary" danger @click="clearTask()">
                <span v-if="!submittedStop" class="bi bi-stop-circle"
                  style="font-size: 18px; margin-inline: 5px"></span>
                Cancel
              </a-button>
            </a-col>
            <a-col :span="12">
              <a-button style="width: 100%" size="large" type="primary" @click="submitPreprocess"
                :loading="info.preprocess.progress" :disabled="!info.preprocess.folderPath">
                <span v-if="eta > 0">ETA: {{ eta }} s</span>

                <span v-else>
                  <span v-if="!info.preprocess.progress" class="bi bi-play"
                    style="font-style: normal; margin-inline: 5px"></span>Convert</span>
              </a-button></a-col>
          </a-row>
          <a-alert v-if="outputPath" style="margin-top: 10px" type="success" show-icon closable>
            <template #message>
              Output:<a @click="handleGoToFolder(outputPath)">{{ outputPath }}</a>
            </template>
          </a-alert>
          <a-modal centered :open="API.uploaderModal" @cancel="() => (API.uploaderModal = false)" :footer="null"
            width="50%" style="min-width: 500px; max-width: 800px" bodyStyle="padding:20px;">
            <Dashboard v-if="API.uploaderModal" u :key="API.currentTheme" :uppy="uppy" :props="{
              theme: API.currentTheme,
              showProgressDetails: true,
              proudlyDisplayPoweredByUppy: false,
              note: 'Any files, folder or Zip file Less than 2 GB.',
              height: '460px',
              doneButtonHandler: doneButtonHandler
            }" />
          </a-modal>
        </a-card>

      </a-card>
    </a-spin>
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useApi, useInfo } from '../stores/dataStore.js'
import { ref, computed, onMounted, watch, h } from 'vue'
import { notification } from 'ant-design-vue'
import { Modal, Descriptions } from 'ant-design-vue'
import {
  ExclamationCircleOutlined,
  CloudUploadOutlined,
  SyncOutlined,
  SnippetsOutlined,
  FundViewOutlined,
  InfoCircleOutlined,
  CloseOutlined,
  LoadingOutlined
} from '@ant-design/icons-vue'

const windowWidth = ref(window.innerWidth)

const API = useApi()
const status = useStatus()
const info = useInfo()
const submittedStop = ref(false)
const eta = ref(-1)
const outputPath = ref('')
const showError = ref(false)
const errorMessage = ref('')
const showUploadSpinner = ref(false)
const editClick = ref(false)
const editable = ref(-1)

const Server_URL = API.api + '/data/archive'
import JSZip from 'jszip'
import { Dashboard, DashboardModal } from '@uppy/vue'
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'
import GoldenRetriever from '@uppy/golden-retriever'
import Compressor from '@uppy/compressor'

import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'
import '@uppy/webcam/dist/style.css'
import '@uppy/informer/dist/style.min.css'
// import '@uppy/image-editor/dist/style.css'

const scrollableDiv = ref(null);
// Function to return the target element
const getScrollTarget = () => {
  console.log(scrollableDiv.value)
  return scrollableDiv.value;
};

const uppy = new Uppy({
  restrictions: {
    // maxFileSize: 1000000,
    maxFileSize: 2 * 1024 * 1024 * 1024 // 5GB limit
    // allowedFileTypes: ['.zip', '.tar', '.gz']
  }
})
  .use(XHRUpload, {
    method: 'POST',
    endpoint: Server_URL,
    // chunkSize: 10 * 1024 * 1024,
    fieldName: 'files',
    withCredentials: true,
    limit: 6
  })
  //   .use(TUSUpload, {
  //   endpoint: TUS_ENDPOINT,
  //   chunkSize: 10 * 1024 * 1024,
  //   fieldName: 'file',
  //   // withCredentials: true,
  //   limit: 6
  // })
  // work for the tusd server
  .use(Compressor)
  .use(GoldenRetriever)
  .on('complete', (result) => {
    if (result.successful.length > 0) {
      if (result.failed.length > 0) {
        console.log('failed files:', result.failed[0])
        const errorMessage =
          (result.failed[0]?.response as XMLHttpRequest)?.responseText ||
          'Upload failed';
        openNotificationWithIcon('error', errorMessage);
      } else {
        console.log('successful files:', result.successful)
        openNotificationWithIcon('uploadSuccess')
        doneButtonHandler()
      }
      checkInputFolder()
    } else {
      console.log('failed files:', result.failed)
      const errorMessage =
        (result.failed[0]?.response as XMLHttpRequest)?.responseText ||
        'Upload failed';
      openNotificationWithIcon('error', errorMessage);
    }
  })

const prepareFiles = async (filesID) => {
  const files = uppy.getFiles()
  const hasNonZipFile = files.some((file) => !file.name.endsWith('.zip'))

  if (hasNonZipFile) {
    await zipFiles(files)
    return Promise.reject()
  } else {
    return Promise.resolve(files)
  }
}
uppy.addPreProcessor(prepareFiles)

function zipFiles(files) {
  const nonZip = files.filter((file) => !file.name.endsWith('.zip'))
  const zipFiles = files.filter((file) => file.name.endsWith('.zip'))
  const zip = new JSZip()
  const zipFileName = nonZip[0].meta.relativePath
    ? nonZip[0].meta.relativePath.split('/')[0] + '.zip'
    : nonZip[0].name.split('.')[0] + '_folder.zip'
  uppy.info('zipping into folder', 'info')

  for (const file of nonZip) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const data = e.target.result
      const layer = file.meta.relativePath ? file.meta.relativePath.split(file.name)[0] : '/'
      zip.folder(layer).file(file.name, data)
      if (file === nonZip[nonZip.length - 1]) {
        zip.generateAsync({ type: 'blob' }).then((zipBlob) => {
          const zipFile = new File([zipBlob], zipFileName, {
            type: 'application/zip',
            lastModified: Date.now()
          })
          // console.log(zipFile)
          uppy.clear()
          uppy.addFile({
            name: zipFileName,
            type: 'application/zip',
            data: zipFile
          })

          zipFiles.forEach((file) => {
            uppy.addFile({
              name: file.name,
              type: file.type,
              data: file.data
            })
          })
          uppy.info('uploading zipped file', 'info')
          uppy.upload()
        })
      }
    }
    reader.readAsArrayBuffer(file.data)
  }
}

const handleFileDrop = async (e) => {
  // console.log('drop', e)
  API.uploaderModal = true
  const items = e.dataTransfer?.items
  if (!items) return

  for (const item of items) {
    const entry = item.webkitGetAsEntry()
    if (entry) {
      if (entry.isDirectory) {
        // console.log('Folder detected:', entry.name)
        await readFolder(entry, entry.name)
      } else {
        entry.file((file) => {
          uppy.addFile(file)
        })
      }
    }
  }
}

const readFolder = async (directoryEntry, path): Promise<void> => {
  const reader = directoryEntry.createReader()

  return new Promise((resolve) => {
    reader.readEntries(async (entries) => {
      for (const entry of entries) {
        if (entry.isDirectory) {
          // console.log('Subfolder:', entry.name)
          await readFolder(entry, `${path}/${entry.name}`) // Recursively read subfolders
        } else {
          entry.file((file) => {
            const fileWithPath = new File([file], `${path}/${file.name}`)
            uppy.addFile({
              name: fileWithPath.name,
              type: fileWithPath.type,
              data: fileWithPath
            })
          })
        }
      }
      resolve()
    })
  })
}

document.addEventListener('click', (event) => {
  if (!editClick.value) {
    // console.log('click')
    editable.value = -1
  }
  // console.log(editClick.value, editable.value)
})

const searchItem = ref(null)
const showItem = computed(() => {
  if (searchItem.value) {
    const searchItems =
      API.inputTree?.filter((item) =>
        item.value.toLowerCase().includes(searchItem?.value.toLowerCase())
      ) || [] // In case inputTree is empty or undefined

    return searchItems
  }
})

const tip = computed(() => {
  if (status.app == 1 || status.files == 1) {
    return 'Getting data from server...'
  } else {
    return false
  }
})

const searchOptions = computed(() => {
  const otherItems =
    API.inputTree?.map((item) => {
      return {
        value: item.value,
        label: item.value
      }
    }) || [] // In case inputTree is empty or undefined

  // Concatenate both results
  return otherItems
})

interface Option {
  value: string
}

const filterOption = (input: string, option: Option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}

let checkInternalStatus = null

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

const colourOptions = [
  {
    label: 'Grayscale',
    value: 'Grayscale'
  },
  {
    label: 'RGB',
    value: 'RGB'
  },
  {
    label: 'BW',
    value: 'BW'
  },
  {
    label: 'HSV',
    value: 'HSV'
  },
  {
    label: 'RGBA',
    value: 'RGBA'
  },
  {
    label: 'CMYK',
    value: 'CMYK'
  },
  {
    label: 'YCbCr',
    value: 'YCbCr'
  }
]

const indicator = h(SyncOutlined, {
  style: {
    fontSize: '50px',
    fontWeight: 'bold',
    marginLeft: '-25px',
    marginTop: '-40px'
  },
  spin: true
})

const select = (e, item) => {
  if (e.target.checked) {
    info.preprocess.folderPath = item
    const preprocessElement = document.getElementById('preprocess')
    if (preprocessElement) {
      preprocessElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    info.preprocess.folderPath = ''
  }
  // console.log('selected', info.preprocess.folderPath, e.target.checked, item)
}

const clearTask = async () => {
  submittedStop.value = true
  const url = `${API.api}/task/cancel/${info.preprocess.id}?type=preprocessing`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
    clearInterval(checkInternalStatus)
    info.preprocess.progress = false
    status.updateStatus('preprocess', 2)
    info.preprocess.id = ''
    eta.value = -1
    submittedStop.value = false
    openNotificationWithIcon('stop')
  } catch (error) {
    console.log(error.message)
    openNotificationWithIcon('error', error.message)
    console.error('Error cancel task:', error)
  }
}

//submit the preprocess task, update status & taskIDs, start a new process timer, redirect to process page
const submitPreprocess = async () => {
  const requestBody = {
    source: info.preprocess.folderPath,
    options: {
      convert: info.preprocess.type ? info.preprocess.type.toLowerCase() : null,
      mode: info.preprocess.color ? info.preprocess.color.toLowerCase() : null,
      scale: info.preprocess.selectedRadio == 'ratio' ? info.preprocess.ratio / 100 : null,
      resize: info.preprocess.selectedRadio == 'size' ? info.preprocess.size : null,
      pattern: null
    },
    status: 0
  }
  const url = `${API.api}/scan/preprocessing`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })
    if (data) {
      // console.log(data)
      status.updateStatus('preprocess', 1)
      info.preprocess.progress = true
      info.preprocess.id = data['Preprocessing task in progress']
      eta.value = -1
      checkInternalStatus = setInterval(async () => {
        if (info.preprocess.id != '' && status.preprocess == 1) {
          // Note: if the task propcessing fast, can not get ETA
          getETA(info.preprocess.id)
          if (eta.value <= 0 || eta.value == null) {
            checkPreprocess()
          }
        } else {
          clearInterval(checkInternalStatus)
        }
      }, 1000)
    }
  } catch (error) {
    errorMessage.value = error.detail[0].msg
    showError.value = true
    console.error('Error submitting preprocessing task:', error)
  }
}

const getETA = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data && data.done != 0) {
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

const checkPreprocess = async () => {
  if (info.preprocess.id != '') {
    const url2 = `${API.api}/scan/preprocessing/${info.preprocess.id}`
    try {
      const data = await API.authFetch(url2, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      if (data) {
        // console.log(data)
        outputPath.value = data.target
        if (data.status == 2 || data.status == -1) {
          if (data.status == -1) {
            status.updateStatus('preprocess', -1)
            console.error('preprocessing task failed')
          }
          status.updateStatus('preprocess', 2)
          info.preprocess.id = ''
          info.preprocess.progress = false
          checkInputFolder()
          info.preprocess.folderPath = ''
        }
      }
    } catch (error) {
      console.error('Error check preprocessing task status:', error)
    }
  }
}

const openReportInfo = (item, index) => {
  const { duplicate, ...data } = info.preprocess.folderInfo[item]
  Modal.info({
    title: 'Folder Info',
    centered: true,
    width: 500,
    content: h('div', {
      style: {
        marginTop: '20px',
        marginRight: '30px',
        display: 'flex',
        justifyContent: 'center'
      }
    }, [
      h(Descriptions, {
        column: 1,
        bordered: true,
        size: 'small',
        style: { width: '100%' }
      }, {
        default: () => [
          h(Descriptions.Item, { label: 'File Count' }, () => data.num),
          h(Descriptions.Item, { label: 'Modality' }, () => data.modal.map(item => {
            const s = String(item ?? '').trim();
            return s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : '';
          })
            .join(', '))
        ]
      })
    ]),
    closable: true,
    okText: 'Refresh',
    onOk: () => {
      delete info.preprocess.folderInfo[item];
      getInfo(item, index);
    }
  });
}

const openDuplicateInfo = (item, index) => {
  const data = info.preprocess.folderInfo[item].duplicate
  Modal.info({
    title: 'Duplication Info',
    width: 500,
    content: h('div', {
      style: {
        marginTop: '20px',
        marginRight: '30px',
        display: 'flex',
        justifyContent: 'center'
      }
    }, [
      h(Descriptions, {
        column: 1,
        bordered: true,
        size: 'small',
        style: { width: '100%' }
      }, {
        default: () => [
          h(Descriptions.Item, { label: 'Duplicate Files' }, () => data.map((file, i) => h('div', { key: i }, file))),
          h(Descriptions.Item, { label: 'Total' }, () => data.length)
        ]
      })
    ]),

    closable: true,
    centered: true,
    okText: data.length > 0 && data != 'false' ? 'Remove Duplications' : 'Refresh',
    onOk: () => {
      if (data.length > 0 && data != 'false') {
        return deDuplicate(item)
      } else {
        // delete info.preprocess.folderInfo[item].duplicate; 
        info.preprocess.folderInfo[item].duplicate = 'false'
        detectDuplicate(item, index)
      }
    }
  })
}

const updateSelect = (item) => {
  info.preprocess.selectedRadio = item
}

const openNotificationWithIcon = (type: string, error = '') => {
  if (type === 'delete') {
    notification['success']({
      message: 'Item Deleted',
      description: 'The selected folder has been deleted successfully.',
      placement: 'top'
    })
  } else if (type === 'error') {
    notification['error']({
      message: 'Action Failed',
      description: error,
      placement: 'top'
    })
  } else if (type === 'upload') {
    notification['success']({
      message: 'Zip Folder Uploaded',
      description: 'The zip folder has been uploaded to the server successfully.',
      placement: 'top'
    })
  } else if (type === 'invalid') {
    notification['warning']({
      message: 'Cannot Delete Item',
      description: 'The folder cannot be deleted as it has not been uploaded.',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'notZip') {
    notification['error']({
      message: 'Invalid File Type',
      description: 'The dropped file is not a zip file. Please select a valid zip file.',
      placement: 'top'
    })
  } else if (type === 'updateName') {
    notification['success']({
      message: 'Folder Name Updated',
      description: 'The zip folder name has been updated successfully.',
      placement: 'top'
    })
  } else if (type === 'stop') {
    notification['success']({
      message: 'Task Stopped',
      description: 'The current running task has been stopped successfully.',
      placement: 'top'
    })
  } else if (type === 'deduplicate') {
    notification['success']({
      message: 'Decuplicate files',
      description: 'Deduplicate files in selected folder successfully.',
      placement: 'top'
    })
  } else if (type == 'uploadSuccess') {
    notification['success']({
      message: 'Upload Successful',
      description: 'Selected document(s) have been successfully uploaded to the server.',
      placement: 'top',
      duration: 3
    })
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

const uploadZip = async (e) => {
  if (e.file.status == 'uploading') {
    showUploadSpinner.value = true
  }
  if (e.file.status !== 'uploading') {
    const res = await e.file.response
    showUploadSpinner.value = false
    if (res.detail) {
      // console.log(res)
      openNotificationWithIcon('error')
    }
    if (res.message) {
      // console.log(res)
      openNotificationWithIcon('upload')
      await checkInputFolder()
    }
  }
}

function showDeleteConfirm(item) {
  Modal.confirm({
    title: 'Are you sure you want to delete this folder?',
    icon: h(ExclamationCircleOutlined),
    content: 'Files in the folder will be deleted and cannot be restored.',
    okType: 'danger',
    centered: true,
    okText: 'Delete',
    async onOk() {
      // console.log('OK')
      try {
        await deleteFolder(item)
        return Promise.resolve()
      } catch (error) {
        console.log('Oops, errors!', error)
        return Promise.reject(error)
      }
    },
    onCancel() {
      // console.log('Cancel')
    }
  })
}

const deleteFolder = async (item) => {
  status.updateStatus('files', 1)
  const name = item.split('data/')[1]
  // console.log(item.split('data/')[1])
  const url = `${API.api}/data/archive/${name}`
  try {
    const data = await API.authFetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      mode: 'cors'
    })

    openNotificationWithIcon('delete')
    status.updateStatus('files', 2)
    const index = API.inputTree.findIndex((x) => x.value === item)
    if (index !== -1) {
      API.inputTree.splice(index, 1)
    }
    delete info.preprocess.folderInfo[name]
  } catch (error) {
    console.log(error.message)
    openNotificationWithIcon('error', error.message)
    status.updateStatus('files', 0)
    // console.error('Error deleting folder:', JSON.parse(error))
  }
}

const editName = (index) => {
  editClick.value = true
  editable.value = index
  setTimeout(() => {
    editClick.value = false
  }, 1000)
}
const inputValue = ref('')

const updateName = async (item) => {
  status.updateStatus('files', 1)
  const newName = inputValue.value
  const name = item.value.split('data/')[1]
  item.value = 'data/' + inputValue.value
  item.title = inputValue.value
  editable.value = -1
  editClick.value = false
  // console.log(newName, name)
  const url = `${API.api}/data/archive/${name}?new_name=${newName}`
  try {
    const data = await API.authFetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      mode: 'cors'
    })
    status.updateStatus('files', 2)
    // console.log(data)
    openNotificationWithIcon('updateName')
    const folderInfo = info.preprocess.folderInfo[name]
    delete info.preprocess.folderInfo[name]
    info.preprocess.folderInfo[newName] = folderInfo

    // checkInputFolder()
  } catch (error) {
    status.updateStatus('files', 0)
    item.value = 'data/' + name
    item.title = name
    const detail = error.message.split('detail:')[1]
    console.log(detail)
    openNotificationWithIcon('error', detail)
    // console.error('Error getting folder info:', error)
  }
}
const detectDuplicate = async (item, index) => {
  if (Object.keys(info.preprocess.folderInfo).includes(item) && info.preprocess.folderInfo[item].duplicate != 'false') {
    // console.log(info.preprocess.folderInfo[item].duplicate)
    openDuplicateInfo(item, index)
  } else {
    // console.log(item)
    // status.updateStatus('files', 1)
    spinDuplicate.value = index
    const url = `${API.api}/data/archive/${item}/duplicates`
    try {
      const data = await API.authFetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        mode: 'cors'
      })

      // console.log(data)
      status.updateStatus('files', 2)
      spinDuplicate.value = -1
      const newFolderStatus = {
        [item]: {
          duplicate: data['Duplicates Found'],
          num: info.preprocess.folderInfo[item]?.num || 0,
          modal: info.preprocess.folderInfo[item]?.modal || []
        }
      }
      // console.log(data['Duplicates Found'].length,newFolderStatus.duplicate)
      info.preprocess.folderInfo = { ...info.preprocess.folderInfo, ...newFolderStatus }
    } catch (error) {
      status.updateStatus('files', 0)
      spinDuplicate.value = -1
      console.log(error.message)
      openNotificationWithIcon('error', error.message)
      console.error('Error getting folder info:', error)
    }
  }
}

const deDuplicate = async (item) => {
  // console.log(item)
  status.updateStatus('files', 1)
  const url = `${API.api}/data/archive/${item}/deduplicate`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      mode: 'cors'
    })
    status.updateStatus('files', 2)
    const newFolderStatus = {
      [item]: {
        ...info.preprocess.folderInfo[item],
        duplicate: 'false'
      }
    }
    info.preprocess.folderInfo = { ...info.preprocess.folderInfo, ...newFolderStatus }
    openNotificationWithIcon('deduplicate')
    // console.log(data)
  } catch (error) {
    status.updateStatus('files', 0)
    console.log(error.message)
    openNotificationWithIcon('error', error.message)
    console.error('Error getting folder info:', error)
  }
}
const spinInfo = ref(-1)
const spinDuplicate = ref(-1)
// const folderInfo=ref({})

const getInfo = async (item, index) => {
  if (info.preprocess.folderInfo[item]) {
    openReportInfo(item, index)
  } else {
    // console.log(item)
    // status.updateStatus('files', 1)
    // console.log(info.preprocess.folderInfo)
    spinInfo.value = index
    // const url1 = `${API.api}/data/archive/${item}`
    const url2 = `${API.api}/data/archive/${item}/modality`
    try {
      // const data1 = await API.authFetch(url1, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      //   mode: 'cors'
      // })

      const data2 = await API.authFetch(url2, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', accept: 'application/json' },
        mode: 'cors'
      })
      const { total, sample, ...rest } = data2;
      const dataInfo = {
        Num: total,
        Modal: rest
      }
      // console.log(dataInfo)
      spinInfo.value = -1
      const newFolderStatus = {
        [item]: {
          empty: dataInfo.Num > 0 ? false : true,
          num: dataInfo.Num,
          modal: Object.keys(dataInfo.Modal),
          duplicate: 'false'
        }
      }
      status.updateStatus('files', 2)
      info.preprocess.folderInfo = { ...info.preprocess.folderInfo, ...newFolderStatus }
      // console.log(info.preprocess.folderInfo)

    } catch (error) {
      status.updateStatus('files', 0)
      spinInfo.value = -1
      console.log(error.message)
      openNotificationWithIcon('error', error.message)
      console.error('Error getting folder info:', error)
    }
  }

}

const handleGoToFolder = (item) => {
  // console.log(item)
  const linkToFolder = API.api + '/warehouse/' + item + '/'
  window.open(linkToFolder, '_blank')
}

const checkInputFolder = async () => {
  status.updateStatus('files', 1)
  try {
    const data = await API.authFetch(`${API.api}/task/inputs/folders`, {
      method: 'GET'
    })
    if (data) {
      API.updateInputFolder(data)
      API.updateInputTree(data)
      status.updateStatus('files', 2)
    }
  } catch (error) {
    status.updateStatus('files', -1)
    console.error('the API can not be reach', error)
  }
}
const doneButtonHandler = () => {
  API.uploaderModal = false
  uppy.clear()
}
onMounted(async () => {
  if (API.inputTree?.length > 0) {
    // console.log(API.inputTree[0].children)
  } else {
    await checkInputFolder()
    // console.log(API.inputTree[0].children)
  }
})

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// const thumbnails = ref([]) // Store the image paths

// Simulate handling folder selection
// const handleFolderChange = (event) => {
//   const files = event.target.files;
//   const imageFiles = [];

//   // Filter only image files (jpg, png, etc.)
//   for (let file of files) {
//     if (file.type.startsWith("image/")) {
//       const imageUrl = URL.createObjectURL(file);
//       imageFiles.push(imageUrl);
//     }
//   }

//   // Limit thumbnails to display (e.g., first 4 images)
//   thumbnails.value = imageFiles.slice(0, 4);
// };
// const folderImages = import.meta.glob('../assets/folder_*.png', { eager: true, import: 'default' })

// function getFolderImage(modal) {
//   const imageKey = `../assets/folder_${modal ?? 'default'}.png`
//   return String(folderImages[imageKey] || folderImages['../assets/folder_default.png'])
// }

const Image = import.meta.glob('../assets/*.png', { eager: true, import: 'default' })

function getFolderImage(i) {
  let imageKey = `../assets/${i ?? 'file'}.png`
  switch (i) {
    case 'face':
      imageKey = `../assets/${i ?? 'file'}.png`
      return String(Image[imageKey] || Image['file'])
      break;
    case 'fingerprint':
      const str = 'finger'
      imageKey = `../assets/${str ?? 'file'}.png`
      return String(Image[imageKey] || Image['file'])
      break;
    case 'iris':
      imageKey = `../assets/${i ?? 'file'}.png`
      return String(Image[imageKey] || Image['file'])
      break;

    case 'speech':
      imageKey = `../assets/${i ?? 'file'}.png`
      return String(Image[imageKey] || Image['file'])
      break;
    case 'unknown':
      imageKey = `../assets/file.png`
      return String(Image[imageKey] || Image['file'])
    default:
      return String(Image['file'])
  }

}


</script>

<style>
.filesContainer {
  width: 80%;
  max-width: 1200px;
  margin-top: 15px;
}

.filesCard {
  width: 100%;
  overflow: hidden;
  min-height: 750px;
  position: relative;
  /* height: calc(100vh - 250px); */
}

.filesTab {
  margin-block: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 300px;
  height: calc(100vh - 500px);
  background-color: rgba(245, 245, 245, 0.4);
  padding-block: 1rem;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  max-width: 100%;
  width: 100%;
  /* Ensure it takes full parent width */
}

.file-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 200px));
  justify-content: center;
  /* Center the grid items */
  gap: 10px;
  /* Consistent spacing */
  margin: 0;
  padding: 0;
  width: 100%;
}

.cardContainerStyle {
  width: 200px;
  /* Maximum width to cap card size */
  height: 280px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease-in-out;
}

.cardContainerStyle:hover {
  transform: scale(1.05);
  /* Slight hover zoom effect */
}

.custom-back-top {
  position: absolute !important;
  right: 50px;
  /* Adjust as needed */
  bottom: 500px;
  /* Adjust as needed */
}

.resItem {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}


i {
  transition: opacity 0.3s ease;
}

.uploader {
  margin-block: 30px;
}

.checkbox-hidden2 {
  display: block;
  width: 100%;
  margin-top: 25px;
}

.checkbox-hidden2 .ant-checkbox {
  display: none;

}

[data-theme='dark'] {
  .resItem {
    background-color: rgba(245, 245, 245, 0.1);
  }

  .filesTab {
    background-color: rgba(245, 245, 245, 0.1);
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

@media (max-width: 1024px) {
  i {
    display: none;
  }
}

@media (min-width: 1024px) {
  .uploader {
    margin-block: 35px;
  }

  .resItem {
    min-height: 350px;
  }

  .file-container {
    min-height: 350px;
    padding-inline: 20px;
    /* background-color: rgba(245, 245, 245, 0.1); */
  }

  .filesContainer {
    margin-top: 10px;
  }

  .filesCard {
    min-height: 800px;
  }

  .filesTab {
    height: calc(100vh - 300px);
    min-height: 450px;
  }

  .custom-back-top {
    position: absolute !important;
    right: 50px;
    /* Adjust as needed */
    bottom: 600px;
    /* Adjust as needed */
  }
}

/* Folder Icon */
.folder-icon {
  z-index: 3;
  height: 170px;
  max-width: 180px;
  margin: -10px 5px;
  filter: drop-shadow(2px 4px 6px rgba(0, 0, 0, 0.3));
  /* 3D Shadow */
}

/* Close Button */
.close-button {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  transition:
    background 0.3s ease,
    transform 0.2s;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.2);
}

/* Folder Title */
.folder-title {
  font-weight: bold;
  align-items: center;
  cursor: context-menu;
}

.folder-title:hover {
  color: hsl(44, 92%, 49%);
}
</style>
