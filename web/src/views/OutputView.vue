<template>
  <a-flex vertical class="outputContainer" gap="middle">
    <a-card hoverable>
      <!-- Search Section -->
      <a-row justify="center">
        <a-auto-complete
          v-model:value="searchItem"
          :options="searchOptions"
          style="width: 90%; padding-top: 10px"
          auto-size
          :filter-option="filterOption"
          ><a-input-search
            enter-button
            @search="handleSearch"
            placeholder="Search existing report"
            size="large"
          ></a-input-search
        ></a-auto-complete>
      </a-row>
      <!-- Reports Section -->
      <a-tabs
        v-model:activeKey="resultInfo.result.activeKey"
        centered
        style="width: 100%; margin-top: 10px"
        animated
        size="large"
      >
        <a-tab-pane :key="tabIndex" v-for="(tabItem, tabIndex) in modalityNames">
          <template #tab>
            <i :class="iconNames[tabIndex]"></i>
            {{ tabIndex == 4 ? 'Others' : tabIndex == 3 ? 'Voice' : tabItem }}
          </template>
          <!-- Reports Board -->
          <div
            v-if="
              resultInfo.result.generatedReports.filter(
                (item) => item.modality === tabItem.toLowerCase()
              ).length > 0 ||
              resultInfo.result.generating.filter((item) => item.modality === tabItem.toLowerCase())
                .length > 0
            "
            class="res-card-container"
          >
            <div
              v-if="showItem && searchItem"
              class="cardContainerStyle"
              v-for="(item1, index1) in showItem.filter(
                (item) => item.modality === tabItem.toLowerCase()
              )"
              :key="index1"
            >
              <a-card size="small" hoverable>
                <template #cover>
                  <i
                    class="bi bi-x-square"
                    style="
                      display: flex;
                      flex-direction: row-reverse;
                      padding: 5px;
                      font-size: 18px;
                    "
                    @click="deleteReport(item1)"
                  ></i>
                  <a-qrcode
                    style="margin: 5px auto"
                    error-level="H"
                    :value="`${API.api}/scan/${item1.id}/report`"
                    icon="./src/assets/favicon.png"
                  />
                </template>
                <template #actions>
                  <FundViewOutlined
                    key="open"
                    @click="
                      openHtml(
                        resultInfo.result.generatedReports.filter(
                          (item2) => item2.id == item1.id
                        )[0]
                      )
                    "
                  />
                  <InfoCircleOutlined
                    key="info"
                    @click="
                      openReportInfo(item1)
                    "
                  />
                  <DownloadOutlined
                    key="download"
                    @click="
                      downloadHtml(
                        resultInfo.result.generatedReports.filter(
                          (item2) => item2.id == item1.id
                        )[0]
                      )
                    "
                  />
                </template>
                <a-card-meta
                  style="
                    height: 46px;
                    margin-top: -10px;
                    margin-bottom: -10px;
                    margin-left: -10px;
                    text-align: center;
                    line-height: 18px;
                  "
                >
                  <template #title
                    >{{ item1.name?.toUpperCase() }}
                    <!-- <i class="bi bi-info-circle" @click="openReportInfo(item1)"></i> -->
                  </template>
                  <template #description>
                    <p style="margin-left: 0px">
                      {{
                        item1.num > 0
                          ? `Engine: ${item1.engine ? item1.engine.toLowerCase() : 'Default'} | Data: ${item1.num}`
                          : item1.modified.substring(5, 19)
                      }}
                    </p>
                  </template>
                </a-card-meta>
              </a-card>
            </div>
            <div
              v-else
              class="cardContainerStyle"
              v-for="(item, index) in resultInfo.result.generatedReports.filter(
                (item) => item.modality === tabItem.toLowerCase()
              )"
              :key="index"
            >
            <a-tooltip>
              <template #title>{{ new Date(resultInfo.result.generatedReports.filter((item2) => item2.id == item.id)[0].modified).toLocaleString() }}</template>
                <a-card size="small">
                  <template #cover>
                    <i
                      class="bi bi-x-square"
                      style="
                        display: flex;
                        flex-direction: row-reverse;
                        padding: 5px;
                        font-size: 18px;
                      "
                      @click="deleteReport(item)"
                    ></i>
                    <a-qrcode
                      style="margin: 5px auto"
                      error-level="H"
                      :value="`${API.api}/scan/${item.id}/report`"
                      icon="./src/assets/favicon.png"
                    />
                  </template>
                  <template #actions>
                    <FundViewOutlined
                      key="open"
                      @click="
                        openHtml(
                          resultInfo.result.generatedReports.filter((item2) => item2.id == item.id)[0]
                        )
                      "
                    />
                    <InfoCircleOutlined
                      key="info"
                      @click="
                        openReportInfo(resultInfo.result.generatedReports.filter((item2) => item2.id == item.id)[0])
                      "
                    />
                    <DownloadOutlined
                      key="download"
                      @click="
                        downloadHtml(
                          resultInfo.result.generatedReports.filter((item2) => item2.id == item.id)[0]
                        )
                      "
                    />
                  </template>
                  <a-card-meta
                    style="
                      height: 25px;
                      margin-top: -10px;
                      margin-bottom: -10px;
                      margin-left: -10px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #title
                      >ID: {{ item.name?.toUpperCase() }}
                      <!-- <i class="bi bi-info-circle" @click="openReportInfo(item)"></i> -->
                    </template>
                    <template #description>
                      <p style="margin-left: 0px">
                        {{
                          item.num > 0
                            ? `Engine: ${item.engine ? item.engine.toUpperCase() : 'Default'} | Data: ${item.num}`
                            : item.modified.substring(5, 19)
                        }}
                      </p>
                    </template>
                  </a-card-meta>
                </a-card>
              </a-tooltip>
            </div>
            <div
              v-if="resultInfo.result.generating.length > 0"
              class="cardContainerStyle"
              v-for="(item, index) in resultInfo.result.generating.filter(
                (item) => item.modality === tabItem.toLowerCase()
              )"
              :key="index"
            >
              <a-spin size="middle" tip="Generating...">
                <a-card size="small">
                  <template #cover>
                    <i
                      class="bi bi-x-square"
                      style="
                        display: flex;
                        flex-direction: row-reverse;
                        padding: 5px;
                        font-size: 18px;
                      "
                    ></i>
                    <a-qrcode
                      style="margin: 5px auto"
                      error-level="H"
                      icon="./src/assets/favicon.png"
                    />
                  </template>
                  <template #actions>
                    <BarChartOutlined key="open" />
                    <DownloadOutlined key="download" />
                  </template>
                  <a-card-meta
                    style="
                      height: 28px;
                      margin-top: -10px;
                      margin-bottom: -10px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #description>
                      {{
                        item.num > 0
                          ? `${item.engine ? item.engine : item.modality.substring(0, 6)}  | Num:${item.num}`
                          : item.modality
                      }}</template
                    >
                  </a-card-meta>
                </a-card>
              </a-spin>
            </div>
            <div
              class="cardContainerStyle"
              v-if="
                resultInfo.result.generatedReport.id.length > 0 &&
                resultInfo.result.generatedReport.html.length == 0 &&
                resultStatus.result == 1 &&
                tabItem.toLowerCase() == 'generated'
              "
            >
              <a-spin size="middle" tip="Generating...">
                <a-card size="small">
                  <template #cover>
                    <i
                      class="bi bi-x-square"
                      style="
                        display: flex;
                        flex-direction: row-reverse;
                        padding: 5px;
                        font-size: 18px;
                      "
                    ></i>
                    <a-qrcode
                      style="margin: 5px auto"
                      error-level="H"
                      icon="./src/assets/favicon.png"
                    />
                  </template>
                  <template #actions>
                    <BarChartOutlined key="open" />
                    <DownloadOutlined key="download" />
                  </template>
                  <a-card-meta
                    style="
                      height: 28px;
                      margin-top: -10px;
                      margin-bottom: -10px;
                      text-align: center;
                      line-height: 18px;
                    "
                  >
                    <template #title
                      >{{ resultInfo.result.generatedReport.id.substring(0, 5).toUpperCase() }}
                      <i class="bi bi-info-circle"></i>
                    </template>
                  </a-card-meta>
                </a-card>
              </a-spin>
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
    </a-card>
    <!-- Stop Task Section -->
    <a-row justify="center" style="margin-block: 10px">
      <a-col :span="8">
        <a-button
          style="width: 100%; height: 100%; min-width: 200px"
          :disabled="resultStatus.result != 1"
          size="large"
          danger
          @click="stopReportTask"
        >
          <i class="bi bi-stop-circle" style="font-size: 18px; margin-inline: 5px"></i>
          Stop
        </a-button>
      </a-col>
    </a-row>
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { ref, computed, onMounted } from 'vue'
import { DownloadOutlined, FundViewOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { h } from 'vue'
import { notification } from 'ant-design-vue'

const openNotificationWithIcon = (type: string) => {
  if (type === 'stop') {
    notification['success']({
      message: 'Stop Task',
      description: 'Stop current running task successful.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'delete') {
    notification['success']({
      message: 'Delete Item',
      description: 'Delete selected item successful.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'error') {
    notification['error']({
      message: 'Action Failed',
      description: 'Current operation failed. Please check your input and try again.',
      placement: 'top',
      duration: 1
    })
  }
}

const API = useApi()
const resultStatus = useStatus()
const resultInfo = ref(useInfo())
const iconNames = [
  'bi bi-person-bounding-box',
  'bi bi-fingerprint',
  'bi bi-eye',
  'bi bi-soundwave',
  'bi bi-filetype-csv'
]
const modalityNames = ['Face', 'Fingerprint', 'Iris', 'Speech', '']
//No need to handle pending Tasks, because the task will be added to datasetIds when it is done in Process interval

const searchItem = ref(null)
const showItem = ref(null)
const searchOptions = computed(() => {
  return resultInfo.value.result.generatedReports.map((item) => {
    return {
      value: item.id,
      label: item.id
    }
  })
})
interface Option {
  value: string
}

const filterOption = (input: string, option: Option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}

const handleSearch = () => {
  const newitem = resultInfo.value.result.generatedReports.filter((item) =>
    item.id.includes(searchItem.value)
  )
  if (newitem) {
    showItem.value = newitem
    const capitalizedModality =
      newitem[0].modality.charAt(0).toUpperCase() + newitem[0].modality.slice(1)
    const index = modalityNames.indexOf(capitalizedModality)
    if (index != -1) resultInfo.value.result.activeKey = index
  }
}

const tip = computed(() => {
  if (resultStatus.result == 1) {
    return 'Report is generating...'
  } else if (resultStatus.app == 1) {
    return 'Getting data from server...'
  } else {
    return false
  }
})

const stopReportTask = async () => {
  setTimeout(async () => {
    if (resultInfo.value.result.generatedReport.id) {
      const url2 = `${API.api}/task/${resultInfo.value.result.generatedReport.id}/cancel?type=report`
      await API.authFetch(url2, {
        method: 'POST',
        headers: { accept: 'application/json' }
      })
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          openNotificationWithIcon('stop')
          resultInfo.value.result.generatedReport = { id: '', blob: new Blob(), html: '' }
        })
        .catch((error) => {
          console.error('Error cancel task:', error)
        })
    } else {
      const cancelTasks = resultInfo.value.result.generating.map((item) => item.tid)
      resultStatus.updateStatus('result', 2)
      resultInfo.value.result.generating = []
      cancelTasks.map(async (item) => {
        const url2 = `${API.api}/task/${item}/cancel?type=report`
        await API.authFetch(url2, {
          method: 'POST',
          headers: { accept: 'application/json' }
        })
          .then((response) => {
            return response.json()
          })
          .then((data) => {
            openNotificationWithIcon('stop')
          })
          .catch((error) => {
            console.error('Error cancel task:', error)
          })
      })
    }
  }, 500)
}

const openReportInfo = (item) => {
  Modal.info({
    title: 'Report Info',
    content: h('div', {}, [
      h('br'),
      h('p', 'Generated: ' + new Date(item.modified).toLocaleString()),
      h('p', 'Modality: ' + `${item.modality ? capitalizeFirstLetter(item.modality) : 'NA'}`),
      h('p', 'Engine: ' + `${item.engine ? item.engine.toUpperCase() : 'NA'}`),
      h('p', 'Data: ' + `${item.num > 0 ? item.num : 'NA'}`),
      h('p', 'Downsample: ' + item.downsample.toString() + '%'),
      h('p', 'Minimal: ' + item.minimal.toString())
    ]),
    closable: true,
    centered: true
  })
}

const deleteReport = async (item) => {
  const url = `${API.api}/scan/${item.id}/report`
  await API.authFetch(url, {
    method: 'DELETE',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        openNotificationWithIcon('error')
        console.error('Error delete report:', response.statusText)
        throw new Error('Failed to delete report')
      }
      return response.text()
    })
    .then((data) => {
      console.log(data)
      openNotificationWithIcon('delete')
      const index = resultInfo.value.result.generatedReports.indexOf(item)
      if (index !== -1) {
        resultInfo.value.result.generatedReports.splice(index, 1)
      }
    })
    .catch((error) => {
      message.error('Error on deleting task report')
      console.error('Error deleting task report:', error)
    })
}

const checkGeneratedReport = async () => {
  try {
    const url = `${API.api}/scan/${resultInfo.value.result.generatedReport.id}/report`
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })

    if (!response.ok) {
      console.error('Error getting task report:', response.statusText)
    }
    const data = await response.text()
    if (!data.includes('not found')) {
      // const blob = new Blob([data], { type: 'text/html' })
      // resultInfo.value.result.generatedReport.blob = blob
      resultInfo.value.result.generatedReport.html = url
      await checkReportDetails(resultInfo.value.result.generatedReport)
      const index = resultInfo.value.result.generatedReports.findIndex(
        (report) => report.id === resultInfo.value.result.generatedReport.id
      )
      // Update or append the generated value to generatedReports
      if (index === -1) {
        resultInfo.value.result.generatedReports.push(resultInfo.value.result.generatedReport)
      } else {
        resultInfo.value.result.generatedReports[index] = resultInfo.value.result.generatedReport
      }
    }
  } catch (error) {
    console.error('Error getting task report:', error)
  }
}

