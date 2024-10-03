<template>
  <a-flex class="processContainer" gap="middle" vertical>
    <a-card hoverable>
      <a-spin
        size="large"
        style="margin-top: 20%"
        :indicator="indicator"
        :spinning="tip"
        :tip="tip"
      >
        <!-- Task Info Section -->
        <a-row :gutter="16" justify="center">
          <a-col :span="6">
            <a-statistic
              title="Current Task"
              :value="
                processInfo.process.taskStatus.filter((item) => item.status != 2).length > 0
                  ? processInfo.process.taskStatus.filter((item) => item.status != 2)[0].name
                  : 'NA'
              "
              style="text-align: center"
            >
              <template #prefix>
                <i class="bi bi-terminal"></i>
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="Elapsed Time"
              :value="formatSeconds"
              style="text-align: center"
            >
              <template #prefix>
                <i class="bi bi-stopwatch"></i>
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="ETC"
              :value="
                processInfo.process.taskStatus.filter((item) => item.status != 2).length > 0
                  ? formatETA
                  : '00:00:00'
              "
              style="text-align: center"
            >
              <template #prefix>
                <i class="bi bi-stopwatch"></i>
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="Processed"
              :value="`${processInfo.process.taskStatus.filter((item) => item.status == 2).length} / ${processInfo.process.taskStatus.length}`"
              style="text-align: center"
            >
              <template #prefix>
                <i class="bi bi-check2-circle"></i> </template
              >``
            </a-statistic>
          </a-col>
        </a-row>

        <!-- Stop Task Section -->
        <a-row justify="center" style="margin-block: 15px">
          <a-col :span="8">
            <a-button
              :disabled="processStatus.process != 1"
              style="width: 100%; padding: 0px; overflow: hidden"
              danger
              @click="clearTask"
            >
              <i class="bi bi-stop-circle" style="font-size: 15px; margin-inline: 5px"></i>
              Stop Current Task
            </a-button>
          </a-col>
        </a-row>

        <!-- Task Board Section -->
        <div v-if="processInfo.process.taskStatus.length > 0" class="task-card-container">
          <a-card
            v-for="(item, index) in processInfo.process.taskStatus"
            :key="index"
            hoverable
            class="taskStyle"
            bodyStyle="padding: 0px; height: 78px;"
            :style="{
              backgroundColor: processInfo.process.selectedItems[item.tid]
                ? item.percent < 100
                  ? 'rgba(162, 165, 166,0.5)'
                  : 'rgba(200, 200, 200,0.7)'
                : 'rgba(200, 200, 200,0.2)'
            }"
          >
            <a-spin style="margin-top: -15px" :spinning="item.percent < 100">
              <a-tooltip :title="`${new Date(item.modified).toLocaleString()} | ${convertSecondsToHMS(Number(item.elapse))}`">
                <div style="padding-inline: 10px; width: 100%">
                  <a-checkbox
                    class="checkbox-hidden"
                    :disabled="item.status != 2"
                    v-model:checked="processInfo.process.selectedItems[item.tid]"
                    @change="(e) => selectTask(e, item)"
                  >
                    <div
                      style="display: flex; flex-direction: row; height: 35px; margin-top: -15px"
                    >
                      <p
                        style="padding: 5px; text-align: end; font-size: medium; font-weight: normal"
                      >
                        {{ item.name.toUpperCase() }}:
                      </p>
                      <a-progress
                        class="progressStyle"
                        :size="[300, 20]"
                        :stroke-color="{ '0%': '#ff1a2d', '100%': '#99000d' }"
                        :percent="item.percent"
                      />
                    </div>
                    <div style="text-align: center; height: 40px; padding-top: 2px; width: 100%">
                      <p
                        style="
                          overflow: hidden;
                          text-overflow: ellipsis;
                          white-space: nowrap;
                          width: 100%;
                          font-size: medium;
                        "
                      >
                        Input: {{ truncateString(item.input) }} | Modality:
                        {{ capitalizeFirstLetter(item.mode) }} | Engine:
                        {{ item.engine ? item.engine.toUpperCase() : 'Default' }} | Data:
                        {{ item.num }}/{{ item.total }}
                      </p>
                    </div>
                  </a-checkbox>
                </div>
              </a-tooltip>
            </a-spin>
          </a-card>

          <a-card
            hoverable
            class="taskStyle"
            bodyStyle="padding: 10px 10px; height: 70px"
            :style="{
              height: '70px',
              backgroundColor: processInfo.process.selectedExternal
                ? 'rgba(200, 200, 200,0.7)'
                : 'rgba(200, 200, 200,0.2)'
            }"
          >
            <a-tooltip title="Import CSV to Generate Report">
              <div style="display: flex; flex-direction: row">
                <a-checkbox
                  :disabled="!processInfo.result.selectedCsv[0]"
                  v-model:checked="processInfo.process.selectedExternal"
                  class="checkbox-hidden"
                >
                  <div style="display: flex; flex-direction: row; height: 35px; margin-top: -15px">
                    <h3
                      style="
                        padding-inline: 6px;
                        padding-top: 4px;
                        padding-right: 10px;
                        text-align: end;
                        font-size: medium;
                        font-weight: normal;
                      "
                    >
                      External:
                    </h3>

                    <input
                      type="file"
                      ref="uploadRef"
                      accept=".csv"
                      style="display: none"
                      @change="selectCsv"
                    />
                    <a-button
                      size="medium"
                      @click="uploadCsv"
                      danger
                      style="width: 80%; text-overflow: ellipsis; overflow: hidden"
                      :disabled="
                        tip !== false || processStatus.outlier == 1 || processStatus.preprocess == 1
                      "
                    >
                      {{
                        processInfo.result.selectedCsv[0]
                          ? processInfo.result.selectedCsv[0].name
                          : 'Import CSV file'
                      }}
                    </a-button>
                    <!-- <div style="text-align: center; height: 40px; padding-top: 6px">
                      <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                        Select External CSV File
                      </p>
                    </div> -->
                  </div>
                </a-checkbox>
              </div>
            </a-tooltip>
          </a-card>
        </div>

        <!-- Empty Task Board Section -->
        <div v-else class="processItem">
          <a-card
            hoverable
            class="taskStyle"
            bodyStyle="padding: 10px 10px; height: 85px;"
            :style="{
              height: '70px',
              backgroundColor: processInfo.process.selectedExternal
                ? 'rgba(200, 200, 200,0.7)'
                : 'rgba(200, 200, 200,0.2)'
            }"
          >
            <a-tooltip title="Use External CSV to Generate Report">
              <div style="display: flex; flex-direction: row; height: 40px">
                <a-checkbox
                  class="checkbox-hidden"
                  :disabled="!processInfo.result.selectedCsv[0]"
                  v-model:checked="processInfo.process.selectedExternal"
                >
                  <div style="display: flex; flex-direction: row; height: 35px; margin-top: -15px">
                    <h3
                      style="
                        padding-inline: 6px;
                        padding-top: 4px;
                        text-align: end;
                        font-size: large;
                        font-weight: bold;
                      "
                    >
                      External:
                    </h3>

                    <input
                      type="file"
                      ref="uploadRef"
                      accept=".csv"
                      style="display: none"
                      @change="selectCsv"
                    />
                    <a-button
                      size="large"
                      @click="uploadCsv"
                      danger
                      style="width: 80%; text-overflow: ellipsis; overflow: hidden"
                      :disabled="
                        tip !== false || processStatus.outlier == 1 || processStatus.preprocess == 1
                      "
                    >
                      {{
                        processInfo.result.selectedCsv[0]
                          ? processInfo.result.selectedCsv[0].name
                          : 'Import CSV file'
                      }}
                    </a-button>
                    <!-- <div style="text-align: center; height: 40px; padding-top: 6px">
                    <p style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap">
                      Select External CSV File
                    </p>
                  </div> -->
                  </div>
                </a-checkbox>
              </div>
            </a-tooltip>
          </a-card>
          <a-empty style="margin-top: 3rem" />
        </div>

        <!-- Operation Section -->
        <a-row justify="center" style="margin-top: 1rem" :gutter="20">
          <!-- Delete Item -->
          <a-col :span="2">
            <a-button
              style="width: 100%; padding: 0"
              size="large"
              danger
              @click="deleteTask"
              :disabled="
                processInfo.process.selectedItems.length < 1 ||
                processStatus.outlier == 1 ||
                processStatus.result == 1
              "
            >
              <DeleteOutlined />
            </a-button>
          </a-col>

          <!-- Preview Result -->
          <a-col :span="5">
            <a-button
              style="width: 100%; height: 100%; padding: 0"
              size="large"
              :disabled="
                processInfo.process.selectedItems.length != 1 ||
                processStatus.outlier == 1 ||
                processStatus.result == 1
              "
              @click="getCsv('preview')"
            >
              <i id="test" class="bi bi-table" style="margin-right: 5px; font-size: 18px"></i>
              Preview</a-button
            >
          </a-col>

          <!-- Download Result -->
          <a-col :span="5">
            <a-button
              style="width: 100%; height: 100%; padding: 0"
              size="large"
              :disabled="
                processInfo.process.selectedItems.length < 1 ||
                processStatus.outlier == 1 ||
                processStatus.result == 1
              "
              @click="getCsv('download')"
            >
              <i
                id="test"
                class="bi bi-database-add"
                style="margin-right: 5px; font-size: 18px"
              ></i>
              Download</a-button
            >
          </a-col>

          <!-- Detect Outliers -->
          <a-col :span="6">
            <a-button
              style="width: 100%; height: 100%; padding: 0"
              size="large"
              @click="getOutlier()"
              :disabled="
                processInfo.process.selectedItems.length != 1 ||
                processStatus.process == 1 ||
                processStatus.outlier == 1 ||
                processStatus.result == 1
              "
            >
              <i class="bi bi-radar" style="margin-right: 5px; font-size: 18px"></i>
              Get Outliers</a-button
            ></a-col
          >

          <!-- Generate Report -->
          <a-col :span="6">
            <a-button
              style="width: 100%; padding: 0"
              size="large"
              @click="getReport()"
              :loading="processStatus.result == 1"
              :disabled="
                (processInfo.process.selectedItems.length < 1 &&
                  !processInfo.process.selectedExternal) ||
                processStatus.process == 1 ||
                processStatus.outlier == 1 ||
                processStatus.result == 1
              "
            >
              <i class="bi bi-clipboard-data" style="margin-right: 5px; font-size: 18px"></i>Get
              Report</a-button
            >
          </a-col>
        </a-row>

        <!-- Hidden Function Section -->
        <div id="bottom-anchor">
          <!-- Result Section -->
          <a-flex v-if="csvdata.length > 0" gap="middle" vertical>
            <br>
            <a-card hoverable>
              <a-flex gap="middle" vertical style="width: 100%">
                <h2><i class="bi bi-kanban"></i> Output Data:</h2>
                <h3>Shape: {{ csvdata.length }} × {{ headers.length - 1 }}</h3>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th
                          v-for="(header, index) in headers.filter((item) => item !== 'log')"
                          :key="index"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, rowIndex) in csvdata.slice(0, 50)" :key="rowIndex">
                        <td>
                          {{ rowIndex + 1 }}
                        </td>
                        <td
                          v-for="(header, colIndex) in headers.filter((item) => item !== 'log')"
                          :key="colIndex"
                        >
                          {{ item[header] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <a-divider v-if="headers.filter((item) => item == 'log').length > 0" />
                <a-collapse v-if="headers.filter((item) => item == 'log').length > 0">
                  <a-collapse-panel header="log">
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            <!-- <th>Index</th> -->
                            <th
                              v-for="(header, index) in headers.filter(
                                (item) => item == 'file' || item == 'log'
                              )"
                              :key="index"
                            >
                              {{ header }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, rowIndex) in csvdata.filter((item) => item.log)"
                            :key="rowIndex"
                          >
                            <!-- <td>
                              {{ rowIndex + 1 }}
                            </td> -->
                            <td
                              v-for="(header, colIndex) in headers.filter(
                                (item) => item == 'file' || item == 'log'
                              )"
                              :key="colIndex"
                            >
                              {{ item[header] }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </a-collapse-panel>
                </a-collapse>
              </a-flex>
            </a-card>
          </a-flex>

          <!-- Outlier Section  -->
          <a-flex v-if="showOutlier" gap="middle" vertical>
            <a-spin
              size="large"
              :indicator="indicator"
              :spinning="processStatus.outlier == 1"
              tip="Task is running..."
            >
              <!-- Select Detector -->
              <a-card hoverable>
                <a-flex vertical gap="middle">
                  <h2><i class="bi bi-exclamation-square"></i> Select Outlier Detector:</h2>

                  <a-select
                    size="large"
                    ref="select"
                    style="width: 100%; margin-block: 10px"
                    v-model:value="processInfo.outlier.detector"
                    :options="detectorSelect"
                    @click="
                      () => {
                        processInfo.outlier.iconLoading = false
                      }
                    "
                  >
                  </a-select>
                </a-flex>
              </a-card>

              <br>

              <!-- Advanced Configuration -->
              <a-card hoverable>
                <a-flex vertical gap="middle">
                  <h2><i class="bi bi-columns-gap"></i> Configure Detection Parameters:</h2>

                  <a-cascader
                    popupClassName="popupClass"
                    expand-trigger="hover"
                    multiple
                    size="large"
                    style="width: 100%; margin-block: 10px"
                    v-model:value="processInfo.outlier.columns"
                    change-on-select
                    placeholder="Please select the columns to detect"
                    :options="columnSelect"
                  />
                </a-flex>
              </a-card>

              <!-- Submit Detection -->
              <a-row justify="center" :gutter="40" style="margin-top: 2rem">
                <a-col :span="12">
                  <a-button
                    :disabled="!processInfo.outlier.iconLoading"
                    style="width: 100%; padding: 0"
                    size="large"
                    type="primary"
                    danger
                    @click="stopOutlierTask"
                  >
                    <i class="bi bi-stop-circle" style="font-size: 18px; margin-inline: 5px"></i>
                    Stop
                  </a-button>
                </a-col>
                <a-col :span="12">
                  <a-button
                    style="width: 100%"
                    size="large"
                    type="primary"
                    :loading="processInfo.outlier.iconLoading"
                    :disabled="
                      processInfo.process.selectedItems.length !== 1 ||
                      processInfo.outlier.columns.length == 0
                    "
                    @click="startOutlierTask"
                  >
                    <i v-if="outlierEta > 0">ETA: {{ outlierEta }} s</i>
                    <i v-else class="bi bi-play" style="font-style: normal; margin-inline: 5px"></i>
                    Start
                  </a-button>
                </a-col>
              </a-row>

              <!-- Outlier Result -->
              <a-alert
                v-if="processStatus.outlier == 2"
                style="margin-top: 2rem"
                message="Outliers"
                :description="'There are ' + outlierLength + ' outliers'"
                type="info"
                show-icon
                closable
              />
            </a-spin>
          </a-flex>

          <!-- Report Section -->
          <a-flex v-if="showReport" gap="middle" vertical>
            <a-spin
              size="large"
              :indicator="indicator"
              :spinning="processStatus.result == 1"
              tip="Task is running..."
            >
              <!-- Config Report -->
              <a-card hoverable>
                <a-flex gap="middle" vertical style="width: 100%">
                  <h2><i class="bi bi-kanban"></i> Generate EDA Report:</h2>
                  <h3>Select data source:</h3>
                  <a-radio-group v-model:value="generateExternal">
                    <a-row>
                      <a-col :span="12">
                        <a-radio :value="false">From Scan Task</a-radio>
                      </a-col>
                      <a-col :span="12">
                        <a-radio :value="true">External CSV</a-radio>
                      </a-col>
                    </a-row>
                  </a-radio-group>

                  <h3>Report configurations:</h3>
                  <a-row justify="center" :gutter="40">
                    <a-col :span="12">
                      <a-input-number
                        size="large"
                        style="width: 85%"
                        v-model:value="processInfo.result.downsample"
                        addon-before="Subsample"
                        addon-after="%"
                        placeholder="100"
                        min="1"
                        max="100"
                      />
                    </a-col>
                    <a-col :span="12">
                      <a-checkbox
                        style="font-size: 17px"
                        size="large"
                        v-model:checked="processInfo.result.minimal"
                        >Minimal</a-checkbox
                      >
                    </a-col>
                  </a-row>
                </a-flex>
              </a-card>

              <!-- Submit Report Task-->
              <a-row justify="center" :gutter="40" style="margin-block: 2rem">
                <a-col :span="24">
                  <a-button
                    size="large"
                    :disabled="
                      processStatus.result == 1 ||
                      (generateExternal && !processInfo.process.selectedExternal) ||
                      (!generateExternal && processInfo.process.selectedItems.length < 1)
                    "
                    style="width: 100%"
                    type="primary"
                    @click="generateReport"
                    ><i class="bi bi-play" style="font-size: 18px; margin-inline: 5px"></i>
                    Start</a-button
                  >
                </a-col>
              </a-row>
            </a-spin>
          </a-flex>
        </div>
      </a-spin>
    </a-card>
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { json2csv } from 'json-2-csv'
import { DeleteOutlined } from '@ant-design/icons-vue'
import type { SelectProps, CascaderProps } from 'ant-design-vue'
import { notification } from 'ant-design-vue'
import { h } from 'vue'
import { SyncOutlined } from '@ant-design/icons-vue'
import Papa from 'papaparse'

const csvdata = ref([])
const headers = ref([])
const API = useApi()
const processStatus = useStatus()
const processInfo = ref(useInfo())
const route = useRoute()
const router = useRouter()
const showReport = ref(false)
const showOutlier = ref(false)
const uploadRef = ref(null)
const generateExternal = ref(false)
const tasksToUpdateOnPage = ref([])

const outlierEta = ref(-1)
const outlierLength = ref(0)
let checkOutlierInterval = null

const indicator = h(SyncOutlined, {
  style: {
    fontSize: '50px',
    // color:'red',
    fontWeight: 'bold',
    marginLeft: '-25px',
    marginTop: '-40px'
  },
  spin: true
})

const tip = computed(() => {
  if (processStatus.preprocess == 1) {
    return 'Task is running...'
  } else if (processStatus.app == 1) {
    return 'Getting data from server...'
  } else {
    return false
  }
})

// const colorCustom = (percent) => {
//   if (percent >= 100) {
//     return 'background-color: rgba(162, 165, 166,0.2)'
//   } else if (percent == -1) {
//     return 'background-color: rgba(250, 33, 25, 0.3)'
//   } else if (percent == 0) {
//     return 'background-color: rgba(162, 165, 166,0.3)'
//   } else {
//     return 'background-color: rgba(162, 165, 166,0.2)'
//   }
// }

const detectorSelect = ref<SelectProps['options']>([
  {
    value: 'ECOD',
    label: 'ECOD'
  },
  {
    value: 'CBLOF',
    label: 'CBLOF'
  },
  {
    value: 'IForest',
    label: 'IForest'
  },
  {
    value: 'KNN',
    label: 'KNN'
  },
  {
    value: 'COPOD',
    label: 'COPOD'
  },
  {
    value: 'PCA',
    label: 'PCA'
  }
])

const columnSelect = ref<CascaderProps['options']>([
  {
    value: 'Face:BQAT',
    label: 'Face:BQAT',
    disabled: true,
    children: [
      {
        value: 'confidence',
        label: 'Confidence'
      },
      {
        value: 'ipd',
        label: 'IPD'
      },
      {
        value: 'yaw_degree',
        label: 'Yaw Degree'
      },
      {
        value: 'pitch_degree',
        label: 'Pitch Degree'
      },
      {
        value: 'roll_degree',
        label: 'Roll Degree'
      }
    ]
  },
  {
    value: 'Face:OFIQ',
    label: 'Face:OFIQ',
    disabled: true,
    children: [
      {
        label: 'quality',
        value: 'quality'
      },
      {
        label: 'unified_quality_score',
        value: 'unified_quality_score'
      },
      {
        label: 'background_uniformity',
        value: 'background_uniformity'
      },
      {
        label: 'illumination_uniformity',
        value: 'illumination_uniformity'
      },
      {
        label: 'luminance_mean',
        value: 'luminance_mean'
      },
      {
        label: 'luminance_variance',
        value: 'luminance_variance'
      },
      {
        label: 'under_exposure_prevention',
        value: 'under_exposure_prevention'
      },
      {
        label: 'over_exposure_prevention',
        value: 'over_exposure_prevention'
      },
      {
        label: 'dynamic_range',
        value: 'dynamic_range'
      },
      {
        label: 'sharpness',
        value: 'sharpness'
      },
      {
        label: 'compression_artifacts',
        value: 'compression_artifacts'
      },
      {
        label: 'natural_colour',
        value: 'natural_colour'
      },
      {
        label: 'single_face_present',
        value: 'single_face_present'
      },
      {
        label: 'eyes_open',
        value: 'eyes_open'
      },
      {
        label: 'mouth_closed',
        value: 'mouth_closed'
      },
      {
        label: 'eyes_visible',
        value: 'eyes_visible'
      },
      {
        label: 'mouth_occlusion_prevention',
        value: 'mouth_occlusion_prevention'
      },
      {
        label: 'face_occlusion_prevention',
        value: 'face_occlusion_prevention'
      },
      {
        label: 'inter_eye_distance',
        value: 'inter_eye_distance'
      },
      {
        label: 'head_size',
        value: 'head_size'
      },
      {
        label: 'leftward_crop_of_the_face_image',
        value: 'leftward_crop_of_the_face_image'
      },
      {
        label: 'rightward_crop_of_the_face_image',
        value: 'rightward_crop_of_the_face_image'
      },
      {
        label: 'downward_crop_of_the_face_image',
        value: 'downward_crop_of_the_face_image'
      },
      {
        label: 'upward_crop_of_the_face_image',
        value: 'upward_crop_of_the_face_image'
      },
      {
        label: 'head_pose_yaw',
        value: 'head_pose_yaw'
      },
      {
        label: 'head_pose_pitch',
        value: 'head_pose_pitch'
      },
      {
        label: 'head_pose_roll',
        value: 'head_pose_roll'
      },
      {
        label: 'expression_neutrality',
        value: 'expression_neutrality'
      },
      {
        label: 'no_head_coverings',
        value: 'no_head_coverings'
      },
      {
        label: 'unified_quality_score',
        value: 'unified_quality_score'
      },

      {
        label: 'unified_quality_score.scalar',
        value: 'unified_quality_score.scalar'
      },
      {
        label: 'background_uniformity.scalar',
        value: 'background_uniformity.scalar'
      },
      {
        label: 'illumination_uniformity.scalar',
        value: 'illumination_uniformity.scalar'
      },
      {
        label: 'luminance_mean.scalar',
        value: 'luminance_mean.scalar'
      },
      {
        label: 'luminance_variance.scalar',
        value: 'luminance_variance.scalar'
      },
      {
        label: 'under_exposure_prevention.scalar',
        value: 'under_exposure_prevention.scalar'
      },
      {
        label: 'over_exposure_prevention.scalar',
        value: 'over_exposure_prevention.scalar'
      },
      {
        label: 'dynamic_range.scalar',
        value: 'dynamic_range.scalar'
      },
      {
        label: 'sharpness.scalar',
        value: 'sharpness.scalar'
      },
      {
        label: 'compression_artifacts.scalar',
        value: 'compression_artifacts.scalar'
      },
      {
        label: 'natural_colour.scalar',
        value: 'natural_colour.scalar'
      },
      {
        label: 'single_face_present.scalar',
        value: 'single_face_present.scalar'
      },
      {
        label: 'eyes_open.scalar',
        value: 'eyes_open.scalar'
      },
      {
        label: 'mouth_closed.scalar',
        value: 'mouth_closed.scalar'
      },
      {
        label: 'eyes_visible.scalar',
        value: 'eyes_visible.scalar'
      },
      {
        label: 'mouth_occlusion_prevention.scalar',
        value: 'mouth_occlusion_prevention.scalar'
      },
      {
        label: 'face_occlusion_prevention.scalar',
        value: 'face_occlusion_prevention.scalar'
      },
      {
        label: 'inter_eye_distance.scalar',
        value: 'inter_eye_distance.scalar'
      },
      {
        label: 'head_size.scalar',
        value: 'head_size.scalar'
      },
      {
        label: 'leftward_crop_of_the_face_image.scalar',
        value: 'leftward_crop_of_the_face_image.scalar'
      },
      {
        label: 'rightward_crop_of_the_face_image.scalar',
        value: 'rightward_crop_of_the_face_image.scalar'
      },
      {
        label: 'downward_crop_of_the_face_image.scalar',
        value: 'downward_crop_of_the_face_image.scalar'
      },
      {
        label: 'upward_crop_of_the_face_image.scalar',
        value: 'upward_crop_of_the_face_image.scalar'
      },
      {
        label: 'head_pose_yaw.scalar',
        value: 'head_pose_yaw.scalar'
      },
      {
        label: 'head_pose_pitch.scalar',
        value: 'head_pose_pitch.scalar'
      },
      {
        label: 'head_pose_roll.scalar',
        value: 'head_pose_roll.scalar'
      },
      {
        label: 'expression_neutrality.scalar',
        value: 'expression_neutrality.scalar'
      },
      {
        label: 'no_head_coverings.scalar',
        value: 'no_head_coverings.scalar'
      }
    ]
  },
  {
    value: 'Face:BIQT',
    label: 'Face:BIQT',
    disabled: true,
    children: [
      {
        value: 'background_deviation',
        label: 'background_deviation'
      },
      {
        value: 'background_grayness',
        label: 'background_grayness'
      },
      {
        value: 'blur',
        label: 'blur'
      },
      {
        value: 'blur_face',
        label: 'blur_face'
      },
      {
        value: 'focus',
        label: 'focus'
      },
      {
        value: 'focus_face',
        label: 'focus_face'
      },
      {
        value: 'openbr_IPD',
        label: 'openbr_IPD'
      },
      {
        value: 'openbr_confidence',
        label: 'openbr_confidence'
      },

      {
        value: 'opencv_IPD',
        label: 'opencv_IPD'
      },
      {
        value: 'opencv_eye_count',
        label: 'opencv_eye_count'
      },
      {
        value: 'opencv_face_found',
        label: 'opencv_face_found'
      },
      {
        value: 'opencv_face_height',
        label: 'opencv_face_height'
      },
      {
        value: 'opencv_face_width',
        label: 'opencv_face_width'
      },
      {
        value: 'opencv_frontal_face_found',
        label: 'opencv_frontal_face_found'
      },
      {
        value: 'opencv_landmarks_count',
        label: 'opencv_landmarks_count'
      },
      {
        value: 'opencv_mouth_count',
        label: 'opencv_mouth_count'
      },

      {
        value: 'opencv_nose_count',
        label: 'opencv_nose_count'
      },
      {
        value: 'opencv_profile_face_found',
        label: 'opencv_profile_face_found'
      },
      {
        value: 'over_exposure',
        label: 'over_exposure'
      },
      {
        value: 'over_exposure_face',
        label: 'over_exposure_face'
      },
      {
        value: 'quality',
        label: 'quality'
      },

      {
        label: 'sap_code',
        value: 'sap_code'
      },
      {
        label: 'skin_ratio_face',
        value: 'skin_ratio_face'
      },
      {
        label: 'skin_ratio_full',
        value: 'skin_ratio_full'
      },
      {
        label: 'image_area',
        value: 'image_area'
      },
      {
        label: 'image_channels',
        value: 'image_channels'
      },
      {
        label: 'image_height',
        value: 'image_height'
      },
      {
        label: 'image_ratio',
        value: 'image_ratio'
      },
      {
        label: 'image_width',
        value: 'image_width'
      },
      {
        label: 'openbr_left_eye_x',
        value: 'openbr_left_eye_x'
      },
      {
        label: 'openbr_left_eye_y',
        value: 'openbr_left_eye_y'
      },
      {
        label: 'openbr_right_eye_x',
        value: 'openbr_right_eye_x'
      },
      {
        label: 'openbr_right_eye_y',
        value: 'openbr_right_eye_y'
      },
      {
        label: 'opencv_face_center_of_mass_x',
        value: 'opencv_face_center_of_mass_x'
      },
      {
        label: 'opencv_face_center_of_mass_y',
        value: 'opencv_face_center_of_mass_y'
      },
      {
        label: 'opencv_face_offset_x',
        value: 'opencv_face_offset_x'
      },
      {
        label: 'opencv_face_offset_y',
        value: 'opencv_face_offset_y'
      },
      {
        label: 'opencv_face_x',
        value: 'opencv_face_x'
      },
      {
        label: 'opencv_face_y',
        value: 'opencv_face_y'
      },
      {
        label: 'opencv_left_eye_x',
        value: 'opencv_left_eye_x'
      },
      {
        label: 'opencv_left_eye_y',
        value: 'opencv_left_eye_y'
      },
      {
        label: 'opencv_mouth_x',
        value: 'opencv_mouth_x'
      },
      {
        label: 'opencv_mouth_y',
        value: 'opencv_mouth_y'
      },
      {
        label: 'opencv_nose_x',
        value: 'opencv_nose_x'
      },
      {
        label: 'opencv_nose_y',
        value: 'opencv_nose_y'
      },
      {
        label: 'opencv_right_eye_x',
        value: 'opencv_right_eye_x'
      },
      {
        label: 'opencv_right_eye_y',
        value: 'opencv_right_eye_y'
      }
    ]
  },
  {
    value: 'Fingerprint',
    label: 'Fingerprint',
    disabled: true,
    children: [
      {
        value: 'NFIQ2',
        label: 'NFIQ2'
      },
      {
        value: 'UniformImage',
        label: 'Uniform Image'
      },
      {
        value: 'EmptyImageOrContrastTooLow',
        label: 'Empty Image Or Contrast Too Low'
      },
      {
        value: 'SufficientFingerprintForeground',
        label: 'Sufficient Fingerprint Foreground'
      },
      {
        value: 'EdgeStd',
        label: 'Edge Std'
      }
    ]
  },
  {
    value: 'Iris',
    label: 'Iris',
    disabled: true,
    children: [
      {
        value: 'iso_overall_quality',
        label: 'ISO Overall Quality'
      },
      {
        value: 'iso_sharpness',
        label: 'ISO Sharpness'
      },
      {
        value: 'iso_iris_sclera_contrast',
        label: 'ISO Iris Sclera Contrast'
      },
      {
        value: 'iso_iris_pupil_contrast',
        label: 'ISO Iris Pupil Contrast'
      },
      {
        value: 'iso_iris_pupil_concentricity',
        label: 'ISO Iris Pupil Concentricity'
      }
    ]
  }
])

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
  } else if (type == 'csverror') {
    notification['error']({
      message: 'CSV Syntax Error',
      description: 'Invalid delimiter found. Only commas are allowed.',
      placement: 'top',
      duration: 1
    })
  }
}

