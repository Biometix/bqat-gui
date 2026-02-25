<template>
  <a-card hoverable>
    <a-flex vertical class="viewContainer" gap="middle">
      <a-flex horizental style="margin-bottom: 0px; justify-content: space-between">
        <div>
          <a-button
            type="primary"
            size="medium"
            :disabled="selectedRow.length == 0"
            @click="handleDownload"
          >
            <template #icon>
              <DownloadOutlined />
            </template>
          </a-button>
          <span style="margin-left: 8px">
            <template v-if="selectedRow.length > 0">
              {{ `Selected ${selectedRow.length} items` }}
            </template>
          </span>
        </div>
        <div v-if="!dataType.type" style="align-self: center">
          More Details
          <a-switch v-model:checked="Info.dataview.rawData" @change="handleSwitch" />
        </div>
        <div v-else>
          <span style="margin: 8px">
            <template v-if="selectedRow.length > 0">
              {{ `Selected ${selectedRow.length} items` }}
            </template>
          </span>
          <!-- <a-button
            v-if="dataType.type"
            type="primary"
            :disabled="selectedRow.length == 0"
            @click="handleRerun"
          >
            Rerun
          </a-button> -->
          <a-button
            v-if="dataType.type"
            type="primary"
            :disabled="true"
            @click="handleRerun"
          >
            Rerun
          </a-button>
        </div>
      </a-flex>
      <a-table
        :loading="dataType.type ? Info.dataview.loadingData : Info.dataview.loadingOutlier"
        class="ant-table-striped"
        :row-class-name="(_record, index) => (index % 2 === 1 ? 'table-striped' : null)"
        :columns="columns"
        :row-selection="{ onSelect: onSelectChange, onSelectAll: onSelectAll }"
        :data-source="dataType.type ? Info.dataview.data : Info.dataview.outlier"
        :scroll="{ x: 'max-content', y: 580 }"
        :expandRowByClick="true"
        :showExpandColumn="false"
        :pagination="{
          position: ['bottomCenter'],
          defaultPageSize: 20,
          showQuickJumper: true,
          size: 'middle',
          total: dataType.type ? Info.dataview.data?.length : Info.dataview.outlier?.length,
          showTotal: (total) => `Total ${total} items`
        }"
      >
        <template #headerCell="{ column }">
          <span v-if="column.key == 'file'" style="color: #1890ff">File</span>
        </template>
        <template
          #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
        >
          <div style="padding: 8px" v-if="column.key !== 'file'">
            <a-input
              ref="searchInput"
              :placeholder="`Search ${column.dataIndex}`"
              :value="selectedKeys[0]"
              style="width: 188px; margin-bottom: 8px; display: block"
              @change="(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])"
              @pressEnter="handleSearch(selectedKeys, confirm, column.dataIndex)"
            />
            <a-button
              type="primary"
              size="small"
              style="width: 90px; margin-right: 8px"
              @click="handleSearch(selectedKeys, confirm, column.dataIndex)"
            >
              <template #icon><SearchOutlined /></template>
              Search
            </a-button>
            <a-button size="small" style="width: 90px" @click="handleReset(clearFilters)">
              Reset
            </a-button>
          </div>

          <div style="padding: 10px; height: 400px; overflow-y: scroll" v-else>
            <a-input
              ref="searchInput"
              :placeholder="`Search ${column.dataIndex}`"
              :value="selectedKeys[0]"
              style="width: 100%; margin-bottom: 8px; display: block"
              @change="(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])"
              @pressEnter="handleSearch(selectedKeys, confirm, column.dataIndex)"
            />
            <a-row justify="space-between" style="margin-bottom: 10px">
              <a-button
                type="primary"
                size="small"
                style="width: 90px; margin-right: 8px"
                @click="handleSearch(selectedKeys, confirm, column.dataIndex)"
              >
                <template #icon><SearchOutlined /></template>
                Search
              </a-button>
              <a-button size="small" style="width: 90px" @click="handleReset(clearFilters)">
                Reset
              </a-button>
            </a-row>
            <a-divider style="margin: 0px"></a-divider>
            <a-flex vertical style="margin-top: 10px; width: 250px">
              <a-checkbox
                :indeterminate="indeterminate"
                :checked="checkedAllGet()"
                @change="checkedAllSet()"
                >Select All</a-checkbox
              >
              <div
                v-for="item in dataType.type ? Info.dataview.dataMenus : Info.dataview.outlierMenus"
              >
                <a-checkbox
                  v-if="item.value != 'index' && item.value != 'file'"
                  :checked="item.checked"
                  @change="() => (item.checked = !item.checked)"
                  >{{ item.text }}</a-checkbox
                >
              </div>
            </a-flex>
          </div>
        </template>
        <template #customFilterIcon="{ filtered, column }">
          <search-outlined v-if="column.key !== 'file'" />
          <FilterOutlined v-else />
        </template>
        <template #bodyCell="{ record, column, text }">
          <span v-if="searchText && searchedColumn === column.dataIndex">
            <template
              v-for="(fragment, i) in text
                .toString()
                .split(new RegExp(`(?<=${searchText})|(?=${searchText})`, 'i'))"
            >
              <mark
                v-if="fragment.toLowerCase() === searchText.toLowerCase()"
                :key="i"
                class="highlight"
              >
                {{ fragment }}
              </mark>
              <template v-else>{{ fragment }}</template>
            </template>
          </span>
          <span v-else-if="column.key !== 'file'">
            {{ JSON.stringify(record[column.key]) }}
          </span>
        </template>
        <template #expandedRowRender="{ record }">
          <div v-if="mime.getType(record.file)?.includes('audio')">
            <vue-sound
              :show-download="false"
              :file="
                record.file.startsWith('/tmp/')
                  ? API.api +
                    '/warehouse/' +
                    record.file
                      .split('/')
                      .pop()
                      .replace(/\./g, '/')
                      .replace(/\/([^\/]+)$/, '.$1')
                  : API.api + '/warehouse/' + record.file
              "
              :alt="
                '🔉' + record.file.startsWith('/tmp/')
                  ? record.file
                      .split('/')
                      .pop()
                      .replace(/\./g, '/')
                      .replace(/\/([^\/]+)$/, '.$1')
                  : record.file
              "
            />
          </div>
          <div v-else>
            <img
              style="max-height: 200px"
              :src="
                record.file.startsWith('/tmp/')
                  ? API.api +
                    '/warehouse/' +
                    record.file
                      .split('/')
                      .pop()
                      .replace(/\./g, '/')
                      .replace(/\/([^\/]+)$/, '.$1')
                  : API.api + '/warehouse/' + record.file
              "
              :alt="
                '🖼️' + record.file.startsWith('/tmp/')
                  ? record.file
                      .split('/')
                      .pop()
                      .replace(/\./g, '/')
                      .replace(/\/([^\/]+)$/, '.$1')
                  : record.file
              "
            />
          </div>
        </template>
      </a-table>

      <!-- <a-pagination
        :current="2"
        :page-size="20"
        :total="500"
        :show-total="(total) => `Total ${total} items`"
        style="height: 30px; overflow-inline: hidden; overflow: auto"
      />  -->
    </a-flex>
  </a-card>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { SearchOutlined, FilterOutlined } from '@ant-design/icons-vue'
