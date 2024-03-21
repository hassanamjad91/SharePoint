# Add Non-Persistent PS-Module Directory For This Session
$m = 'D:\Program Files\Modules'
$p = [Environment]::GetEnvironmentVariable("PSModulePath")
$q = $p -split ';'
if ($q -notContains $m) {
    $q += ";$m"
}
$p = $q -join ';'
[Environment]::SetEnvironmentVariable("PSModulePath", $p)

# Paths
$url = "{Common:ItemUrl}"
$local = "\\usoxf-saphfsp01\TCG\BW\Consolidated_AP\Concur\{ItemProperty:FileLeafRef}"
$remote = "/Test/"

# SFTP Credentials
$username= "{WFConstant:SFTP_Username}"
$serverIP = "{WFConstant:SFTP_Server}"
$password = ConvertTo-SecureString '{WFConstant:SFTP_Password}' –asplaintext –force

# Download The Document
Invoke-WebRequest -Uri $url -OutFile $local -UseDefaultCredentials

# Connect & Copy To SFTP
$credential = New-Object -TypeName "System.Management.Automation.PSCredential" -ArgumentList $username, $password
$session = New-SFTPSession -ComputerName $serverIP -Credential $credential -AcceptKey

$setParams = @{
   SessionId = $session.SessionId
   LocalFile = $local
   RemotePath = $remote
}
Set-SFTPFile @setParams

if ($session = Get-SFTPSession -SessionId $session.SessionId) {
    $session.Disconnect()
} 
Remove-Item –path $local
$null = Remove-SftpSession -SftpSession $session