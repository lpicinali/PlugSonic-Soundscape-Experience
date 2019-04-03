import { all, call, put, select, take, fork, spawn } from 'redux-saga/effects'
import { map } from 'lodash'

import { ActionType, PlaybackState, ReachAction } from 'src/constants.js'
import { setHrtfFilename } from 'src/actions/listener.actions.js'
import { getFileUrl } from 'src/audio/audio-files.js'
import { getInstance as getBinauralSpatializer } from 'src/audio/binauralSpatializer.js'
import {
  play as enginePlay,
  stop as engineStop,
  playSource as enginePlaySource,
  stopSource as engineStopSource,
  setSourceLoop as engineSetSourceLoop,
  setSource as engineSetSource,
  unsetSource as engineUnsetSource,
  setMasterVolume as engineSetMasterVolume,
  setSourceVolume as engineSetSourceVolume,
  setSourcePosition as engineSetSourcePosition,
  setListenerPosition as engineSetListenerPosition,
  setHeadRadius as engineSetHeadRadius,
  setPerformanceMode as engineSetPerformanceMode,
  setQualityMode as engineSetQualityMode,
  addSource as engineAddSource,
  deleteSources as engineDeleteSources,
  deleteAllSources as engineDeleteAllSources,
  importSources as engineImportSources,
} from 'src/audio/engine.js'

/* ======================================================================== */
// PLAY/STOP
/* ======================================================================== */
function* applyPlayStop() {
  while (true) {
    const { payload: { state } } = yield take(ActionType.SET_PLAYBACK_STATE)
    // console.log('Saga -> Apply Play Stop')
    if (state === PlaybackState.PLAY) {
      enginePlay()
    } else if (state === PlaybackState.STOP) {
      engineStop()
    }
  }
}

/* ======================================================================== */
// SOURCE ON/OFF
/* ======================================================================== */
function* manageSourceOnOff(name) {
  const sources = yield select(state => state.sources.sources)
  const sourceObject = sources[name]
  if (sourceObject.selected === true) {
    yield call(engineSetSource, sourceObject)
  } else {
    yield call(engineUnsetSource, sourceObject)
  }
  const playbackState = yield select(state => state.controls.playbackState)

  if (playbackState === PlaybackState.PLAY) {
    yield call(enginePlay)
  }
}

function* applySourceOnOff() {
  while (true) {
    const { type, payload } = yield take(ActionType.SOURCE_ONOFF)
    yield spawn(manageSourceOnOff, payload.name)
  }
}

/* ======================================================================== */
// ADD SOURCE
/* ======================================================================== */
function* manageAddSource(name) {
  const sources = yield select(state => state.sources.sources)
  const sourceObject = sources[name]
  console.log(`Saga -> Manage Add Source`)
  console.log(sourceObject)
  yield call(engineAddSource, sourceObject)

  if (sourceObject.selected === true){
    yield call(engineSetSource, sourceObject)
  }

  const playbackState = yield select(state => state.controls.playbackState)
  if (playbackState === PlaybackState.PLAY) {
    yield call(enginePlay)
  }
}

function* applyAddSourceLocal() {
  while (true) {
    const { type, payload } = yield take(ActionType.ADD_SOURCE_LOCAL)
    // console.log('Saga -> applyAddSource')
    yield spawn(manageAddSource, payload.name)
  }
}

function* applyAddSourceRemote() {
  while (true) {
    const { type, payload } = yield take(ActionType.ADD_SOURCE_REMOTE)
    // console.log('Saga -> applyAddSource')
    yield spawn(manageAddSource, payload.name)
  }
}

/* ======================================================================== */
// IMPORT SOURCES
/* ======================================================================== */
function* manageImportSources(sourcesArray) {
  yield call(engineDeleteAllSources)
  for(let i=0; i<sourcesArray.length;i++){
    yield spawn(manageAddSource, sourcesArray[i].name)
  }
}

function* applyImportSources() {
  while (true) {
    const { type, payload } = yield take(ActionType.IMPORT_SOURCES)
    const sourcesArray = payload.sources
    yield call(manageImportSources, sourcesArray)
  }
}

// function* applyDeleteSources() {
//   while (true) {
//     const { type, payload } = yield take(ActionType.DELETE_TARGETS)
//     const selected = payload.targets
//     engineStop()
//
//     yield call(engineDeleteSources, selected)
//
//     const playbackState = yield select(state => state.controls.playbackState)
//     if (playbackState === PlaybackState.PLAYING) {
//       yield call(enginePlay)
//     }
//   }
// }

/* ======================================================================== */
// LOOP
/* ======================================================================== */
function* applyLoopChanges() {
  while (true) {
    const { payload: { source, loop } } = yield take(ActionType.SET_SOURCE_LOOP)
    yield call(engineSetSourceLoop, source, loop)

    const playbackState = yield select(state => state.controls.playbackState)

    if (playbackState === PlaybackState.PLAY) {
      yield call(engineStopSource, source)
      yield call(enginePlaySource, source)
    }
  }
}