const checkReportDetails = async (item) => {
  const url2 = `${API.api}/task/logs/report`

  await API.authFetch(url2, {
    method: 'GET',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        console.error('Error get report metadata')
      }
      return response.json()
    })
    .then(async (tempData) => {
      if (tempData.length > 0) {
        const data = tempData.filter((tempItem) => tempItem.tid == item.tid)[0]
        if (data) {
          item.minimal = data.options.minimal
          item.downsample = data.options.downsample
            ? data.options.downsample > 0
              ? data.options.downsample * 100
              : 100
            : 100
          item.modified = data.modified
        }
      } else {
        console.log('mo report log')
      }
    })
    .catch((error) => {
      console.error(error)
    })
}

//Update the pending reports
const checkReport = async (item) => {
  try {
    const url = `${API.api}/scan/${item.id}/report`
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (!response.ok) {
      console.log('Error getting task report:', response.statusText)
    }
    const temp = await response.text()
    if (!temp.includes('not found')) {
      const generated = {
        ...item,
        name: item.id.substring(0, 5),
        html: url,
        minimal: false,
        downsample: 100,
        modified: '',
      }
      await checkReportDetails(generated)
      resultInfo.value.result.generating.splice(item, 1)
      const index = resultInfo.value.result.generatedReports.findIndex(
        (report) => report.id === generated.id
      )
      // Update or append the generated value to generatedReports
      if (index === -1) {
        resultInfo.value.result.generatedReports.push(generated)
      } else {
        resultInfo.value.result.generatedReports[index] = generated
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const checkInternalStatus = setInterval(async () => {
  if (resultInfo.value.result.generating.length == 0) {
    resultStatus.updateStatus('result', 2)
    resultInfo.value.process.selectedItems = []
    clearInterval(checkInternalStatus)
  } else {
    for (const item of resultInfo.value.result.generating) {
      resultStatus.updateStatus('result', 1)
      await checkReport(item)
    }
  }
}, 3000)

const checkExternalStatus = setInterval(async () => {
  if (
    resultInfo.value.result.generatedReport.html.length == 0 &&
    resultInfo.value.result.generatedReport.id
  ) {
    resultStatus.updateStatus('result', 1)
    await checkGeneratedReport()
  } else {
    clearInterval(checkExternalStatus)
    resultStatus.updateStatus('result', 2)
  }
}, 3000)

const fetchReport = async (item) => {
  const url = `${API.api}/scan/${item.id}/report`
  const response = await API.authFetch(url, {
    method: 'GET',
    headers: { accept: 'text/html' }
  })
  if (!response.ok) {
    console.error('Error get report')
  }
  const data = await response.text()
  if (!data.includes('{"detail":"Report of')) {
    // const blob = new Blob([data], { type: 'text/html' })
    item.html = url
    // item.blob=blob
    const index = resultInfo.value.result.generatedReports.findIndex(
      (report) => report.id === item.id
    )
    // Update or append the generated value to generatedReports
    if (index === -1) {
      resultInfo.value.result.generatedReports.push(item)
    } else {
      resultInfo.value.result.generatedReports[index] = item
    }
  }
}

const initResultLoad = async () => {
  const url = `${API.api}/task/logs/report`
  await API.authFetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to get report log')
      }
      return response.json()
    })
    .then((data) => {
      data.forEach(async (item) => {
        if (item.status != 0) {
          const newItem = {
            tid: item.tid,
            id: item.collection,
            name: item.collection.substring(0, 5),
            minimal: item.options.minimal,
            downsample:
              item.options.downsample != null && item.options.downsample > 0
                ? item.options.downsample * 100
                : 100,
            modified: item.modified,
            status: item.status,
            modality: item.metadata ? item.metadata.mode : '',
            engine: item.metadata ? item.metadata.engine : '',
            num: item.metadata ? item.metadata.length : 0,
            html: '',
          }
          if (item.status == 2) {
            await fetchReport(newItem)
          } else {
            await checkRunning(newItem)
          }
        }
      })
      resultStatus.updateStatus('app', 2)
    })
    .catch((error) => {
      console.error('Error get report logs:', error)
    })

  console.log('2. get all generated reports:', resultInfo.value.result.generatedReports)
}

const checkRunning = async (newItem) => {
  const url = `${API.api}/task/metadata`
  await API.authFetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      // console.log('=-----',response)
      if (!response.ok) {
        console.log('No running task')
      }
      return response.json()
    })
    .then((data) => {
      console.log(data)
      if (data.type == 'report' && data.tid == newItem.tid) {
        console.log('3. get running report')
        resultInfo.value.result.generating.push(newItem)
      }
    })
    .catch((error) => {
      console.error('Error get running report:', error)
    })
}