import { VueSound } from 'vue-sound'
import { useInfo, useApi } from '../stores/dataStore.js'
import mime from 'mime'
import { DownloadOutlined } from '@ant-design/icons-vue'

const Info = ref(useInfo())
const API = ref(useApi())
const searchInput = ref()
const searchText = ref('')
const searchedColumn = ref(-1)
const selectedRow = ref([])
const data = ref([])
const columns = computed(() => {
  return dataType.type
    ? Info.value.dataview.dataColumns?.filter((item) => {
        const menu = Info.value.dataview.dataMenus?.find(
          (menuItem) => menuItem.column === item.dataIndex
        )
        return menu && menu.checked
      })
    : Info.value.dataview.outlierColumns?.filter((item) => {
        const menu = Info.value.dataview.outlierMenus
          .filter((item) => item.column !== 'data_reduced' && item.column !== 'key')
          ?.find((menuItem) => menuItem.column === item.dataIndex)
        return menu && menu.checked
      })
})

const dataType = defineProps({
  type: {
    type: Boolean,
    required: true
  }
})

// Define emitted events
const emit = defineEmits(['download', 'switch', 'rerun'])

const checkedAllGet = () => {
  return dataType.type
    ? Info.value.dataview.dataMenus.every((menu) => menu.checked)
    : Info.value.dataview.outlierMenus.every((menu) => menu.checked)
}

