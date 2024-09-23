<script setup lang="ts">
import { theme } from 'ant-design-vue'
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
document.documentElement.setAttribute('data-theme', prefersDarkScheme.matches ? 'dark' : 'light')
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
let timer = setInterval(() => {
  if (info.value.process.timer != -1) {
    info.value.process.timeRecord = info.value.process.timeRecord + 1
  }
  // Increment elapsed time by 1 second
}, 1000)

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
      description: 'Connection to host server failed, Please check your configuration and try again.',
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
//start timer and stop timer
watchEffect(() => {
  if (info.value.process.taskStatus.length > 0) {
    if (
      timer == null &&
      info.value.process.taskStatus.filter((item) => item.status != 2).length > 0
    ) {
      timer = setInterval(() => {
        info.value.process.timeRecord = info.value.process.timeRecord + 1
      }, 1000)
    }
    if (
      info.value.process.taskStatus.filter((item) => item.status != 2).length == 0 ||
      info.value.process.taskStatus.filter((item) => item.status != 2).length ==
        info.value.process.taskStatus.filter((item) => item.status == -1).length
    ) {
      // console.log('clear')
      clearInterval(timer)
      info.value.process.timer = -1
      timer = null
    }
  }
})

watch(API.apiList, () => {
  console.log('api changed')
  checkInputFolder()
})

const checkRunning = async () => {
  const url = `${API.api}/task/metadata`
  await API.authFetch(url, {
    method: 'GET',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      status.updateStatus('app', 2)
      if (!response.ok) {
        console.log('No running task')
      }
      return response.json()
    })
    .then((data) => {
      // console.log(data)
      if (data.type == 'report') {
        console.log('3. get running report')
        status.updateStatus('result', 1)
        status.updateStatus('app', 1)
      }
      if (data.type == 'scan') {
        console.log('3. get running scan')
        status.updateStatus('app', 1)
        status.updateStatus('process', 1)
      }
      if (data.type == 'preprocessing') {
        console.log('3. get running preprocessing')
        status.updateStatus('app', 1)
        status.updateStatus('preprocess', 1)
      }
      if (data.type == 'outlier') {
        console.log('3. get running outlier')
        status.updateStatus('app', 1)
        status.updateStatus('outlier', 1)
      }
    })
    .catch((error) => {
      status.updateStatus('app', 2)
      console.error('Error get running task:', error)
    })
}

const intervalId = setInterval(() => {
  if (status.app == 2) {
    clearInterval(intervalId)
  } else {
    checkRunning()
  }
}, 5000)

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

let currentRequest = null
let currentController = null
const validateUrl = async () => {
  // If there's an ongoing request, abort it
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
  console.log('request', tempApi.value)
  requestApi.value = true
  const myRequest = new Request(`${tempApi.value}/scan/info`, {
    method: 'GET',
    signal: signal
  })

  try {
    // Await the fetch response
    const response = await fetch(myRequest)
    // Check if the response is OK
    if (!response.ok) {
      console.log('There was a problem with the new API address')
      validApi.value = false
      requestApi.value = false
      return false // Early return if response is not OK
    }

    // Await the parsed JSON data
    const data = await response.json()

    // Set the API status as valid
    validApi.value = true
    requestApi.value = false

    console.log(data)
    return true // Return true if everything is OK
  } catch (error) {
    // Catch any errors (e.g., network errors, aborted requests)
    console.log('There was a problem with the new API address:', error)
    validApi.value = false
    requestApi.value = false
    return false // Return false if an error occurs
  }
}

// const checkMountedFolder =async () => {
//   const myRequest = new Request(`${API.api}/task/cwd`, {
//     method: 'GET'
//   })
//   await fetch(myRequest)
//     .then((response) => {
//       if(!response.ok){
//         throw new Error('Mounted folder is not exist')
//       }
//       return response.json()
//     })
//     .then(data=>{
//       if(data){
//         console.log(data)
//         API.updateFolderPath(data)
//       }
//     }).catch(error=>{
//       console.error("the API can not be reach",error)
//     })
// }
const checkInputFolder = async () => {
  const myRequest = new Request(`${API.api}/task/inputs`, {
    method: 'GET'
  })

  await API.authFetch(myRequest)
    .then((response) => {
      if (!response.ok) {
        throw new Error('Mounted folder is not exist')
      }
      return response.json()
    })
    .then((data) => {
      if (data) {
        // console.log(data)
        // openNotificationWithIcon('folderSuccess')
        API.updateInputFolder(data)
        API.updateInputTree(data)
      }
    })
    .catch((error) => {
      // openNotificationWithIcon('folderError')
      console.error('the API can not be reach', error)
    })
}
const purgeDatabase = async () => {
  const url = `${API.api}/purge`
  await API.authFetch(url, {
    method: 'POST',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('the Database can not be purge')
      }
      return response.json()
    })
    .then((data) => {
      console.log(data)
      openNotificationWithIcon('purgeSuccess')
      window.location.reload()
    })
    .catch((error) => {
      openNotificationWithIcon('purgeError')
      console.error(error)
    })
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
  router.push({ path: '/task' })
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

onMounted(async () => {
  try {
    currentController = new AbortController()
    const res = await requestUrl(currentController.signal)
    console.log(res) // This should log the response

    if (res) {
      // openNotificationWithIcon('hostSuccess')
    } else {
      openNotificationWithIcon('hostError')
    }

    checkInputFolder()
  } catch (error) {
    console.error('Error in onMounted:', error)
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
          <img alt="BQAT logo" class="logo" src="./assets/logo-bqat.png" height="50" />
        </a-tooltip>
        <div style="margin-bottom: 8px; margin-left: 20px">
          <RouterLink to="/">Home</RouterLink>
          <RouterLink to="/scan">Scan</RouterLink>

          <!-- <RouterLink to="/outlier">Outliers</RouterLink> -->
          <RouterLink to="/result">Report</RouterLink>
          <!-- <RouterLink to="/preprocess">Tools</RouterLink> -->
          <!-- <RouterLink to="/task"><span style="font-weight: bold">Tasks</span></RouterLink> -->
        </div>
      </a-config-provider>
    </nav>
  </header>
  <body class="body">
    <a-float-button
      :badge="{ count: info.process.taskStatus.filter((item) => item.status != 2).length }"
      shape="square"
      @click="goToTaskBoard"
      :style="{
        right: '70px',
        // left:'800px',
        bottom: '1400px',
        top: '70px',
        width: '140px'
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

    <a-float-button-group trigger="hover" type="primary" class="floatButtons">
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
      <a-float-button tooltip="Purge Database" @click="purgeDatabase">
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
    <!-- button to set api -->

    <a-modal
      v-model:open="openSetting"
      title="Host Configuration"
      centered
      @ok="updateApiUrl()"
    >
      <!-- :ok-button-props="{ disabled: validApi ? false : true }" -->
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
    <RouterView />
  </body>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
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
  font-size: 20px;
  text-align: center;
  margin-top: 1rem;
}

nav a.router-link-exact-active {
  color: red;
}

/* [data-theme='dark']{
  nav a.router-link-exact-active {
  color: orange
}
} */

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
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
    margin-right: 15rem;
    /* margin-left: -15rem; */
    align-items: end;
    display: flex;
    font-size: 1.5rem;
    height: 100px;
    max-width: 1200px;
    width: 80%;
  }
}
</style>
