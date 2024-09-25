<script setup lang="ts">
import HomeItem from './HomeItem.vue'
import { LoadingOutlined, PieChartTwoTone, HourglassTwoTone } from '@ant-design/icons-vue';
import { useStatus, useInfo } from '../stores/dataStore';
const status = useStatus();
const info = useInfo();
</script>

<template>

  <div style="margin-top: 2rem;">

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
      <h3>1. Upload Biometric Samples (fingerprint, face, iris, and voice) for Quality Analysis</h3>
      - Upload biometric samples to the server OR select a local folder.<br>
      - Adjust the size, file type, and color space of biometric images as needed (Optional).<br>
      - Submit scan task.
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
    <template #heading><RouterLink  class="introItem"  to="/task">Analysis</RouterLink></template>
    <p>
      <h3>2. Monitor Task Status</h3>
        - Check the status of ongoing tasks in the "Task List".<br>
        - Processing times may vary depending on sample size and system capacity.
    </p>
    <p>
      <h3>3. Preview Outputs</h3>
      - View the outputs and download as CSV.
    </p>
    <p>
      <h3>4. Detect Outliers</h3>
      - Select algorithm and criteria to detect potential outliers of the dataset.
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
    <template #heading><RouterLink  class="introItem"  to="/result">Reports</RouterLink></template>
    <p>
  <h3>6. Generate Quality Report</h3>
  - Produce an Exploratory Data Analysis (EDA) report using the output quality metrics.
</p>

  </HomeItem>
</div>

</template>

<style scoped>
@media (min-width: 1024px) {
  p {
    font-size: 1.1rem;
  }

}
.introItem {
  text-decoration: none;
  font-weight: 500;
  color: inherit; 
}
.introItem:hover {
    background-color: rgba(165, 162, 162, 0.384);
    border-radius: 5px;
    padding: 5px;
  }
</style>
