$config=@"
{
  "web": "<target-url>",
  "list": "<Target List Name>",
  "mappings": 
  [
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 1</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "i:0#.w|domain\\user1", "type": "person" } ] },
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 2</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "i:0#.w|domain\\user2", "type": "person" } ] },
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 3</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "domain\\user3", "type": "person" } ] },
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 4</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "i:0#.w|domain\\user4", "type": "person" } ] },
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 5</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "i:0#.w|domain\\user5", "type": "person" } ] },
    { role:"Contribute", "query": "<Where><Eq><FieldRef Name='AcName'/><Value Type='Text'>Amazon 6</Value></Eq></Where>", "cols": [ { "name": "personColumn", "value": "i:0#.w|domain\\user6", "type": "person" } ] }
  ],
  "fire_event_receiver": 0,
  "system_update": 1,
  "ps_snapins": 
  [
    "microsoft.sharepoint.powershell"
  ]
}
"@
$cfg = $config | ConvertFrom-Json

foreach ($snapin in $cfg.ps_snapins) {
    If ((Get-PSSnapIn -Name $snapin -ErrorAction SilentlyContinue) -eq $null )  
    { 
        Add-PSSnapIn -Name $snapin 
    }
}

$web = Get-SPWeb -Identity $cfg.web
$list = $web.Lists[$cfg.list]

# Disable Event Reciever
$assembly = [Reflection.Assembly]::LoadWithPartialName("Microsoft.SharePoint");
$type = $assembly.GetType("Microsoft.SharePoint.SPEventManager");
$prop = $type.GetProperty([string]"EventFiringDisabled",[System.Reflection.BindingFlags] ([System.Reflection.BindingFlags]::NonPublic -bor [System.Reflection.BindingFlags]::Static)); 
$prop.SetValue($null, $true, $null);

foreach ($map in  $cfg.mappings)
{
    $query = New-Object Microsoft.SharePoint.SPQuery 
    $query.Query = $map.query
    $items = $list.GetItems($query)

    foreach ($item in $items)
    {
       foreach ($col in $map.cols)
       {
            try 
			{
				[Microsoft.SharePoint.SPUser]$usr = $web.EnsureUser($col.value)
				$item[$col.name] = $usr
				
				#Assign Contribute Permission
				$role = $web.RoleDefinitions[$map.role]
				$roleassignment = New-Object Microsoft.SharePoint.SPRoleAssignment($usr)
				$roleassignment.RoleDefinitionBindings.Add($role)
				$item.RoleAssignments.Add($roleassignment)
				#Assign Contribute Permission
				
				$item.SystemUpdate($true)
			}
			catch 
			{
				write-host -f red $_.Exception.ToString() 
			}
       }
    }
}
# Enable Event Reciever
$prop.SetValue($null, $false, $null);