import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import router from '../router/index.ts';
import { inject } from 'vue';

export const useStatus = defineStore('status', () => {
    const scan = ref(0)
    const process = ref(0)
    const result = ref(0)
    const outlier = ref(0)
    const preprocess = ref(0)
    const app = ref(0)
    const files = ref(0)

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
        if (item == 'files') {
            files.value = statusCode
        }
    }

    return { scan, process, result, outlier, app, files, preprocess, updateStatus }
})

export const useInfo = defineStore('info', () => {
    const scan = ref({
        fileList: [],
        validFileList: [],
        folderPath: null,
        length: 0,
        limit: 0,
        type: [],
        inputType: ['PNG', 'JPG', 'JPEG', 'JP2', 'WSQ', 'BMP', 'WAV'],
        name: '',
        modality: 'face',
        engine: ['bqat'],
        submit: false,
        disableUploader: false,
        percent: 0,
        activeKeys: [3],
        tabKey: 1,
        converted: []
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
        minimal: true,
        generatedReports: [], // all generated data set on result page
        generating: [],
        selectedCsv: [],
        treeSelected: [],
        generatedReport: { id: '', blob: new Blob(), html: '' }
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
        progress: false,
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
            modality: 'face',
            engine: ['bqat'],
            submit: false,
            disableUploader: false,
            percent: 0,
            activeKeys: [3],
            tabKey: 1,
            converted: []
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
            minimal: true,
            generatedReports: [], // all generated data set on result page
            generating: [],
            selectedCsv: [],
            treeSelected: [],
            generatedReport: { id: '', blob: new Blob(), html: '' }
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
            progress: false,
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
    type Config = {
        apiUrl?: string;
        cookieExpire?: string;
        login?: string;
    };

    const setCookie = (name: string, value: string, sec: number) => {
        const expires = new Date(Date.now() + sec * 1000).toUTCString();
        let encodedValue = btoa(value);
        document.cookie = `${name}=${encodedValue}; expires=${expires}; path=/;`;
    };

    // Helper to get unexpired cookie
    const getCookie = (name: string) => {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    };
    const clearCookie = (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }


    const config: Config = inject('config');
    const api = ref(config.apiUrl ? config.apiUrl : import.meta.env.VITE_API.toString())
    const apiList = ref([config.apiUrl ? config.apiUrl : import.meta.env.VITE_API.toString()])
    const login = ref(config.login ? config.login ? true : false : import.meta.env.VITE_LOGIN.toString() == 'true' ? true : false)
    const landing = ref(false)
    const accessKey = ref<string>('');
    if (login.value) {
        const token = getCookie('accessToken');
        if (token) {
            try {
                accessKey.value = atob(token);
            } catch (error) {
                console.error('Invalid Base64 token:', error);
                accessKey.value = '';
            }
        } else {
            accessKey.value = '';
        }
    } else {
        accessKey.value = 'noKey';
    }
    const testTimer = ref(0)
    const cookieExpire = ref(config.cookieExpire ? config.cookieExpire : import.meta.env.VITE_COOKIE_EXPIRE.toString())

    const folderPath = ref('')
    const inputFolder = ref([])
    const inputTree = ref([])

    // Define a type for the fetch options with optional headers
    type FetchOptions = RequestInit & {
        headers?: HeadersInit;
    };

    class AccessKeyError extends Error {
        constructor(message:string) {
          super(message);
          this.name = "AccessKey Not correct";
        }
      }

    // Create a wrapper around fetch to automatically add the Authorization header
    const authFetch = async (url, options: RequestInit = {}) => {
        let token = '';
        try {
            const cookieValue = getCookie('accessToken');
            if (cookieValue) {
                token = atob(cookieValue);
            }
        } catch (error) {
            console.error('Error decoding access token:', error);
        }
        if ((token == accessKey.value && token) || !login.value) {
            if (token == accessKey.value && token) {
                setCookie('accessToken', accessKey.value, cookieExpire.value); // Renew token for 10 min
            }
            options.headers = options.headers || {};
            // options.headers['Authorization'] = `Bearer ${token}`;
            // options.credentials = 'include';
            const timeoutId = setTimeout(() => Promise.reject(new Error('Request timed out')), 600000);

            const fetchPromise = fetch(url, options).then(async response => {
                clearTimeout(timeoutId);  // Clear timeout when request completes

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                    return response
                }

                // Check for JSON or text response
                const contentType = response.headers.get('Content-Type');
                const data = contentType && contentType.includes('application/json')
                    ? await response.json()
                    : await response.text();

                return data;
            });

            // return Promise.race([fetchPromise, new Promise((_, reject) => timeoutId)]);
            return fetchPromise;

        } else {
            console.log('back to landing page!');
            router.push({ path: '/landing' });
            throw new AccessKeyError('AccessKey error')
        }

    };

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
            const segments = item.split('/');

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
                        value: index == 0 && index1 == 0 ? segment : item,
                        children: [],
                        disabled: index == 0 && index1 == 0 ? true : false
                    };
                    currentLevel.push(newNode);
                    existingNode = newNode;
                }

                // Move to the next level
                currentLevel = existingNode.children;
            });
        });

        inputTree.value = nestedStructure ? nestedStructure[0] ?.children : []
    }

    return { testTimer, accessKey, landing, login, cookieExpire, setCookie, getCookie, clearCookie, api, apiList, updateApi, folderPath, updateFolderPath, updateInputFolder, inputFolder, inputTree, updateInputTree, authFetch }
})

