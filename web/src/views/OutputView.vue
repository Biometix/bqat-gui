<template>
  <a-flex vertical class="outputContainer" gap="middle">
    <a-spin size="large" :spinning="resultStatus.app == 1" tip="Getting data from server..." style="margin-top: 10rem">
      <a-card hoverable class="outputCard">
        <!-- Search Section -->
        <a-row justify="center">
          <a-auto-complete v-model:value="searchItem" :options="searchOptions" style="width: 90%; padding-block: 10px"
            auto-size :filter-option="filterOption"><a-input-search enter-button @search="handleSearch"
              placeholder="Search EDA report" size="large" allow-clear></a-input-search></a-auto-complete>
        </a-row>
        <!-- Reports Section -->

        <a-tabs v-model:activeKey="resultInfo.result.activeKey" centered animated size="large" class="outputTabs">
          <a-tab-pane class="outputTab" :key="tabIndex" v-for="(tabItem, tabIndex) in modalityNames">
            <template #tab>
              <i :class="iconNames[tabIndex]"></i>
              {{ tabIndex == 4 ? 'Others' : tabIndex == 3 ? 'Voice' : tabItem }}
              <a-badge size="small" :count="resultInfo.result.generating.filter(
                (item) => item.modality.toLowerCase() == tabItem.toLowerCase()
              ).length
                  ? resultInfo.result.generating.filter(
                    (item) => item.modality.toLowerCase() == tabItem.toLowerCase()
                  ).length
                  : tabIndex == 4 &&
                    resultStatus.result == 1 &&
                    resultInfo.result.generatedReport.id.length > 0 &&
                    resultInfo.result.generatedReport.html.length == 0
                    ? 1
                    : 0
                " :overflow-count="5" />
            </template>
            <!-- Reports Board -->
            <div :ref="'outputTabRef' + tabIndex" v-if="
              resultInfo.result.generatedReports.filter(
                (item) => item.modality.toLowerCase() === tabItem.toLowerCase()
              ).length > 0 ||
              resultInfo.result.generating.filter(
                (item) => item.modality.toLowerCase() === tabItem.toLowerCase()
              ).length > 0
            " class="res-card-container">
              <div v-if="showItem && searchItem" class="cardContainerStyle" v-for="(item1, index1) in showItem.filter(
                (item) => item.modality.toLowerCase() === tabItem.toLowerCase()
              )" :key="index1">
                <a-card size="small" hoverable>
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
                      " class="close-button" @click="showDeleteConfirm(item1)">
                      <CloseOutlined />
                    </a-button>
                    <a-qrcode style="margin-top: 35px; margin-inline: auto" error-level="H"
                      :value="`${API.api}/scan/${item1.id}/report`" icon="./src/assets/favicon.png" />
                  </template>
                  <template #actions>
                    <a-tooltip title="View Report">
                      <FundViewOutlined key="open" @click="
                        openHtml(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item1.id
                          )[0]
                        )
                        " style="font-size: 17px" />
                    </a-tooltip>
                    <a-tooltip title="Report Info">
                      <InfoCircleOutlined key="info" @click="openReportInfo(item1)" style="font-size: 17px" />
                    </a-tooltip>
                    <a-tooltip title="Download Report">
                      <DownloadOutlined key="download" @click="
                        downloadHtml(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item1.id
                          )[0]
                        )
                        " style="font-size: 17px" />
                    </a-tooltip>
                  </template>
                  <a-card-meta style="
                      height: 25px;
                      margin-top: 0px;
                      margin-bottom: 0px;
                      margin-left: -10px;
                      text-align: center;
                      line-height: 20px;
                    ">
                    <template #title>{{ item1.name?.toUpperCase() }}
                      <!-- <i class="bi bi-info-circle" @click="openReportInfo(item1)"></i> -->
                    </template>
                  </a-card-meta>
                </a-card>
              </div>
              <div v-else class="cardContainerStyle" v-for="(item, index) in (resultInfo.result.generating || [])
                .concat(
                  resultInfo.result.generatedReport?.id &&
                    !resultInfo.result.generatedReport?.html
                    ? [resultInfo.result.generatedReport].concat(
                      resultInfo.result.generatedReports || []
                    )
                    : resultInfo.result.generatedReports || []
                )
                .filter((item) => item.modality.toLowerCase() === tabItem.toLowerCase())" :key="index">
                <a-spin v-if="
                  resultStatus.result == 1 &&
                  tabItem.toLowerCase() == '' &&
                  item?.id &&
                  item.id.length > 0 &&
                  !item?.html
                " size="middle" tip="Generating...">
                  <a-card size="small">
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
                        " class="close-button">
                        <CloseOutlined />
                      </a-button>
                      <a-qrcode style="margin-top: 35px; margin-inline: auto" error-level="H"
                        icon="./src/assets/favicon.png" />
                    </template>
                    <template #actions>
                      <FundViewOutlined key="open" style="font-size: 17px" />
                      <InfoCircleOutlined key="info" style="font-size: 17px" />
                      <DownloadOutlined key="download" style="font-size: 17px" />
                    </template>
                    <a-card-meta style="
                        height: 25px;
                        margin-top: 0px;
                        margin-bottom: 0px;
                        margin-left: -10px;
                        text-align: center;
                        line-height: 20px;
                      ">
                      <template #title>{{ resultInfo.result.generatedReport.id.substring(0, 5).toUpperCase() }}
                        <i class="bi bi-info-circle"></i>
                      </template>
                    </a-card-meta>
                  </a-card>
                </a-spin>
                <a-spin v-else-if="item.status !== 2" size="middle" tip="Generating...">
                  <a-card size="small">
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
                        " class="close-button">
                        <CloseOutlined />
                      </a-button>
                      <a-qrcode style="margin-top: 35px; margin-inline: auto" error-level="H"
                        icon="./src/assets/favicon.png" />
                    </template>
                    <template #actions>
                      <FundViewOutlined key="open" style="font-size: 17px" />
                      <InfoCircleOutlined key="info" style="font-size: 17px" />
                      <DownloadOutlined key="download" style="font-size: 17px" />
                    </template>
                    <a-card-meta style="
                        height: 25px;
                        margin-top: 0px;
                        margin-bottom: 0px;
                        margin-left: -10px;
                        text-align: center;
                        line-height: 20px;
                      ">
                    </a-card-meta>
                  </a-card>
                </a-spin>
                <a-card v-else size="small">
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
                      " class="close-button" @click="showDeleteConfirm(item)">
                      <CloseOutlined />
                    </a-button>
                    <a-tooltip>
                      <template #title>{{
                        formatDate(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item.id
                          )[0].modified
                        )
                      }}</template>
                      <a-qrcode style="margin-top: 35px; margin-inline: auto" error-level="H"
                        :value="`${API.api}/scan/${item.id}/report`" icon="./src/assets/favicon.png" /></a-tooltip>
                  </template>
                  <template #actions>
                    <a-tooltip title="View Report">
                      <FundViewOutlined key="open" @click="
                        openHtml(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item.id
                          )[0]
                        )
                        " style="font-size: 17px" />
                    </a-tooltip>
                    <a-tooltip title="Report Info">
                      <InfoCircleOutlined key="info" @click="
                        openReportInfo(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item.id
                          )[0]
                        )
                        " style="font-size: 17px" />
                    </a-tooltip>
                    <a-tooltip title="Download Report">
                      <SyncOutlined v-if="getHtml == item.id" spin style="font-size: 17px" />
                      <DownloadOutlined v-else key="download" @click="
                        downloadHtml(
                          resultInfo.result.generatedReports.filter(
                            (item2) => item2.id == item.id
                          )[0]
                        )
                        " style="font-size: 17px" />
                    </a-tooltip>
                  </template>
                  <a-card-meta style="
                      height: 25px;
                      margin-top: 0px;
                      margin-bottom: 0px;
                      margin-left: -10px;
                      text-align: center;
                      line-height: 20px;
                    ">
                    <template #title>ID: {{ item.name?.toUpperCase() }}
                      <!-- <i class="bi bi-info-circle" @click="openReportInfo(item)"></i> -->
                    </template>
                    <!-- <template #description>
                      <p style="margin-left: 0px">
                        {{
                          item.num > 0
                            ? `Engine: ${item.engine ? item.engine.toUpperCase() : 'Default'} | Data: ${item.num}`
                            : item.modified.substring(5, 19)
                        }}
                      </p>
                    </template> -->
                  </a-card-meta>
                </a-card>
              </div>
              <!-- <div
                class="cardContainerStyle"
                v-if="
                  resultInfo.result.generatedReport.id.length > 0 &&
                  resultInfo.result.generatedReport.html.length == 0 &&
                  resultStatus.result == 1 &&
                  tabItem.toLowerCase() == ''
                "
              >
                <a-spin size="middle" tip="Generating...">
                  <a-card size="small">
                    <template #cover>
                      <a-button
                        style="
                          position: relative;
                          top: 5px;
                          left: 170px;
                          display: flex;
                          width: fit-content;
                          height: fit-content;
                          font-size: 13px;
                          align-items: center;
                          justify-content: center;
                        "
                      >
                        <CloseOutlined />
                      </a-button>
                      <a-qrcode
                        style="margin: 5px auto"
                        error-level="H"
                        icon="./src/assets/favicon.png"
                      />
                    </template>
                    <template #actions>
                      <FundViewOutlined key="open" />
                      <InfoCircleOutlined key="info" />
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
              </div> -->
            </div>
            <!-- Empty Board -->
            <div v-else :ref="'outputTabRef' + tabIndex" class="resItem">
              <!-- <a-spin size="large" :spinning="tip" :tip="tip"> -->
              <a-empty />
              <!-- </a-spin> -->
            </div>
          </a-tab-pane>
        </a-tabs>
        <a-float-button v-if="showBackTop" @click="backTop" class="custom-back-top2">
          <template #icon>
            <VerticalAlignTopOutlined />
          </template>
        </a-float-button>
        <!-- <a-back-top :target="() => document.querySelector('.outputTab')" :visibility-height="0" class="custom-back-top2" /> -->
        <!-- <a-divider /> -->
        <!-- Stop Task Section -->
        <a-row justify="center" class="stopClass">
          <a-col :span="8">
            <a-button style="width: 100%; height: 100%; min-width: 200px"
              :disabled="resultStatus.result != 1 || getStop" size="large" danger @click="stopReportTask"
              :loading="getStop">
              <i v-if="!getStop" class="bi bi-stop-circle" style="font-size: 18px; margin-inline: 5px"></i>
              Stop
            </a-button>
          </a-col>
        </a-row>
      </a-card>
    </a-spin>
    <!-- <a-modal       
      :open="dataVisualize"
      style="width:100%; max-width:1600px; justify-content: center; align-items: center;"
      wrap-class-name="full-modal" @cancel="()=>{dataVisualize=false}">
      <template #footer>
        <a-button key="submit" type='primary' @click="()=>{dataVisualize=false}">Download</a-button>
        </template>
        <template #title>
          <h3 style="text-align: center; margin-top:10px">Data Visualiser</h3>
        </template>
      <DataVisualiser/>
    </a-modal> -->
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { ref, computed, onMounted, h, onUnmounted } from 'vue'
import {
  SyncOutlined,
  DownloadOutlined,
  FundViewOutlined,
  InfoCircleOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { Modal, Descriptions } from 'ant-design-vue'
import { notification } from 'ant-design-vue'
import { ExclamationCircleOutlined, VerticalAlignTopOutlined } from '@ant-design/icons-vue'
import { parseFusionCode } from '../components/utils.ts'
const outputTabRef0 = ref(null)
const outputTabRef1 = ref(null)
const outputTabRef2 = ref(null)
const outputTabRef3 = ref(null)
const outputTabRef4 = ref(null)
// Add this to your script setup
const showBackTop = ref(false)

onMounted(() => {
  const tabs = document.querySelectorAll('.outputTab')
  tabs.forEach((tab) => {
    tab.addEventListener('scroll', (event) => {
      const target = event.target as HTMLElement
      const scrollTop = target.scrollTop
      showBackTop.value = scrollTop > 100 // Adjust threshold as needed
    })
  })
})

onUnmounted(() => {
  const tabs = document.querySelectorAll('.outputTab')
  tabs.forEach((tab) => {
    tab.removeEventListener('scroll', () => { })
  })
})

const backTop = () => {
  const index = resultInfo.value.result.activeKey
  let refElement = outputTabRef0.value?.[0]?.closest('.outputTab')
  switch (index) {
    case 0:
      refElement = outputTabRef0.value?.[0]?.closest('.outputTab')
      break
    case 1:
      refElement = outputTabRef1.value?.[0]?.closest('.outputTab')
      break
    case 2:
      refElement = outputTabRef2.value?.[0]?.closest('.outputTab')
      break
    case 3:
      refElement = outputTabRef3.value?.[0]?.closest('.outputTab')
      break
    case 4:
      refElement = outputTabRef4.value?.[0]?.closest('.outputTab')
      break

    default:
      refElement = outputTabRef0.value?.[0]?.closest('.outputTab')
      break
  }
  // console.log(refElement)
  if (refElement) {
    refElement.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
import DataVisualiser from '../components/DataVisualiser.vue'

const openNotificationWithIcon = (type: string, error = '') => {
  if (type === 'stop') {
    notification['success']({
      message: 'Task Stopped',
      description: 'The current running task has been stopped successfully.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'delete') {
    notification['success']({
      message: 'Item Deleted',
      description: 'The selected item has been deleted successfully.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'error') {
    notification['error']({
      message: 'Action Failed',
      description: 'The operation failed. Please check your input and try again.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'reportError') {
    notification['error']({
      message: 'Report Generation Failed',
      description: error || 'An error occurred while generating the report. Please try again.',
      placement: 'top',
      duration: 1
    })
  } else if (type === 'noReport') {
    notification['error']({
      message: 'Report Not Found',
      description: 'The report generation has not been started.',
      placement: 'top',
      duration: 1
    })
  }
}

const dataVisualize = ref(false)
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
const showItem = computed(() => {
  if (searchItem.value) {
    const newitem = resultInfo.value.result.generatedReports.filter((item) =>
      item.id.toUpperCase().includes(searchItem?.value.toUpperCase())
    )
    return newitem
  }
})

const searchOptions = computed(() => {
  return resultInfo.value.result.generatedReports.map((item) => {
    return {
      value: item.id,
      label: item.id
    }
  })
})

const getStop = ref(false)

interface Option {
  value: string
}

const filterOption = (input: string, option: Option) => {
  return option.value.toUpperCase().indexOf(input.toUpperCase()) >= 0
}

const handleSearch = () => {
  if (showItem.value) {
    const capitalizedModality =
      showItem.value[0].modality.charAt(0).toUpperCase() + showItem.value[0].modality.slice(1)
    const index = modalityNames.indexOf(capitalizedModality)
    if (index != -1) resultInfo.value.result.activeKey = index
  }
}

const tip = computed(() => {
  if (resultStatus.result == 1) {
    return 'Report is generating...'
  } else {
    return false
  }
})

const stopReportTask = async () => {
  getStop.value = true
  setTimeout(async () => {
    if (resultInfo.value.result.generatedReport.id) {
      // const url2 = `${API.api}/task/cancel/${resultInfo.value.result.generatedReport.id}?type=report`
      const url2 = `${API.api}/task/cancel`
      try {
        const data = await API.authFetch(url2, {
          method: 'POST',
          headers: { accept: 'application/json' }
        })

        resultStatus.updateStatus('result', 2)
        openNotificationWithIcon('stop')
        resultInfo.value.result.generatedReport = {
          id: '',
          blob: new Blob(),
          html: ''
        }
        getStop.value = false
      } catch (error) {
        console.error('Error cancel task:', error)
        getStop.value = false
      }
    } else {
      // const cancelTasks = resultInfo.value.result.generating.map((item) => item.tid)
      resultInfo.value.result.generating = []
      // cancelTasks.map(async (item) => {
      // const url2 = `${API.api}/task/cancel/${item}?type=report`
      const url2 = `${API.api}/task/cancel`
      try {
        const data = await API.authFetch(url2, {
          method: 'POST',
          headers: { accept: 'application/json' }
        })

        if (data) {
          console.log(data)
          resultStatus.updateStatus('result', 2)
          openNotificationWithIcon('stop')
          getStop.value = false
        }
      } catch (error) {
        console.error('Error cancel task:', error)
        getStop.value = false
      }
    }
  }, 500)
}

const openReportInfo = (item) => {
  Modal.info({
    title: 'Report Info',
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
          h(Descriptions.Item, { label: 'Generated' }, () => formatDate(item.modified)),
          h(Descriptions.Item, { label: 'Modality' }, () => `${item.modality ? capitalizeFirstLetter(item.modality) : 'NA'}`),
          h(Descriptions.Item, { label: 'Engine' }, () => `${item.engine
              ? item.engine == 'fusion'
                ? 'Fusion (' +
                parseFusionCode(item.fusion)
                  .map((item) => item.toUpperCase())
                  .join(', ') +
                ')'
                : item.engine.toUpperCase()
              : 'NA'
            }`),
          h(Descriptions.Item, { label: 'Data' }, () => `${item.num > 0 ? item.num : 'NA'}`),
          h(Descriptions.Item, { label: 'Downsample' }, () => `${item.downsample}%`),
          h(Descriptions.Item, { label: 'Minimal' }, () => item.minimal.toString()),
        ]
      })
    ]),
    closable: true,
    centered: true
  })
}

function showDeleteConfirm(item) {
  Modal.confirm({
    title: 'Are you sure you want to delete this report?',
    icon: h(ExclamationCircleOutlined),
    content: 'The report will be deleted and cannot be restored.',
    okType: 'danger',
    centered: true,
    okText: 'Delete',
    async onOk() {
      console.log('OK')
      try {
        await deleteReport(item)
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

const deleteReport = async (item) => {
  resultStatus.updateStatus('app', 1)
  const url = `${API.api}/scan/${item.id}/report`
  try {
    const data = await API.authFetch(url, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    })

    if (data) {
      console.log(data)
      openNotificationWithIcon('delete')
      resultStatus.updateStatus('app', 2)
      const index = resultInfo.value.result.generatedReports.indexOf(item)
      if (index !== -1) {
        resultInfo.value.result.generatedReports.splice(index, 1)
      }
    }
  } catch (error) {
    openNotificationWithIcon('error')
    resultStatus.updateStatus('app', 2)
    console.error('Error deleting task report:', error)
  }
}

const checkGeneratedReport = async () => {
  try {
    const url = `${API.api}/scan/${resultInfo.value.result.generatedReport.id}/report`
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (data && !data.includes('not found')) {
      resultInfo.value.result.generatedReport.html = url
      await checkReportDetails(resultInfo.value.result.generatedReport)
      const index = resultInfo.value.result.generatedReports.findIndex(
        (report) => report.id === resultInfo.value.result.generatedReport.id
      )
      // Update or append the generated value to generatedReports
      if (index === -1) {
        resultInfo.value.result.generatedReports.unshift(resultInfo.value.result.generatedReport)
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
  try {
    const tempData = await API.authFetch(url2, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (tempData && tempData.length > 0) {
      const data = tempData.filter((tempItem) => tempItem.tid == item.tid)[0]
      if (data) {
        item.minimal = data.options.minimal
        item.downsample = data.options.downsample
          ? data.options.downsample > 0
            ? data.options.downsample * 100
            : 100
          : 100
        item.modified = data.modified
        item.status = data.status
      }
      if (data.metadata?.fusion) {
        item.fusion = data.metadata?.fusion
      }
    } else {
      console.log('mo report log')
    }
  } catch (error) {
    console.error(error)
  }
}

//Update the pending reports
const checkReport = async (item) => {
  try {
    const url = `${API.api}/scan/${item.id}/report`
    const temp = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (temp && !temp.includes('not found')) {
      const generated = {
        ...item,
        name: item.id.substring(0, 5),
        html: url,
        minimal: false,
        downsample: 100,
        modified: '',
        fusion: 0
      }
      await checkReportDetails(generated)
      const index1 = resultInfo.value.result.generating.indexOf(item)
      if (index1 > -1) {
        resultInfo.value.result.generating.splice(index1, 1) // Remove from original array
      }
      const index = resultInfo.value.result.generatedReports.findIndex(
        (report) => report.id === generated.id
      )
      // Update or append the generated value to generatedReports
      if (index === -1) {
        resultInfo.value.result.generatedReports.unshift(generated)
      } else {
        resultInfo.value.result.generatedReports[index] = generated
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const checkReportStatus = async () => {
  for (const item of resultInfo.value.result.generating.slice()) {
    resultStatus.updateStatus('result', 1)
    const url = `${API.api}/task/${item.tid}/status`
    try {
      const data = await API.authFetch(url, {
        method: 'GET',
        headers: { accept: 'text/html' }
      })
    } catch (e) {
      console.log('Error getting task status:', e)
      const url2 = `${API.api}/task/logs/report/${item.tid}`
      try {
        const data = await API.authFetch(url2, {
          method: 'GET',
          headers: { accept: 'application/json' }
        })
        if (data) {
          console.log(data)
          if (data[0]?.status == 3 || data[0]?.status == 0) {
            const index = resultInfo.value.result.generating.indexOf(item)
            if (index > -1) {
              resultInfo.value.result.generating.splice(index, 1) // Remove from original array
            }
            openNotificationWithIcon('reportError', data[0]?.status == 3 ? data[0]?.logs[0] : '')
            resultStatus.updateStatus('result', 0)
            clearInterval(checkInternalStatus)
          } else {
            await checkReport(item)
          }
        }
      } catch (error) {
        const index = resultInfo.value.result.generating.indexOf(item)
        if (index > -1) {
          resultInfo.value.result.generating.splice(index, 1) // Remove from original array
        }
        openNotificationWithIcon('reportError', error)
        resultStatus.updateStatus('result', 0)
        console.error(error)
      }
    }
  }
}

const checkOneReportStatus = async (type, item) => {
  resultStatus.updateStatus('result', 1)
  const url = `${API.api}/task/${item.tid}/status`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
  } catch (e) {
    console.log('Error getting task status:', e)
    const url2 = `${API.api}/task/logs/report/${item.tid}`
    try {
      const data = await API.authFetch(url2, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (data) {
        console.log(data)
        if (data[0]?.status == 3) {
          resultInfo.value.result.generating.splice(item, 1)
          openNotificationWithIcon('reportError', data[0]?.logs[0])
          resultStatus.updateStatus('result', 0)
          if (type == 1) {
            clearInterval(checkInternalStatus)
          } else {
            clearInterval(checkExternalStatus)
          }
        } else if (data[0]?.status == 0) {
          resultInfo.value.result.generating.splice(item, 1)
          openNotificationWithIcon('reportError')
          resultStatus.updateStatus('result', 0)
          if (type == 1) {
            clearInterval(checkInternalStatus)
          } else {
            clearInterval(checkExternalStatus)
          }
        } else {
          // resultStatus.updateStatus('result', 2)
          if (type == 1) {
            await checkReport(item)
          } else {
            await checkGeneratedReport()
          }
        }
      }
    } catch (error) {
      resultInfo.value.result.generating.splice(item, 1)
      openNotificationWithIcon('reportError', error)
      resultStatus.updateStatus('result', 0)
      console.error(error)
    }
  }
}

const checkInternalStatus = setInterval(async () => {
  if (resultInfo.value.result.generating.length == 0) {
    resultStatus.updateStatus('result', 2)
    resultInfo.value.process.selectedItems = []
    clearInterval(checkInternalStatus)
  } else {
    await checkReportStatus()
  }
}, 3000)

const checkExternalStatus = setInterval(async () => {
  if (
    resultInfo.value.result.generatedReport.html.length == 0 &&
    resultInfo.value.result.generatedReport.id
  ) {
    await checkOneReportStatus(2, { tid: resultInfo.value.result.generatedReport.id })
  } else {
    clearInterval(checkExternalStatus)
    resultStatus.updateStatus('result', 2)
  }
}, 3000)

const fetchReport = async (item) => {
  const url = `${API.api}/scan/${item.id}/report`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (data && !data.includes('{"detail":"Report of')) {
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
  } catch (error) {
    console.error('Error get report, try second time')
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (data && !data.includes('{"detail":"Report of')) {
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
}

const initResultLoad = async () => {
  const url = `${API.api}/task/logs/report`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data) {
      for (const item of data) {
        if (item.status != 0 && item.status != 3) {
          const newItem = {
            tid: item.tid,
            id: item?.collection,
            name: item?.collection?.substring(0, 5),
            minimal: item.options.minimal,
            downsample:
              item.options.downsample != null && item.options.downsample > 0
                ? item.options.downsample * 100
                : 100,
            modified: item.modified,
            status: item.status,
            modality: item.metadata ? item.metadata.mode : '',
            engine: item.metadata ? item.metadata.engine : '',
            fusion: item.metadata?.fusion ? item.metadata?.fusion : 0,
            num: item.metadata ? item.metadata.length : 0,
            html: ''
          }
          if (item.status == 2) {
            await fetchReport(newItem)
          } else {
            await checkRunning(newItem)
          }
        }
      }
      resultStatus.updateStatus('app', 2)
    }
  } catch (error) {
    console.error('Error get report logs:', error)
    resultStatus.updateStatus('app', 2)
  }

  console.log('2. get all generated reports:', resultInfo.value.result.generatedReports)
}

const checkRunning = async (newItem) => {
  const url = `${API.api}/task/pending`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (data && data.type == 'report' && data.tid == newItem.tid) {
      console.log(data)
      console.log('3. get running report')
      const index = resultInfo.value.result.generating.findIndex((item) => item.id == newItem.id)
      if (index == -1) {
        resultInfo.value.result.generating.push(newItem)
      }
    }
  } catch (error) {
    console.error('Error get running report:', error)
  }
}

//Get more need display reports on current page in every navigation
onMounted(async () => {
  if (resultInfo.value.result.generatedReports.length == 0) {
    resultStatus.updateStatus('app', 1)
    initResultLoad()
  }
})

//Tool to open the html file in new tab
const openHtml = (item) => {
  // Create a URL for the blob
  const url = item.html
  // dataVisualize.value = true
  // Open the URL in a new window
  window.open(url, '_blank')
}

const getHtml = ref('')
//Tool to download the html file
const downloadHtml = async (item) => {
  getHtml.value = item.id
  // console.log('downloadHtml', item.html)
  item.blob = await generateReportBlob(item.id)
  const url = URL.createObjectURL(item.blob)

  getHtml.value = ''
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
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'text/html' }
    })
    if (data && !data.includes('{"detail":"Report of')) {
      const blob = new Blob([data], { type: 'text/html' })
      return blob
    }
  } catch (error) {
    console.error('Error get report', error)
  }
}

//TODO: get report column data

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatDate(date) {
  const formattedTimestamp = date.slice(0, 23) + 'Z'
  const formated = date
    ? new Date(formattedTimestamp).toLocaleString(undefined, { hour12: false })
    : new Date().toLocaleString(undefined, { hour12: false })
  return formated
}
</script>

<style>
.outputContainer {
  width: 80%;
  max-width: 1200px;
  margin-top: 15px;
}

.outputCard {
  width: 100%;
  overflow: hidden;
  min-height: 750px;
  height: calc(100vh - 250px);
}

.outputTab {
  margin-block: 1rem;
  display: flex;
  width: 100%;
  height: calc(100vh - 525px);
  min-height: 480px;
  background-color: rgba(245, 245, 245, 0.4);
  padding-block: 1rem;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
}

.res-card-container {
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

.resItem {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
}

.cardContainerStyle {
  margin-bottom: 10px;
  height: 280px;
  width: 200px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease-in-out;
}

.cardContainerStyle:hover {
  transform: scale(1.05);
  /* Slight hover zoom effect */
}

i {
  transition: opacity 0.3s ease;
}

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

.stopClass {
  margin-block: 13px;
}

.custom-back-top2 {
  position: absolute !important;
  right: 50px;
  /* Adjust as needed */
  bottom: 350px;
  /* Adjust as needed */
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

  .stopClass {
    margin-block: 25px;
  }

  .res-card-container {
    min-height: 400px;
    padding-inline: 20px;
  }

  .outputContainer {
    margin-top: 10px;
  }

  .outputCard {
    min-height: 800px;
  }

  .outputTab {
    height: calc(100vh - 550px);
    min-height: 505px;
  }

  .custom-back-top2 {
    position: absolute !important;
    right: 50px;
    /* Adjust as needed */
    bottom: 360px;
    /* Adjust as needed */
  }
}

[data-theme='dark'] {
  .outputTab {
    background-color: rgba(245, 245, 245, 0.1);
  }

  /* .resItem {
    background-color: rgba(245, 245, 245, 0.1);
  } */

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