const selectTask = (e, item) => {
  showOutlier.value = false
  showReport.value = false
  csvdata.value = []
  const selectedItem = {
    tid: item.tid,
    id: item.collection,
    modality: item.mode,
    engine: item.engine,
    num: item.num,
    total: item.total,
    input: item.input,
    elaspe: item.elapse
  }
  if (e.target.checked) {
    processInfo.value.process.selectedItems.push(selectedItem)
    processInfo.value.outlier.columns = []
  } else {
    const index = processInfo.value.process.selectedItems.findIndex(
      (i) => i.tid === selectedItem.tid
    )
    if (index > -1) {
      processInfo.value.process.selectedItems.splice(index, 1)
    }
  }
}

const scrollToBottom = () => {
  // Scroll to the bottom of the page
  setTimeout(() => {
    const bottomAnchor = document.getElementById('bottom-anchor')
    if (bottomAnchor) {
      bottomAnchor.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

const deleteTask = async () => {
  for (const item of processInfo.value.process.selectedItems) {
    // Removing the item from taskList
    const taskIndex = processInfo.value.process.taskList.findIndex(
      (taskList) => taskList.tid === item.tid
    )
    if (taskIndex !== -1) {
      processInfo.value.process.taskList.splice(taskIndex, 1)
    }

    // Removing the item from taskStatus
    const statusIndex = processInfo.value.process.taskStatus.findIndex(
      (taskStatus) => taskStatus.tid === item.tid
    )
    if (statusIndex !== -1) {
      processInfo.value.process.taskStatus.splice(statusIndex, 1)
    }
    const url = `${API.api}/task/${item.tid}/`
    await API.authFetch(url, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          openNotificationWithIcon('error')
          throw new Error('Failed to delete task')
        }
        return response.json()
      })
      .then((data) => {
        openNotificationWithIcon('delete')
        console.log('delete task', data)
      })
      .catch((error) => {
        console.error('Error delete task:', error)
      })
    const url2 = `${API.api}/scan/${item.id}/profiles`
    await API.authFetch(url2, {
      method: 'DELETE',
      headers: { accept: 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to delete test profiles')
        }
        return response.json()
      })
      .then((data) => {
        console.log('delete test profiles', data)
      })
      .catch((error) => {
        console.error('Error delete test profiles:', error)
      })
  }
  processInfo.value.process.selectedItems = []
}

const clearTask = async () => {
  const data = await checkRunning()
  const task_id = data.tid
  const type = data.type
  const url2 = `${API.api}/task/${task_id}/cancel?type=${type}`
  await API.authFetch(url2, {
    method: 'POST',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      openNotificationWithIcon('stop')
      initialiseTask()
      processInfo.value.process.timer == -1
      processInfo.value.process.timeRecord == 0
    })
    .catch((error) => {
      console.error('Error cancel task:', error)
    })
}

const checkRunning = async () => {
  const url = `${API.api}/task/metadata`
  try {
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (!response.ok) {
      openNotificationWithIcon('error')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error check runnning task:', error)
  }
}

//add selected item to generating report
const getReport = () => {
  showOutlier.value = false
  showReport.value = true
  csvdata.value = []
  scrollToBottom()
  if (processInfo.value.process.selectedExternal) {
    generateExternal.value = true
  }
}

//Get the last scan task and go check result page
const checkModeTab = () => {
  if (generateExternal.value) {
    processInfo.value.result.activeKey = 4
  } else if (
    processInfo.value.process.selectedItems[processInfo.value.process.selectedItems.length - 1]
  ) {
    const mode =
      processInfo.value.process.selectedItems[processInfo.value.process.selectedItems.length - 1]
        .modality
    if (mode == 'face') {
      processInfo.value.result.activeKey = 0
    } else if (mode == 'fingerprint') {
      processInfo.value.result.activeKey = 1
    } else if (mode == 'iris') {
      processInfo.value.result.activeKey = 2
    } else {
      processInfo.value.result.activeKey = 3
    }
  }

  router.push({ path: '/result' })
}

//add selected item to generating csv
const getCsv = async (type) => {
  for (const item of processInfo.value.process.selectedItems) {
    const url = `${API.api}/scan/${item.id}/profiles`
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (response.ok) {
      const data = await response.json()
      if (type == 'preview') {
        // console.log(data)
        csvdata.value = data
        showOutlier.value = false
        showReport.value = false
        if (data.length > 0) {
          if (data.length > 0) {
            const allHeaders = new Set() // Use a Set to avoid duplicates
            data.forEach((row) => {
              Object.keys(row).forEach((key) => allHeaders.add(key))
            })
            headers.value = Array.from(allHeaders) // Convert Set to Array for headers
          }
          scrollToBottom()
        }
      } else {
        downloadCsv(data)
      }
    }
  }
}

const downloadCsv = async (data) => {
  const csv = await json2csv(data)

  // Create a Blob from the CSV
  const blob = new Blob([csv], { type: 'text/csv' })

  // Create a link element
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'data.csv'

  // Append the link to the body
  document.body.appendChild(link)

  // Programmatically click the link to trigger the download
  link.click()

  // Remove the link from the document
  document.body.removeChild(link)
}

const getOutlier = () => {
  columnSelect.value.forEach((item) => (item.disabled = true))
  let mode = processInfo.value.process.selectedItems[0].modality
  mode = processInfo.value.process.selectedItems[0].engine
    ? mode + processInfo.value.process.selectedItems[0].engine
    : mode
  console.log(mode)
  switch (mode) {
    case 'facebqat':
      columnSelect.value[0].disabled = false
      break
    case 'faceofiq':
      columnSelect.value[1].disabled = false
      break
    case 'facebiqt':
      columnSelect.value[2].disabled = false
      break
    case 'fingerprint':
      columnSelect.value[3].disabled = false
      break
    case 'iris':
      columnSelect.value[4].disabled = false
      break
    default:
      console.error('Unknown engine:', mode)
      break
  }
  showOutlier.value = true
  showReport.value = false
  csvdata.value = []
  scrollToBottom()
}

//Tool to format timestamp to hh:mm:ss
const formatSeconds = computed(() => {
  if (processInfo.value.process.timer == -1 && processInfo.value.process.timeRecord == 0) {
    return `00:00:00`
  }
  const hours = Math.floor(processInfo.value.process.timeRecord / 3600)
  const minutes = Math.floor((processInfo.value.process.timeRecord % 3600) / 60)
  const remainingSeconds = processInfo.value.process.timeRecord % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
})

const formatETA = computed(() => {
  const item = processInfo.value.process.taskStatus.filter((item) => item.status != 2)
  const eta = item[0].eta
  if (eta == 0 || !eta) {
    return `00:00:00`
  }
  const hours = Math.floor(eta / 3600)
  const minutes = Math.floor((eta % 3600) / 60)
  const remainingSeconds = eta % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
})

const intervalGap = ref(1000)
//Interval to check whether there are tasks need to update progress
//update task withid(no new) and unfinished task
const checkTaskStatus = setInterval(() => {
  tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
    (item) => item.status != 2
  )
  if (tasksToUpdateOnPage.value.length > 0) {
    getTaskETA(tasksToUpdateOnPage.value)
  } else {
    clearInterval(checkTaskStatus)
    processInfo.value.process.timer = -1
    processInfo.value.process.timeRecord = 0
  }
}, intervalGap.value)
//Update the progress as task going
//Notes: update to only one task can be runnning at one time
const getTaskETA = async (tasksToUpdate) => {
  for (const item of tasksToUpdate) {
    const url = `${API.api}/task/${item.tid}/status`
    try {
      const response = await API.authFetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (!response.ok) {
        console.log('can not find task progress')
        throw new Error('Error getting task status')
      }
      const data = await response.json()
      if (data.done != 0) {
        item.eta = data.eta
        item.percent = Math.floor((data.done * 100) / data.total)
        item.num = data.done

        if (data.done == data.total) {
          item.percent = 100
          item.status = 2
          
          const index = processInfo.value.process.taskList.findIndex(
            (x) => x.collection === item.collection
          )
          if (index == -1) processInfo.value.process.taskList.push(item)
          processStatus.updateStatus('process', 2)
        }
      }
    } catch (error) {
      // If the task status can not be found, finish too fast
      console.error('Error getting task status:', error)

      const url1 = `${API.api}/task/logs/scan/${item.tid}`
      const response = await API.authFetch(url1, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (!response.ok) {
        console.log('can not find task log')

      }
      const data = await response.json()
      if (data[0].status == 2) {
        item.eta = 0
        item.percent = 100
        item.status = 2
        item.num = data[0].finished
        item.elapse = data[0].elapse

        const index = processInfo.value.process.taskList.findIndex(
          (x) => x.collection === item.collection
        )
        if (index == -1) processInfo.value.process.taskList.push(item)
        processStatus.updateStatus('process', 2)
      }
    }
  }
}

//Update the task info
const updateTaskStatus = async (tasksToUpdate) => {
  for (const item of tasksToUpdate) {
    const url = `${API.api}/task/logs/scan/${item.tid}`
    try {
      const response = await API.authFetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to log task')
      }
      const tempData = await response.json()
      const data = tempData[0]
      if (data) {
        item.collection = data.collection
        item.mode = data.options.mode
        item.engine = data.options.engine
        item.num = data.finished
        item.total = data.total
        item.modified = data.modified
        item.input = data.input
        item.status = data.status
        item.elapse = data.elapse
      }
      if (data.total > 500) {
        intervalGap.value = 5000
        console.log('update interval gep')
        clearInterval(checkTaskStatus)
        const largecheckTaskStatus = setInterval(() => {
          tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
            (item) => item.status != 2
          )
          if (tasksToUpdateOnPage.value.length > 0) {
            setTimeout(() => {
              getTaskETA(tasksToUpdateOnPage.value)
            }, 1000)
          } else {
            processStatus.updateStatus('process', 2)
            clearInterval(largecheckTaskStatus)
          }
        }, intervalGap.value)
      }
    } catch (error) {
      console.error('Error logging task:', error)
    }
  }
}

const initialiseTask = async () => {
  const url = `${API.api}/task/logs/scan`
  try {
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to get task status')
    }
    const data = await response.json()
    if (data) {
      const finishedTasks = data.filter((displayItem) => displayItem.status == 2).reverse()
      processInfo.value.process.taskList = finishedTasks
      processInfo.value.process.taskStatus = finishedTasks.map((item) => {
        return {
          tid: item.tid,
          collection: item.collection,
          name: item.collection.substring(0, 5),
          status: item.status,
          percent: item.status == 2 ? 100 : Math.floor((item.finished * 100) / item.total),
          num: item.finished,
          total: item.total,
          mode: item.options.mode,
          engine: item.options.engine,
          input: item.input,
          modified: item.modified,
          elapse: item.elapse
        }
      })
      if (data.filter((displayItem) => displayItem.status == 1).length > 0) {
        const url = `${API.api}/task/metadata`
        await API.authFetch(url, {
          method: 'GET',
          headers: { accept: 'application/json' }
        })
          .then((response) => {
            processStatus.updateStatus('process', 2)
            if (!response.ok) {
              console.log('No running task')
            }
            return response.json()
          })
          .then((data) => {
            //Only one running item
            if (data.type == 'scan') {
              processStatus.updateStatus('process', 1)
              const runningItem = data
              const runningItemStatus = {
                tid: runningItem.tid,
                collection: runningItem.collection,
                name: runningItem.collection.substring(0, 5),
                status: runningItem.status,
                percent:
                  runningItem.status == 2
                    ? 100
                    : Math.floor((runningItem.finished * 100) / runningItem.total),
                num: runningItem.finished,
                total: runningItem.total,
                mode: runningItem.options.mode,
                engine: runningItem.options.engine,
                input: runningItem.input,
                modified: runningItem.modified,
                elapse: runningItem.elapse
              }
              processInfo.value.process.taskStatus.unshift(runningItemStatus)
            }
          })
          .catch((error) => {
            console.error('Error get running task:', error)
          })
      }
      processStatus.updateStatus('app', 2)
    }
  } catch (error) {
    console.error('Error getting task status:', error)
  }
}

