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
import androidx.core.view.WindowCompat
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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.unit.dp
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.ui.Alignment
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.ui.graphics.Brush
import androidx.compose.foundation.Image
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.foundation.background
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.drawOutline
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.runtime.*
import androidx.compose.animation.core.*
import androidx.compose.ui.draw.drawWithContent
import com.felixny.inkflow.inkReveal
import com.felixny.inkflow.InkFlowConfig
import android.view.ViewGroup
import com.kyant.backdrop.backdrops.rememberLayerBackdrop
import com.kyant.backdrop.backdrops.layerBackdrop
import com.kyant.backdrop.drawBackdrop
import com.kyant.backdrop.effects.blur
import com.kyant.backdrop.effects.lens
import com.kyant.backdrop.effects.vibrancy

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

    private var navLeft by mutableFloatStateOf(0f)
    private var navTop by mutableFloatStateOf(0f)
    private var navWidth by mutableFloatStateOf(0f)
    private var navHeight by mutableFloatStateOf(0f)
    private var navVisible by mutableStateOf(false)
    private var navTheme by mutableStateOf("dark")
    private var navCornerRadius by mutableFloatStateOf(0f)

    private var pillLeft by mutableFloatStateOf(0f)
    private var pillWidth by mutableFloatStateOf(0f)
    private var pillVisible by mutableStateOf(false)

    private var floatLeft by mutableFloatStateOf(0f)
    private var floatTop by mutableFloatStateOf(0f)
    private var floatWidth by mutableFloatStateOf(0f)
    private var floatHeight by mutableFloatStateOf(0f)
    private var floatVisible by mutableStateOf(false)

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
        WindowCompat.setDecorFitsSystemWindows(window, false)

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
            webView.addJavascriptInterface(LiquidGlassBridge(), "LiquidGlassBridge")

            val parentGroup = (webView.parent as? ViewGroup) ?: findViewById<ViewGroup>(android.R.id.content)
            android.util.Log.i("LiquidGlass", "onCreate: parentGroup=$parentGroup, webViewParent=${webView.parent}")
            if (parentGroup != null) {
                parentGroup.removeView(webView)
                
                val composeView = ComposeView(this).apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                }
                parentGroup.addView(composeView)
                android.util.Log.i("LiquidGlass", "onCreate: composeView added to parentGroup $parentGroup")
                
                composeView.setContent {
                    val backdrop = rememberLayerBackdrop {
                        drawRect(if (navTheme == "light") Color(0xFFF8FAFC) else Color(0xFF0E0E12))
                        drawContent()
                    }
                    
                    Box(modifier = Modifier.fillMaxSize()) {
                        val density = LocalDensity.current
                        val strokeWidthPx = with(density) { 1.2f.dp.toPx() }

                        val (fillColor, strokeColor, topHighlightColor) = when (navTheme) {
                            "light" -> Triple(
                                Color.White.copy(alpha = 0.55f),
                                Color.Black.copy(alpha = 0.08f),
                                Color.White.copy(alpha = 0.90f)
                            )
                            "amoled" -> Triple(
                                Color.Black.copy(alpha = 0.58f),
                                Color.White.copy(alpha = 0.22f),
                                Color.White.copy(alpha = 0.45f)
                            )
                            else -> Triple( // "dark"
                                Color(0xFF14151B).copy(alpha = 0.50f),
                                Color.White.copy(alpha = 0.15f),
                                Color.White.copy(alpha = 0.35f)
                            )
                        }

                        val (pillFillColor, pillStrokeColor, pillHighlightColor) = when (navTheme) {
                            "light" -> Triple(
                                Color.White.copy(alpha = 0.50f),
                                Color.Black.copy(alpha = 0.10f),
                                Color.White.copy(alpha = 0.95f)
                            )
                            "amoled" -> Triple(
                                Color.White.copy(alpha = 0.22f),
                                Color.White.copy(alpha = 0.35f),
                                Color.White.copy(alpha = 0.50f)
                            )
                            else -> Triple( // "dark"
                                Color.White.copy(alpha = 0.16f),
                                Color.White.copy(alpha = 0.26f),
                                Color.White.copy(alpha = 0.40f)
                            )
                        }

                        val (iconColor, _) = when (navTheme) {
                            "light" -> Pair(Color(0xFF0F172A).copy(alpha = 0.70f), Color(0xFF0F172A))
                            "amoled" -> Pair(Color.White.copy(alpha = 0.90f), Color.White)
                            else -> Pair(Color.White.copy(alpha = 0.75f), Color.White)
                        }

                        // 1. AndroidView (WebView content layer) captured by backdrop
                        AndroidView(
                            factory = { webView },
                            modifier = Modifier
                                .fillMaxSize()
                                .layerBackdrop(backdrop)
                        )

                        // 2. Liquid Glass Surfaces & Icons rendered ON TOP of the live WebView content
                        if (navVisible) {
                            val navLeftDp = navLeft.dp
                            val navTopDp = navTop.dp
                            val navWidthDp = navWidth.dp
                            val navHeightDp = navHeight.dp
                            val navCornerRadiusDp = navCornerRadius.dp
                            val barShape = RoundedCornerShape(navCornerRadiusDp)
                            
                            Box(
                                modifier = Modifier
                                    .offset(x = navLeftDp, y = navTopDp)
                                    .size(width = navWidthDp, height = navHeightDp)
                                    .drawBackdrop(
                                        backdrop = backdrop,
                                        shape = { barShape },
                                        effects = {
                                            vibrancy()
                                            blur(18f.dp.toPx())
                                            lens(16f.dp.toPx(), 32f.dp.toPx(), depthEffect = true, chromaticAberration = true)
                                        },
                                        onDrawSurface = {
                                            val outline = barShape.createOutline(size, layoutDirection, this)
                                            drawOutline(outline = outline, color = fillColor)
                                            drawOutline(
                                                outline = outline,
                                                color = strokeColor,
                                                style = Stroke(width = strokeWidthPx)
                                            )
                                            drawOutline(
                                                outline = outline,
                                                brush = Brush.verticalGradient(
                                                    listOf(topHighlightColor, Color.Transparent),
                                                    startY = 0f,
                                                    endY = size.height * 0.45f
                                                ),
                                                style = Stroke(width = strokeWidthPx)
                                            )
                                        }
                                    )
                            ) {
                                if (pillVisible) {
                                    val pillLeftDp = pillLeft.dp
                                    val pillWidthDp = pillWidth.dp
                                    val pillHeightDp = navHeightDp - 8f.dp
                                    val pillShape = RoundedCornerShape(percent = 50)
                                    
                                    Box(
                                        modifier = Modifier
                                            .offset(x = pillLeftDp, y = 4f.dp)
                                            .size(width = pillWidthDp, height = pillHeightDp)
                                            .drawBackdrop(
                                                backdrop = backdrop,
                                                shape = { pillShape },
                                                effects = {
                                                    vibrancy()
                                                    blur(18f.dp.toPx())
                                                    lens(16f.dp.toPx(), 32f.dp.toPx(), depthEffect = true, chromaticAberration = true)
                                                },
                                                onDrawSurface = {
                                                    val outline = pillShape.createOutline(size, layoutDirection, this)
                                                    drawOutline(outline = outline, color = pillFillColor)
                                                    drawOutline(
                                                        outline = outline,
                                                        color = pillStrokeColor,
                                                        style = Stroke(width = strokeWidthPx)
                                                    )
                                                    drawOutline(
                                                        outline = outline,
                                                        brush = Brush.verticalGradient(
                                                            listOf(pillHighlightColor, Color.Transparent),
                                                            startY = 0f,
                                                            endY = size.height * 0.5f
                                                        ),
                                                        style = Stroke(width = strokeWidthPx)
                                                    )
                                                }
                                            )
                                    )
                                }
                            }
                        }

                        if (floatVisible) {
                            val floatLeftDp = floatLeft.dp
                            val floatTopDp = floatTop.dp
                            val floatWidthDp = floatWidth.dp
                            val floatHeightDp = floatHeight.dp
                            val floatShape = CircleShape
                            
                            Box(
                                modifier = Modifier
                                    .offset(x = floatLeftDp, y = floatTopDp)
                                    .size(width = floatWidthDp, height = floatHeightDp)
                                    .drawBackdrop(
                                        backdrop = backdrop,
                                        shape = { floatShape },
                                        effects = {
                                            vibrancy()
                                            blur(18f.dp.toPx())
                                            lens(16f.dp.toPx(), 32f.dp.toPx(), depthEffect = true, chromaticAberration = true)
                                        },
                                        onDrawSurface = {
                                            val outline = floatShape.createOutline(size, layoutDirection, this)
                                            drawOutline(outline = outline, color = fillColor)
                                            drawOutline(
                                                outline = outline,
                                                color = strokeColor,
                                                style = Stroke(width = strokeWidthPx)
                                            )
                                            drawOutline(
                                                outline = outline,
                                                brush = Brush.verticalGradient(
                                                    listOf(topHighlightColor, Color.Transparent),
                                                    startY = 0f,
                                                    endY = size.height * 0.45f
                                                ),
                                                style = Stroke(width = strokeWidthPx)
                                            )
                                        }
                                    )
                            )
                        }
                    }
                }
            }

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
            resolveContentUri(sharedFileUriToProcess!!)
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
            resolveContentUri(targetUri)
        }
        handlePackageInstallerIntent(intent)
        handleThemeIntent(intent)
    }

    private fun handleThemeIntent(intent: Intent?) {
        val themeArg = intent?.getStringExtra("theme")
        if (!themeArg.isNullOrEmpty()) {
            runOnUiThread {
                navTheme = themeArg
                val js = "window.dispatchEvent(new CustomEvent('studio-set-theme', { detail: { theme: '$themeArg' } }));"
                this.bridge?.webView?.evaluateJavascript(js, null)
            }
        }
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

    private fun resolveContentUri(uri: Uri) {
        try {
            val scheme = uri.scheme
            if (scheme != "content" && scheme != "file") {
                return
            }
            val auth = uri.authority
            if (auth != null && (auth == "${packageName}.fileprovider" || auth == packageName || auth == "com.chordex.app.fileprovider" || auth.contains(packageName))) {
                throw SecurityException("Access to internal app file provider blocked.")
            }
            val fileName = getFileName(uri) ?: "unknown"
            val mimeType = contentResolver.getType(uri) ?: ""

            val fileObj = JSObject()
            fileObj.put("fileName", fileName)

            if (fileName.endsWith(".json") || mimeType.contains("json")) {
                val inputStream = contentResolver.openInputStream(uri) ?: return
                val reader = java.io.BufferedReader(java.io.InputStreamReader(inputStream, java.nio.charset.StandardCharsets.UTF_8))
                val stringBuilder = StringBuilder()
                var line: String?
                while (reader.readLine().also { line = it } != null) {
                    stringBuilder.append(line)
                }
                inputStream.close()
                val jsonContent = stringBuilder.toString()

                fileObj.put("type", "json")
                fileObj.put("data", jsonContent)
                lastSharedFile = fileObj

                triggerJsEvent("chordex:shared-json", jsonContent, fileName)
            } else {
                val inputStream = contentResolver.openInputStream(uri) ?: return
                val cacheDir = cacheDir
                val safeName = fileName.replace(Regex("[^a-zA-Z0-9._-]"), "_")
                val tempFile = File(cacheDir, "shared_" + System.currentTimeMillis() + "_" + safeName)
                if (!tempFile.canonicalPath.startsWith(cacheDir.canonicalPath)) {
                    inputStream.close()
                    throw SecurityException("Path traversal attempt blocked.")
                }
                val outputStream = java.io.FileOutputStream(tempFile)
                val buffer = ByteArray(4096)
                var read: Int
                while (inputStream.read(buffer).also { read = it } != -1) {
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
        if (result != null) {
            result = java.io.File(result).name
            result = result.replace(Regex("[^a-zA-Z0-9.\\-_]"), "_")
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

    inner class LiquidGlassBridge {
        @android.webkit.JavascriptInterface
        fun updatePosition(left: Float, top: Float, width: Float, height: Float, visible: Boolean, theme: String, cornerRadius: Float) {
            android.util.Log.i("LiquidGlass", "updatePosition: left=$left, top=$top, w=$width, h=$height, vis=$visible, theme=$theme, rad=$cornerRadius")
            runOnUiThread {
                navLeft = left
                navTop = top
                navWidth = width
                navHeight = height
                navVisible = visible
                navTheme = theme
                navCornerRadius = cornerRadius
            }
        }

        @android.webkit.JavascriptInterface
        fun updatePillPosition(left: Float, width: Float, visible: Boolean) {
            android.util.Log.i("LiquidGlass", "updatePillPosition: left=$left, width=$width, vis=$visible")
            runOnUiThread {
                pillLeft = left
                pillWidth = width
                pillVisible = visible
            }
        }

        @android.webkit.JavascriptInterface
        fun updateFloatingButtonPosition(left: Float, top: Float, width: Float, height: Float, visible: Boolean) {
            android.util.Log.i("LiquidGlass", "updateFloatingButtonPosition: left=$left, top=$top, w=$width, h=$height, vis=$visible")
            runOnUiThread {
                floatLeft = left
                floatTop = top
                floatWidth = width
                floatHeight = height
                floatVisible = visible
            }
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
