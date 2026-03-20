$ProgressPreference = 'SilentlyContinue'
try {
    $r = Invoke-WebRequest -Uri 'http://localhost:3001/api/levels?sort=created_at&page=1&limit=5' -UseBasicParsing -ErrorAction Stop
    Write-Host "Status: $($r.StatusCode)"
    Write-Host $r.Content
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    Write-Host "Body: $body"
}