//everytime entry this page, check whether there are more tasks need to update taskStatus
onMounted(async () => {
  if (processInfo.value.process.timeStamp != '') {
    console.log('continue timer')
  } else {
    //first time, get timeStamp from scan page, start timmer&initialise taskStatus
    if (route.query.timeStamp) {
      processInfo.value.process.timeStamp = route.query.timeStamp.toString()
      console.log('start timer:', processInfo.value.process.timeStamp)
    }
    if (processInfo.value.process.taskList.length == 0) {
      processStatus.updateStatus('app', 1)
      initialiseTask()
    }
  }
  tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
    (item) => item.status != 2
  )
  if (tasksToUpdateOnPage.value.filter((item) => item.num == 0).length > 0) {
    updateTaskStatus(tasksToUpdateOnPage.value)
  }
})

const stopOutlierTask = async () => {
  processInfo.value.outlier.iconLoading = false
  const url = `${API.api}/task/${processInfo.value.outlier.id}/cancel?type=outlier`
  await API.authFetch(url, {
    method: 'POST',
    headers: { accept: 'application/json' }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to cancel task')
      }
      return response.json()
    })
    .then((data) => {
      clearInterval(checkOutlierInterval)
      processStatus.updateStatus('outlier', 2)
      processInfo.value.outlier.id = ''
      outlierEta.value = -1
    })
    .catch((error) => {
      console.error('Error cancel task:', error)
    })
}

