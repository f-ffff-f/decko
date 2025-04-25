// jest.setup.js
const { AudioContext, OfflineAudioContext } = require('node-web-audio-api')

// node-web-audio-api에서 가져온 구현체를 global 객체에 할당
global.AudioContext = AudioContext
global.OfflineAudioContext = OfflineAudioContext
// 조건 회피하기 위해 window 객체 할당
global.window = {}

console.log(
  'Jest setup: Global AudioContext and OfflineAudioContext configured using node-web-audio-api.'
)
