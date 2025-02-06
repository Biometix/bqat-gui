export const initialiseTask = async (API, info, status) => {
    const url = `${API.api}/task/logs/scan`
    try {
        const data = await API.authFetch(url, {
            method: 'GET',
            headers: { accept: 'application/json' }
        })

        if (data) {
            const finishedTasks = data.filter(
                (displayItem) => displayItem.status == 2 || displayItem.status == 3
            )
            info.value.process.taskList = finishedTasks
            info.value.process.taskStatus = data.map((item) => {
                return {
                    tid: item.tid,
                    collection: item ?.collection,
                    name: item ?.collection ?.substring(0, 5),
                    status: item.status,
                    percent:
                        item.status == 2
                            ? 100
                            : item.status == 3
                                ? -1
                                : Math.floor((item.finished * 100) / item.total),
                    num: item.finished,
                    total: item.total,
                    mode: item.options.mode,
                    engine: item.options.engine,
                    input: item.input,
                    modified: item.modified,
                    elapse: item.elapse,
                    logs: item.logs ? item.logs : [],
                    options: item.options
                }
            })
        }
    } catch (error) {
        console.error('Error getting task status:', error)
    }
}
export const checkRunning = async (API, info, status) => {
    const url = `${API.api}/task/pending`
    try {
        const data = await API.authFetch(url, {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data) {
            status.updateStatus('app', 2)
            if (data.type == 'report') {
                console.log('3. get running report')
                status.updateStatus('result', 1)
            }
            if (data.type == 'scan') {
                console.log('3. get running scan')
                if (await checkRayState(API, status)) {
                    status.updateStatus('process', 1)
                    const elapse = Math.round(data.elapse)
                    info.value.process.timer = 0
                    info.value.process.timeRecord = elapse
                    // API.testTimer = elapse
                    // info.value.process.taskStatus.unshift(runningItemStatus)
                } else {
                    await stopTask(API, data.tid)
                }
            }
            if (data.type == 'preprocessing') {
                console.log('3. get running preprocessing')
                status.updateStatus('preprocess', 1)
            }
            if (data.type == 'outlier') {
                console.log('3. get running outlier')
                status.updateStatus('outlier', 1)
            }
        }

    } catch (error) {
        status.updateStatus('app', -1)
        console.error('Error get running task:', error)
    }
}
export const checkOutlierDesp = async (API, info) => {
    const url = `${API.api}/specification`
    try {
        const data1 = await API.authFetch(url + '?modality=iris', {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data1) {
            Object.assign(info.value.outlier.description, { 'iris': data1 });
        }
        const data2 = await API.authFetch(url + '?modality=fingerprint', {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data2) {
            Object.assign(info.value.outlier.description, { 'fingerprint': data2 });
        }
        const data3 = await API.authFetch(url + '?modality=face', {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data3) {
            Object.assign(info.value.outlier.description, { 'face-bqat': data3 });

        }
        const data4 = await API.authFetch(url + '?modality=face&engine=ofiq', {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data4) {
            Object.assign(info.value.outlier.description,{ 'face-ofiq': data4 });
        }
        const data5 = await API.authFetch(url + '?modality=face&engine=biqt', {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        if (data5) {
            Object.assign(info.value.outlier.description, { 'face-biqt': data5 });
        }
    } catch (error) {
        console.error('Error get outlier description:', error)
    }
}
//Check whether the server node crash
export const checkRayState = async (API, status) => {
    const url = `${API.api}/task/state`
    let state = true
    try {
        const data = await API.authFetch(url, {
            method: 'GET',
            headers: { accept: 'application/json' }
        })
        console.log(data)
    } catch (error) {
        console.log('server node crashed')
        status.updateStatus('app', -1)
        state = false
    }
    return state
}

export const stopTask = async (API, tid) => {
    const url = `${API.api}/task/${tid}/stop`
    try {
        const data = await API.authFetch(url, {
            method: 'POST',
            headers: { accept: 'application/json' }
        })

        console.log(data)
    } catch (error) {
        console.error('Error stop task:', error)
    }
}

export const parseFusionCode = (code: number) => {
    let engines = []
    if (code & 4) {
        engines.push('bqat')
    }
    if (code & 2) {
        engines.push('ofiq')
    }
    if (code & 1) {
        engines.push('biqt')
    }
    return engines
}

export const getFusionCode = (fusionArray: string[]) => {
    let code = 0
    if (fusionArray.includes('bqat')) {
        code |= 4
    }
    if (fusionArray.includes('ofiq')) {
        code |= 2
    }
    if (fusionArray.includes('biqt')) {
        code |= 1
    }
    return code
}
