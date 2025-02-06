<template>
  <a-flex class="processContainer" gap="middle" vertical>
    <a-card hoverable class="processCard">
      <a-spin
        size="large"
        style="margin-top: 20%; height: 100%"
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
                processInfo.process.taskStatus.filter((item) => item.status == 1).length > 0
                  ? processInfo.process.taskStatus
                      .filter((item) => item.status == 1)[0]
                      .name.toUpperCase() + ' '
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
            <a-statistic title="Elapsed Time" :value="formatSeconds" style="text-align: center">
              <template #prefix>
                <i class="bi bi-stopwatch"></i>
              </template>
            </a-statistic>
          </a-col>
          <a-col :span="6">
            <a-statistic
              title="ETC"
              :value="
                processInfo.process.taskStatus.filter((item) => item.status == 1).length > 0
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
              <template #prefix> <i class="bi bi-check2-circle"></i> </template>``
            </a-statistic>
          </a-col>
        </a-row>

        <!-- Stop Task Section -->
        <a-row justify="center" style="margin-block: 35px" gutter="30">
          <a-col :span="6">
            <a-button
              :disabled="
                processInfo.process.selectedItems.length !== 1 ||
                getResume ||
                getCancel ||
                getStop ||
                processInfo.process.selectedItems.filter((item) => item.status == 2).length > 0 ||
                (processStatus.process == 1 &&
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length == 0)
              "
              style="width: 100%; padding: 0px; overflow: hidden"
              danger
              @click="showCancelConfirm(processInfo.process.selectedItems[0].tid)"
              :loading="getCancel"
            >
              <i
                v-if="!getCancel"
                class="bi bi-stop-circle"
                style="font-size: 15px; margin-inline: 5px"
              ></i>
              Cancel Task
            </a-button>
          </a-col>
          <a-col :span="6">
            <a-button
              :disabled="
                processInfo.process.selectedItems.length !== 1 ||
                getResume ||
                getCancel ||
                getStop ||
                processInfo.process.selectedItems.filter((item) => item.status == 2).length > 0 ||
                processInfo.process.selectedItems.filter((item) => item.status !== 1).length > 0
              "
              style="width: 100%; padding: 0px; overflow: hidden"
              danger
              @click="stopTask(processInfo.process.selectedItems[0].tid)"
              :loading="getStop"
            >
              <i
                v-if="!getStop"
                class="bi bi-pause-circle"
                style="font-size: 15px; margin-inline: 5px"
              ></i>
              Stop Task
            </a-button>
          </a-col>
          <a-col :span="6">
            <a-button
              :disabled="
                processStatus.process == 1 ||
                processStatus.result == 1 ||
                processStatus.outlier == 1 ||
                getResume ||
                processInfo.process.selectedItems.length !== 1 ||
                processInfo.process.selectedItems.filter((item) => item.status == 2).length > 0
              "
              @click="resumeTask(processInfo.process.selectedItems[0].tid)"
              style="width: 100%; padding: 0px; overflow: hidden"
              danger
              :loading="getResume"
            >
              <!-- @click="resumeTask(processInfo.process.selectedItems[0].tid)" -->
              <i
                v-if="!getResume"
                class="bi bi-play-circle"
                style="font-size: 15px; margin-inline: 5px"
              ></i>
              Resume Task
            </a-button>
          </a-col>
        </a-row>

        <div
          class="processBoard"
          :style="{
            height:
              showPreview || showOutlier || showReport
                ? '450px'
                : isWideWindow
                  ? 'calc(100vh - 300px)'
                  : 'calc(100vh - 450px)'
          }"
        >
          <div
            class="processTask"
            :style="{
              height:
                showPreview || showOutlier || showReport
                  ? '400px'
                  : isWideWindow
                    ? 'calc(100vh - 525px)'
                    : 'calc(100vh - 620px)'
            }"
          >
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
                    ? item.status != 2
                      ? 'rgba(200, 200, 200,0.7)'
                      : 'rgba(200, 200, 200,0.7)'
                    : 'rgba(200, 200, 200,0.2)'
                }"
              >
                <a-tooltip
                  :title="`${formatDate(
                    item.modified
                  )} | ${convertSecondsToHMS(Number(item.elapse))} ${item.logs.length > 0 ? ' | ' + item.logs[0] : ''}`"
                >
                  <div style="width: 100%">
                    <a-checkbox
                      class="checkbox-hidden"
                      v-model:checked="processInfo.process.selectedItems[item.tid]"
                      @change="(e) => selectTask(e, item)"
                    >
                      <a-spin :spinning="item.status == 1">
                        <div
                          style="
                            display: flex;
                            flex-direction: row;
                            height: 35px;
                            margin-top: -20px;
                            padding-top: 5px;
                            padding-inline: 10px;
                          "
                        >
                          <p
                            style="
                              padding: 5px;
                              text-align: end;
                              font-size: medium;
                              font-weight: normal;
                            "
                          >
                            {{ item.name.toUpperCase() }}:
                          </p>
                          <a-progress
                            class="progressStyle"
                            :size="[300, 20]"
                            :stroke-color="{ '0%': '#ff1a2d', '100%': '#99000d' }"
                            :percent="item.percent"
                            :status="
                              item.status == 3
                                ? 'exception'
                                : item.status == 2
                                  ? 'success'
                                  : 'normal'
                            "
                          />
                        </div>
                        <div
                          style="
                            text-align: center;
                            padding-inline: 10px;
                            height: 40px;
                            padding-top: 2px;
                            width: 100%;
                          "
                        >
                          <p
                            style="
                              overflow: hidden;
                              text-overflow: ellipsis;
                              white-space: nowrap;
                              width: 100%;
                              font-size: medium;
                              padding-left: 5px;
                            "
                          >
                            Input: {{ truncateString(item.input) }} | Modality:
                            {{ capitalizeFirstLetter(item.mode) }} | Engine:
                            {{
                              item.engine
                                ? item.engine == 'fusion'
                                  ? 'Fusion'
                                  : item.engine.toUpperCase()
                                : 'Default'
                            }}
                            | Data: {{ item.num }}/{{ item.total }}
                          </p>
                        </div>
                      </a-spin>
                    </a-checkbox>
                  </div>
                </a-tooltip>
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
                      <div
                        style="display: flex; flex-direction: row; height: 35px; margin-top: -12px"
                      >
                        <h3
                          style="
                            padding-inline: 6px;
                            align-self: center;
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
                          style="
                            width: 80%;
                            text-overflow: ellipsis;
                            overflow: hidden;
                            margin-top: -2px;
                          "
                          :disabled="
                            tip !== false ||
                            processStatus.outlier == 1 ||
                            processStatus.preprocess == 1
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
                      <div
                        style="display: flex; flex-direction: row; height: 35px; margin-top: -15px"
                      >
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
                            tip !== false ||
                            processStatus.outlier == 1 ||
                            processStatus.preprocess == 1
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
          </div>
          <!-- Operation Section -->
          <a-row justify="center" style="margin-block: 30px" :gutter="20">
            <!-- Delete Item -->
            <a-col :span="2">
              <a-button
                style="width: 100%; padding: 0"
                size="large"
                danger
                @click="showDeleteConfirm"
                :disabled="
                  processInfo.process.selectedItems.length < 1 ||
                  processStatus.outlier == 1 ||
                  processStatus.result == 1 ||
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length > 0
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
                  processStatus.result == 1 ||
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length > 0
                "
                @click="getCsv('preview')"
                :loading="getPreview"
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
                  processStatus.result == 1 ||
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length > 0
                "
                @click="getCsv('download')"
                :loading="getDownlaod"
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
                  processStatus.result == 1 ||
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length > 0
                "
                :loading="processStatus.outlier == 1"
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
                  processStatus.result == 1 ||
                  processInfo.process.selectedItems.filter((item) => item.status == 1).length > 0
                "
              >
                <i class="bi bi-clipboard-data" style="margin-right: 5px; font-size: 18px"></i>Get
                Report</a-button
              >
            </a-col>
          </a-row>
        </div>
      </a-spin>
    </a-card>
    <!-- Hidden Function Section -->
    <a-card
      v-if="showPreview || showOutlier || showReport"
      style="width: 100%"
      hoverable
      id="bottom-anchor"
    >
      <!-- Result Section -->
      <a-flex v-if="showPreview" gap="middle" vertical>
        <br />
        <a-spin :spinning="getPreview">
          <a-card hoverable>
            <a-flex gap="middle" vertical style="width: 100%">
              <h2><i class="bi bi-kanban"></i> Output Data:</h2>
              <div v-if="csvHeaders.length > 0">
                <h3>
                  Shape: {{ processInfo.process.selectedItems[0].num }} ×
                  {{ csvHeaders.length - 1 }}
                </h3>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>index</th>
                        <th>file</th>
                        <th
                          v-for="(header, index) in csvHeaders.filter(
                            (item) => item !== 'log' && item !== 'file'
                          )"
                          :key="index"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, rowIndex) in csvdata" :key="rowIndex">
                        <td>
                          {{ rowIndex + 1 }}
                        </td>

                        <td>
                          {{ item['file'] }}
                        </td>

                        <td
                          v-for="(header, colIndex) in csvHeaders.filter(
                            (item) => item !== 'log' && item !== 'file'
                          )"
                          :key="colIndex"
                        >
                          {{ item[header] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <a-divider v-if="csvlog.length > 0" />
                <a-collapse v-if="csvlog.length > 0">
                  <a-collapse-panel>
                    <template #header>
                      <a-tooltip
                        placement="left"
                        title="Only the first 50 entries displayed if there are more."
                      >
                        <div>Task log</div>
                      </a-tooltip>
                    </template>
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th>index</th>
                            <th>file</th>
                            <th>log</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(item, rowIndex) in csvlog.slice(0, 50)" :key="rowIndex">
                            <td>
                              {{ rowIndex + 1 }}
                            </td>
                            <td>
                              {{ item['file'] }}
                            </td>
                            <td>
                              {{ item['log'] }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </a-collapse-panel>
                </a-collapse>
                <!-- </a-tooltip> -->
              </div>
              <div v-else-if="getPreview">
                <p>Retriving result...</p>
              </div>
              <div v-else>
                <p>No result!</p>
              </div>
            </a-flex>
          </a-card>
        </a-spin>
      </a-flex>

      <!-- Outlier Section  -->
      <a-flex v-if="showOutlier" gap="middle" vertical>
        <a-spin
          size="large"
          :indicator="indicator"
          :spinning="processStatus.outlier == 1 && outlierHeaders.length == 0"
          tip="Task is running..."
        >
          <a-alert v-if="outlierError" message="Previous Run:" type="warning" show-icon closable>
            <template #description>
              <p>{{ outlierError }}</p>
            </template>
          </a-alert>
          <a-alert v-else-if="outlierLog" message="Previous Run:" type="info" show-icon closable>
            <template #description>
              <p>{{ outlierData.length + ' outliers detected in this dataset. ' }}</p>
            </template>
          </a-alert>

          <br />
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
          <br />

          <a-card hoverable>
            <a-flex vertical gap="middle">
              <a-flex horizental justify="space-between">
                <h2><i class="bi bi-columns-gap"></i> Configure Detection Parameters:</h2>
                <a-popover trigger="click" placement="topLeft">
                  <!-- <template #title>
                    <h3>Column Description</h3>
                  </template> -->
                  <template #content>
                    <div style="height: 350px; width: 500px; overflow: scroll">
                      <div
                        v-if="
                          processInfo.outlier.columns.some((innerArray) =>
                            innerArray.includes('face-bqat')
                          )
                        "
                      >
                        <a-divider><h3>Engine:BQAT-Column Description</h3></a-divider>
                        <p v-for="(value, key) in processInfo.outlier.description['face-bqat']">
                          [{{ key }}] : {{ value }}
                        </p>
                      </div>
                      <div
                        v-if="
                          processInfo.outlier.columns.some((innerArray) =>
                            innerArray.includes('face-biqt')
                          )
                        "
                        style="height: 400px; width: 500px; overflow: scroll"
                      >
                        <a-divider><h3>Engine:BIQT-Column Description</h3> </a-divider>
                        <p v-for="(value, key) in processInfo.outlier.description['face-biqt']">
                          [{{ key }}] : {{ value }}
                        </p>
                      </div>
                      <div
                        v-if="
                          processInfo.outlier.columns.some((innerArray) =>
                            innerArray.includes('face-ofiq')
                          )
                        "
                      >
                        <a-divider><h3>Engine:OFIQ-Column Description</h3> </a-divider>
                        <p v-for="(value, key) in processInfo.outlier.description['face-ofiq']">
                          [{{ key }}] : {{ value }}
                        </p>
                      </div>
                      <div
                        v-if="
                          processInfo.outlier.columns.some((innerArray) =>
                            innerArray.includes('fingerprint')
                          )
                        "
                      >
                        <a-divider><h3>Engine:FINGERPRINT-Column Description</h3> </a-divider>
                        <p v-for="(value, key) in processInfo.outlier.description['fingerprint']">
                          [{{ key }}] : {{ value }}
                        </p>
                      </div>
                      <div
                        v-if="
                          processInfo.outlier.columns.some((innerArray) =>
                            innerArray.includes('iris')
                          )
                        "
                      >
                        <a-divider><h3>Engine:IRIS-Column Description</h3></a-divider>
                        <p v-for="(value, key) in processInfo.outlier.description['iris']">
                          [{{ key }}] : {{ value }}
                        </p>
                      </div>
                    </div>
                  </template>
                  <span class="bi bi-info-circle" style="font-size: larger; padding: 5px"></span>
                </a-popover>
              </a-flex>
              <a-row gutter="10">
                <a-cascader
                  class="outlierOption"
                  popupClassName="popupClass"
                  expand-trigger="hover"
                  multiple
                  size="large"
                  v-model:value="processInfo.outlier.columns"
                  change-on-select
                  placeholder="Please select the columns to detect"
                  :options="columnSelect"
                  style="width: 100%; margin-block: 10px"
                />
                <a-tooltip>
                  <template #title
                    >The proportion of data points considered as outliers in the data set.</template
                  >
                  <div>
                    <a-input-number
                      class="inputNumber"
                      v-model:value="contaminationNum"
                      :min="1"
                      :max="100"
                      size="large"
                      style="margin-block: 10px; width: 50%; min-width: 200px"
                    >
                      <template #addonBefore>Outliers Threshold:</template>
                      <template #addonAfter>%</template>
                    </a-input-number>
                  </div>
                </a-tooltip>
              </a-row>
            </a-flex>
          </a-card>
        </a-spin>

        <a-row justify="center" :gutter="40" style="margin-block: 2rem">
          <a-col :span="12">
            <a-button
              :disabled="!processInfo.outlier.iconLoading"
              style="width: 100%; padding: 0"
              size="large"
              type="primary"
              danger
              @click="stopOutlierTask"
            >
              <span class="bi bi-stop-circle" style="font-size: 18px; margin-inline: 5px"></span>
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
              <span
                v-if="processStatus.outlier !== 1"
                class="bi bi-play"
                style="font-style: normal; margin-inline: 5px"
              ></span>
              Start
            </a-button>
          </a-col>
        </a-row>

        <a-card
          hoverable
          v-if="outlierHeaders.length > 0 && processStatus.outlier !== 0 && outlierData.length > 0"
          id="outlier-anchor"
        >
          <a-flex gap="middle" vertical style="width: 100%">
            <a-row align="space-between" justify="center">
              <h2>
                <i class="bi bi-kanban"></i> Outliers Detected:
                <a-button
                  type="primary"
                  :disabled="processStatus.outlier == 1"
                  @click="downloadOutlier(outlierData)"
                >
                  <template #icon>
                    <DownloadOutlined />
                  </template>
                </a-button>
              </h2>

              <div style="align-self: center">
                Raw Data
                <a-switch
                  v-model:checked="rawData"
                  @change="
                    checkOutlier(processInfo.process.selectedItems[0].collection, rawData, false)
                  "
                />
              </div>
            </a-row>
            <a-spin
              size="large"
              :indicator="indicator"
              :spinning="processStatus.outlier == 1"
              tip="Table is loading..."
            >
              <div>
                <p>Higher scores indicate higher likelihood of anomaly.</p>
                <h3>
                  Shape: {{ outlierData.length }} ×
                  {{
                    outlierHeaders.find((item) => item == 'info')
                      ? outlierHeaders.length - 1
                      : outlierHeaders.length
                  }}
                </h3>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        <th
                          v-for="(header, index) in outlierHeaders.filter(
                            (item) => item !== 'info'
                          )"
                          :key="index"
                        >
                          {{ header }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(item, rowIndex) in outlierData.slice(0, 50)" :key="rowIndex">
                        <td>
                          {{ rowIndex + 1 }}
                        </td>
                        <td
                          v-for="(header, colIndex) in outlierHeaders.filter(
                            (item) => item !== 'info'
                          )"
                          :key="colIndex"
                        >
                          {{ item[header] }}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <a-divider v-if="outlierHeaders.filter((item) => item == 'info').length > 0" />
                <a-collapse v-if="outlierHeaders.filter((item) => item == 'info').length > 0">
                  <a-collapse-panel header="info">
                    <div class="table-container">
                      <table>
                        <thead>
                          <tr>
                            <th
                              v-for="(header, index) in outlierHeaders.filter(
                                (item) => item == 'file' || item == 'info'
                              )"
                              :key="index"
                            >
                              {{ header }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, rowIndex) in outlierData.filter((item) => item.info)"
                            :key="rowIndex"
                          >
                            <td
                              v-for="(header, colIndex) in outlierHeaders.filter(
                                (item) => item == 'file' || item == 'info'
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
              </div>
            </a-spin>
          </a-flex>
        </a-card>
        <a-alert
          v-else-if="outlierHeaders.length >= 0 && processStatus.outlier == 2"
          message="No outlier detected"
          type="info"
          show-icon
          closable
        >
          <template #description>
            <p>{{ outlierData.length + ' outliers detected in this dataset. ' }}</p>
          </template>
        </a-alert>
      </a-flex>

      <!-- Report Section -->
      <a-flex v-if="showReport" gap="middle" vertical>
        <a-spin
          size="large"
          :indicator="indicator"
          :spinning="processStatus.result == 1"
          tip="Task is running..."
        >
          <br />
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
                  <a-tooltip title="Subset of the original output data">
                    <a-input-number
                      size="large"
                      style="width: 85%"
                      v-model:value="processInfo.result.downsample"
                      addon-before="Downsample"
                      addon-after="%"
                      placeholder="100"
                      min="1"
                      max="100"
                  /></a-tooltip>
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
                ><span class="bi bi-play" style="font-size: 18px; margin-inline: 5px"></span>
                Start</a-button
              >
            </a-col>
          </a-row>
        </a-spin>
      </a-flex>
    </a-card>
  </a-flex>
</template>

<script setup lang="ts">
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { json2csv } from 'json-2-csv'
import { DeleteOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import type { SelectProps, CascaderProps } from 'ant-design-vue'
import { notification } from 'ant-design-vue'
import { h } from 'vue'
import { SyncOutlined } from '@ant-design/icons-vue'
import Papa from 'papaparse'

import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

const csvdata = ref([])
const csvlog = ref([])
const outlierData = ref([])
const csvHeaders = ref([])
const outlierHeaders = ref([])
const API = useApi()
const processStatus = useStatus()
const processInfo = ref(useInfo())
const route = useRoute()
const router = useRouter()
const showReport = ref(false)
const showOutlier = ref(false)
const showPreview = ref(false)
const uploadRef = ref(null)
const generateExternal = ref(false)
const tasksToUpdateOnPage = ref([])
const rawData = ref(false)
const contaminationNum = ref(5)
const outlierLog = ref(false)
const outlierError = ref('')
const windowWidth = ref(window.innerWidth)
const isWideWindow = computed(() => windowWidth.value >= 1024)

let checkOutlierInterval = null

const getPreview = ref(false)
const getDownlaod = ref(false)
const getStop = ref(false)
const getCancel = ref(false)
const getResume = ref(false)

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
    value: 'face-bqat',
    label: 'Face (BQAT)',
    children: [
      {
        value: 'ipd',
        label: 'ipd'
      },
      {
        value: 'face_detection',
        label: 'face_detection'
      },
      {
        value: 'bbox_left',
        label: 'bbox_left'
      },
      {
        value: 'bbox_right',
        label: 'bbox_right'
      },
      {
        value: 'bbox_upper',
        label: 'bbox_upper'
      },
      {
        value: 'bbox_bottom',
        label: 'bbox_bottom'
      },
      {
        value: 'eye_closed_left',
        label: 'eye_closed_left'
      },
      {
        value: 'eye_closed_right',
        label: 'eye_closed_right'
      },
      {
        value: 'pupil_right_x',
        label: 'pupil_right_x'
      },
      {
        value: 'pupil_right_y',
        label: 'pupil_right_y'
      },
      {
        value: 'pupil_left_x',
        label: 'pupil_left_x'
      },
      {
        value: 'pupil_left_y',
        label: 'pupil_left_y'
      },
      {
        value: 'yaw_pose',
        label: 'yaw_pose'
      },
      {
        value: 'yaw_degree',
        label: 'yaw_degree'
      },
      {
        value: 'pitch_pose',
        label: 'pitch_pose'
      },
      {
        value: 'pitch_degree',
        label: 'pitch_degree'
      },
      {
        value: 'roll_pose',
        label: 'roll_pose'
      },
      {
        value: 'roll_degree',
        label: 'roll_degree'
      },
      {
        value: 'smile',
        label: 'smile'
      },
      {
        value: 'glasses',
        label: 'glasses'
      },
      {
        value: 'face_ratio',
        label: 'face_ratio'
      },
      {
        value: 'brightness',
        label: 'brightness'
      },
      {
        value: 'dynamic_range',
        label: 'dynamic_range'
      },
      {
        value: 'sharpness',
        label: 'sharpness'
      },
      {
        value: 'contrast',
        label: 'contrast'
      },
      {
        value: 'face_offset_x',
        label: 'face_offset_x'
      },
      {
        value: 'face_offset_y',
        label: 'face_offset_y'
      },
      {
        value: 'background_colour_name',
        label: 'background_colour_name'
      },
      {
        value: 'background_colour_rgb',
        label: 'background_colour_rgb'
      },
      {
        value: 'background_colour_variance',
        label: 'background_colour_variance'
      },
      {
        value: 'hair_coverage',
        label: 'hair_coverage'
      },
      {
        value: 'blur_lap_var',
        label: 'blur_lap_var'
      },
      {
        value: 'blurriness',
        label: 'blurriness'
      },
      {
        value: 'gaze_right_x',
        label: 'gaze_right_x'
      },
      {
        value: 'gaze_right_y',
        label: 'gaze_right_y'
      },
      {
        value: 'gaze_left_x',
        label: 'gaze_left_x'
      },
      {
        value: 'gaze_left_y',
        label: 'gaze_left_y'
      },
      {
        value: 'pupil_colour_right_name',
        label: 'pupil_colour_right_name'
      },
      {
        value: 'pupil_colour_right_rgb',
        label: 'pupil_colour_right_rgb'
      },
      {
        value: 'pupil_colour_left_name',
        label: 'pupil_colour_left_name'
      },
      {
        value: 'pupil_colour_left_rgb',
        label: 'pupil_colour_left_rgb'
      },
      {
        value: 'brisque_quality',
        label: 'brisque_quality'
      },
      {
        value: 'age',
        label: 'age'
      },
      {
        value: 'gender',
        label: 'gender'
      },
      {
        value: 'ethnicity',
        label: 'ethnicity'
      },
      {
        value: 'emotion',
        label: 'emotion'
      },
      {
        value: 'is_hologram',
        label: 'is_hologram'
      },
      {
        value: 'holograms',
        label: 'holograms'
      },
      {
        value: 'is_glare',
        label: 'is_glare'
      },
      {
        value: 'glares',
        label: 'glares'
      },
      {
        value: 'image_height',
        label: 'image_height'
      },
      {
        value: 'image_width',
        label: 'image_width'
      },
      {
        value: 'headgear_detection',
        label: 'headgear_detection'
      },
      {
        value: 'headgear_detection_dark',
        label: 'headgear_detection_dark'
      },
      {
        value: 'colour_temperature',
        label: 'colour_temperature'
      },
      {
        value: 'brightness_variance',
        label: 'brightness_variance'
      }
    ]
  },
  {
    value: 'face-ofiq',
    label: 'Face (OFIQ)',
    children: [
      {
        value: 'quality',
        label: 'quality'
      },
      {
        value: 'background_uniformity',
        label: 'background_uniformity'
      },
      {
        value: 'illumination_uniformity',
        label: 'illumination_uniformity'
      },
      {
        value: 'luminance_mean',
        label: 'luminance_mean'
      },
      {
        value: 'luminance_variance',
        label: 'luminance_variance'
      },
      {
        value: 'under_exposure_prevention',
        label: 'under_exposure_prevention'
      },
      {
        value: 'over_exposure_prevention',
        label: 'over_exposure_prevention'
      },
      {
        value: 'dynamic_range',
        label: 'dynamic_range'
      },
      {
        value: 'sharpness',
        label: 'sharpness'
      },
      {
        value: 'compression_artifacts',
        label: 'compression_artifacts'
      },
      {
        value: 'natural_colour',
        label: 'natural_colour'
      },
      {
        value: 'single_face_present',
        label: 'single_face_present'
      },
      {
        value: 'eyes_open',
        label: 'eyes_open'
      },
      {
        value: 'mouth_closed',
        label: 'mouth_closed'
      },
      {
        value: 'eyes_visible',
        label: 'eyes_visible'
      },
      {
        value: 'mouth_occlusion_prevention',
        label: 'mouth_occlusion_prevention'
      },
      {
        value: 'face_occlusion_prevention',
        label: 'face_occlusion_prevention'
      },
      {
        value: 'inter_eye_distance',
        label: 'inter_eye_distance'
      },
      {
        value: 'head_size',
        label: 'head_size'
      },
      {
        value: 'leftward_crop_of_the_face_image',
        label: 'leftward_crop_of_the_face_image'
      },
      {
        value: 'rightward_crop_of_the_face_image',
        label: 'rightward_crop_of_the_face_image'
      },
      {
        value: 'downward_crop_of_the_face_image',
        label: 'downward_crop_of_the_face_image'
      },
      {
        value: 'upward_crop_of_the_face_image',
        label: 'upward_crop_of_the_face_image'
      },
      {
        value: 'head_pose_yaw',
        label: 'head_pose_yaw'
      },
      {
        value: 'head_pose_pitch',
        label: 'head_pose_pitch'
      },
      {
        value: 'head_pose_roll',
        label: 'head_pose_roll'
      },
      {
        value: 'expression_neutrality',
        label: 'expression_neutrality'
      },
      {
        value: 'no_head_coverings',
        label: 'no_head_coverings'
      }
    ]
  },
  {
    value: 'face-biqt',
    label: 'Face (BIQT)',
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
        value: 'openbr_confidence',
        label: 'openbr_confidence'
      },
      {
        value: 'opencv_IPD',
        label: 'opencv_IPD'
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
        value: 'skin_ratio_face',
        label: 'skin_ratio_face'
      },
      {
        value: 'skin_ratio_full',
        label: 'skin_ratio_full'
      }
    ]
  },
  {
    value: 'fingerprint',
    label: 'Fingerprint',
    children: [
      {
        value: 'NFIQ2',
        label: 'NFIQ2'
      },
      {
        value: 'uniform_image',
        label: 'uniform_image'
      },
      {
        value: 'empty_image_or_contrast_too_low',
        label: 'empty_image_or_contrast_too_low'
      },
      {
        value: 'fingerprint_image_with_minutiae',
        label: 'fingerprint_image_with_minutiae'
      },
      {
        value: 'sufficient_fingerprint_foreground',
        label: 'sufficient_fingerprint_foreground'
      },
      {
        value: 'edge_std',
        label: 'edge_std'
      }
    ]
  },
  {
    value: 'iris',
    label: 'Iris',
    children: [
      {
        value: 'quality',
        label: 'quality'
      },
      {
        value: 'contrast',
        label: 'contrast'
      },
      {
        value: 'sharpness',
        label: 'sharpness'
      },
      {
        value: 'iris_diameter',
        label: 'iris_diameter'
      },
      {
        value: 'percent_visible_iris',
        label: 'percent_visible_iris'
      },
      {
        value: 'iris_pupil_gs',
        label: 'iris_pupil_gs'
      },
      {
        value: 'iris_sclera_gs',
        label: 'iris_sclera_gs'
      },
      {
        value: 'iso_overall_quality',
        label: 'iso_overall_quality'
      },
      {
        value: 'iso_greyscale_utilization',
        label: 'iso_greyscale_utilization'
      },
      {
        value: 'iso_iris_pupil_concentricity',
        label: 'iso_iris_pupil_concentricity'
      },
      {
        value: 'iso_iris_pupil_contrast',
        label: 'iso_iris_pupil_contrast'
      },
      {
        value: 'iso_iris_pupil_ratio',
        label: 'iso_iris_pupil_ratio'
      },
      {
        value: 'iso_iris_sclera_contrast',
        label: 'iso_iris_sclera_contrast'
      },
      {
        value: 'iso_margin_adequacy',
        label: 'iso_margin_adequacy'
      },
      {
        value: 'iso_pupil_boundary_circularity',
        label: 'iso_pupil_boundary_circularity'
      },
      {
        value: 'iso_sharpness',
        label: 'iso_sharpness'
      },
      {
        value: 'iso_usable_iris_area',
        label: 'iso_usable_iris_area'
      }
    ]
  }
])

const openNotificationWithIcon = (type: string, error = '') => {
  if (type === 'stop') {
    notification['success']({
      message: 'Stop Task',
      description: 'Stop current running task successful.',
      placement: 'top',
      duration: 2
    })
  } else if (type === 'cancel') {
    notification['success']({
      message: 'Cancel Task',
      description: 'Cancel current running task successful.',
      placement: 'top',
      duration: 2
    })
  } else if (type === 'resume') {
    notification['success']({
      message: 'Resume Task',
      description: 'Resume selected task successful.',
      placement: 'top',
      duration: 2
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
      duration: 3
    })
  } else if (type == 'csverror') {
    notification['error']({
      message: 'CSV Syntax Error',
      description: 'Invalid delimiter found. Only commas are allowed.',
      placement: 'top',
      duration: 3
    })
  } else if (type == 'reportError') {
    notification['error']({
      message: 'Failed to generate report',
      description: 'Invalid/Empty data source',
      placement: 'top',
      duration: 3
    })
  } else if (type === 'taskError') {
    notification['error']({
      message: 'Task Failed',
      description: error || 'Task failed. Please check your input and try again.',
      placement: 'top',
      duration: 5
    })
  }
}

const selectTask = (e, item) => {
  showOutlier.value = false
  showReport.value = false
  csvdata.value = []
  csvlog.value = []
  showPreview.value = false
  getDownlaod.value = false
  // const selectedItem = {
  //   tid: item.tid,
  //   id: item?.collection,
  //   modality: item.mode,
  //   engine: item.engine,
  //   num: item.num,
  //   total: item.total,
  //   input: item.input,
  //   elaspe: item.elapse,
  //   status: item.status
  // }
  if (e.target.checked) {
    processInfo.value.process.selectedItems.push(item)
    processInfo.value.outlier.columns = []
  } else {
    const index = processInfo.value.process.selectedItems.findIndex((i) => i.tid === item.tid)
    if (index > -1) {
      processInfo.value.process.selectedItems.splice(index, 1)
    }
  }
}

// const scrollToBottom = () => {
//   // Scroll to the bottom of the page
//   setTimeout(() => {
//     const bottomAnchor = document.getElementById('bottom-anchor')
//     if (bottomAnchor) {
//       bottomAnchor.scrollIntoView({ behavior: 'smooth' })
//     }
//   }, 100)
// }
const scrollToBottom = () => {
  // Scroll to the bottom of the current page
  setTimeout(() => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }, 100)
}

const scrollToOutlier = () => {
  // Scroll to the bottom of the page
  setTimeout(() => {
    const outlierAnchor = document.getElementById('outlier-anchor')
    if (outlierAnchor) {
      outlierAnchor.scrollIntoView({ behavior: 'smooth' })
    }
  }, 100)
}

function showDeleteConfirm() {
  Modal.confirm({
    title: 'Are you sure you want to delete this task?',
    icon: h(ExclamationCircleOutlined),
    content: 'Data of the task will be deleted and cannot be restored.',
    okType: 'danger',
    centered: true,
    okText: 'Delete',
    async onOk() {
      console.log('OK')
      try {
        await deleteTask()
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
    const url = `${API.api}/task/${item.tid}`
    try {
      const data = await API.authFetch(url, {
        method: 'DELETE',
        headers: { accept: 'application/json' }
      })
      if (data) {
        openNotificationWithIcon('delete')
        console.log('delete task', data)
      }
    } catch (error) {
      openNotificationWithIcon('error')
      console.error('Error delete task:', error)
    }

    const url2 = `${API.api}/scan/${item.collection}/profiles`
    try {
      const data = await API.authFetch(url2, {
        method: 'DELETE',
        headers: { accept: 'application/json' }
      })
      if (data) {
        console.log('delete test profiles', data)
      }
    } catch (error) {
      console.error('Error delete test profiles:', error)
    }
  }
  processInfo.value.process.selectedItems = []
}

function showCancelConfirm(tid) {
  Modal.confirm({
    title: 'Are you sure you want to cancel the task?',
    icon: h(ExclamationCircleOutlined),
    content: 'Progress of the task will be deleted and cannot be restored.',
    okType: 'danger',
    centered: true,
    okText: 'Yes',
    cancelText: 'No',
    async onOk() {
      console.log('OK')
      try {
        await cancelTask(tid)
        return Promise.resolve()
      } catch (error) {
        console.log('Oops, errors!', error)
        return Promise.reject(error)
      }
    },
    onCancel() {
      console.log('Cancel action')
    }
  })
}
const cancelTask = async (tid) => {
  getCancel.value = true
  const url2 = `${API.api}/task/cancel/${tid}?type=scan`
  try {
    const data = await API.authFetch(url2, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })

    processInfo.value.process.selectedItems = []
    processInfo.value.process.taskStatus.splice(0, 1)
    processInfo.value.process.timer == -1
    processInfo.value.process.timeRecord == 0
    openNotificationWithIcon('cancel')
    processStatus.updateStatus('process', 0)
    getCancel.value = false
  } catch (error) {
    console.error('Error cancel task:', error)
    getCancel.value = false
  }
}

const stopTask = async (tid) => {
  getStop.value = true
  const url2 = `${API.api}/task/${tid}/stop`
  try {
    const data = await API.authFetch(url2, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })

    const task = processInfo.value.process.taskStatus.find((item) => item.tid === tid)
    if (task) {
      task.status = 0
      task.elapse = processInfo.value.process.timeRecord
    } else {
      console.error(`Task with tid ${tid} not found`) // Optional: Handle the case where the task is not found
    }
    processInfo.value.process.timer == -1
    processInfo.value.process.timeRecord == 0
    // API.testTimer = 0
    openNotificationWithIcon('stop')
    processStatus.updateStatus('process', 0)
    getStop.value = false
  } catch (error) {
    console.error('Error cancel task:', error)
    getStop.value = false
  }
}

const resumeTask = async (tid) => {
  getResume.value = true
  const url = `${API.api}/scan/resume/${tid}`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
    const task = processInfo.value.process.taskStatus.find((item) => item.tid === tid)
    if (task) {
      task.status = 1
      task.logs = []
      processInfo.value.process.timer = 0
      processInfo.value.process.timeRecord = task.elapse
      // API.testTimer = 0
      openNotificationWithIcon('resume')
      processStatus.updateStatus('process', 1)
      const checkTaskStatus = setInterval(async () => {
        // console.log('check task status...')
        tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
          (item) => item.status == 1
        )
        if (tasksToUpdateOnPage.value.length > 0) {
          const controller = new AbortController()
          const signal = controller.signal
          try {
            // Race between the getTaskETA function and a timeout of 5 seconds
            await Promise.race([
              getTaskETA(tasksToUpdateOnPage.value, signal),
              new Promise((_, reject) =>
                setTimeout(() => {
                  controller.abort() // Abort the request after 5 seconds
                  reject(new Error('Request timed out'))
                }, 5000)
              )
            ])
          } catch (error) {
            console.error(error.message) // Logs "Request timed out" if the request takes longer than 5 seconds
          }
          // await getTaskETA(tasksToUpdateOnPage.value)
        } else {
          clearInterval(checkTaskStatus)
          processInfo.value.process.timer = -1
          processInfo.value.process.timeRecord = 0
        }
      }, 10000)
    } else {
      console.error(`Task with tid ${tid} not found`) // Optional: Handle the case where the task is not found
    }
    getResume.value = false
  } catch (error) {
    openNotificationWithIcon('error')
    console.error('Error cancel task:', error)
    getResume.value = false
  }
}

//add selected item to generating report
const getReport = () => {
  showOutlier.value = false
  showReport.value = true
  csvdata.value = []
  csvlog.value = []
  showPreview.value = false
  getDownlaod.value = false
  scrollToBottom()
  if (processInfo.value.process.selectedExternal) {
    generateExternal.value = true
  }
}

//Get the last scan task and go check result page
const checkModeTab = () => {
  if (generateExternal.value) {
    processInfo.value.result.activeKey = 4
  } else if (processInfo.value.process.selectedItems.filter((item) => item.status == 2)[0]) {
    const mode = processInfo.value.process.selectedItems
      .filter((item) => item.status == 2)[0]
      .mode.toLowerCase()
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

  router.push({ path: '/results' })
}

//add selected item to generating csv
const getCsv = async (type) => {
  showOutlier.value = false
  showReport.value = false
  let limit = ''
  if (type == 'preview') {
    showPreview.value = true
    getPreview.value = true
    scrollToBottom()
    // limit = '&limit=50'
  } else {
    getDownlaod.value = true
  }
  for (const item of processInfo.value.process.selectedItems) {
    const url = `${API.api}/scan/${item.collection}/profiles?skip=0${limit}`
    try {
      const data = await API.authFetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (data) {
        if (type == 'preview') {
          // console.log(data)
          csvdata.value = data
            .filter((item) =>
              item.log ? Object.values(item).length > 2 : Object.values(item).length > 1
            )
            .slice(0, 50)
          csvlog.value = data.filter((item) => item.log && item.log.length > 0)
          getPreview.value = false
          if (data.length > 0) {
            const allHeaders = new Set() // Use a Set to avoid duplicates
            data.forEach((row) => {
              Object.keys(row).forEach((key) => allHeaders.add(key))
            })
            csvHeaders.value = Array.from(allHeaders) // Convert Set to Array for headers
          }
          scrollToBottom()
        } else {
          getDownlaod.value = false
          downloadCsv(data)
        }
      }
    } catch (e) {
      getPreview.value = false
      console.log('retrive result error', e)
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

const getOutlier = async () => {
  processStatus.updateStatus('outlier', 0)
  outlierLog.value = false
  outlierError.value = ''
  columnSelect.value.forEach((item) => (item.disabled = true))
  let mode =
    processInfo.value.process.selectedItems[0].mode != 'speech'
      ? processInfo.value.process.selectedItems[0].mode
      : null
  let engine = processInfo.value.process.selectedItems[0].engine
  let fusionCode = processInfo.value.process.selectedItems[0].options?.fusion
  if (engine == 'fusion' && fusionCode) {
    switch (fusionCode) {
      case 6:
        // Enable both BQAT and OFIQ when input is 6
        columnSelect.value[0].disabled = false
        columnSelect.value[1].disabled = false
        processInfo.value.outlier.columns = [['face-bqat'], ['face-ofiq']]
        break
      case 3:
        columnSelect.value[1].disabled = false
        columnSelect.value[2].disabled = false
        processInfo.value.outlier.columns = [['face-ofiq'], ['face-biqt']]
        break
      case 5:
        columnSelect.value[0].disabled = false
        columnSelect.value[2].disabled = false
        processInfo.value.outlier.columns = [['face-bqat'], ['face-biqt']]
        break
      case 7:
        columnSelect.value[0].disabled = false
        columnSelect.value[1].disabled = false
        columnSelect.value[2].disabled = false
        processInfo.value.outlier.columns = [['face-bqat'], ['face-ofiq'], ['face-biqt']]
        break
      default:
        console.error('Unknown engine:', mode)
        break
    }
  } else {
    mode = processInfo.value.process.selectedItems[0].engine
      ? mode + '-' + processInfo.value.process.selectedItems[0].engine
      : mode
    if (mode) processInfo.value.outlier.columns = [[mode]]
    columnSelect.value?.filter((item) =>
      item.value == mode ? (item.disabled = false) : (item.disabled = true)
    )
  }

  showOutlier.value = true
  showReport.value = false
  showPreview.value = false
  csvdata.value = []
  csvlog.value = []
  getDownlaod.value = false
  scrollToBottom()
  await checkOutlierLog(processInfo.value.process.selectedItems[0].collection)
}

const checkOutlierLog = async (id) => {
  processStatus.updateStatus('outlier', 1)
  const url = `${API.api}/task/logs/outlier`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data) {
      const outliers = data.filter((item) => item?.collection == id)
      if (outliers.length > 0) {
        const outlier = outliers[0]
        if (outlier.status == 2) {
          // console.log(outlier)
          const url2 = `${API.api}/scan/${id}/outliers`
          try {
            const data = await API.authFetch(url2, {
              method: 'GET',
              headers: { accept: 'application/json' }
            })
            outlierData.value = data
            outlierLog.value = true
            processStatus.updateStatus('outlier', 0)
            if (data.length > 0) {
              processStatus.updateStatus('outlier', 2)
              const allHeaders = new Set() // Use a Set to avoid duplicates
              data.forEach((row) => {
                Object.keys(row).forEach((key) => allHeaders.add(key))
              })
              outlierHeaders.value = Array.from(allHeaders) // Convert Set to Array for headers
            }
          } catch (error) {
            console.error('retrive outlier error', error)
            processStatus.updateStatus('outlier', 0)
          }
        } else {
          outlierLog.value = true
          processStatus.updateStatus('outlier', 0)
          if (outlier.status == 3) {
            outlierError.value = outlier.logs[0]
          }
          if (outlier.status == 0) {
            outlierError.value = "Task has been stopped or haven't start"
          }
        }
      } else {
        console.log('no outlier log')
        processStatus.updateStatus('outlier', 0)
      }
    }
    getOutlierColumns()
  } catch (error) {
    processStatus.updateStatus('outlier', 0)
    console.error(error)
  }
}

const getOutlierColumns = async () => {
  const checkItem = processInfo.value.process.selectedItems[0]
  const url = `${API.api}/scan/${checkItem.collection}/profiles?skip=0&limit=1`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data) {
      const columns = Object.keys(data[0]).filter((item) => item != 'file' && item != 'log')
      if (checkItem.engine !== 'fusion' && checkItem.mode != 'speech') {
        let type = checkItem.mode
        type += checkItem.engine ? '-' + checkItem.engine : ''
        const newCol = columns.map((item) => {
          return { value: item, label: item }
        })
        if (columnSelect.value) {
          const target = columnSelect.value.find((item) => item.value == type)
          if (target) {
            target.children = newCol
            // console.log(target)
          }
        }
      }
    } else {
      console.error('nn result data')
    }
  } catch (error) {
    console.log(error)
  }
}

//Tool to format timestamp to hh:mm:ss
const formatSeconds = computed(() => {
  if (processInfo.value.process.timer == -1 || processInfo.value.process.timeRecord == 0) {
    return `00:00:00`
  }
  const hours = Math.floor(processInfo.value.process.timeRecord / 3600)
  const minutes = Math.floor((processInfo.value.process.timeRecord % 3600) / 60)
  const remainingSeconds = processInfo.value.process.timeRecord % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
})

const formatETA = computed(() => {
  const item = processInfo.value.process.taskStatus.filter((item) => item.status == 1)
  const eta = item[0].eta
  if (eta == 0 || !eta) {
    return `00:00:00`
  }
  const hours = Math.floor(eta / 3600)
  const minutes = Math.floor((eta % 3600) / 60)
  const remainingSeconds = eta % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
})

// const intervalGap = ref(10000)
//Interval to check whether there are tasks need to update progress
//update task withid(no new) and unfinished task
const checkTaskStatus = setInterval(async () => {
  // console.log('check task status...')
  tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
    (item) => item.status == 1
  )
  if (tasksToUpdateOnPage.value.length > 0) {
    const controller = new AbortController()
    const signal = controller.signal
    try {
      // Race between the getTaskETA function and a timeout of 5 seconds
      await Promise.race([
        getTaskETA(tasksToUpdateOnPage.value, signal),

        new Promise((_, reject) =>
          setTimeout(() => {
            controller.abort() // Abort the request after 5 seconds
            reject(new Error('Request timed out'))
          }, 5000)
        )
      ])
    } catch (error) {
      console.error(error.message) // Logs "Request timed out" if the request takes longer than 5 seconds
    }
    // await getTaskETA(tasksToUpdateOnPage.value)
  } else {
    clearInterval(checkTaskStatus)
    processInfo.value.process.timer = -1
    processInfo.value.process.timeRecord = 0
  }
}, 10000)

//Update the progress as task going
//Notes: update to only one task can be runnning at one time
const getTaskETA = async (tasksToUpdate, signal) => {
  for (const item of tasksToUpdate) {
    if (await checkRayState()) {
      console.log('Ray exist')
      const url = `${API.api}/task/${item.tid}/status`
      try {
        const data = await API.authFetch(url, {
          method: 'GET',
          headers: { accept: 'application/json' },
          signal: signal
        })
        if (data && data.done != 0) {
          item.eta = data.eta
          item.percent = Math.floor((data.done * 100) / data.total)
          item.num = data.done

          if (data.done == data.total) {
            item.percent = 100
            item.status = 2

            const index = processInfo.value.process.taskList.findIndex(
              (x) => x.collection === item?.collection
            )
            if (index == -1) processInfo.value.process.taskList.push(item)
            processStatus.updateStatus('process', 2)
          }
        }
      } catch (error) {
        console.log('Status not exist')
        // If the task status can not be found, finish too fast
        console.error('Error getting task status:', error)
        await checkTaskLogAfterError(item)
      }
    } else {
      console.log('Ray not exist')
      await checkTaskLogAfterError(item)
    }
  }
}

const checkTaskLogAfterError = async (item) => {
  const url1 = `${API.api}/task/logs/scan/${item.tid}`
  try {
    const data = await API.authFetch(url1, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (data) {
      if (data[0]?.status == 2) {
        item.eta = 0
        item.percent = 100
        item.status = 2
        item.num = data[0].finished
        item.elapse = data[0].elapse
        item.logs = data[0]?.logs

        const index = processInfo.value.process.taskList.findIndex(
          (x) => x.collection === item?.collection
        )
        if (index == -1) processInfo.value.process.taskList.push(item)
        processStatus.updateStatus('process', 2)
      }
      if (data[0]?.status == 3) {
        console.log('process crashed')
        item.status = 3
        item.percent = -1
        item.logs = data[0]?.logs
        openNotificationWithIcon('taskError', data[0]?.logs[0])
        const index = processInfo.value.process.taskList.findIndex(
          (x) => x.collection === item?.collection
        )
        if (index == -1) processInfo.value.process.taskList.push(item)
        // await stopTask(item.tid)
        processStatus.updateStatus('process', 2)
      }
      if (data[0]?.status == 0) {
        console.log('Task stopped')
        item.status = 0
        item.logs = data[0]?.logs
        processStatus.updateStatus('process', 2)
        //Note: For testing restart Docker
      }
      if (data[0]?.status == 1) {
        console.log('large dataset crashed')
        await stopTask(item.tid)
        //Note: For testing restart Docker
        setTimeout(async () => {
          await resumeTask(item.tid)
        }, 1000 * 60)
      }
    }
  } catch (error) {
    console.log('can not find task log', error)
  }
}

const checkRayState = async () => {
  const url = `${API.api}/task/state`
  let state = true
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
  } catch (error) {
    console.log('server node crashed')
    processStatus.updateStatus('process', -1)
    state = false
  }
  return state
}

//Update the task info
const updateTaskCollection = async (tasksToUpdate) => {
  for (const item of tasksToUpdate) {
    const url = `${API.api}/task/logs/scan/${item.tid}`
    try {
      const tempData = await API.authFetch(url, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (tempData) {
        // if (!response.ok) {
        //   throw new Error('Failed to log task')
        // }
        // const tempData = await response.json()
        const data = tempData[0]
        if (data) {
          item.collection = data?.collection
          item.modified = data.modified
          // console.log(item.modified)
          item.elapse = data.elapse
        }
      }
    } catch (error) {
      console.error('Error logging task:', error)
    }
  }
}
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth // Update the reactive window width
}

//everytime entry this page, check whether there are more tasks need to update taskStatus
onMounted(async () => {
  processInfo.value.process.selectedItems = []
  if (processInfo.value.process.timeStamp != '') {
    console.log('continue timer')
  } else {
    //first time, get timeStamp from scan page, start timmer&initialise taskStatus
    if (route.query.timeStamp) {
      processInfo.value.process.timeStamp = route.query.timeStamp.toString()
      console.log('start timer:', new Date(processInfo.value.process.timeStamp))
    }
  }
  tasksToUpdateOnPage.value = processInfo.value.process.taskStatus.filter(
    (item) => item.status == 1
  )
  if (tasksToUpdateOnPage.value.filter((item) => item.num == 0).length > 0) {
    updateTaskCollection(tasksToUpdateOnPage.value)
  }
  window.addEventListener('resize', updateWindowWidth)
})

const stopOutlierTask = async () => {
  processInfo.value.outlier.iconLoading = false
  // const url = `${API.api}/task/cancel/${processInfo.value.outlier.id}?type=outlier`
  const url = `${API.api}/task/cancel`
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      headers: { accept: 'application/json' }
    })
    clearInterval(checkOutlierInterval)
    processStatus.updateStatus('outlier', 0)
    processInfo.value.outlier.id = ''
  } catch (error) {
    console.error('Error cancel task:', error)
  }
}

const startOutlierTask = async () => {
  outlierLog.value = false
  outlierError.value = ''
  let optionColumns = []
  processInfo.value.outlier.columns.map((item) => {
    if (item[1]) {
      optionColumns.push(item[1])
    } else {
      const options = item[0]
      console.log(options)
      if (options.includes('Face')) {
        if (options.includes('BQAT')) {
          optionColumns.push('confidence', 'ipd', 'yaw_degree', 'pitch_degree', 'roll_degree')
        }
        if (options.includes('OFIQ')) {
          optionColumns.push(
            'quality',
            'unified_quality_score_scalar',
            'background_uniformity_scalar',
            'illumination_uniformity_scalar',
            'luminance_mean_scalar',
            'luminance_variance_scalar',
            'under_exposure_prevention_scalar',
            'over_exposure_prevention_scalar',
            'dynamic_range_scalar',
            'sharpness_scalar',
            'compression_artifacts_scalar',
            'natural_colour_scalar',
            'single_face_present_scalar',
            'eyes_open_scalar',
            'mouth_closed_scalar',
            'eyes_visible_scalar',
            'mouth_occlusion_prevention_scalar',
            'face_occlusion_prevention_scalar',
            'inter_eye_distance_scalar',
            'head_size_scalar',
            'leftward_crop_of_the_face_image_scalar',
            'rightward_crop_of_the_face_image_scalar',
            'downward_crop_of_the_face_image_scalar',
            'upward_crop_of_the_face_image_scalar',
            'head_pose_yaw_scalar',
            'head_pose_pitch_scalar',
            'head_pose_roll_scalar',
            'expression_neutrality_scalar',
            'no_head_coverings_scalar'
          )
        }
        if (options.includes('BIQT')) {
          optionColumns.push(
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
          )
        }
      } else if (options == 'Fingerprint') {
        optionColumns.push(
          'NFIQ2',
          'UniformImage',
          'EmptyImageOrContrastTooLow',
          'SufficientFingerprintForeground',
          'EdgeStd'
        )
      } else if (options == 'Iris') {
        optionColumns.push(
          'iso_overall_quality',
          'iso_sharpness',
          'iso_iris_sclera_contrast',
          'iso_iris_pupil_contrast',
          'iso_iris_pupil_concentricity'
        )
      }
    }
  })

  // console.log(optionColumns)
  const id = processInfo.value.process.selectedItems[0].collection
  const url = `${API.api}/scan/${id}/outliers/detect?trigger=true`

  try {
    const temp = await API.authFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detector: processInfo.value.outlier.detector,
        columns: optionColumns,
        contamination: contaminationNum.value / 100
      })
    })
    if (temp) {
      processInfo.value.outlier.id = temp['outlier detection task in progress']
      processInfo.value.outlier.iconLoading = true
      processStatus.updateStatus('outlier', 1)
      checkOutlierInterval = setInterval(() => {
        if (processInfo.value.outlier.id != '' && processStatus.outlier == 1) {
          getOutlierStatus(processInfo.value.outlier.id)
        } else {
          clearInterval(checkOutlierInterval)
        }
      }, 1000)
    }
  } catch (error) {
    console.error('Error detect outlier:', error)
    processInfo.value.outlier.iconLoading = false
  }
}

const checkOutlier = async (id, withData = false, download = false) => {
  processStatus.updateStatus('outlier', 1)
  processInfo.value.outlier.iconLoading = true
  const url2 = `${API.api}/scan/${id}/outliers?with_data=${withData}`
  try {
    const data = await API.authFetch(url2, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (data) {
      processStatus.updateStatus('outlier', 2)
      // scrollToBottom()
      processInfo.value.outlier.id = ''
      processInfo.value.outlier.iconLoading = false
      if (download) {
        downloadOutlier(data)
      } else {
        clearInterval(checkOutlierInterval)
        if (data != null) {
          outlierData.value = data
        }
        if (data.length > 0) {
          const allHeaders = new Set() // Use a Set to avoid duplicates
          data.forEach((row) => {
            Object.keys(row).forEach((key) => allHeaders.add(key))
          })
          outlierHeaders.value = Array.from(allHeaders) // Convert Set to Array for headers
        } else {
          outlierHeaders.value = []
          scrollToBottom()
        }
        scrollToOutlier()
      }
    }
  } catch (error) {
    console.error('Error check outliers task status:', error)
  }
}

const getOutlierStatus = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const data = await API.authFetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
  } catch (error) {
    console.log('can not find task progress')
    console.error('Error getting task status:', error)
    clearInterval(checkOutlierInterval)
    const url2 = `${API.api}/task/logs/outlier/${tid}`
    try {
      const data = await API.authFetch(url2, {
        method: 'GET',
        headers: { accept: 'application/json' }
      })
      if (data) {
        console.log(data[0])
        if (data[0]?.status == 3) {
          processInfo.value.outlier.iconLoading = false
          outlierError.value = data[0].logs[0]
          processStatus.updateStatus('outlier', 0)
        } else {
          checkOutlier(processInfo.value.process.selectedItems[0].collection, false, false)
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
}

const downloadOutlier = async (data) => {
  // const options = {
  //   expandArrayObjects: false // This handles flattening nested objects in json-2-csv
  // }
  // Convert JSON to CSV with options
  // const csv = await json2csv(data, options)
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
  try {
    const data = await API.authFetch(url, {
      method: 'POST',
      body: formData
    })
    if (data) {
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
    }
  } catch (error) {
    processInfo.value.result.generatedReport = { id: '', blob: new Blob(), html: '' }
    processStatus.updateStatus('result', 2)
    openNotificationWithIcon('reportError')
    console.error('Error generating task report:', error)
  }
}

const submitGenerate = async () => {
  for (const item of processInfo.value.result.generating) {
    const url = `${API.api}/scan/${item.id}/report/generate?trigger=true`
    const requestBody = {
      downsample:
        processInfo.value.result.downsample > 0 ? processInfo.value.result.downsample / 100 : 1,
      minimal: processInfo.value.result.minimal
    }
    try {
      const data = await API.authFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(requestBody)
      })
      if (data) {
        item.tid = data['reporting in progress']
      }
    } catch (error) {
      console.error('Error generating task report:', error)
      openNotificationWithIcon('reportError')
      const index = processInfo.value.result.generating.indexOf(item)
      if (index !== -1) {
        processInfo.value.result.generating.splice(index, 1)
      }
    }
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
    const items = processInfo.value.process.selectedItems.map((item) => {
      return {
        tid: item.tid,
        id: item?.collection,
        modality: item.mode,
        engine: item.engine,
        num: item.num,
        total: item.total,
        input: item.input,
        elaspe: item.elapse,
        status: 0
      }
    })
    processInfo.value.result.generating = items
    console.log('generating', processInfo.value.result.generating.length, 'reports')
    await submitGenerate()
  }
  checkModeTab()
}

// watch(
//   () => API.testTimer,
//   async (value) => {
//     if (value % (60 * 60 * 5) === 0 && value !== 0) {
//       console.log('5 hours timeout----Stop task')
//       // Find the task with status == 1 (active task)
//       const activeTask = processInfo.value.process.taskStatus.find((item) => item.status === 1)

//       if (activeTask) {
//         const tid = activeTask.tid
//         await stopTask(tid)
//         setTimeout(
//           async () => {
//             console.log('3 mins timeout----Resume task')
//             await resumeTask(tid)
//           },
//           1000 * 60 * 3
//         )
//       } else {
//         console.warn('No active task found to stop.')
//       }
//     }
//   }
// )

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
  seconds = seconds | 0
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`
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
.popupClass {
  width: 50%;
  max-width: 1000px;
  min-width: 600px;
}
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
  /* overflow: scroll; */
}

.processCard {
  width: 100%;
  min-height: 700px;
  /* height: calc(100vh - 200px); */
}

.processBoard {
  flex-direction: column;
  margin-block: 1rem;
  display: flex;
  width: 100%;
  min-height: 400px;
}

.processTask {
  display: flex;
  width: 100%;
  min-height: 400px;
}

.task-card-container {
  display: flex;
  flex-direction: column;
  justify-content: top;
  align-items: center;
  padding: 1rem 0;
  height: 100%;
  width: 100%;
  border: 1px dotted grey;
  border-radius: 10px;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.4);
}

.processItem {
  padding: 1rem 0;
  height: 100%;
  width: 100%;
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

/* .outlierOption {
  width: 100%;
  margin-block: 10px;
} */

.inputNumber {
  width: 30%;
  min-width: 200px;
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
    min-height: 500px;
    padding: 2rem 0;
  }
  .progressStyle {
    margin-block: 6px;
    width: 98%;
  }
  .processCard {
    min-height: 825px;
  }
  .processTask {
    /* height: calc(100vh - 500px); */
    min-height: 540px;
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
