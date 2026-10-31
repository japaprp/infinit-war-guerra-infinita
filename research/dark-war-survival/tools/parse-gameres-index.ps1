param(
  [Parameter(Mandatory=$true)][string]$IndexPath,
  [Parameter(Mandatory=$true)][string]$AssetMapCsv,
  [Parameter(Mandatory=$true)][string]$ApkBundleManifestCsv,
  [Parameter(Mandatory=$true)][string]$PhoneCacheManifestCsv,
  [Parameter(Mandatory=$true)][string]$OutputMapCsv,
  [Parameter(Mandatory=$true)][string]$OutputCoverageCsv
)
$ErrorActionPreference = 'Stop'
function Get-SectionIndex([string[]]$Lines, [string]$Name) {
  $target = "[$Name]"
  for ($i = 0; $i -lt $Lines.Length; $i++) { if ($Lines[$i] -ceq $target) { return $i } }
  throw "Missing section $target"
}
function Test-AssetIndexExpression([string]$Expression, [string]$AssetIndex) {
  foreach ($token in $Expression.Split('|')) {
    if ($token -match '^([0-9]+)-([0-9]+)$') {
      $value = [int]$AssetIndex
      if ($value -ge [int]$Matches[1] -and $value -le [int]$Matches[2]) { return $true }
    } elseif ($token -match '^[0-9]+$') {
      if ($token -eq $AssetIndex) { return $true }
    }
  }
  return $false
}
$lines = [IO.File]::ReadAllLines($IndexPath)
$assetsStart = Get-SectionIndex $lines 'Assets'
$dependenciesStart = Get-SectionIndex $lines 'Dependencies'
$bundlesStart = Get-SectionIndex $lines 'Bundles'
# [Assets] is the authoritative direct AssetIndex -> BundleId relation.
$assetToBundle = @{}
for ($i = $assetsStart + 2; $i -lt $dependenciesStart; $i++) {
  $parts = $lines[$i].Split(',', 3)
  if ($parts.Length -ge 3) { $assetToBundle[$parts[0]] = $parts[2] }
}
$bundleById = @{}
$bundleByName = @{}
for ($i = $bundlesStart + 2; $i -lt $lines.Length; $i++) {
  if ($lines[$i].StartsWith('[')) { break }
  $parts = $lines[$i].Split(',', 7)
  if ($parts.Length -ge 5) {
    $entry = [pscustomobject]@{ Id=$parts[0]; Name=$parts[1]; SizeBytes=[int64]$parts[3]; AssetIndexExpression=$parts[4] }
    $bundleById[$entry.Id] = $entry
    $bundleByName[$entry.Name] = $entry
  }
}
$apkRows = Import-Csv -LiteralPath $ApkBundleManifestCsv
$apkSizeByName = @{}
$apkNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($item in $apkRows) { [void]$apkNames.Add($item.BundleName); $apkSizeByName[$item.BundleName] = [int64]$item.SizeBytes }
$cacheRows = Import-Csv -LiteralPath $PhoneCacheManifestCsv
$cacheNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($item in $cacheRows) { if ($item.Kind -eq 'bundle') { [void]$cacheNames.Add($item.File) } }
$sourceRows = Import-Csv -LiteralPath $AssetMapCsv
$correctedRows = [Collections.Generic.List[object]]::new()
$recoveredUnmapped = 0
$expressionChecks = 0
$existingNameMatches = 0
foreach ($row in $sourceRows) {
  $assetId = [string]$row.AssetIndex
  $bundleId = $assetToBundle[$assetId]
  if ($null -eq $bundleId) { throw "AssetIndex $assetId is absent from [Assets]" }
  $bundle = $bundleById[[string]$bundleId]
  if ($null -eq $bundle) { throw "Bundle ID $bundleId for AssetIndex $assetId is absent from [Bundles]" }
  if ($row.BundleName -eq 'UNMAPPED') {
    if (-not (Test-AssetIndexExpression $bundle.AssetIndexExpression $assetId)) {
      throw "Recovered AssetIndex $assetId is not covered by bundle expression $($bundle.AssetIndexExpression)"
    }
    $expressionChecks++
    $recoveredUnmapped++
  } elseif ($row.BundleName -ne $bundle.Name) {
    throw ("Existing mapping mismatch at AssetIndex " + $assetId + ": CSV=" + $row.BundleName + ", index=" + $bundle.Name)
  } else { $existingNameMatches++ }
  $row.BundleName = $bundle.Name
  if ($cacheNames.Contains($bundle.Name)) { $row.CachedOnS21 = 'YES' } else { $row.CachedOnS21 = 'NO' }
  $correctedRows.Add($row)
}
$coverageByName = @{}
foreach ($row in $correctedRows) {
  $name = [string]$row.BundleName
  if (-not $coverageByName.ContainsKey($name)) {
    $coverageByName[$name] = [pscustomobject]@{ BundleName=$name; AssetRows=0; Categories=[Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase) }
  }
  $coverageByName[$name].AssetRows++
  if ($row.Category) { [void]$coverageByName[$name].Categories.Add([string]$row.Category) }
}
$coverageRows = [Collections.Generic.List[object]]::new()
$apkOnly = 0; $cacheOnly = 0; $both = 0; $neither = 0
$sizeMismatches = [Collections.Generic.List[string]]::new()
foreach ($name in $coverageByName.Keys) {
  $inApk = $apkNames.Contains($name)
  $inCache = $cacheNames.Contains($name)
  if ($inApk -and $inCache) { $both++ } elseif ($inApk) { $apkOnly++ } elseif ($inCache) { $cacheOnly++ } else { $neither++ }
  $bundle = $bundleByName[$name]
  if ($null -eq $bundle) { throw "Bundle name $name is absent from [Bundles]" }
  $size = $bundle.SizeBytes
  if ($inApk) {
    $packageSize = $apkSizeByName[$name]
    if ($packageSize -ne $bundle.SizeBytes) { $sizeMismatches.Add("$name index=$($bundle.SizeBytes) apk=$packageSize") }
    $size = $packageSize
  }
  $categoryNames = @($coverageByName[$name].Categories | Sort-Object)
  $categoryText = $categoryNames -join ';'
  $available = if ($inApk -or $inCache) { 'YES' } else { 'NO' }
  $apkText = if ($inApk) { 'YES' } else { 'NO' }
  $cacheText = if ($inCache) { 'YES' } else { 'NO' }
  $coverageRows.Add([pscustomobject]@{
    AssetRows=$coverageByName[$name].AssetRows; AvailableFromEither=$available; BundleName=$name
    Categories=$categoryText; PresentInAPK=$apkText; PresentInS21Cache=$cacheText; SizeBytes=$size
  })
}
$correctedRows | Export-Csv -LiteralPath $OutputMapCsv -NoTypeInformation -Encoding UTF8
$coverageRows | Sort-Object BundleName | Export-Csv -LiteralPath $OutputCoverageCsv -NoTypeInformation -Encoding UTF8
[pscustomobject]@{
  SourceRows=$sourceRows.Count; CorrectedRows=$correctedRows.Count; ExistingNameMatches=$existingNameMatches
  RecoveredUnmappedRows=$recoveredUnmapped; PipeOrRangeExpressionChecks=$expressionChecks
  DistinctBundles=$coverageByName.Count; APKOnly=$apkOnly; CacheOnly=$cacheOnly; Both=$both; Neither=$neither
  PackageSizeMismatches=$sizeMismatches.Count; OutputMapCsv=$OutputMapCsv; OutputCoverageCsv=$OutputCoverageCsv
} | Format-List
if ($sizeMismatches.Count -gt 0) { Write-Warning 'Package/index size mismatches were recorded.'; $sizeMismatches | Select-Object -First 20 }
