Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue

# Dismount Content DB
Dismount-SPContentDatabase "SP_Content_DB"

# Test Content DB against target web app
Test-SPContentDatabase -Name "SP_Content_DB" -WebApplication http://contoso1

# Mount Content DB to target web app
Mount-SPContentDatabase -Name "<Newly Restored SRF Content DB>" -WebApplication http://constoso2
