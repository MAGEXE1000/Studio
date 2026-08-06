package com.chordex.app

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.widget.FrameLayout
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.work.Constraints
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequest
import androidx.work.WorkManager
import com.getcapacitor.BridgeActivity
import com.getcapacitor.BridgeWebChromeClient
import com.getcapacitor.JSObject
import java.io.File
import java.util.concurrent.TimeUnit

import androidx.compose.ui.platform.ComposeView
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.runtime.*
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.drawWithContent
import com.felixny.inkflow.inkReveal
import com.felixny.inkflow.InkFlowConfig

class MainActivity : BridgeActivity() {

    companion object {
        private const val UPDATE_WORK_NAME = "studio_update_check"
        
        @JvmField
        var lastSharedFile: JSObject? = null
        
        @Volatile
        @JvmField
        var isWebViewReady = false
    }

    private var sharedFileUriToProcess: Uri? = null

    inner class ThemeTransitionBridge {
        @JavascriptInterface
        fun triggerTransition(nextTheme: String, amoled: Boolean, x: Float, y: Float) {
            runOnUiThread {
                runInkFlowTransition(nextTheme, amoled, x, y)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        handleIncomingIntent(intent)

        var processStartTime: Long = 0
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            processStartTime = android.os.Process.getStartElapsedRealtime()
        }
        val onCreateTime = android.os.SystemClock.elapsedRealtime()
        android.util.Log.i("LivexBoot", "MainActivity onCreate started at " + onCreateTime + "ms since boot. Process start to onCreate gap: " + (if (processStartTime > 0) (onCreateTime - processStartTime) else "N/A") + "ms")

        val splashScreen = installSplashScreen()
        splashScreen.setKeepOnScreenCondition {
            if (isWebViewReady) {
                false
            } else if (android.os.SystemClock.elapsedRealtime() - onCreateTime > 2500) {
                false
            } else {
                true
            }
        }

        registerPlugin(AppInstallerPlugin::class.java)
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val window = window
                if (window != null) {
                    val layoutParams = window.attributes
                    val display = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        display
                    } else {
                        window.windowManager.defaultDisplay
                    }
                    if (display != null) {
                        val modes = display.supportedModes
                        var highestMode: android.view.Display.Mode? = null
                        var maxRate = 0f
                        for (mode in modes) {
                            if (mode.refreshRate > maxRate) {
                                maxRate = mode.refreshRate
                                highestMode = mode
                            }
                        }
                        if (highestMode != null && maxRate >= 90f) {
                            layoutParams.preferredDisplayModeId = highestMode.modeId
                            window.attributes = layoutParams
                            android.util.Log.i("LivexRefreshRate", "Configured preferred display mode: ModeId=" + highestMode.modeId + ", RefreshRate=" + maxRate + " Hz")
                        }
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("LivexRefreshRate", "Failed to configure preferred display mode: " + e.message)
            }
        }

        window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        scheduleUpdateBackgroundCheck()

        if (this.bridge != null && this.bridge.webView != null) {
            val webView = this.bridge.webView
            android.util.Log.i("LivexBoot", "WebView initialized at " + android.os.SystemClock.elapsedRealtime() + "ms since boot")
            webView.setBackgroundColor(android.graphics.Color.TRANSPARENT)
            webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
            
            webView.addJavascriptInterface(ThemeTransitionBridge(), "ThemeTransitionBridge")

            val webViewInitTime = android.os.SystemClock.elapsedRealtime()
            webView.post {
                if (this.bridge != null && this.bridge.webView != null) {
                    val timingsJs = "window.__nativeBootTimings = {" +
                        "processStart: " + processStartTime + "," +
                        "onCreate: " + onCreateTime + "," +
                        "webViewInit: " + webViewInitTime +
                        "};"
                    this.bridge.webView.evaluateJavascript(timingsJs, null)

                    val transitionJs = """
                        window.__triggerThemeTransition = function(nextTheme, amoled, x, y, callback) {
                            window.__themeTransitionCallback = callback;
                            window.ThemeTransitionBridge.triggerTransition(nextTheme, amoled, x, y);
                        };
                    """.trimIndent()
                    this.bridge.webView.evaluateJavascript(transitionJs, null)
                }
            }

            webView.webChromeClient = object : BridgeWebChromeClient(this.bridge) {
                override fun onPermissionRequest(request: PermissionRequest) {
                    runOnUiThread {
                        request.grant(request.resources)
                    }
                }
            }
        }

        if (sharedFileUriToProcess != null) {
            processIncomingFile(sharedFileUriToProcess!!)
            sharedFileUriToProcess = null
        }
        handlePackageInstallerIntent(intent)
    }

