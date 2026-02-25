
import Plotly from 'plotly.js-dist-min'

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

const config = {
    toImageButtonOptions: {
      format: 'jpeg', // one of png, svg, jpeg, webp
      height: 500,
      width: 700,
      scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
    },
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['reset', 'resetViews', 'autoScale', 'lasso', 'pan', 'select'],
    modeBarButtonsToAdd: ['toggleHover']
  }

export const drawBox = (columnData, columnName, index) => {
    var trace = {
      y: columnData,
      boxpoints: 'all',
      jitter: 0.3,
      type: 'box',
      pointpos: -1.8,
      name: 'Distribusion'
    }
  
    var data = [trace]
  
    var layout = {
      title: {
        text: columnName.toUpperCase() + ' Box Plot'
      },
      font: { size: 18 },
      hovermode: false
    }
  
    Plotly.newPlot('myDiv'+index, data, layout, config)
}
  
export const drawHist = (columnData, columnName, index) => {
    var trace = {
      x: columnData,
      type: 'histogram'
    }
    var data = [trace]
    var layout = {
      title: {
        text: columnName.toUpperCase() + ' Hist Plot'
      },
      font: { size: 18 },
      hovermode: false,
      xaxis: {
        rangeslider: {
          range: [Math.min(...columnData), Math.max(...columnData)] // Ensure x is an array
        }
      },
      yaxis: {
        fixedrange: true
      }
    }
    Plotly.newPlot('myDiv'+index, data, layout, config)
}
  
export const drawBar = (columnData, columnName, index) => {
    const valueCounts = {}
    // Count occurrences of each unique value
    columnData.forEach((value) => {
      // Handle potential undefined or null values
      const normalizedValue = value !== null && value !== undefined ? String(value).trim() : 'Unknown'
      valueCounts[normalizedValue] = (valueCounts[normalizedValue] || 0) + 1
    })
    //x is the column type
    //y is the number of same column type
    var data = [
      {
        x: Object.keys(valueCounts),
  
        y: Object.values(valueCounts),
  
        type: 'bar'
      }
    ]
  
    var layout = {
      title: {
        text: columnName.toUpperCase() + ' Bar Plot'
      },
      font: { size: 18 },
      hovermode: false,
      xaxis: {
        type: 'category', // Treat x-axis values as categorical
        rangeslider: { visible: true } // Enable slider for categorical data
      },
      yaxis: {
        fixedrange: true
      }
    }
    Plotly.newPlot('myDiv'+index, data, layout, config)
}

export const drawOutlierHist = (Info, columnName, index) => {
    const normal = Info.value.dataview.restData
    const outlier = Info.value.dataview.outlier
    const columnDataNormal = normal.map((item) => item[columnName])
    const columnDataOutlier = outlier.map((item) => item[columnName])
  
    // Calculate the top and bottom 5% of normal data
    const sortedNormalData = [...columnDataNormal].sort((a, b) => a - b)
    const top5PercentIndex = Math.floor(sortedNormalData.length * 0.95)
    const bottom5PercentIndex = Math.ceil(sortedNormalData.length * 0.05)
    const top5Percent = sortedNormalData.slice(top5PercentIndex)
    const bottom5Percent = sortedNormalData.slice(0, bottom5PercentIndex)
  
    const columnDataPredict = [...top5Percent, ...bottom5Percent]

    var trace = {
      x: columnDataNormal,
      type: 'histogram',
      name: 'Normals'
    }
    var trace1 = {
      x: columnDataOutlier,
      type: 'histogram',
      name: 'Outliers',
      opacity: 0.75
    }
    var trace2 = {
      x: columnDataPredict,
      type: 'histogram',
      name: 'Predicts',
      opacity: 0.75,
      marker: {
        color: 'gray'
      }
    }
    var data = [trace, trace1, trace2]
    var layout = {
      title: {
        text: columnName.toUpperCase() + ' Outlier Hist'
      },
      font: { size: 18 },
      hovermode: false,
      xaxis: {
        rangeslider: {
          range: [Math.min(...columnDataNormal), Math.max(...columnDataNormal)] // Ensure x is an array
        }
      },
      yaxis: {
        fixedrange: true
      }
      // barmode: 'overlay'// overlay have display issue
    }
    Plotly.newPlot('myDiv'+index, data, layout, config)
}

