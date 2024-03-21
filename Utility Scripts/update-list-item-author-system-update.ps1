Add-PSSnapin microsoft.sharepoint.powershell
$web = get-spweb "<target-url>"
$list = $web.Lists["<Target List Name>"]
$item = $list.Items.GetItemById(1)

$user = Get-SPUser -web $web -Identity "i:0#.w|domain\username" 
$userString = "{0};#{1}" -f $user.ID, $user.UserLogin.Tostring()

$item.SystemUpdate($true) 
$item["Author"] = $userString
$item.SystemUpdate($false) 
