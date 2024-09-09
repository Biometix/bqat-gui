<script setup lang="ts">
import HomeItem from './HomeItem.vue'
import { ExclamationCircleTwoTone, SecurityScanTwoTone, LoadingOutlined, PieChartTwoTone, HourglassTwoTone, HourglassOutlined } from '@ant-design/icons-vue';
import { useStatus, useInfo } from '../stores/dataStore';
const status = useStatus();
const info = useInfo();
</script>

<template>

  <!-- <HomeItem>
    <template #icon>
      <ExclamationCircleTwoTone twoToneColor="#55995e" />
    </template>
    <template #heading>Instruction</template>
    <p>Introduction
This guide provides a step-by-step process for using our biometric processing system. Follow these instructions to preprocess images, upload samples, configure reports, and export results. </p>
  </HomeItem> -->
  <div style="margin-top: 2rem;">
  <!-- <HomeItem>

    <template #icon>
      <span class="bi bi-image-fill" v-if="status.preprocess == 0" style=" color: #9b9b9b"></span >

      <LoadingOutlined style=" color: #87bbdd" v-else-if="status.preprocess == 1" />

      <span class="bi bi-image-fill" v-else-if="status.preprocess == 2" style=" color: #55995e"></span >

      <span class="bi bi-image-fill" v-else-if="status.preprocess == -1" style=" color: #9b2015"></span >

    </template>
    <template #heading>Preprocess (optional)</template>
    <p>
    <h3> 1. Convert / resize inputs if required: </h3>
      - Adjust image size, file type, and/or colour space of the biometrics. <br>
    </p>

  </HomeItem> -->

  <HomeItem>
    <template #icon>
      <!-- normal status -->
      <span class="bi bi-upc-scan" v-if="status.scan == 0" style="color: #9b9b9b"></span >
      <!-- <SecurityScanTwoTone v-if="status.scan == 0" /> -->
      <!-- processing Status -->
      <LoadingOutlined twoToneColor="#87bbdd" v-else-if="status.scan == 1" />
      <!-- success status -->
      <span class="bi bi-upc-scan" v-else-if="status.scan == 2" style=" color: #55995e"></span >
      <!-- <SecurityScanTwoTone twoToneColor="#55995e" v-else-if="status.scan == 2" /> -->
      <!-- error status -->
      <span class="bi bi-upc-scan" v-else-if="status.scan == -1" style=" color: #9b2015"></span >
      <!-- <SecurityScanTwoTone twoToneColor="#9b2015" v-else-if="status.scan == -1" /> -->
    </template>
    <template #heading><RouterLink  class="introItem"  to="/scan">Input</RouterLink></template>
    <p>
      <h3>1. Upload Biometric Samples (fingerprint, face, iris, and voice) for Quality Analysis</h3>
      - Upload biometric samples to the server.<br>
      - Alternatively, select a local folder if BQAT is running on your computer.<br>
      - Adjust the size, file type, and color space of biometric images as needed (Optional).<br>
      - Submit scan task.
    </p>

    <!-- <p>
    <h3>3. Filter files</h3>
    - After uploading, filter your biometric samples by type or name pattern to streamline processing.
    </p> -->
<!-- 
    <p>
    <h3>3. Select Modality</h3>
    - Specify the modality of the samples (e.g., Fingerprint, face, iris, voice). <br>
    </p> -->
    <!-- <p>
    <h3>5. Config Report:</h3>
    - Configure the report attributes based on your specific needs.
    </p> -->
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

  <!-- <HomeItem>
    <template #icon>

      <span class="bi bi-bug" style=" color: #9b9b9b" v-if="status.outlier == 0" ></span >
      <LoadingOutlined twoToneColor="#87bbdd" v-else-if="status.outlier == 1" />

      <span class="bi bi-bug" style="color:#55995e" v-else-if="status.outlier == 2" ></span >

      <span class="bi bi-bug" style="color:#9b2015" v-else-if="status.outlier == -1" ></span >
    </template>
    <template #heading>Outliers</template>
    <p>
    <h3>4. Detect Outliers:</h3>
    - Use selected algorithms and criteria to detect potential outliers.
    </p>
    <br />
  </HomeItem> -->

  <HomeItem>
    <template #icon>
      <!-- normal status -->
      <PieChartTwoTone twoToneColor= "#9b9b9b" v-if="status.result == 0" />
      <LoadingOutlined twoToneColor=" #87bbdd" v-else-if="status.result == 1" />
      <!-- success status -->
      <!-- <span class="bi bi-pie-chart-fill" style="color:#55995e" v-else-if="status.result == 2"></span> -->
      <PieChartTwoTone twoToneColor="#55995e" v-else-if="status.result == 2" />
      <!-- error status -->
      <PieChartTwoTone twoToneColor="#9b2015" v-else-if="status.result == -1" />
    </template>
    <template #heading><RouterLink  class="introItem"  to="/result">Reports</RouterLink></template>
    <p>
  <h3>6. Generate Quality Report</h3>
  - Produce an Exploratory Data Analysis (EDA) report using the output quality metrics.
</p>
<!-- <p>
  <h3>7. Generate External Reports</h3>
  - Create an EDA report based on a custom CSV file.
</p> -->

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
  color: inherit; /* This ensures the text color remains the default color */
}
.introItem:hover {
    background-color: rgba(165, 162, 162, 0.384);
    border-radius: 5px;
    padding: 5px;
  }
</style>