const calculatePercentile = (arr, percentile) => {
    arr.sort((a, b) => a - b)
    const index = (percentile / 100) * (arr.length - 1)
    if (Math.floor(index) === index) {
      return arr[index]
    }
    const lower = arr[Math.floor(index)]
    const upper = arr[Math.ceil(index)]
    return lower + (upper - lower) * (index - Math.floor(index))
}
  
export const drawScatter = (Info, dotSize, index) => {
    const data = [...Info.value.dataview.restData, ...Info.value.dataview.outlier]
    const normal_reduced = data.map((item) => item.data_reduced).filter(item=>item[2]==0)
    const outlier_reduced = data.map((item) => item.data_reduced).filter(item=>item[2]==1)
    var inliersData = {
      y: normal_reduced.map((item) => item[1]),
      x: normal_reduced.map((item) => item[0]),
      mode: 'markers',
      type: 'scatter',
      name: 'Normals',
      text: normal_reduced.map((item) => item['file']),
      marker: { size: dotSize.value, color: 'rgb(35,35,35)' }
    }
    var outliersData = {
      y: outlier_reduced.map((item) => item[1]),
      x: outlier_reduced.map((item) => item[0]),
      mode: 'markers',
      type: 'scatter',
      name: 'Outliers',
      text: outlier_reduced.map((item) => item['file']),
      marker: { size: dotSize.value, color:'red'}
    }

    var contourTrace2 = {
      x: Array.from({ length: 100 }, (_, i) => i / 99),
      y: Array.from({ length: 100 }, (_, i) => i / 99),
      z: Info.value.dataview.outlierHeatmap,
      showscale: false,
      type: 'contour',
      colorscale: [
        [0, 'blue'],
        [1, 'blue']
      ],
      line: {
        width: 3,
        dash: 'dash'
      },
      contours: {
        start: Info.value.dataview.threshold,
        end: Info.value.dataview.threshold,
        size: 0.01,
        coloring: 'lines', // Ensure only lines are drawn
        showlines: true // Show the contour lines
      }
    }
  
    var contourTrace1 = {
      x: Array.from({ length: 100 }, (_, i) => i / 99),
      y: Array.from({ length: 100 }, (_, i) => i / 99),
      z: Info.value.dataview.outlierHeatmap,
      type: 'contour',
      reversescale: true,
      contours: {
        showlines: false,
        start: 0,
        end: (Math.max(...Info.value.dataview.outlierHeatmap.flat()) * dotSize.value) / 10,
        size: (Math.max(...Info.value.dataview.outlierHeatmap.flat()) * dotSize.value) / 200
      }
    }

    var layout = {
      font: { size: 18 },
      hovermode: 'closest',
      title: { text: 'Outlier Distribution' },

      legend: {
        x: 1.1, // Move legend to the right
        y: 1
      },
      sliders: [
      {
        pad: { t: 60 },
        currentvalue: {
        xanchor:'right',
          prefix: 'Size: ',
          font: {
            color: '#888',
            size: 20
          }
        },

        steps: [
          {
            label: 'small',
            method: 'restyle',
            args: ['marker.size', '8']
          },
          {
            label: 'medium',
            method: 'restyle',
            args: ['marker.size', '12']
          },
          {
            label: 'large',
            method: 'restyle',
            args: ['marker.size', '16']
          }
        ]
      }
    ]
    }
    var plotData = [inliersData, outliersData, contourTrace1, contourTrace2]
  
    Plotly.newPlot('myDiv'+index, plotData, layout, config)
  }
  

