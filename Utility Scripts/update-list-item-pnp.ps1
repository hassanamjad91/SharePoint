$siteurl="<target-url>"
$listUrl = "Target List URI"
$listItemId = 8457

Connect-PnPOnline -Url $siteurl
Set-PnPListItem -List $listUrl -Id $listItemId -Values @{"Status" = "Draft"}