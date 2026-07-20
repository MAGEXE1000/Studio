$groovex = 'packages/ui-shared/src/features/groovex/components/GroovexPreferences.tsx'
(Get-Content $groovex) -replace 'useChordStore }', 'useChordStore, ACCENT_COLORS }' -replace "\(\['library', 'player', 'preferences'\] as const\)", "(['library', 'preferences'] as const)" -replace "const icons: Record<string, string> = \{ library: 'library_music', player: 'album', preferences: 'tune' \};", "const icons: Record<string, string> = { library: 'library_music', preferences: 'tune' };" | Set-Content $groovex

$main = 'apps/studio-web/src/main.tsx'
(Get-Content $main) -replace 'initDevToolsFramework }', 'initDevToolsFramework, NavigationDispatcher }' -replace 'createRoot\(document.getElementById\("root"\)!\).render\(', "// @ts-ignore
window.NavigationDispatcher = NavigationDispatcher;

createRoot(document.getElementById("root")!).render(" | Set-Content $main

$logo = 'packages/ui-shared/src/components/icons/AppModeMenuLogo.tsx'
$logoContent = Get-Content $logo -Raw
$logoContent = $logoContent.Replace("const isWebDesktop = useIsWebDesktop();
  if (isWebDesktop) return null;

  const settings = useChordStore", "const isWebDesktop = useIsWebDesktop();

  const settings = useChordStore")
$logoContent = $logoContent.Replace("transform 320ms ${SPRING} 80ms;

  return (
    <div ref={wrapRef}", "transform 320ms ${SPRING} 80ms;

  if (isWebDesktop) return null;

  return (
    <div ref={wrapRef}")
$logoContent = $logoContent.Replace("const isWebDesktop = useIsWebDesktop();
  if (isWebDesktop) return null;

  const settings = useChordStore", "const isWebDesktop = useIsWebDesktop();

  const settings = useChordStore")
$logoContent = $logoContent.Replace("transform 320ms ${SPRING} 80ms;

  return (
    <div ref={wrapRef}", "transform 320ms ${SPRING} 80ms;

  if (isWebDesktop) return null;

  return (
    <div ref={wrapRef}")
Set-Content -Path $logo -Value $logoContent