const startOutlierTask = async () => {
  let optionColumns =
    processInfo.value.outlier.columns.length > 0
      ? processInfo.value.outlier.columns.map((item) => {
          if (item[1]) {
            return item[1]
          }
        })
      : []

  if (processInfo.value.outlier.columns.length == 1 && !processInfo.value.outlier.columns[0][1]) {
    const options = processInfo.value.outlier.columns[0][0]
    if (options.includes('Face')) {
      if (options.includes('BQAT')) {
        optionColumns = ['confidence', 'ipd', 'yaw_degree', 'pitch_degree', 'roll_degree']
      }
      if (options.includes('OFIQ')) {
        optionColumns = [
          'quality',
          'unified_quality_score',
          'background_uniformity',
          'illumination_uniformity',
          'luminance_mean',
          'luminance_variance',
          'under_exposure_prevention',
          'over_exposure_prevention',
          'dynamic_range',
          'sharpness',
          'compression_artifacts',
          'natural_colour',
          'single_face_present',
          'eyes_open',
          'mouth_closed',
          'eyes_visible',
          'mouth_occlusion_prevention',
          'face_occlusion_prevention',
          'inter_eye_distance',
          'head_size',
          'leftward_crop_of_the_face_image',
          'rightward_crop_of_the_face_image',
          'downward_crop_of_the_face_image',
          'upward_crop_of_the_face_image',
          'head_pose_yaw',
          'head_pose_pitch',
          'head_pose_roll',
          'expression_neutrality',
          'no_head_coverings',
          'unified_quality_score',
          'unified_quality_score.scalar',
          'background_uniformity.scalar',
          'illumination_uniformity.scalar',
          'luminance_mean.scalar',
          'luminance_variance.scalar',
          'under_exposure_prevention.scalar',
          'over_exposure_prevention.scalar',
          'dynamic_range.scalar',
          'sharpness.scalar',
          'compression_artifacts.scalar',
          'natural_colour.scalar',
          'single_face_present.scalar',
          'eyes_open.scalar',
          'mouth_closed.scalar',
          'eyes_visible.scalar',
          'mouth_occlusion_prevention.scalar',
          'face_occlusion_prevention.scalar',
          'inter_eye_distance.scalar',
          'head_size.scalar',
          'leftward_crop_of_the_face_image.scalar',
          'rightward_crop_of_the_face_image.scalar',
          'downward_crop_of_the_face_image.scalar',
          'upward_crop_of_the_face_image.scalar',
          'head_pose_yaw.scalar',
          'head_pose_pitch.scalar',
          'head_pose_roll.scalar',
          'expression_neutrality.scalar',
          'no_head_coverings.scalar'
        ]
      }
      if (options.includes('BIQT')) {
        optionColumns = [
          'background_deviation',
          'background_grayness',
          'blur',
          'blur_face',
          'focus',
          'focus_face',
          'openbr_IPD',
          'openbr_confidence',
          'opencv_IPD',
          'opencv_eye_count',
          'opencv_face_found',
          'opencv_face_height',
          'opencv_face_width',
          'opencv_frontal_face_found',
          'opencv_landmarks_count',
          'opencv_mouth_count',
          'opencv_nose_count',
          'opencv_profile_face_found',
          'over_exposure',
          'over_exposure_face',
          'quality',
          'sap_code',
          'skin_ratio_face',
          'skin_ratio_full',
          'image_area',
          'image_channels',
          'image_height',
          'image_ratio',
          'image_width',
          'openbr_left_eye_x',
          'openbr_left_eye_y',
          'openbr_right_eye_x',
          'openbr_right_eye_y',
          'opencv_face_center_of_mass_x',
          'opencv_face_center_of_mass_y',
          'opencv_face_offset_x',
          'opencv_face_offset_y',
          'opencv_face_x',
          'opencv_face_y',
          'opencv_left_eye_x',
          'opencv_left_eye_y',
          'opencv_mouth_x',
          'opencv_mouth_y',
          'opencv_nose_x',
          'opencv_nose_y',
          'opencv_right_eye_x',
          'opencv_right_eye_y'
        ]
      }
    }
    if (options == 'Fingerprint') {
      optionColumns = [
        'NFIQ2',
        'UniformImage',
        'EmptyImageOrContrastTooLow',
        'SufficientFingerprintForeground',
        'EdgeStd'
      ]
    }
    if (options == 'Iris') {
      optionColumns = [
        'iso_overall_quality',
        'iso_sharpness',
        'iso_iris_sclera_contrast',
        'iso_iris_pupil_contrast',
        'iso_iris_pupil_concentricity'
      ]
    }
  }

  const id = processInfo.value.process.selectedItems[0].id
  const url = `${API.api}/scan/${id}/outliers/detect?trigger=true`

  try {
    const response = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detector: processInfo.value.outlier.detector,
        columns: optionColumns
      })
    })

    if (!response.ok) {
      processInfo.value.outlier.iconLoading = false
      throw new Error('Failed to detect outlier')
    }
    const temp = await response.json()

    processInfo.value.outlier.id = temp['outlier detection task in progress']
    processInfo.value.outlier.iconLoading = true
    processStatus.updateStatus('outlier', 1)
    checkOutlierInterval = setInterval(() => {
      if (processInfo.value.outlier.id != '' && processStatus.outlier == 1) {
        getOutlierETA(processInfo.value.outlier.id)
        if (outlierEta.value <= 0 || outlierEta.value == null) {
          checkOutlier(id)
        }
      } else {
        clearInterval(checkOutlierInterval)
      }
    }, 1000)
  } catch (error) {
    console.error('Error detect outlier:', error)
    processInfo.value.outlier.iconLoading = false
  }
}

