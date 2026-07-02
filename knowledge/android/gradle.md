# Reusable Knowledge — Gradle Native Compilation

This document contains gradle details and compilation heap setups.

---

## Gradle Properties Heap Size
- Memory heap size settings:
  `org.gradle.jvmargs=-Xmx3072m -XX:MaxPermSize=512m`
- Prevents JVM memory exhaust errors during Android builds on restricted containers.

Source:
* [variables.gradle](file:///c:/Users/ayuda/Documents/.gemini/antigravity/scratch/Studio/apps/studio-android/android/variables.gradle#L2-L4)