const checkedAllSet = () => {
  const status = checkedAllGet()
  dataType.type
    ? Info.value.dataview.dataMenus.forEach((menu) => {
        if (menu.value != 'index' && menu.value != 'file') menu.checked = !status
      })
    : Info.value.dataview.outlierMenus.forEach((menu) => {
        if (menu.value != 'index' && menu.value != 'file') menu.checked = !status
      })
}

const indeterminate = computed(() => {
  const checkedCount = dataType.type
    ? Info.value.dataview.dataMenus.filter((menu) => menu.checked).length
    : Info.value.dataview.outlierMenus.filter((menu) => menu.checked).length
  const temp = dataType.type
    ? Info.value.dataview.dataMenus.length
    : Info.value.dataview.outlierMenus.length
  return checkedCount > 0 && checkedCount < temp
})

const handleSearch = (selectedKeys, confirm, dataIndex) => {
  confirm()
  searchText.value = selectedKeys[0]
  searchedColumn.value = dataIndex
}

const handleReset = (clearFilters) => {
  clearFilters({ confirm: true })
  searchText.value = ''
}

const onSelectChange = (record, selected, selectedRows) => {
  console.log('selectedRowKeys changed: ', selectedRows)
  selectedRow.value = selectedRows?.map((item) => item?.key)
}

const onSelectAll = (selected, selectedRows) => {
  console.log('selectedRowKeys changed: ', selectedRows)
  selectedRow.value = selected ? selectedRows?.map((item) => item?.key) : []
}

const handleDownload = () => {
  // console.log(selectedRow.value)
  emit('download', selectedRow.value)
}

const handleSwitch = () => {
  // console.log(selectedRow.value)
  emit('switch', Info.value.dataview.rawData)
  // Info.value.dataview.rawData=!Info.value.dataview.rawData
}

const handleRerun = () => {
  // console.log(selectedRow.value)
  emit('rerun', selectedRow.value)
}

