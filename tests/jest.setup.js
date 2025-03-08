// AudioContext 관련 Fake 클래스들
class FakeGainNode {
  gain = { value: 1 }
  connect = jest.fn().mockReturnThis()
}

class FakeBufferSourceNode {
  buffer = null
  playbackRate = { value: 1 }
  detune = { value: 0 }
  loop = false
  loopStart = 0
  loopEnd = 0
  channelCount = 1
  channelCountMode = 'max'
  channelInterpretation = 'speakers'
  context = {}
  numberOfInputs = 0
  numberOfOutputs = 0
  onended = null
  start = jest.fn()
  stop = jest.fn()
  connect = jest.fn().mockReturnThis()
  disconnect = jest.fn()
  addEventListener = jest.fn()
  removeEventListener = jest.fn()
  dispatchEvent = jest.fn().mockReturnValue(true)
}

class FakeAudioContext {
  currentTime = 100
  destination = {}
  createGain = jest.fn(() => new FakeGainNode())
  createBufferSource = jest.fn(() => new FakeBufferSourceNode())
  decodeAudioData = jest.fn(async arrayBuffer => {
    return {} // 간단하게 빈 AudioBuffer 객체로 처리
  })
  resume = jest.fn(async () => {})
}

// 전역 AudioContext 오버라이드
global.AudioContext = FakeAudioContext