const checkOutlier = async (id) => {
  if (processInfo.value.outlier.id != '') {
    const url2 = `${API.api}/scan/${id}/outliers`
    await API.authFetch(url2, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then((response) => {
        if (!response.ok) {
          console.log('outliers have not ready')
        }
        const data = response.json()
        return data
      })
      .then((data) => {
        processStatus.updateStatus('outlier', 2)
        processInfo.value.outlier.id = ''
        processInfo.value.outlier.iconLoading = false
        clearInterval(checkOutlierInterval)
        if (data != null) {
          outlierLength.value = data.length
        }
        if (data.length > 0) {
          downloadOutlier(data)
        }
      })
      .catch((error) => {
        console.error('Error check outliers task status:', error)
      })
  }
}

const getOutlierETA = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const response = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (!response.ok) {
      console.log('can not find task progress')
    }
    const data = await response.json()
    if (data.done != 0) {
      outlierEta.value = data.eta
      if (data.eta == 0) {
        outlierEta.value = -1
        checkOutlier(processInfo.value.process.selectedItems[0].id)
        clearInterval(checkOutlierInterval)
      }
    }
  } catch (error) {
    console.error('Error getting task status:', error)
  }
}

const downloadOutlier = async (data) => {
  const csv = await json2csv(data)

  // Create a Blob from the CSV
  const blob = new Blob([csv], { type: 'text/csv' })

  // Create a link element
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'outlier.csv'

  // Append the link to the body
  document.body.appendChild(link)

  // Programmatically click the link to trigger the download
  link.click()

  // Remove the link from the document
  document.body.removeChild(link)
}

