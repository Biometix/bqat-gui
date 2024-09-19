import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStatus = defineStore('status', () => {
    const scan = ref(0)
    const process = ref(0)
    const result = ref(0)
    const outlier = ref(0)
    const preprocess = ref(0)
    const app = ref(0)
    function updateStatus(item, statusCode) {
        if (item === 'scan') {
            scan.value = statusCode
        }
        if (item == 'process') {
            process.value = statusCode
        }
        if (item == 'result') {
            result.value = statusCode
        }
        if (item == 'outlier') {
            outlier.value = statusCode
        }
        if (item == 'preprocess') {
            preprocess.value = statusCode
        }
        if (item == 'app') {
            app.value = statusCode
        }
    }

    return { scan, process, result, outlier, app, preprocess, updateStatus }
})

export const useInfo = defineStore('info', () => {
    const scan = ref({
        fileList: [],
        validFileList: [],
        folderPath: null,
        length: 0,
        limit: 0,
        type: [],
        inputType: ['PNG', 'JPG', 'JPEG', 'JP2', 'WSQ', 'BMP','WAV'],
        name: '',
        modality: ['Fingerprint'],
        submit: false,
        disableUploader: false,
        percent: 0,
        activeKeys: [3],
        tabKey: 1,
        converted:[]
    })
    const process = ref({
        taskIds: [], // current running time all task ids(including pending tasks)
        timeStamp: '',
        timeRecord: 0,//current time record
        timer: -1,//whether to start/stop record time
        taskStatus: [],
        taskList: [],
        selectedItems: [],
        selectedExternal: false
    })
    const result = ref({
        activeKey: 0,
        downsample: 100,
        minimal: false,
        generatedReports: [], // all generated data set on result page
        generating: [],
        selectedCsv: [],
        treeSelected: [],
        generatedReport: { id: '', html: new Blob() }
    })
    const outlier = ref({
        id: '',
        detector: 'ECOD',
        columns: [],
        folderPath: '',
        length: 0,
        activeKeys: [6],
        iconLoading: false
    })
    const preprocess = ref({
        id: '',
        size: 100,
        ratio: 100,
        selectedRadio: 'ratio',
        type: 'JPG',
        inputType: [
            'PNG',

            'JPG',

            'JPEG',

            'JP2',

            'WSQ',

            'BMP'
        ],
        color: 'RGB',
        loading: false,
        // grayscale: false,
        folderPath: null,
        length: 0,
        log: [],
        activeKeys: [7, 8, 9]

    })

    function updateData(item, data) {
        if (item === 'scan') {
            scan.value = data
        }
        if (item == 'process') {
            process.value = data
        }
        if (item == 'result') {
            result.value = data
        }
        if (item == 'outlier') {
            outlier.value = data
        }
        if (item == 'preprocess') {
            preprocess.value = data
        }
    }
    function initialiseScan() {
        const newScan = {
            fileList: [],
            validFileList: [],
            length: 0,
            folderPath: null,
            limit: 0,
            type: [],
            inputType: ['PNG', 'JPG', 'JPEG', 'JP2', 'WSQ', 'BMP', 'WAV'],
            name: '',
            modality: ['Fingerprint'],
            submit: false,
            disableUploader: false,
            percent: 0,
            activeKeys: [3],
            tabKey: 1,
            converted:[]
        }
        scan.value = newScan
    }

    function initialiseProcess() {
        const newProcess = {
            taskIds: [], // current running time all task ids(including pending tasks)
            timeStamp: '',
            timeRecord: 0,//current time record
            timer: -1,//whether to start/stop record time
            taskStatus: [],
            taskList: [],
            selectedItems: [],
            selectedExternal: false
        }
        process.value = newProcess
    }

    function initialiseResult() {
        const newResult = {
            dataSet: [],// all finished data set(including pending report)
            activeKey: 0,
            downsample: 0,
            minimal: false,
            generatedReports: [], // all generated data set on result page
            generating: [],
            selectedCsv: [],
            treeSelected: [],
            generatedReport: { id: '', html: new Blob() }
        }
        result.value = newResult
    }

    function initialiseOutlier() {
        const newOutlier = {
            id: '',
            detector: 'ECOD',
            columns: [],
            folderPath: '',
            length: 0,
            activeKeys: [6],
            iconLoading: false
        }
        outlier.value = newOutlier
    }

    function initialisePreprocess() {
        const newPreprocess = {
            id: '',
            size: 100,
            ratio: 50,
            selectedRadio: 'ratio',
            type: 'JPG',
            inputType: [
                'PNG',

                'JPG',

                'JPEG',

                'JP2',

                'WSQ',

                'BMP'
            ],
            color: 'RGB',
            loading: false,
            // grayscale: false,
            length: 0,
            folderPath: null,
            log: [],
            activeKeys: [7, 8, 9]
        }
        preprocess.value = newPreprocess
    }


    return { scan, process, result, outlier, preprocess, updateData, initialiseScan, initialiseProcess, initialiseResult, initialiseOutlier, initialisePreprocess }
})

export const useApi = defineStore('api', () => {
    const api = ref(import.meta.env.VITE_API.toString())
    const apiList = ref([import.meta.env.VITE_API.toString()])

    const folderPath = ref('')
    const inputFolder = ref([])
    const inputTree = ref([])
    function updateApi(newapi) {
        api.value = newapi
        const index = apiList.value.findIndex(item => item == newapi)
        if (index == -1)
            apiList.value.push(newapi.toString())
    }
    function updateFolderPath(newpath) {
        folderPath.value = newpath
    }
    function updateInputFolder(newpath) {
        inputFolder.value = newpath
    }
    function updateInputTree(data) {
        const nestedStructure = [];

        // Iterate through each item in the data array
        data.forEach((item, index1) => {
            // Split the directory path into segments
            const segments = item.dir.split('/');

            // Initialize reference to the current level of the nested structure
            let currentLevel = nestedStructure;

            // Iterate through each segment to build the nested structure
            segments.forEach((segment, index) => {
                // Check if the segment already exists in the current level
                let existingNode = currentLevel.find(node => node.title === segment);

                // If node doesn't exist, create a new node
                if (!existingNode) {
                    const newNode = {
                        title: segment,
                        value: index == 0 && index1 == 0 ? segment : item.dir,
                        children: [],
                        count: index === segments.length - 1 ? item.count : 0,
                        disabled: index == 0 && index1 == 0 ? true : false
                    };
                    currentLevel.push(newNode);
                    existingNode = newNode;
                }

                // Move to the next level
                currentLevel = existingNode.children;

                // Add count to the last segment
                if (index === segments.length - 1) {
                    existingNode.count = item.count;
                }
            });
        });
        
        inputTree.value = nestedStructure[0].children
        // console.log(inputTree.value)
    }

    return { api, apiList, updateApi, folderPath, updateFolderPath, updateInputFolder, inputFolder, inputTree, updateInputTree }
})