/* ======================================================================== */
// SOURCE POSITION
/* ======================================================================== */
function* applySourcePosition() {
  while (true) {
    const { payload } = yield take(ActionType.SET_SOURCE_POSITION)
    const name = payload.source
    const { x, y, z } = payload.position
    engineSetSourcePosition(name, { x, y, z })
  }
}

/* ======================================================================== */
// LISTENER POSITION
/* ======================================================================== */
function* applyListenerPosition() {
  while (true) {
    const { payload } = yield take(ActionType.SET_LISTENER_POSITION)
    const { x, y, z, rotZAxis } = payload.position
    engineSetListenerPosition({ x, y, z, rotZAxis })
  }
}

// function* applyMasterVolume() {
//   while (true) {
//     const { type, payload } = yield take(ActionType.SET_MASTER_VOLUME)
//     engineSetMasterVolume(payload.volume)
//   }
// }

// function* applyTargetVolume() {
//   while (true) {
//     const { type, payload } = yield take(ActionType.SET_TARGET_VOLUME)
//     const { target, volume } = payload
//     engineSetSourceVolume(target, volume)
//   }
// }

function* handleSourcesReach() {
  while (true) {
    yield take([
      ActionType.SET_LISTENER_POSITION,
      ActionType.SET_SOURCE_POSITION,
      ActionType.SET_SOURCE_REACH,
      ActionType.SET_PLAYBACK_STATE,
    ])

    const [listener, sources] = yield all([
      select(state => state.listener),
      select(state => Object.values(state.sources.sources).filter(x => x.spatialised === true)),
    ])

    // eslint-disable-next-line
    for (const source of sources) {
      const distanceToListener = Math.sqrt(
        (listener.position.x - source.position.x) ** 2 +
        (listener.position.y - source.position.y) ** 2
      )
      const isInsideReach = distanceToListener <= source.reach.radius

      if (source.reach.action === ReachAction.TOGGLE_VOLUME) {
        const volume = isInsideReach === true ? source.volume : 0
        yield call(engineSetSourceVolume, source.name, volume, source.reach.fadeDuration)
      } else if (source.reach.action === ReachAction.TOGGLE_PLAYBACK) {
        yield call(engineStopSource, source.name)

        if (isInsideReach === true) {
          yield call(enginePlaySource, source.name)
        }
      }
    }
  }
}

/* ======================================================================== */
// HEAD RADIUS
/* ======================================================================== */
function* applyHeadRadius() {
  while (true) {
    const { payload } = yield take(ActionType.SET_HEAD_RADIUS)
    engineSetHeadRadius(payload.radius)
  }
}

/* ======================================================================== */
// PERFORMANCE MODE
/* ======================================================================== */
function* applyPerformanceMode() {
  while (true) {
    const { payload } = yield take(ActionType.SET_HIGH_PERFORMANCE_MODE)
    engineSetPerformanceMode()
  }
}

/* ======================================================================== */
// QUALITY MODE
/* ======================================================================== */
function* applyQualityMode() {
  while (true) {
    const { payload } = yield take(ActionType.SET_HIGH_QUALITY_MODE)
    engineSetQualityMode()
  }
}

// function* applyDirectionalityEnabled() {
//   while (true) {
//     const { payload } = yield take(ActionType.SET_DIRECTIONALITY_ENABLED)
//     engine.setDirectionalityEnabled(payload.isEnabled)
//   }
// }

// function* applyDirectionalityAttenuation() {
//   while (true) {
//     const { payload } = yield take(ActionType.SET_DIRECTIONALITY_VALUE)
//     const attenuation = payload.value * 30
//     engine.setDirectionalityAttenuation(Ear.LEFT, attenuation)
//     engine.setDirectionalityAttenuation(Ear.RIGHT, attenuation)
//   }
// }

/* ======================================================================== */
// HRTF
/* ======================================================================== */
function* initDefaultHrtf() {
  const hrtfFilename = yield select(state => state.listener.hrtfFilename)
  const binauralInstance = yield call(getBinauralSpatializer)
  yield call(binauralInstance.setHrtf, hrtfFilename)
}

function* applyHrtfs() {
  while (true) {
    const { payload: { filename } } = yield take(ActionType.SET_HRTF_FILENAME)

    try {
      const binauralInstance = yield call(getBinauralSpatializer)
      yield call(binauralInstance.setHrtf, filename)
    } catch (err) {
      console.log('Could not set default HRTF:')
      console.error(err)
    }
  }
}

export default function* rootSaga() {
  yield [
    applyPlayStop(),
    applySourceOnOff(),
    applyAddSourceLocal(),
    applyAddSourceRemote(),
    // applyDeleteSources(),
    applyImportSources(),
    // applyMasterVolume(),
    // applyTargetVolume(),
    applyLoopChanges(),
    handleSourcesReach(),
    applyPerformanceMode(),
    applyQualityMode(),
    applyHeadRadius(),
    // applyDirectionalityEnabled(),
    // applyDirectionalityAttenuation(),
    applySourcePosition(),
    applyListenerPosition(),
    initDefaultHrtf(),
    applyHrtfs(),
  ]
}
