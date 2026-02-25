<script setup lang="ts">
import { message, theme } from 'ant-design-vue'
import {
  SettingOutlined,
  CheckCircleTwoTone,
  SyncOutlined,
  CloseCircleTwoTone
} from '@ant-design/icons-vue'
import { RouterLink, RouterView } from 'vue-router'
import { useInfo, useStatus, useApi } from './stores/dataStore.js'
import { ref, watchEffect, watch, computed, onMounted } from 'vue'
import { notification } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { initialiseTask, checkRunning, checkOutlierDesp } from './components/utils.ts'
import { Modal, Input } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'
import Benchmark from "./components/Benchmark.vue";

const openSetting = ref(false)
const openBenchmark = ref(false)
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)')
const darkSetting = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: 'orange'
  }
}
const defaultSetting = {
  algorithm: theme.defaultAlgorithm,
  token: {
    colorPrimary: 'grey'
  },
  components: {
    Button: {
      colorPrimary: 'grey'
    },
    Spin: {
      colorPrimary: 'black;'
    }
  }
}
const colorTheme = ref(prefersDarkScheme.matches ? darkSetting : defaultSetting)
// const currentTheme = ref('light')

const info = ref(useInfo())
const status = useStatus()
const API = useApi()
API.currentTheme = prefersDarkScheme.matches ? 'dark' : 'light'
const router = useRouter()
const tempApi = ref(API.api)
const validApi = ref(false)
const requestApi = ref(false)
const options = ref<{ value: string }[]>(API.apiList.slice(1))
const version = import.meta.env.VITE_VERSION

const click = ref(false)


