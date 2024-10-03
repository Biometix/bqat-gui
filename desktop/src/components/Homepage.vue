<script setup lang="ts">
import HomeItem from './HomeItem.vue'
import { LoadingOutlined, PieChartTwoTone, HourglassTwoTone } from '@ant-design/icons-vue';
import { useStatus, useInfo } from '../stores/dataStore';
const status = useStatus();
const info = useInfo();
</script>

<template>

  <div style="margin-top: 0rem;">

  <HomeItem>
    <template #icon>
      <!-- normal status -->
      <span class="bi bi-upc-scan" v-if="status.scan == 0" style="color: #9b9b9b"></span >
      <!-- processing Status -->
      <LoadingOutlined twoToneColor="#87bbdd" v-else-if="status.scan == 1" />
      <!-- success status -->
      <span class="bi bi-upc-scan" v-else-if="status.scan == 2" style=" color: #55995e"></span >
      <!-- error status -->
      <span class="bi bi-upc-scan" v-else-if="status.scan == -1" style=" color: #9b2015"></span >

    </template>
    <template #heading><RouterLink  class="introItem"  to="/scan">Input</RouterLink></template>
    <p>
      <h3>1. Import biometric samples (fingerprint, face, iris, and voice) for quality assessment</h3>
      - Import biometric samples OR select from a local folder.<br>
      - Modify image size, file type, and/or color space of biometric samples as needed.
    </p>

  </HomeItem>

  <HomeItem>
    <template #icon>
      <!-- normal status -->
      <HourglassTwoTone twoToneColor="#9b9b9b" v-if="status.process == 0" />
      <!-- processing Status -->
      <LoadingOutlined twoToneColor=" #87bbdd" v-else-if="status.process == 1" />
      <!-- success status -->
      <HourglassTwoTone twoToneColor="#55995e" v-else-if="status.process == 2" />
      <!-- error status -->
      <HourglassTwoTone twoToneColor="#9b2015" v-else-if="status.process == -1" />
    </template>
    <template #heading><RouterLink  class="introItem"  to="/task">Task</RouterLink></template>
    <p>
      <h3>2. Keep eyes on the task status</h3>
        - Check the status of ongoing tasks in the "Task List".<br>
        - Come back at around ETC.
    </p>
    <p>
      <h3>3. View output data</h3>
      - Preview the output quality metrics.<br>
      - Download as CSV and investigate.
    </p>
    <p>
      <h3>4. Detect outliers (beta)</h3>
      - Select algorithm and criteria to detect potential outliers of the dataset.<br>
      - Download outliers as CSV and investigate.
    </p>
  </HomeItem>

  <HomeItem>
    <template #icon>
      <!-- normal status -->
      <PieChartTwoTone twoToneColor= "#9b9b9b" v-if="status.result == 0" />
      <!-- processing Status -->
      <LoadingOutlined twoToneColor=" #87bbdd" v-else-if="status.result == 1" />
      <!-- success status -->
      <PieChartTwoTone twoToneColor="#55995e" v-else-if="status.result == 2" />
      <!-- error status -->
      <PieChartTwoTone twoToneColor="#9b2015" v-else-if="status.result == -1" />
    </template>
    <template #heading><RouterLink  class="introItem"  to="/result">Result</RouterLink></template>
    <p>
      <h3>5. Generate EDA quality report</h3>
      - Produce an Exploratory Data Analysis (EDA) report using the output quality metrics.
    </p>
  </HomeItem>
</div>

</template>

<style scoped>
@media (min-width: 1024px) {
  p {
    font-size: 1.1rem;
    padding-left: 10px;
  }

}
.introItem {
  text-decoration: none;
  font-weight: 500;
  color: inherit;
  border-radius: 5px;
  padding: 5px 10px;
}
.introItem:hover {
    background-color: rgba(165, 162, 162, 0.384);
    border-radius: 5px;
    padding: 5px 10px;
  }
</style>
