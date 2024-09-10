<template>
  <a-flex class="outlierContainer" gap="middle" vertical>
    <a-spin size="large" :spinning="tip" :tip="tip">
      <a-flex gap="large" vertical>
        <!-- detector section  -->
        <a-card hoverable>
          <a-flex vertical gap="middle">
            <h2><i class="bi bi-exclamation-square"></i> Select Outlier Detector:</h2>

            <a-select
              size="large"
              ref="select"
              style="width: 100%; margin-block: 10px"
              v-model:value="outlierInfo.outlier.detector"
              :options="detectorSelect"
              @click="
                () => {
                  outlierInfo.outlier.iconLoading = false
                }
              "
            >
            </a-select>
          </a-flex>
        </a-card>

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
              v-model:value="outlierInfo.outlier.columns"
              change-on-select
              placeholder="Please select"
              :options="columnSelect"
            />
          </a-flex>
        </a-card>

        <!-- outlier preview section -->
        <!-- <a-collapse
        v-model:activeKey="outlierInfo.outlier.activeKeys"
        :bordered="false"
        style="background: rgb(255, 255, 255); margin-top: 10px"
      >
        <h2>
          <i class="bi bi-bug"></i> Preview the outliers: [
          {{ outlierInfo.outlier.fileList.length }} ]
        </h2>
        <a-collapse-panel :key="6" header="Outlier Preview Section" class="customStyle1">
          <div class="emptyPreview" v-if="outlierInfo.outlier.filePath.length == 0">
            <a-empty />
          </div>

          <div v-else class="image-card-container" @scroll="handleScroll">
            <a-card
              v-if="outlierInfo.outlier.fileList.length > 100"
              hoverable
              v-for="(item, index) in displayedFiles"
              :style="previewStyle"
              :key="index"
              style="margin: 5px"
            >
              <template #cover>
                <a-tooltip :title="item.name">
                  <img :src="item.url" :alt="item.name" :style="previewStyle" />
                </a-tooltip>
              </template>
            </a-card>

            <a-card
              v-else
              hoverable
              v-for="(item1, index1) in outlierInfo.outlier.fileList"
              :style="previewStyle"
              :key="index1"
              style="margin: 5px"
            >
              <template #cover>
                <a-tooltip :title="item1.name">
                  <img :src="item1.url" :alt="item1.name" :style="previewStyle" />
                </a-tooltip>
              </template>
            </a-card>
          </div>
        </a-collapse-panel>
        <p></p>
      </a-collapse> -->
        <a-row justify="center" :gutter="40" style="margin-top: 2rem">
          <!-- <a-col :span="4"
          ><a-button style="width: 100%" size="large" danger @click="clearOutlier">
            Reset</a-button
          ></a-col
        > -->

          <!-- <a-col :span="4">
          <a-descriptions v-if="eta!=-1" style="margin-block: 5px">
            <a-descriptions-item label="ETA(s)">{{ eta == -1 ? '' : eta }}</a-descriptions-item>
          </a-descriptions>
        </a-col> -->
          <a-col :span="12">
            <a-button
              :disabled="!outlierInfo.outlier.iconLoading"
              style="width: 100%; padding: 0"
              size="large"
              type="primary"
              danger
              @click="clearTask"
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
              :loading="outlierInfo.outlier.iconLoading"
              :disabled="outlierInfo.process.selectedItems.length !== 1 || outlierInfo.outlier.columns.length == 0"
              @click="getOutlier"
            >
              <i v-if="eta > 0">ETA: {{ eta }} s</i>
              <i v-else class="bi bi-play" style="font-style: normal; margin-inline: 5px"> Start</i>
            </a-button>
          </a-col>
        </a-row>
        <a-alert
          v-if="outlierStatus.outlier == 2"
          style="margin-top: 2rem"
          message="Outliers"
          :description="'There are ' + outlierLength + ' outliers'"
          type="info"
          show-icon
          closable
        />
      </a-flex>
    </a-spin>
    <!-- <h3 style="text-align: center">
      Current status is :
      {{
        outlierStatus.outlier == 0
          ? 'Not started'
          : outlierStatus.outlier == 1
            ? 'Ongoing'
            : outlierStatus.outlier == 2
              ? 'Success'
              : 'Error'
      }}
    </h3> -->
  </a-flex>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStatus, useInfo, useApi } from '../stores/dataStore.js'