const updateData = () => {
  console.log(dataType.type)
  //result
  if (dataType.type) {
    data.value = Info.value.process.result.map((item, index) => ({ ...item, key: index }))
    const menu = Object.keys(Info.value.process.result[0])?.map((item) => {
      return {
        item,
        checked: true,
        text: item,
        value: item,
        column: item,
        type: typeof Info.value.process.result[0][item] === 'number' ? 'number' : 'string'
      }
    })
    const column = Object.keys(Info.value.process.result[0])?.map((itemKey) => ({
      fixed: itemKey == 'file' ? 'left' : false,
      title: itemKey,
      dataIndex: itemKey,
      key: itemKey,
      customFilterDropdown: true,
      width: 200,
      // resizable: true,
      align: 'center',
      sorter: (a, b) => {
        if (typeof a[itemKey] === 'number' && typeof b[itemKey] === 'number') {
          return a[itemKey] - b[itemKey]
        }
        return a[itemKey]?.toString().localeCompare(b[itemKey]?.toString())
      },
      onFilter: (value, record) =>
        record[itemKey]?.toString().toLowerCase().includes(value.toLowerCase())
    }))
    const menus = [
      // { column: 'index', checked: true, text: 'Index', value: 'index', item: 'index' },
      ...menu
    ]
    // Move the column with key 'file' to the first position
    const fileColumn = column.find((col) => col.key === 'file')
    const otherColumns = column.filter((col) => col.key !== 'file' && col.key !== 'log')
    const lastColumn = column.find((col) => col.key == 'log')
    const columns = [
      ...(fileColumn ? [fileColumn] : []),
      ...otherColumns,
      ...(lastColumn ? [lastColumn] : [])
    ].filter((item) => {
      const menu = menus.find((menuItem) => menuItem.column === item.dataIndex)
      return menu && menu.checked
    })

    Info.value.updateData('dataview', {
      ...Info.value.dataview,
      data: data.value,
      dataMenus: menus,
      dataColumns: columns,
      loadingData: false
    })
  }
  //outlier
  else {
    data.value = Info.value.dataview.outlier.map((item, index) => ({ ...item, key: index }))
    const menu = Object.keys(Info.value.dataview.outlier?.[0])?.map((item) => {
      return {
        item,
        checked: true,
        text: item,
        value: item,
        column: item,
        type: typeof Info.value.dataview.outlier[0][item] === 'number' ? 'number' : 'string'
      }
    })
    const column = Object.keys(Info.value.dataview.outlier[0])?.map((itemKey) => ({
      fixed: itemKey == 'file' ? 'left' : false,
      title: itemKey,
      dataIndex: itemKey,
      key: itemKey,
      customFilterDropdown: true,
      width: 200,
      // resizable: true,
      align: 'center',
      sorter: (a, b) => {
        if (typeof a[itemKey] === 'number' && typeof b[itemKey] === 'number') {
          return a[itemKey] - b[itemKey]
        }
        return a[itemKey]?.toString().localeCompare(b[itemKey]?.toString())
      },
      onFilter: (value, record) =>
        record[itemKey]?.toString().toLowerCase().includes(value.toLowerCase())
    }))
    const menus = [
      // { column: 'index', checked: true, text: 'Index', value: 'index', item: 'index' },
      ...menu
    ]
    const fileColumn = column.find((col) => col.key === 'file')
    const otherColumns = column.filter((col) => col.key !== 'file' && col.key !== 'log')
    const lastColumn = column.find((col) => col.key == 'log')
    const columns = [
      ...(fileColumn ? [fileColumn] : []),
      ...otherColumns,
      ...(lastColumn ? [lastColumn] : [])
    ].filter((item) => {
      const menu = menus.find((menuItem) => menuItem.column === item.dataIndex)
      return menu && menu.checked
    })
    // const columns = [
    //   // {
    //   //   title: '',
    //   //   dataIndex: 'index',
    //   //   key: 'index',
    //   //   customFilterDropdown: true,
    //   //   width: 40,
    //   //   fixed: 'left'
    //   // },
    //   ...column
    // ].filter((item) => {
    //   const menu = menus.find((menuItem) => menuItem.column === item.dataIndex)
    //   return menu && menu.checked
    // })

    Info.value.updateData('dataview', {
      ...Info.value.dataview,
      outlier: data.value,
      outlierMenus: menus,
      outlierColumns: columns,
      loadingOutlier: false
    })
  }
}

// watch(
//   () => Info.value.process.result,
//   (value) => {
//     console.log('update', Info.value.dataview)
//     updateData()
//   }
// )

// watch(
//   () => Info.value.dataview.outlier,
//   (value) => {
//     console.log('update', Info.value.dataview)
//     updateData()
//   }
// )

onMounted(() => {
  updateData()
})
</script>

<style>
.viewContainer {
  min-width: 800px;
  /* background-color: antiquewhite; */
  height: calc(75vh);
  min-height: 500px;
  /* align-items: center; */
}

[data-theme='dark'] .ant-table-striped :deep(.table-striped) td {
  background-color: rgb(29, 29, 29);
}

[data-theme='light'] .ant-table-striped :deep(.table-striped) td {
  background-color: #fafafa;
}
.vue-sound {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(240, 240, 240, 1);
}

.vue-sound .player-back-15-icon,
.player-ahead-15-icon,
.player-volume {
  display: none;
}
.vue-sound .player-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.vue-sound .play-icon,
.pause-icon {
  height: 25px;
  width: 25px;
}

/* .vue-sound .player-track {
  display: none;
} */

[data-theme='dark'] {
  .vue-sound .play-icon,
  .pause-icon {
    fill: #f8f8f8;
  }
  .vue-sound {
    background-color: rgba(20, 20, 20, 1);
  }
}
</style>
