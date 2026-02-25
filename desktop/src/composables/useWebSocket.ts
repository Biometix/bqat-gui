import { ref, onUnmounted } from 'vue'

export function useWebSocket(url) {
  const messages = ref([])
  const isConnected = ref(false)
  const isStarted = ref(false)
  let socket = null

  const connect = (index = 0, dataArray = []) => {
    // Append token to the WebSocket URL
    socket = new WebSocket(url)

    socket.onopen = () => {
      // console.log('WebSocket connected')
      isConnected.value = true
    }

    socket.onmessage = (event) => {
      // console.log('Received:', event.data)
      messages.value.push(event.data)
      try {
        const item = JSON.parse(event.data)
        switch (item['type']) {
          case 'spec':
            const cleanedContent = Object.fromEntries(
              Object.entries(item['content']).map(([key, value]) => [key.replace(/:$/, ''), value])
            )
            dataArray.value[index] = {
              ...dataArray.value[index],
              spec: { ...dataArray.value[index].spec, ...cleanedContent }
            }

            break
          case 'status':
            if (item['content'].Task) {
              if (item['content'].Time) {
                const feature = {
                  Time: item['content'].Time,
                  Throughput: item['content'].Throughput,
                  Output: item['content'].Output,
                  Discrepancy: item['content'].Discrepancy,
                  Differences: item['content'].Differences
                }
                dataArray.value[index] = { ...dataArray.value[index], feature, status: 'done' }
                close()
              }
            } else if (item['content'].total) {
              isStarted.value = true
              dataArray.value[index] = { ...dataArray.value[index], progress: item['content'] }
            } else if (item['content'].Error || item['content'].error) {
              dataArray.value[index] = { ...dataArray.value[index], error: item['content'] }
              dataArray.value[index] = { ...dataArray.value[index], feature, status: 'error' }
              close()
            }
            break
          case 'info':
            if (item['content'].files) {
              dataArray.value[index] = { ...dataArray.value[index], num: item['content'].files }
            }
          default:
            break
          //TODO: error display
        }
      } catch (e) {
        // console.error('Error parsing JSON:', e)
      }
      // console.log('data:',benchMarkData.value)
    }

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error)
    }

    socket.onclose = () => {
      // console.log('WebSocket closed')
      isConnected.value = false
      isStarted.value = false
    }
  }

  const sendMessage = (message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const text = typeof message === 'object' ? JSON.stringify(message) : message
      socket.send(text)
    } else {
      console.error('WebSocket is not open')
    }
  }
  const stop = () => {
    if (socket && isConnected) {
      // socket.send('stop')
      isStarted.value = false
    }
  }
  const close = () => {
    if (socket) {
      socket.close()
      isStarted.value = false
    }
  }

  onUnmounted(() => {
    if (socket) {
      socket.close()
      isStarted.value = false
    }
  })

  return { messages, isConnected, isStarted, connect, sendMessage, stop, close }
}