import type { SelectProps, CascaderProps } from 'ant-design-vue'
import { json2csv } from 'json-2-csv'
// import { Cascader } from 'ant-design-vue';

const outlierStatus = useStatus()
const API = useApi()
//0:not started / 1:ongoing / 2:finished /-1:failed
const outlierInfo = ref(useInfo())
const outlierLength = ref(0)
let intervalId = null
const tip = computed(() => {
  if (outlierStatus.result == 1) {
    return 'Report is generating...'
  } else if (outlierStatus.process == 1) {
    return 'Task is running...'
  } else if (outlierStatus.preprocess == 1) {
    return 'Preprocess is implementing...'
  } else {
    return false
  }
})
const eta = ref(-1)

// const loading = ref(false)
// const displayedFiles = ref(
//   computed(() => outlierInfo.value.outlier.fileList.slice(0, loadedFiles.value))
// )
// const loadedFiles = ref(100)

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
    disabled:
      outlierInfo.value.process.selectedItems.length == 1 &&
      outlierInfo.value.process.selectedItems[0].modality == 'face' &&
      (outlierInfo.value.process.selectedItems[0].engine == 'bqat' ||
        outlierInfo.value.process.selectedItems[0].engine == 'default')
        ? false
        : true,
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
    disabled:
      outlierInfo.value.process.selectedItems.length == 1 &&
      outlierInfo.value.process.selectedItems[0].modality == 'face' &&
      outlierInfo.value.process.selectedItems[0].engine == 'ofiq'
        ? false
        : true,
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
    disabled:
      outlierInfo.value.process.selectedItems.length == 1 &&
      outlierInfo.value.process.selectedItems[0].modality == 'face' &&
      outlierInfo.value.process.selectedItems[0].engine == 'biqt'
        ? false
        : true,
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
    disabled:
      outlierInfo.value.process.selectedItems.length == 1 &&
      outlierInfo.value.process.selectedItems[0].modality == 'Fingerprint'
        ? false
        : true,
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
    disabled:
      outlierInfo.value.process.selectedItems.length == 1 &&
      outlierInfo.value.process.selectedItems[0].modality == 'iris'
        ? false
        : true,
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

const clearTask = async () => {
  outlierInfo.value.outlier.iconLoading = false
  const url = `${API.api}/task/${outlierInfo.value.outlier.id}/cancel?type=outlier`
  await fetch(url, {
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
      clearInterval(intervalId)
      outlierStatus.updateStatus('outlier', 2)
      outlierInfo.value.outlier.id = ''
      console.log(data)
    })
    .catch((error) => {
      console.error('Error cancel task:', error)
    })
}
// const clearTask = async () => {
//   const url = `${API.api}/task/metadata`
//   try {
//     const response = await fetch(url, {
//       method: 'GET',
//       headers: { accept: 'application/json' }
//     })
//     if (!response.ok) {
//       console.log(response)
//     }
//     const data = await response.json()
//     const task_id = data.tid
//     const type = data.type
//     const url2 = `${API.api}/task/${task_id}/cancel?type=${type}`
//     await fetch(url2, {
//       method: 'POST',
//       headers: { accept: 'application/json' }
//     })
//       .then((response) => {
//         return response.json()
//       })
//       .then((data) => {
//         console.log(data)
//       })
//       .catch((error) => {
//         console.error('Error cancel task:', error)
//       })
//   } catch (error) {
//     console.error('Error clear task:', error)
//   }
// }
//do not claim two value in one const
// const previewStyle = ref(
//   computed(() => {
//     if (outlierInfo.value.outlier.fileList.length < 100) {
//       return 'width: 100px; height: 100px; object-fit: contain;'
//     } else {
//       return 'width: 50px; height: 50px; object-fit: contain; '
//     }
//   })
// )