    fun runInkFlowTransition(nextTheme: String, amoled: Boolean, x: Float, y: Float) {
        val webView = this.bridge?.webView ?: return
        if (webView.width <= 0 || webView.height <= 0) {
            // Background JS callback run fallback directly
            webView.evaluateJavascript("if (typeof window.__themeTransitionCallback === 'function') { window.__themeTransitionCallback(); }", null)
            return
        }

        // 1. Capture WebView bitmap
        val bitmap = Bitmap.createBitmap(webView.width, webView.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        webView.draw(canvas)

        // 2. Add ComposeView overlay
        val rootView = findViewById<FrameLayout>(android.R.id.content)
        val composeView = ComposeView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }
        rootView.addView(composeView)

        // 3. Set content with InkFlow reveal
        composeView.setContent {
            var progress by remember { mutableStateOf(0f) }

            LaunchedEffect(Unit) {
                // Execute the JS theme change callback to update the WebView in the background
                webView.evaluateJavascript("if (typeof window.__themeTransitionCallback === 'function') { window.__themeTransitionCallback(); }", null)

                // Allow 40ms (approx 2 frames) for the WebView to finish background style recalculation & paint
                // under the static screenshot overlay before running the reveal animation.
                kotlinx.coroutines.delay(40)

                // Run progress animation
                animate(
                    initialValue = 0f,
                    targetValue = 1f,
                    animationSpec = tween(durationMillis = 550, easing = FastOutSlowInEasing)
                ) { value, _ ->
                    progress = value
                }

                // Animation finished: remove the overlay
                rootView.removeView(composeView)
                bitmap.recycle()
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .graphicsLayer(compositingStrategy = CompositingStrategy.Offscreen)
            ) {
                Image(
                    bitmap = bitmap.asImageBitmap(),
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.FillBounds
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .inkReveal(progress = progress, config = InkFlowConfig.CENTER)
                        .drawWithContent {
                            drawRect(
                                color = Color.Black,
                                blendMode = BlendMode.DstOut
                            )
                        }
                )
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        
        val action = intent.action
        val data = intent.data
        var targetUri: Uri? = null

        if (Intent.ACTION_VIEW == action && data != null) {
            val scheme = data.scheme
            if ("content" == scheme || "file" == scheme) {
                intent.data = null
                intent.action = Intent.ACTION_MAIN
                targetUri = data
            }
        } else if (Intent.ACTION_SEND == action && intent.type != null) {
            val streamUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            if (streamUri != null) {
                intent.action = Intent.ACTION_MAIN
                intent.removeExtra(Intent.EXTRA_STREAM)
                targetUri = streamUri
            }
        }

        if (targetUri != null) {
            processIncomingFile(targetUri)
        }
        handlePackageInstallerIntent(intent)
    }

    private fun handlePackageInstallerIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        if ("com.chordex.app.SESSION_API_PACKAGE_INSTALLED" == action) {
            android.util.Log.i("MainActivity", "[INSTRUMENTATION] [NATIVE] Intercepted PackageInstaller intent in MainActivity: action=$action")
            InstallReceiver().onReceive(this, intent)
        }
    }

    private fun handleIncomingIntent(intent: Intent?) {
        if (intent == null) return
        val action = intent.action
        val data = intent.data

        if (Intent.ACTION_VIEW == action && data != null) {
            val scheme = data.scheme
            if ("content" == scheme || "file" == scheme) {
                intent.data = null // Prevent BridgeActivity from loading this file path directly as a webpage
                intent.action = Intent.ACTION_MAIN
                sharedFileUriToProcess = data
            }
        } else if (Intent.ACTION_SEND == action && intent.type != null) {
            val streamUri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
            if (streamUri != null) {
                intent.action = Intent.ACTION_MAIN
                intent.removeExtra(Intent.EXTRA_STREAM)
                sharedFileUriToProcess = streamUri
            }
        }
    }

    private fun processIncomingFile(uri: Uri) {
        try {
            val fileName = getFileName(uri) ?: "unknown"
            val mimeType = contentResolver.getType(uri) ?: ""

            val fileObj = JSObject()
            fileObj.put("fileName", fileName)

            if (fileName.endsWith(".json") || mimeType.contains("json")) {
                val inputStream = contentResolver.openInputStream(uri)
                val reader = java.io.BufferedReader(java.io.InputStreamReader(inputStream))
                val stringBuilder = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    stringBuilder.append(line)
                }
                inputStream?.close()
                val jsonContent = stringBuilder.toString()

                fileObj.put("type", "json")
                fileObj.put("data", jsonContent)
                lastSharedFile = fileObj

                triggerJsEvent("chordex:shared-json", jsonContent, fileName)
            } else {
                val inputStream = contentResolver.openInputStream(uri)
                val cacheDir = cacheDir
                val tempFile = File(cacheDir, "shared_" + System.currentTimeMillis() + "_" + fileName)
                val outputStream = java.io.FileOutputStream(tempFile)
                val buffer = ByteArray(1024)
                var read: Int
                while (inputStream!!.read(buffer).also { read = it } != -1) {
                    outputStream.write(buffer, 0, read)
                }
                inputStream.close()
                outputStream.close()

                val filePath = tempFile.absolutePath
                fileObj.put("type", "audio")
                fileObj.put("data", filePath)
                lastSharedFile = fileObj

                triggerJsEvent("chordex:shared-audio", filePath, fileName)
            }
        } catch (e: Exception) {
            android.util.Log.e("MainActivity", "Failed to process shared file: " + e.message)
        }
    }

