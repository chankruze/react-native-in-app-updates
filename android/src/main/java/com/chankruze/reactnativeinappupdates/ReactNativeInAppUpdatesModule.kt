package com.chankruze.reactnativeinappupdates

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability

class ReactNativeInAppUpdatesModule(reactContext: ReactApplicationContext) :
  NativeReactNativeInAppUpdatesSpec(reactContext), ActivityEventListener {

  private val appUpdateManager = AppUpdateManagerFactory.create(reactContext)
  private var listenerCount = 0

  private val installStateListener = InstallStateUpdatedListener { state ->
    if (listenerCount == 0) return@InstallStateUpdatedListener
    val map: WritableMap = Arguments.createMap().apply {
      putInt("status", state.installStatus())
      putDouble("bytesDownloaded", state.bytesDownloaded().toDouble())
      putDouble("totalBytesToDownload", state.totalBytesToDownload().toDouble())
    }
    emit(EVENT_STATUS, map)
  }

  init {
    reactContext.addActivityEventListener(this)
    appUpdateManager.registerListener(installStateListener)
  }

  override fun checkForUpdate(promise: Promise) {
    appUpdateManager.appUpdateInfo
      .addOnFailureListener { promise.reject("CHECK_FAILED", it.message, it) }
      .addOnSuccessListener { info ->
        val map: WritableMap = Arguments.createMap().apply {
          val available = info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
          putBoolean("updateAvailable", available)
          putInt("availabilityStatus", info.updateAvailability())
          putBoolean("flexibleAllowed", info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE))
          putBoolean("immediateAllowed", info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE))
          putInt("updatePriority", info.updatePriority())
          putInt("versionCode", info.availableVersionCode())
          val staleness = info.clientVersionStalenessDays()
          if (staleness != null) putInt("daysSinceRelease", staleness) else putNull("daysSinceRelease")
        }
        promise.resolve(map)
      }
  }

  override fun startUpdate(updateType: Double, promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.reject("NO_ACTIVITY", "No foreground activity found")
      return
    }
    appUpdateManager.appUpdateInfo
      .addOnFailureListener { promise.reject("START_FAILED", it.message, it) }
      .addOnSuccessListener { info -> launchUpdateFlow(info, updateType.toInt(), activity, promise) }
  }

  private fun launchUpdateFlow(
    info: AppUpdateInfo,
    updateType: Int,
    activity: Activity,
    promise: Promise,
  ) {
    if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE) {
      promise.reject("UPDATE_UNAVAILABLE", "No update available")
      return
    }
    val resolvedType = when {
      info.isUpdateTypeAllowed(updateType) -> updateType
      info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE) -> AppUpdateType.FLEXIBLE
      info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE) -> AppUpdateType.IMMEDIATE
      else -> {
        promise.reject("UPDATE_TYPE_UNAVAILABLE", "Neither FLEXIBLE nor IMMEDIATE update is allowed")
        return
      }
    }
    try {
      appUpdateManager.startUpdateFlowForResult(
        info,
        activity,
        AppUpdateOptions.newBuilder(resolvedType)
          .setAllowAssetPackDeletion(true)
          .build(),
        REQUEST_CODE,
      )
      promise.resolve(null)
    } catch (e: Exception) {
      promise.reject("LAUNCH_FAILED", e.message, e)
    }
  }

  override fun installUpdate() {
    appUpdateManager.completeUpdate()
  }

  override fun addListener(eventType: String) {
    listenerCount++
  }

  override fun removeListeners(count: Double) {
    listenerCount = maxOf(0, listenerCount - count.toInt())
  }

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) return
    val map: WritableMap = Arguments.createMap().apply {
      putBoolean("installed", resultCode == Activity.RESULT_OK)
    }
    emit(EVENT_RESULT, map)
  }

  override fun onNewIntent(intent: Intent?) = Unit

  override fun invalidate() {
    appUpdateManager.unregisterListener(installStateListener)
    super.invalidate()
  }

  private fun emit(event: String, payload: WritableMap) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(event, payload)
  }

  companion object {
    const val NAME = NativeReactNativeInAppUpdatesSpec.NAME
    const val EVENT_STATUS = "onInAppUpdateStatus"
    const val EVENT_RESULT = "onInAppUpdateResult"
    private const val REQUEST_CODE = 42139
  }
}
