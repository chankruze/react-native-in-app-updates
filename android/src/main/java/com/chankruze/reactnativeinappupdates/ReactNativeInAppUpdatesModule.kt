package com.chankruze.reactnativeinappupdates

import com.facebook.react.bridge.ReactApplicationContext

class ReactNativeInAppUpdatesModule(reactContext: ReactApplicationContext) :
  NativeReactNativeInAppUpdatesSpec(reactContext) {

  override fun multiply(a: Double, b: Double): Double {
    return a * b
  }

  companion object {
    const val NAME = NativeReactNativeInAppUpdatesSpec.NAME
  }
}
