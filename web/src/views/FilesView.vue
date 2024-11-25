<template>
  <a-flex vertical class="filesContainer" gap="middle">
    <a-spin
      size="large"
      :spinning="status.files == 1"
      tip="Refreshing data from server..."
      style="margin-top: 10rem"
    >
      <a-card hoverable class="filesCard">
        <!-- Search Section -->
        <a-row justify="center">
          <a-auto-complete
            v-model:value="searchItem"
            style="width: 90%; padding-block: 10px"
            auto-size
            :filter-option="filterOption"
            :options="searchOptions"
          >
            <a-input-search
              enter-button
              placeholder="Search dataset folder"
              size="large"
              allow-clear
              @search="handleSearch"
            ></a-input-search
          ></a-auto-complete>
        </a-row>
        <!-- Files Section -->
        <!-- Files Board -->
        <a-tabs centered animated size="large" v-model:activeKey="currentKey">
          <a-tab-pane class="filesTab" :key="tabIndex" v-for="(tabItem, tabIndex) in foldertype">
            <template #tab>
              <i :class="iconNames[tabIndex]"></i>
              {{ capitalizeFirstLetter(tabItem) }}
            </template>
            <div
              v-if="
                (API.inputTree.filter((item) => item.title == foldertype[0]).length > 0 &&
                  tabIndex == 0) ||
                (API.inputTree.filter((item) => item.title !== foldertype[0]).length > 0 &&
                  tabIndex == 1)
              "
              class="file-container"
            >
              <div
                v-if="showItem?.length > 0 && searchItem"
                class="cardContainerStyle"
                v-for="(item1, index1) in showItem.filter(
                  (item) =>
                    (item.value.includes('data/uploaded/') && currentKey == 0) ||
                    (!item.value.includes('data/uploaded/') && currentKey == 1)
                )"
                :key="index1"
              >
                <a-card size="small">
                  <template #cover>
                    <a-button
                      style="
                        position: relative;
                        top: 5px;
                        left: 165px;
                        display: flex;
                        padding: 5px;
                        width: fit-content;
                        height: fit-content;
                        font-size: 15px;
                        align-items: center;
                        justify-content: center;
                      "
                      @click="
                      showDeleteConfirm(
                          tabIndex,
                          API.inputTree.findIndex((item) => item.title == tabItem),
                          item1.value
                        )
                      "
                    >
                      <CloseOutlined />
                    </a-button>
                    <a-tooltip :title="item1?.title">
                      <img
                        style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                        src="../assets/folder.png"
                        alt="folder image"
                        @click="handleGoToFolder(item1.value)"
                      />
                    </a-tooltip>
                  </template>
                  <template #actions>
                    <a-button @click="handleGoToFolder(item1.value)"
                      ><i class="bi bi-info-square" style="margin-right: 5px; font-size: 15px"></i>
                      View Dataset</a-button
                    >
                  </template>
                  <a-card-meta
                    style="
                      height: 30px;
                      margin-bottom: -10px;
                      padding-inline: 5px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #title>{{ item1.title }} </template>
                  </a-card-meta>
                </a-card>
              </div>
              <div
                v-else-if="tabIndex == 0"
                class="cardContainerStyle"
                v-for="(item, index) in API.inputTree.filter((item) => item.title == tabItem)[0]
                  ?.children"
                :key="index"
              >
                <a-card size="small">
                  <template #cover>
                    <a-button
                      style="
                        position: relative;
                        top: 5px;
                        left: 165px;
                        display: flex;
                        padding: 5px;
                        width: fit-content;
                        height: fit-content;
                        font-size: 15px;
                        align-items: center;
                        justify-content: center;
                      "
                      @click="
                        showDeleteConfirm(
                          tabIndex,
                          API.inputTree.findIndex((item) => item.title == tabItem),
                          item.value
                        )
                      "
                    >
                      <CloseOutlined />
                    </a-button>
                    <a-tooltip :title="item?.title">
                      <img
                        style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                        src="../assets/folder.png"
                        alt="folder image"
                        @click="handleGoToFolder(item.value)"
                      />
                    </a-tooltip>
                  </template>
                  <template #actions>
                    <a-tooltip title="View Dataset">
                      <FundViewOutlined key="open" @click="handleGoToFolder(item.value)"
                    /></a-tooltip>
                  </template>
                  <a-card-meta
                    style="
                      height: 40px;
                      margin-bottom: -10px;
                      padding-inline: 5px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #title>{{ item.title }}</template>
                  </a-card-meta>
                </a-card>
              </div>
              <div
                v-else
                class="cardContainerStyle"
                v-for="(item2, index2) in API.inputTree.filter(
                  (item) => item.title !== foldertype[0]
                )"
                :key="index2"
              >
                <a-card size="small">
                  <template #cover>
                    <a-button
                      style="
                        position: relative;
                        top: 5px;
                        left: 165px;
                        display: flex;
                        padding: 5px;
                        width: fit-content;
                        height: fit-content;
                        font-size: 15px;
                        align-items: center;
                        justify-content: center;
                      "
                      @click="
                        showDeleteConfirm(
                          tabIndex,
                          API.inputTree.findIndex((item) => item.title == tabItem),
                          item2.value
                        )
                      "
                    >
                      <CloseOutlined />
                    </a-button>
                    <a-tooltip :title="item2?.title">
                      <img
                        style="z-index: 3; height: 180px; max-width: 180px; margin: -15px auto"
                        src="../assets/folder.png"
                        alt="folder image"
                        @click="handleGoToFolder(item2.value)"
                      />
                    </a-tooltip>
                  </template>
                  <template #actions>
                    <a-button @click="handleGoToFolder(item2.value)"
                      ><span
                        class="bi bi-info-square"
                        style="margin-right: 5px; font-size: 15px"
                      ></span
                      >View Folder</a-button
                    >
                  </template>
                  <a-card-meta
                    style="
                      height: 30px;
                      margin-bottom: -10px;
                      padding-inline: 5px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #title>{{ item2.title }} </template>
                  </a-card-meta>
                </a-card>
              </div>
            </div>
            <!-- Empty Board -->
            <div v-else class="resItem">
              <a-spin size="large" :spinning="tip" :tip="tip">
                <a-empty />
              </a-spin>
            </div>
          </a-tab-pane>
        </a-tabs>
        <!-- </a-spin> -->
        <a-divider />
        <a-spin :spinning="showUploadSpinner">
          <a-flex justify="center" style="margin-block: 2rem">
            <a-upload-dragger
              style="width: 95%; margin: 0 auto"
              name="file"
              :showUploadList="false"
              accept=".zip,.tar,.gz"
              :action="API.api + '/dataset'"
              :withCredentials="true"
              @change="uploadZip"
              @drop="dropZip"
              >Upload dataset from zip file (Click or Drag here)</a-upload-dragger
            >
          </a-flex>
        </a-spin>
      </a-card>
    </a-spin>
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useApi } from '../stores/dataStore.js'
import { ref, computed, onMounted } from 'vue'
import { notification } from 'ant-design-vue'
import { FundViewOutlined, CloseOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'

const iconNames = ['bi bi-cloud-arrow-up', 'bi bi-hdd']

const API = useApi()
const status = useStatus()
const currentKey = ref(0)

const searchItem = ref(null)
// const showItem = ref(null)
const showItem = computed(() => {
  if (searchItem.value) {
    const uploadedChildren =
      API.inputTree[API.inputTree.findIndex((item) => item.title == 'uploaded')]?.children.filter(
        (item) => item.value.toLowerCase().includes(searchItem?.value.toLowerCase())
      ) || [] // In case there are no children or no 'uploaded' item

    const otherItems =
      API.inputTree?.filter(
        (item) =>
          item.title !== 'uploaded' &&
          item.value.toLowerCase().includes(searchItem?.value.toLowerCase())
      ) || [] // In case inputTree is empty or undefined

    return uploadedChildren.concat(otherItems)
  }
})
const foldertype = ['uploaded', 'local']

const tip = computed(() => {
  if (status.app == 1 || status.files == 1) {
    return 'Getting data from server...'
  } else {
    return false
  }
})
const searchOptions = computed(() => {
  const uploadedChildren =
    API.inputTree[API.inputTree.findIndex((item) => item.title == 'uploaded')]?.children.map(
      (item) => {
        return {
          value: item.value,
          label: item.value
        }
      }
    ) || [] // In case the 'uploaded' item doesn't exist or has no children

  const otherItems =
    API.inputTree
      ?.filter((item) => item.title !== 'uploaded')
      .map((item) => {
        return {
          value: item.value,
          label: item.value
        }
      }) || [] // In case inputTree is empty or undefined

  // Concatenate both results
  return uploadedChildren.concat(otherItems)
})

const handleSearch = () => {
  if (showItem.value) {
    console.log(showItem.value, searchItem.value)
    const index = API.inputTree.findIndex((item) => item.value == showItem?.value[0]?.value)
    if (index != -1) currentKey.value = 1
    else currentKey.value = 0
  }
}

interface Option {
  value: string
}

const filterOption = (input: string, option: Option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}

const openNotificationWithIcon = (type: string) => {
  if (type === 'delete') {
    notification['success']({
      message: 'Delete Item',
      description: 'Delete selected folder successful.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'error') {
    notification['error']({
      message: 'Action Failed',
      description: 'Current operation failed. Please try again.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'upload') {
    notification['success']({
      message: 'Upload Zip Folder To Server',
      description: 'Upload zip folder to server successful.',
      placement: 'top'
    })
  } else if (type === 'invalid') {
    notification['warning']({
      message: 'Can not Delete Item',
      description: 'Can not delete non-Uploaded folder.',
      placement: 'top',
      duration: 3
    })
  }else if (type === 'notZip') {
    notification['error']({
      message: 'Dropped File Is Not Zip Folder',
      description: 'Please select Zip folder.',
      placement: 'top'
    })
  }
}

const dropZip = (e) => {
  // console.log(e.dataTransfer.files[0])
  if(e.dataTransfer.files[0].type!=='application/zip'){
    openNotificationWithIcon('notZip')
  }
}
const showUploadSpinner = ref(false)
const uploadZip = async (e) => {
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
      console.log(res)
      openNotificationWithIcon('upload')
      await checkInputFolder()
    }
  }
}

function showDeleteConfirm(tabIndex, rootIndex, item) {
  Modal.confirm({
    title: 'Are you sure you want to delete this folder?',
    icon: h(ExclamationCircleOutlined),
    content: 'Files in the folder will be deleted and cannot be restored.',
    okType: 'danger',
    centered: true,
    okText: 'Delete',
    async onOk() {
      console.log('OK')
      try {
        await deleteFolder(tabIndex, rootIndex, item)
        return Promise.resolve()
      } catch (error) {
        console.log('Oops, errors!', error)
        return Promise.reject(error)
      }
    },
    onCancel() {
      console.log('Cancel')
    }
  })
}

const deleteFolder = async (tabIndex, rootIndex, item) => {
  status.updateStatus('files', 1)
  console.log(rootIndex, item)
  if (tabIndex != 0) {
    status.updateStatus('files', 0)
    openNotificationWithIcon('invalid')
    return
  }
  const url = `${API.api}/dataset`
  try {
    const data = await API.authFetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(item), // Ensure this matches what the backend expects
      mode: 'cors'
    })

    console.log(data)
    openNotificationWithIcon('delete')
    status.updateStatus('files', 2)
    const index = API.inputTree[rootIndex].children.findIndex((x) => x.value === item)
    if (index !== -1) {
      API.inputTree[rootIndex].children.splice(index, 1)
    }
  } catch (error) {
    openNotificationWithIcon('error')
    status.updateStatus('files', 0)
    console.error('Error deleting folder:', error)
  }
}

const handleGoToFolder = (item) => {
  const linkToFolder = API.api + '/warehouse/' + item + '/'
  window.open(linkToFolder, '_blank')
}

const checkInputFolder = async () => {
  // console.log('1')
  status.updateStatus('files', 1)
  try {
    const data = await API.authFetch(`${API.api}/task/inputs/folders`, {
      method: 'GET'
    })
    if (data) {
      API.updateInputFolder(data)
      API.updateInputTree(data)
      status.updateStatus('files', 2)
      // console.log('2')
    }
  } catch (error) {
    status.updateStatus('files', -1)
    console.error('the API can not be reach', error)
  }
}

onMounted(async () => {
  if (API.inputTree.length > 0) {
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
</script>

<style>
.folder-icon {
  position: relative;
  width: 200px;
  height: 150px;
}

.folder-image {
  width: 100%;
  height: auto;
}

.thumbnails {
  display: flex;
  position: absolute;
  top: 20px;
  left: 20px;
}

.thumbnail {
  width: 40px;
  height: 40px;
  object-fit: cover;
  margin-right: 5px;
}

.filesContainer {
  width: 80%;
  max-width: 1200px;
  margin-top: 1rem;
}

.filesCard {
  width: 100%;
  overflow: hidden;
  min-height: 750px;
  height: calc(100vh - 250px);
}
.filesTab {
  margin-block: 1rem;
  display: flex;
  width: 100%;
  height: calc(100vh - 600px);
  min-height: 425px;
}

.file-container {
  display: flex;
  flex-wrap: wrap;
  margin-block: 1rem;
  padding-inline: 35px;
  padding-block: 1rem;
  height: 100%;
  width: 100%;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.resItem {
  margin-block: 1rem;
  height: 100%;
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.cardContainerStyle {
  margin: 10px;
  border-radius: 10px;
  border: solid lightgrey 0.5px;
  height: 280px;
  width: 200px;
  overflow: hidden;
  justify-content: center;
}

i {
  transition: opacity 0.3s ease;
}

[data-theme='dark'] {
  .resItem {
    background-color: rgba(245, 245, 245, 0.1);
  }
  .file-container {
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
  .resItem {
    min-height: 500px;
  }

  .file-container {
    min-height: 400px;
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
    height: calc(100vh - 600px);
    min-height: 450px;
  }
}
</style>
