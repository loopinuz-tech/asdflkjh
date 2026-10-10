Add-Type -AssemblyName System.Runtime.WindowsRuntime

$asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
})[0]

function AwaitTask($WinRtTask, $ResultType) {
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    return $netTask.Result
}

[Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime] | Out-Null
[Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsRuntime] | Out-Null
[Windows.Globalization.Language, Windows.Globalization, ContentType = WindowsRuntime] | Out-Null

$lang = New-Object Windows.Globalization.Language("en-US")
$engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
if (-not $engine) {
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
}

$allResults = @()
$coversDir = (Resolve-Path "frontend\public\articles\covers").Path

Write-Host "Starting OCR for all 101 articles..."
$sw = [System.Diagnostics.Stopwatch]::StartNew()

for ($i = 1; $i -le 101; $i++) {
    $imgPath = Join-Path $coversDir "article-$i.jpg"
    $file = AwaitTask ([Windows.Storage.StorageFile]::GetFileFromPathAsync($imgPath)) ([Windows.Storage.StorageFile])
    $stream = AwaitTask ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = AwaitTask ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = AwaitTask ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $ocrResult = AwaitTask ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    $lines = @()
    foreach ($line in $ocrResult.Lines) {
        $lines += $line.Text
    }

    $allResults += [PSCustomObject]@{
        pageNumber = $i
        lines = $lines
    }

    if ($i % 20 -eq 0 -or $i -eq 101) {
        Write-Host "Completed OCR for $i / 101 articles... ($($sw.Elapsed.TotalSeconds.ToString('F1'))s)"
    }
}

$sw.Stop()
Write-Host "Finished all 101 articles in $($sw.Elapsed.TotalSeconds.ToString('F1')) seconds!"

$jsonPath = "scripts\ocr_raw_101.json"
$allResults | ConvertTo-Json -Depth 5 | Set-Content -Path $jsonPath -Encoding UTF8
Write-Host "Raw OCR saved to $jsonPath"
