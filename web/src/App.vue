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
import { initialiseTask, checkRunning } from './components/utils.ts'
import { Modal, Input } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { h } from 'vue'

const openSetting = ref(false)
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
const currrentTheme = ref('light')

const info = ref(useInfo())
const status = useStatus()
const API = useApi()
const router = useRouter()
const tempApi = ref(API.api)
const validApi = ref(false)
const requestApi = ref(false)
const options = ref<{ value: string }[]>(API.apiList.slice(1))
const version = import.meta.env.VITE_VERSION

const openNotificationWithIcon = (type: string) => {
  if (type === 'purgeError') {
    notification['error']({
      message: 'Deletion failed',
      description: 'Delete database failed, Please check and try again.',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'purgeSuccess') {
    notification['success']({
      message: 'Database purged',
      description: 'Successfully reset the database.',
      placement: 'top',
      duration: 3
    })
  }
  if (type === 'hostError') {
    notification['error']({
      message: 'Fail to Connect',
      description:
        'Connection to host server failed, Please check your configuration and try again.',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'hostSuccess') {
    notification['success']({
      message: 'Connect to Server',
      description: 'Successfully connect to current server.',
      placement: 'top',
      duration: 3
    })
  }
  if (type === 'themeDark') {
    notification['success']({
      message: 'Dark theme activated',
      description: 'Successfully switch to dark theme..',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'themeLight') {
    notification['success']({
      message: 'Light theme activated',
      description: 'Successfully switch light theme.',
      placement: 'top',
      duration: 3
    })
  }
  if (type === 'folderError') {
    notification['error']({
      message: 'No input folder info',
      description: 'Failed to retrieve input folder info , Please check and try again.',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'folderSuccess') {
    notification['success']({
      message: 'Input folder info retrieved',
      description: 'Successfully retrieve input folder info.',
      placement: 'top',
      duration: 3
    })
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
    if (data) {
      openNotificationWithIcon('purgeSuccess')
      window.location.reload()
    }
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
    currrentTheme.value = 'light'
    openNotificationWithIcon('themeLight')
  } else {
    colorTheme.value = darkSetting
    document.documentElement.setAttribute('data-theme', 'dark')
    currrentTheme.value = 'dark'
    openNotificationWithIcon('themeDark')
  }
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
  () => API.landing && API.login,
  () => {
    if (API.landing && API.login) {
      console.log('landing changed')
      validateUrl()
    }
    // API.accessKey = ''
  }
)
onMounted(async () => {
  document.documentElement.setAttribute('data-theme', prefersDarkScheme.matches ? 'dark' : 'light')
  if (
    (!API.getCookie('accessToken') || API.getCookie('accessToken') == null) &&
    !API.landing &&
    API.login
  ) {
    console.log('no token')
    console.log(API.getCookie('accessToken'), API.landing)
    router.push({ path: '/landing' })
  } else {
    try {
      currentController = new AbortController()
      const res = await requestUrl(currentController.signal)
      if (res) {
        status.updateStatus('app', 1)
        await initialiseTask(API, info, status)
        await checkRunning(API, info, status)
      } else {
        status.updateStatus('app', -1)
        openNotificationWithIcon('hostError')
      }
      API.landing = false
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
          <img
            v-if="!API.landing || !API.login"
            alt="BQAT logo"
            class="logo"
            src="./assets/logo-bqat.png"
          />
        </a-tooltip>
        <div v-if="!API.landing || !API.login" style="margin-bottom: 8px; font-size: 25px">
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
      v-if="!API.landing || !API.login"
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

    <a-float-button-group
      v-if="!API.landing || !API.login"
      trigger="hover"
      type="primary"
      class="floatButtons"
    >
      <template #icon>
        <a-badge v-if="!validApi" color="red" style="position: absolute; top: 0px; left: 20px" />
        <SettingOutlined
          :style="{ color: colorTheme.token.colorPrimary == 'orange' ? 'white' : 'white' }"
        />
      </template>

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