const openNotificationWithIcon = (type: string, error='') => {
  switch (type) {
    case 'purgeError':
      notification['error']({
        message: 'Database Deletion Failed',
        description: 'Unable to delete the database. Please check and try again.',
        placement: 'top',
        duration: 3
      })
      break

    case 'purgeSuccess':
      notification['success']({
        message: 'Database Reset Successful',
        description: 'The database has been successfully reset.',
        placement: 'top',
        duration: 3
      })
      break

    case 'hostError':
      notification['error']({
        message: 'Server Connection Failed',
        description:
          'Failed to connect to the host server. Please check your configuration and try again.',
        placement: 'top',
        duration: 3
      })
      break

    case 'hostSuccess':
      notification['success']({
        message: 'Connected to Server',
        description: 'Successfully connected to the current server.',
        placement: 'top',
        duration: 3
      })
      break

    case 'themeDark':
      notification['success']({
        message: 'Dark Theme Enabled',
        description: 'The application is now using the dark theme.',
        placement: 'top',
        duration: 3
      })
      break

    case 'themeLight':
      notification['success']({
        message: 'Light Theme Enabled',
        description: 'The application is now using the light theme.',
        placement: 'top',
        duration: 3
      })
      break

    case 'folderError':
      notification['error']({
        message: 'Folder Information Missing',
        description: 'Unable to retrieve folder information. Please check and try again.',
        placement: 'top',
        duration: 3
      })
      break

    case 'folderSuccess':
      notification['success']({
        message: 'Folder Information Retrieved',
        description: 'Successfully retrieved folder information.',
        placement: 'top',
        duration: 3
      })
      break

    case 'error':
      notification['error']({
        message: 'Operation Failed',
        description: error,
        placement: 'top',
        duration: 1
      })
      break

    case 'uploadSuccess':
      notification['success']({
        message: 'Upload Successful',
        description: 'Selected document(s) have been successfully uploaded to the server.',
        placement: 'top',
        duration: 3
      })
      break

    default:
      console.warn('Unknown notification type:', type)
  }
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

let timer = null

watchEffect(() => {
  if (info.value.process.taskStatus.length > 0) {
    const runningTasks = info.value.process.taskStatus.filter((item) => item.status == 1).length
    if (timer == null && runningTasks > 0) {
      info.value.process.timer = 0
      timer = setInterval(() => {
        info.value.process.timeRecord = info.value.process.timeRecord + 1
        // API.testTimer += 1
      }, 1000)
    }
    if (runningTasks == 0 || info.value.process.timer == -1) {
      // console.log('clear')
      clearInterval(timer)
      info.value.process.timer = -1
      info.value.process.timeRecord = 0
      // API.testTimer = 0
      timer = null
    }
  }
})

watch(API.apiList, async () => {
  console.log('api changed')
  await checkRunning(API, info, status)
})

const updateApiUrl = () => {
  API.updateApi(tempApi.value)
  // console.log(API.apiList)
  openSetting.value = false
  if (validApi.value) {
    // openNotificationWithIcon('hostSuccess')
  } else {
    openNotificationWithIcon('hostError')
  }
}

let currentController = null
const validateUrl = async () => {
  // If there's an ongoing request, abort it
  if (currentController) {
    console.log('cancel')
    currentController.abort()
    currentController = null
  }
  // Create a new AbortController for the new request
  currentController = new AbortController()
  const signal = currentController.signal
  await requestUrl(signal)
}

const requestUrl = async (signal) => {
  requestApi.value = true
  const url = `${tempApi.value}/info`
  try {
    // Await the fetch response
    const data = await API.authFetch(url, {
      method: 'GET',
      signal: signal
    })
    if (data) {
      validApi.value = true
      requestApi.value = false
      return true
    } else {
      validApi.value = false
      requestApi.value = false
      return false
    }
    // Check if the response is OK
    // if (!response.ok) {
    //   console.log('There was a problem with the new API address')
    //   validApi.value = false
    //   requestApi.value = false
    //   return false
    // }
    // const data = await response.json()
    // Set the API status as valid
  } catch (error) {
    // Catch any errors (e.g., network errors, aborted requests)
    console.log('There was a problem with the new API address:', error)
    validApi.value = false
    requestApi.value = false
    return false
  }
}

function showPurgeConfirm() {
  const userInput = ref('')
  Modal.confirm({
    title: 'Purge Database',
    icon: h(ExclamationCircleOutlined),
    content: h('div', [
      h('p', 'Be careful! You are about to delete whole database.'),
      h(Input, {
        placeholder: 'Type "purge" to confirm',
        onChange: (e) => (userInput.value = e.target.value)
      })
    ]),
    okType: 'danger',
    centered: true,
    okText: 'Delete',
    async onOk() {
      if (userInput.value.toLowerCase() !== 'purge') {
        message.error('You must type "purge" to confirm.')
        return Promise.reject(new Error('You must type "purge" to confirm.'))
      }

      console.log('OK')

      try {
        await purgeDatabase()
        // console.log('mockl purge')
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

const purgeDatabase = async () => {
  const url = `${API.api}/purge`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
    openNotificationWithIcon('purgeSuccess')
    window.location.reload()
    // Process the successful response data
  } catch (error) {
    // Handle errors here
    openNotificationWithIcon('purgeError')
    console.error(error)
  }
}

const switchTheme = () => {
  if (colorTheme.value.token.colorPrimary == 'orange') {
    colorTheme.value = defaultSetting
    document.documentElement.setAttribute('data-theme', 'light')
    API.currentTheme = 'light'
    openNotificationWithIcon('themeLight')
  } else {
    colorTheme.value = darkSetting
    document.documentElement.setAttribute('data-theme', 'dark')
    API.currentTheme = 'dark'
    openNotificationWithIcon('themeDark')
  }
}
const benchmarkTest = () => {
  openBenchmark.value = true
  // console.log('benchmark')
}

const goToTaskBoard = () => {
  router.push({ path: '/tasks' })
}

const showBadge = ref(
  computed(() => {
    if (validApi.value) {
      return { dot: false }
    } else {
      return { dot: true }
    }
  })
)

watch(
  () => API.landing,
  () => {
    if (API.login) {
      console.log('landing changed')
      validateUrl()
    }
    // API.accessKey = ''
  }
)
onMounted(async () => {
  document.documentElement.setAttribute('data-theme', prefersDarkScheme.matches ? 'dark' : 'light')
  if (API.login) {
    router.push({ path: '/landing' })
  } else {
    try {
      currentController = new AbortController()
      const res = await requestUrl(currentController.signal)
      if (res) {
        status.updateStatus('app', 1)
        await initialiseTask(API, info, status)
        await checkRunning(API, info, status)
        await checkOutlierDesp(API, info)
      } else {
        status.updateStatus('app', -1)
        openNotificationWithIcon('hostError')
      }
    } catch (error) {
      console.error('Error in onMounted:', error)
    }
  }
})
</script>

<template>
  <header>
    <nav>
      <a-config-provider :theme="colorTheme">
        <a-tooltip placement="left">
          <template #title>
            <span>{{ version }}</span>
          </template>
          <img v-if="!API.landing" alt="BQAT logo" class="logo" src="./assets/logo-bqat.png" />
        </a-tooltip>
        <div v-if="!API.landing" style="margin-bottom: 8px; font-size: 25px">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/input">Input</RouterLink>
          <RouterLink to="/results">Results</RouterLink>
          <RouterLink to="/files">Files</RouterLink>
        </div>
      </a-config-provider>
    </nav>
  </header>

  <body class="body">
    <RouterView />
    <a-float-button
      v-if="!API.landing"
      :badge="{ count: info.process.taskStatus.filter((item) => item.status == 1).length }"
      shape="square"
      @click="goToTaskBoard"
      :style="{
        right: '55px',
        top: '70px',
        width: '140px',
        height: '40px'
      }"
      type="primary"
    >
      <template #description>
        <h2
          style="
            color: white;
            font-weight: normal;
            font-size: 20px;
            text-align: center;
            margin: 0 auto;
          "
        >
          Task List
        </h2>
      </template>
    </a-float-button>

    <a-float-button-group v-if="!API.landing" trigger="hover" type="primary" class="floatButtons">
      <template #icon>
        <a-badge v-if="!validApi" color="red" style="position: absolute; top: 0px; left: 20px" />
        <SettingOutlined
          :style="{ color: colorTheme.token.colorPrimary == 'orange' ? 'white' : 'white' }"
        />
      </template>

      <a-float-button tooltip="Benchmark Task" @click="benchmarkTest">
        <template #icon>
          <span
            :style="{ color: colorTheme.token.colorPrimary == 'orange' ? 'white' : 'black' }"
            class="bi bi-building-check"
          ></span>
        </template>
      </a-float-button>
      <a-float-button tooltip="Switch Theme" @click="switchTheme">
        <template #icon>
          <span
            :style="{ color: colorTheme.token.colorPrimary == 'orange' ? 'white' : 'black' }"
            class="bi bi-palette"
          ></span>
        </template>
      </a-float-button>
      <a-float-button tooltip="Purge Database" @click="showPurgeConfirm">
        <template #icon>
          <span class="bi bi-arrow-counterclockwise"></span>
        </template>
      </a-float-button>

      <a-float-button tooltip="Config Host" @click="openSetting = true" :badge="showBadge">
        <template #icon>
          <span class="bi bi-database-fill-gear"></span>
        </template>
      </a-float-button>
    </a-float-button-group>

    <a-modal v-model:open="openSetting" title="Host Configuration" centered @ok="updateApiUrl()">
      <p>BQAT server address:</p>
      <a-flex horizontal>
        <a-auto-complete
          v-model:value="tempApi"
          placeholder="Enter the server address"
          @change="validateUrl()"
          style="width: 80%; margin-right: 8px"
          :options="options"
        />
        <div v-if="!requestApi">
          <CheckCircleTwoTone
            v-if="validApi"
            style="font-size: 23px; margin-top: 5px"
            twoToneColor="#52c41a"
          />
          <CloseCircleTwoTone
            v-else
            style="font-size: 23px; margin-top: 5px"
            twoToneColor="#9b2015"
          />
        </div>
        <div v-else>
          <SyncOutlined style="font-size: 23px" spin />
        </div>
      </a-flex>
    </a-modal>
    <a-modal
      v-model:open="openBenchmark"
      centered
      width="60%"
      wrap-class-name="full-modal"
      style="min-width: 1000px; max-width: 1600px"
      :footer="null"
    >
      <Benchmark />
    </a-modal>

    <!-- <a-modal
      v-model:open="openBenchmark"
      centered
      width="60%"
      wrap-class-name="full-modal"
      style="min-width: 1000px; max-width: 1600px"
    >
      <template #title>
        <h2 style="text-align: center; margin: 10px">Benchmark Testing</h2>
      </template>
      <a-flex vertical width="100%" gap="middle">
        <a-card style="width: 100%">
          <a-row gutter="10">
            <a-col :span="9" align="center">
              <a-radio-group
                size="large"
                style="width: 100%"
                v-model:value="testItem.modal"
                @change="
                  testItem.modal == 'face'
                    ? (testItem.engine = ['bqat'])
                    : (testItem.engine = ['default'])
                "
              >
                <a-radio-button value="face">Face</a-radio-button>
                <a-radio-button value="fingerprint">Fingerprint</a-radio-button>
                <a-radio-button value="iris">Iris</a-radio-button>
                <a-radio-button value="speech">Voice</a-radio-button>
              </a-radio-group>
              <a-select
                style="width: 90%; margin: 10px"
                v-model:value="testItem.engine"
                mode="multiple"
                :allowClear="true"
                placeholder="Please select"
                size="large"
                :options="modalityOptions"
              />
              <div>
                <a-button type="primary" style="margin-inline: 10px" @click="addOneTest"
                  >Add One Test</a-button
                >
                <a-button type="primary" style="margin-inline: 10px" @click="addAllTest"
                  >Test All</a-button
                >
              </div>
            </a-col>
            <a-col :span="8" align="center" justify="center">
              <a-statistic-countdown
                title="Testing elapse"
                :value="Date.now() + 1000 * 10 * 60 * 24 * 2 + 1000 * 30"
                format="HH:mm:ss:SSS"
                style="margin-block: 20px"
              />
            </a-col>
            <a-col :span="7" align="center" justify="center">
              <a-progress type="circle" :percent="100" :format="() => '100%'" />
            </a-col>
          </a-row>
        </a-card>
        <a-card  style="width: 100%; height:60vh; overflow-y: scroll">
          <a-row v-if="testItems.length>0" v-for="item,index in testItems" gutter="10">
            <a-card  :key="index" :bordered="true" hoverable style="width: 100%; margin: 5px">
              <a-row>
                <a-col :span="16" align="center">
                  <a-row>
                    <a-col :span="8">
                      <p>Modal: {{item.modal}}</p>
                    </a-col>
                    <a-col :span="8">
                      <p>Engine: {{ item.engine }}</p>
                    </a-col>
                    <a-col :span="8">
                      <p>
                        Pass:
                        <a href="http://">
                          [{{
                            Math.round(
                              benchMarkMockData.engines.face.total *
                                benchMarkMockData.engines.face.pass
                            )
                          }}/{{ benchMarkMockData.engines.face.total }}]</a
                        >
                      </p>
                    </a-col>
                  </a-row>
                  <a-row>
                    <a-col :span="8">
                      <p>System Info:</p>
                   
                    </a-col>
                    <a-col :span="16">
                      <a-card :loading="true" size="small">loading...</a-card>
                    </a-col>
                  </a-row>
                </a-col>
                <a-col :span="8" align="center">
                  <a-progress
                    type="circle"
                    size="large"
                    :percent="benchMarkMockData.engines.face.pass * 100"
                /></a-col>
              </a-row>
              <a-row style="margin-top: 20px" align="center">
                <a-progress style="width: 90%" percent="90" />
              </a-row>
            </a-card>
          </a-row>
          <a-empty v-else></a-empty>
        </a-card>
      </a-flex>
      <template #footer>

      </template>

    </a-modal> -->
  </body>
</template>

<style scoped>
header {
  line-height: 1.5;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
  margin-top: 2rem;
  height: 40px;
}

nav {
  position: relative;
  z-index: 10;
  width: 100%;
  /* font-size: 20px; */
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: red;
  font-weight: 500;
}

nav a.router-link-exact-active:hover {
  background-color: lightgrey;
}

nav a {
  display: inline-block;
  padding: 0 15px;
  border-radius: 10px;
  /* border-left: 1px solid var(--color-border); */
}

nav a:first-of-type {
  border: 0;
}
.floatButtons {
  right: 60px;
}
@media (min-width: 1024px) {
  .logo {
    margin: 0 1rem 0 0;
    height: 50px;
  }

  nav {
    justify-content: left;
    margin-left: -10rem;
    align-items: end;
    display: flex;
    font-size: 1.5rem;
    height: 100px;
    max-width: 1200px;
    min-width: 600px;
    width: 80%;
  }
  header {
    display: flex;
    place-items: top;
    margin-top: 1rem;
    justify-content: center;
    align-items: center;
    margin: 0 6rem;
    padding: 0rem 1rem;
    width: 100%;
  }
}
</style>
