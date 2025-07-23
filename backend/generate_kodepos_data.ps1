# PowerShell script to generate complete postal codes data for Java seeder
$sqlFile = "wilayah_kodepos_complete.sql"
$outputFile = "kodepos_java_data.txt"

Write-Host "Processing $sqlFile..."

# Read all postal code lines
$lines = Get-Content $sqlFile | Select-String "^[(]'.*'.*'.*'[)],$"

Write-Host "Found $($lines.Count) postal code entries"

# Generate Java code
$javaCode = @()
$javaCode += "            // Complete postal codes data from wilayah_kodepos_complete.sql"
$javaCode += "            // Total entries: $($lines.Count)"
$javaCode += ""

$count = 0
foreach ($line in $lines) {
    $cleanLine = $line.Line.Trim()
    # Extract kode and kodepos from format ('11.01.01.2001', '23773'),
    if ($cleanLine -match "[(]'([^']+)', '([^']+)'[)],") {
        $kode = $matches[1]
        $kodepos = $matches[2]
        $javaCode += "            new WilayahKodepos(`"$kode`", `"$kodepos`"),"
        $count++
        
        # Add comments every 100 entries for readability
        if ($count % 100 -eq 0) {
            $javaCode += ""
            $javaCode += "            // Entry $count"
            $javaCode += ""
        }
    }
}

# Remove last comma
if ($javaCode.Count -gt 0) {
    $lastIndex = $javaCode.Count - 1
    if ($javaCode[$lastIndex].EndsWith(",")) {
        $javaCode[$lastIndex] = $javaCode[$lastIndex].TrimEnd(",")
    }
}

# Write to output file
$javaCode | Out-File -FilePath $outputFile -Encoding UTF8

Write-Host "Generated Java code with $count entries written to $outputFile"
Write-Host "File size: $((Get-Item $outputFile).Length / 1MB) MB"