const csvGenerateReport = async () => {
  processStatus.updateStatus('result', 1)
  const formData = new FormData()
  formData.append(
    'file',
    processInfo.value.result.selectedCsv[0],
    processInfo.value.result.selectedCsv[0].name
  )
  const downsample =
    processInfo.value.result.downsample > 0 ? processInfo.value.result.downsample / 100 : 1

  const url = `${API.api}/scan/report/remote?trigger=true&minimal=${processInfo.value.result.minimal}&downsample=${downsample}`
  await API.authFetch(url, {
    method: 'POST',
    body: formData
  })
    .then((response) => {
      if (!response.ok) {
        processInfo.value.result.generatedReport = { id: '', blob: new Blob(), html: '' }
        processStatus.updateStatus('result', 2)
        throw new Error('Failed to generate report')
      }
      return response.json()
    })
    .then((data) => {
      const tid = data['reporting in progress']
      let generated = {
        tid: tid,
        html: '',
        blob: new Blob(),
        id: tid,
        name: tid.substring(0, 5),
        modality: '',
        engine: '',
        num: 0,
        total: 0,
        minimal: false,
        downsample: 100,
        modified: ''
      }
      processInfo.value.result.generatedReport = generated
    })
    .catch((error) => {
      processInfo.value.result.generatedReport = { id: '', blob: new Blob(), html: '' }
      processStatus.updateStatus('result', 2)
      console.error('Error generating task report:', error)
    })
}