//Get more need display reports on current page in every navigation
onMounted(async () => {
  if (
    resultInfo.value.result.generatedReports.length == 0 &&
    resultInfo.value.result.generating.length == 0
  ) {
    resultStatus.updateStatus('app', 1)
    initResultLoad()
  }
})

//Tool to open the html file in new tab
const openHtml = (item) => {
  // Create a URL for the blob
  const url = item.html

  // Open the URL in a new window
  window.open(url, '_blank')
}

//Tool to download the html file
const downloadHtml = async (item) => {
  console.log('downloadHtml', item.html)
  item.blob = await generateReportBlob(item.id)
  const url = URL.createObjectURL(item.blob)

  // Create a link element
  const downloadLink = document.createElement('a')

  // Set the download link attributes
  downloadLink.href = url
  // downloadLink.download = item.id + '_' + item.modality + '.html'
  downloadLink.download = 'report.html'

  // Append the link to the document body (or any other element)
  document.body.appendChild(downloadLink)

  // Programmatically trigger a click event on the link to start the download
  downloadLink.click()

  // Clean up the URL object after use
  URL.revokeObjectURL(url)

  // Remove the link from the document
  downloadLink.remove()
}

const generateReportBlob = async (id) => {
  const url = `${API.api}/scan/${id}/report`
  const response = await API.authFetch(url, {
    method: 'GET',
    headers: { accept: 'text/html' }
  })
  if (!response.ok) {
    console.error('Error get report')
  }
  const data = await response.text()
  if (!data.includes('{"detail":"Report of')) {
    const blob = new Blob([data], { type: 'text/html' })
    return blob
  }
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
</script>

<style>
.externalButton {
  padding: 0;
  margin-inline: 2px;
  margin-top: 1px;
  align-self: center;
}
.outputContainer {
  width: 80%;
  max-width: 1200px;
  margin-top: 1rem;
}
.resItem {
  margin-top: 1rem;
  height: 500px;
  display: flex;
  flex-wrap: wrap;
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.res-card-container {
  display: flex;
  flex-wrap: wrap;
  margin-top: 1rem;
  height: 500px;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.cardContainerStyle {
  margin: 10px;
  border-radius: 10px;
  border: solid lightgrey 0.5px;
  height: 280px;
  width: 20%;
  min-width: 165px;
  overflow: hidden;
  justify-content: center;
}

i {
  transition: opacity 0.3s ease;
}
@media (max-width: 1024px) {
  i {
    display: none;
  }
}

@media (min-width: 1024px) {
  .resItem {
    min-height: 400px;
  }

  .res-card-container {
    min-height: 400px;
  }
  .outputContainer {
    margin-top: 10px;
  }
}

[data-theme='dark'] {
  .res-card-container {
    background-color: rgba(245, 245, 245, 0.1);
  }
  .resItem {
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
</style>