// const iconLoading = ref<boolean>(false);
const getOutlier = async () => {
  let optionColumns =
    outlierInfo.value.outlier.columns.length > 0
      ? outlierInfo.value.outlier.columns.map((item) => {
          if (item[1]) {
            return item[1]
          }
        })
      : []

  if (outlierInfo.value.outlier.columns.length == 1 && !outlierInfo.value.outlier.columns[0][1]) {
    const options = outlierInfo.value.outlier.columns[0][0]
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
  // console.log(JSON.stringify(options))
  const id = outlierInfo.value.process.selectedItems[0].id
  // const id = '8228cacc-3c7f-48f5-abd4-14f7095ece7b'
  const url = `${API.api}/scan/${id}/outliers/detect?trigger=true`
  // console.log(outlierInfo.value.outlier.detector, optionColumns)
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        detector: outlierInfo.value.outlier.detector,
        columns: optionColumns
      })
    })

    if (!response.ok) {
      outlierInfo.value.outlier.iconLoading = false
      throw new Error('Failed to detect outlier')
    }
    const temp = await response.json()
    console.log(temp)
    outlierInfo.value.outlier.id = temp['outlier detection task in progress']
    outlierInfo.value.outlier.iconLoading = true
    outlierStatus.updateStatus('outlier', 1)
    intervalId = setInterval(() => {
      if (outlierInfo.value.outlier.id != '' && outlierStatus.outlier == 1) {
        getETA(outlierInfo.value.outlier.id)
        // await getETA(outlierInfo.value.outlier.id)
        if (eta.value <= 0) {
          checkOutlier(id)
        }
      } else {
        clearInterval(intervalId)
      }
    }, 1000)
  } catch (error) {
    console.error('Error detect outlier:', error)
    outlierInfo.value.outlier.iconLoading = false
  }
}

const checkOutlier = async (id) => {
  if (outlierInfo.value.outlier.id != '') {
    const url2 = `${API.api}/scan/${id}/outliers`
    await fetch(url2, {
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
        // console.log(data)
        outlierStatus.updateStatus('outlier', 2)
        outlierInfo.value.outlier.id = ''
        outlierInfo.value.outlier.iconLoading = false
        clearInterval(intervalId)
        if (data != null) {
          outlierLength.value = data.length
        }
        if (data.length > 0) {
          downloadOutliers(data)
        }
      })
      .catch((error) => {
        console.error('Error check outliers task status:', error)
      })
  }
}
const getETA = async (tid) => {
  const url = `${API.api}/task/${tid}/status`
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { accept: 'application/json' }
    })
    if (!response.ok) {
      console.log('can not find task progress')
    }
    const data = await response.json()
    // console.log(data)
    if (data.done != 0) {
      eta.value = data.eta
      if (data.eta == 0) {
        eta.value = -1
        checkOutlier(outlierInfo.value.process.selectedItems[0].id)
        clearInterval(intervalId)
      }
    }
  } catch (error) {
    console.error('Error getting task status:', error)
  }
}
const downloadOutliers = async (data) => {
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

//To lazy load more files when scrolling to the bottom of the file list
// const loadMoreFiles = () => {
//   if (loading.value) return // Prevent multiple requests
//   loading.value = true
//   setTimeout(() => {
//     loadedFiles.value += 100
//     loading.value = false
//   }, 100)
// }

//Clear curent page, set status back to unscan, clear fileList
const clearOutlier = () => {
  outlierInfo.value.initialiseOutlier()
  outlierStatus.updateStatus('outlier', 0)
  // loadedFiles.value = 100
  console.log('Clear Outlier')
}
</script>

<style>
.emptyPreview {
  margin-top: 1rem;
  height: 300px;
  display: flex;
  flex-wrap: wrap;
  /* background-color: lightgrey; */
  border: 1px dotted grey;
  border-radius: 10px;
  justify-content: center;
  align-items: center;
  overflow-y: scroll;
  background-color: rgba(245, 245, 245, 0.3);
}

.popupClass {
  width: 65%;
  max-width: 1000px;
  min-width: 600px;
}

.outlierContainer {
  /* min-height: 100vh; */
  width: 80%;
  max-width: 1200px;
  margin-top: 1rem;
}

.customStyle1 {
  border-radius: 10px;
  margin-bottom: 30px;
  margin-top: 20px;
  border: solid lightgrey 0.5px;
  overflow: hidden;
}

.customStyle1:hover {
  border: solid #1677ff 0.5px;
}

.image-card-container {
  display: flex;
  flex-wrap: wrap;
  /* justify-content: space-around; */
  height: 300px;
  overflow-y: scroll;
}

@media (min-width: 1024px) {
  .outlierContainer{
    margin-top: 2rem;
  }
}
</style>
