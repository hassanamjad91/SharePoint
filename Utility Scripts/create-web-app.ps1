Add-PSSnapin Microsoft.SharePoint.PowerShell
New-SPWebApplication -Name "<Web Application Name>" -ApplicationPool "<Web Applicaiton Pool Name>" -AuthenticationMethod "NTLM" -ApplicationPoolAccount (Get-SPManagedAccount "<username>") -Port 80 -URL "http://constoso.com" -HostHeader "contoso.com"