const submitGenerate = async () => {
  for (const item of processInfo.value.result.generating) {
    const url = `${API.api}/scan/${item.id}/report/generate?trigger=true`
    const requestBody = {
      downsample:
        processInfo.value.result.downsample > 0 ? processInfo.value.result.downsample / 100 : 1,
      minimal: processInfo.value.result.minimal
    }
    await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(requestBody)
    })
      .then((response) => {
        if (!response.ok) {
          const index = processInfo.value.result.generating.indexOf(item)
          if (index !== -1) {
            processInfo.value.result.generating.splice(index, 1)
          }
          throw new Error('Failed to generate report')
        }
        return response.json()
      })
      .then((data) => {
        item.tid = data['reporting in progress']
        // console.log('submit report',item.tid)
      })
      .catch((error) => {
        console.error('Error generating task report:', error)
        const index = processInfo.value.result.generating.indexOf(item)
        if (index !== -1) {
          processInfo.value.result.generating.splice(index, 1)
        }
      })
  }
}

const uploadCsv = () => {
  if (uploadRef.value) {
    uploadRef.value.click()
  }
}

const validateCsv = (fileContent) => {
  // Check if semicolons or spaces are used as delimiters
  const hasInvalidDelimiter = /[\r\n][^,]*[; ][^,]*[;\r\n]/.test(fileContent)
  // Check if the content contains semicolons used as delimiters
  if (hasInvalidDelimiter) {
    console.error('Invalid delimiter found. Only commas are allowed.')
    openNotificationWithIcon('csverror')
    return false
  } else {
    // Parse the file with PapaParse
    Papa.parse(fileContent, {
      delimiter: ',', // Specify comma as the delimiter
      complete: function (results) {},
      error: function (error) {
        console.log('Parsing Error:', error)
        openNotificationWithIcon('csverror')
        return false
      }
    })
  }
  return true
}

