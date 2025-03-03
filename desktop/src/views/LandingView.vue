<script setup lang="ts">
import { useApi, useInfo, useStatus } from '../stores/dataStore'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { initialiseTask, checkRunning, checkOutlierDesp} from '../components/utils.ts'

const router = useRouter()
const API = useApi()
const info = ref(useInfo())
const status = useStatus()
const loading = ref(0)
const version = ref('NA')

const validateKey = async () => {
  loading.value = 1
  try {
    const res = await fetch(`${API.api}/validate`, {
      method: 'POST',
      body: API.accessKey
    })
    const data = await res.json()
    if (data) {
      // console.log(key,API.accessKey)
      loading.value = 2
      await finishLanding()
    } else {
      API.accessKey = ''
      API.clearCookie('accessToken')
      loading.value = -1
    }
  } catch (error) {
    API.accessKey = ''
    loading.value = -1
    API.clearCookie('accessToken')
    console.log(error)
  }
}
const finishLanding = async () => {
  API.setCookie('accessToken', API.accessKey, API.cookieExpire) // Renew token for 10 min
  status.updateStatus('app', 1)
  await initialiseTask(API, info, status)
  await checkRunning(API, info, status)
  await checkOutlierDesp(API, info)
  router.push('/')
  API.landing = false
}
onMounted(async () => {
  // console.log('landing')
  //Public info endpoint
  if (!API.login) {
    router.push('/')
  } else {
    API.landing = true
    API.accessKey = ''
    fetch(
      new Request(`${API.api}/info`, {
        method: 'GET'
      })
    )
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        version.value = data?.version
      })
    if (API.getCookie('accessToken')) {
      try {
        const cookieValue = atob(API.getCookie('accessToken'))
        API.accessKey = cookieValue
        await validateKey()
      } catch (error) {
        console.error('Error decoding access token:', error)
      }
    }
  }
})
</script>

<template>
  <div class="corner-version">
    <p>Version: {{ version }}</p>
  </div>

  <a-flex
    v-if="API.landing"
    vertical
    justify="center"
    align="center"
    style="width: 100%; min-width: 400px; align-self: center"
  >
    <a-row style="align-self: center">
      <a-flex
        justify="center"
        align="center"
        vertical
        style="margin-top: -10rem; margin-bottom: 5rem"
      >
        <!-- <img alt="BQAT logo" class="landing" src="../assets/logo-bqat.png" /> -->
        <h1 class="logo">BQAT</h1>
        <h3>Biometric Quality Assessment Tool</h3>
      </a-flex>
    </a-row>
    <a-flex justify="center" align="center" vertical gap="large" style="width: 100%">
      <a-row justify="center" gutter="15" style="width: 100%; max-width: 300px">
        <!-- <h2>AccessKey</h2> -->
        <a-input
          :status="loading == -1 ? 'error' : 'success'"
          v-model:value="API.accessKey"
          :placeholder="loading == -1 ? 'accesskey error' : 'Please enter your access key here'"
          allowClear
          size="large"
          autofocus
          @pressEnter="validateKey()"
        />
      </a-row>
      <a-row>
        <a-button type="default" size="large" :loading="loading == 1" @click="validateKey()"
          >Log in</a-button
        >
      </a-row>
    </a-flex>
    <!-- <a href="https://biometix.com/"> -->
    <img
      style="margin: 10px"
      class="corner-logo"
      alt="Biometix logo"
      src="../assets/biometix-logo.png"
    />
    <!-- </a> -->
  </a-flex>
</template>

<style>
.landing {
  display: block;
  margin: 0 auto;
  margin-bottom: 5rem;
  height: 90px;
}
.corner-logo {
  position: absolute;
  bottom: 5px;
  left: 0;
  /* Optional adjustments for size */
  width: 200px;
  height: auto;
}
.corner-version {
  position: absolute;
  /* color: black; */
  top: 2px;
  right: 5px;
}
.logo {
  font-size: 140px;
  color: rgb(249, 9, 5);
  /* color: black; */
  /* color:white; */
  font-weight: bold;
  margin-top: 2rem;
  margin-bottom: 0rem;
}
@media (max-width: 1024px) {
  .logo {
    margin-top: 11rem;
  }
}
[data-theme='dark'] {
  /* .logo {
    color: white;
  } */
}
</style>
