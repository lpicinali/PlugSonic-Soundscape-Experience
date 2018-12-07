export const ActionType = {

  // ALERTS
  SET_DISCLAIMER_READ: 'SET_DISCLAIMER_READ',
  SET_PRESET_INFO_DISMISSED: 'SET_PRESET_INFO_DISMISSED',

  // CONTROLS
  SET_PLAYBACK_STATE: 'SET_PLAYBACK_STATE',

  // LISTENER
  SET_LISTENER_POSITION: 'SET_LISTENER_POSITION',
  SET_PERFORMANCE_MODE_ENABLED: 'SET_PERFORMANCE_MODE_ENABLED',
  SET_HEAD_RADIUS: 'SET_HEAD_RADIUS',
  // SET_DIRECTIONALITY_ENABLED: 'SET_DIRECTIONALITY_ENABLED',
  // SET_DIRECTIONALITY_VALUE: 'SET_DIRECTIONALITY_VALUE',

  // ROOM
  SET_ROOM_SHAPE: 'SET_ROOM_SHAPE',
  SET_ROOM_SIZE: 'SET_ROOM_SIZE',
  IMPORT_ROOM: 'IMPORT_ROOM',

  // PANELS
  HIDE_LEFT_PANEL: 'HIDE_LEFT_PANEL',
  SHOW_LEFT_PANEL: 'SHOW_LEFT_PANEL',

  // TARGET
  SET_TARGET: 'SET_TARGET',
  SET_EDITING_TARGET: 'SET_EDITING_TARGET',
  SET_TARGET_POSITION: 'SET_TARGET_POSITION',
  SET_TARGET_REACH: 'SET_TARGET_REACH',
  SET_TARGET_VOLUME: 'SET_TARGET_VOLUME',
  SET_MASTER_VOLUME: 'SET_MASTER_VOLUME',
  ADD_TARGET: 'ADD_TARGET',
  DELETE_TARGETS: 'DELETE_TARGETS',
  IMPORT_TARGETS: 'IMPORT_TARGETS',
  IMPORT_SELECTED: 'IMPORT_SELECTED',
}

export const Ear = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
}

export const PlaybackState = {
  PAUSED: 'PAUSED',
  PLAYING: 'PLAYING',
}

export const RoomShape = {
  ROUND: 'ROUND',
  RECTANGULAR: 'RECTANGULAR',
}