const selectCsv = (event) => {
  const file = event.target.files[0]
  if (file) {
    console.log('File selected:', file)
    const reader = new FileReader()
    reader.onload = function (event) {
      const fileContent = event.target.result
      if (validateCsv(fileContent)) {
        processInfo.value.result.selectedCsv = [file]
      }
    }
    reader.readAsText(file)
  }
  processInfo.value.result.generatedReport = { id: '', blob: new Blob(), html: '' }
}

const generateReport = async () => {
  processStatus.updateStatus('result', 1)
  if (generateExternal.value) {
    console.log('generating external', processInfo.value.result.selectedCsv[0].name, ' report')
    await csvGenerateReport()
    processInfo.value.process.selectedExternal = false
  } else {
    const items = processInfo.value.process.selectedItems
    processInfo.value.result.generating = items
    console.log('generating', processInfo.value.result.generating.length, 'reports')
    await submitGenerate()
  }
  checkModeTab()
}

function capitalizeFirstLetter(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function truncateString(str: string, maxLength = 20) {
  if (str.length > maxLength) {
    return '...' + str.slice(-maxLength)
  }
  return str
}

function convertSecondsToHMS(seconds: number) {
    seconds = seconds | 0;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`;
}
</script>

<style>
.scroller {
  --scrollbar-color-thumb: hotpink;
  --scrollbar-color-track: blue;
  --scrollbar-width: thin;
  --scrollbar-width-legacy: 10px;
}
.table-container {
  width: 100%;
  max-height: 500px;
  height: auto;
  overflow-y: auto;
  overflow-x: scroll;
  border: 1px solid #ccc;
  position: relative;
}

table {
  width: 100%;
  overflow-x: scroll;
}

th,
td {
  border-right: 1px solid #ccc;
  border-bottom: 1px solid #ccc;
  padding: 5px;
  text-align: left;
  /* height: 40px; */
  vertical-align: middle;
  white-space: nowrap;
}
td {
  width: auto;
}

th {
  background-color: rgba(230, 230, 230, 1);
  position: sticky;
  top: -1px;
}

.processContainer {
  margin-top: 1rem;
  width: 80%;
  max-width: 1200px;
}

.processItem {
  padding-top: 1rem;
  height: 400px;
  display: flex;
  flex-wrap: wrap;
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  align-content: flex-start;
  overflow: scroll;
  background-color: rgba(245, 245, 245, 0.3);
}

.task-card-container {
  display: flex;
  flex-direction: column;
  justify-content: top;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem 0;
  height: 400px;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.taskStyle {
  border-radius: 10px;
  border: solid lightgrey 0.5px;
  width: 95%;
  margin-bottom: 1rem;
}
.progressStyle {
  margin-block: 6px;
  width: 85%;
}

.checkbox-hidden {
  display: block;
  width: 100%;
}
.checkbox-hidden .ant-checkbox {
  display: none;
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
  .processContainer {
    margin-top: 0rem;
  }

  .processItem {
    min-height: 500px;
  }

  .task-card-container {
    min-height: 550px;
    padding: 2rem 0;
  }
  .progressStyle {
    margin-block: 6px;
    width: 98%;
  }
}

[data-theme='dark'] {
  .processItem {
    background-color: rgba(245, 245, 245, 0.1);
  }
  .task-card-container {
    background-color: rgba(245, 245, 245, 0.1);
  }
  th {
    background-color: rgba(120, 120, 120, 1);
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