    private fun getFileName(uri: Uri): String? {
        var result: String? = null
        if ("content" == uri.scheme) {
            val cursor = contentResolver.query(uri, null, null, null, null)
            try {
                if (cursor != null && cursor.moveToFirst()) {
                    val index = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                    if (index >= 0) {
                        result = cursor.getString(index)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.w("MainActivity", "Failed to query filename: " + e.message)
            } finally {
                cursor?.close()
            }
        }
        if (result == null) {
            result = uri.path
            val cut = result?.lastIndexOf('/') ?: -1
            if (cut != -1) {
                result = result?.substring(cut + 1)
            }
        }
        return result
    }

    private fun triggerJsEvent(eventName: String, data: String, fileName: String) {
        if (this.bridge == null || this.bridge.webView == null) return
        runOnUiThread {
            try {
                val escapedData = data.replace("\\", "\\\\").replace("'", "\\'").replace("\\n", "\\\\n").replace("\\r", "\\\\r")
                val escapedFileName = fileName.replace("\\", "\\\\").replace("'", "\\'")
                val js = "window.dispatchEvent(new CustomEvent('$eventName', { detail: { data: '$escapedData', fileName: '$escapedFileName' } }));"
                this.bridge.webView.evaluateJavascript(js, null)
            } catch (e: Exception) {
                android.util.Log.e("MainActivity", "Failed to evaluate JS: " + e.message)
            }
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
        }
    }

    private fun scheduleUpdateBackgroundCheck() {
        try {
            val constraints = Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build()
            val request = PeriodicWorkRequest.Builder(
                    UpdateCheckWorker::class.java, 15, TimeUnit.MINUTES)
                .setConstraints(constraints)
                .build()
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                UPDATE_WORK_NAME,
                ExistingPeriodicWorkPolicy.KEEP,
                request
            )
        } catch (e: Exception) {
            android.util.Log.w("MainActivity", "Update background work failed to schedule: " + e.message)
        }
    }

    override fun onStart() {
        super.onStart()
        AppInstallerPlugin.logNativeInstrumentation(this, "MainActivity", -1, "onStart", "MainActivity entered onStart")
    }

    override fun onResume() {
        super.onResume()
        AppInstallerPlugin.logNativeInstrumentation(this, "MainActivity", -1, "onResume", "MainActivity entered onResume")
    }

    override fun onPause() {
        super.onPause()
        AppInstallerPlugin.logNativeInstrumentation(this, "MainActivity", -1, "onPause", "MainActivity entered onPause")
    }

    override fun onStop() {
        super.onStop()
        AppInstallerPlugin.logNativeInstrumentation(this, "MainActivity", -1, "onStop", "MainActivity entered onStop")
    }

    override fun onDestroy() {
        super.onDestroy()
        AppInstallerPlugin.logNativeInstrumentation(this, "MainActivity", -1, "onDestroy", "MainActivity entered onDestroy")
    }
}
