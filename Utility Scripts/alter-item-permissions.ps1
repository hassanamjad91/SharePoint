# Alter Item-Level Permission to a SharePoint Group
 
# Specify the name of the SharePoint group
$groupName = "<Site Group Name>"

# Specify permission level
$permissionLevel = "Read"

# Specify target site
$url = "<target-url>"

# Specify target list
$listTitle = "<Target List Name>"

# Get SP Site
$site = Get-SPSite $url

# Get SP Web
$web = $site | Get-SPWeb

# Get SP List
$list = $web.Lists[$listTitle]

# Get specific items
$caml = "<Where><And><Geq><FieldRef Name="ID"/><Value Type="Counter">1</Value></Geq><Leq><FieldRef Name="ID"/><Value Type="Counter">2</Value></Leq></And></Where>"
$query = New-Object Microsoft.SharePoint.SPQuery 
$query.Query = $caml
$items = $list.GetItems()

# Get all Items
# $items = Get-SPItems -list $listTitle
 
# Iterate items
foreach($item in $items) {
	#Break Inheritance - Remove all permissions
	$item.BreakRoleInheritance($false)

	#Grant Read access to the Group
	$group = $web.SiteGroups[$groupName]
	$roleAssignment = new-object Microsoft.SharePoint.SPRoleAssignment($group)  
	$roleDefinition = $web.RoleDefinitions[$PermissionLevel]
	$roleAssignment.RoleDefinitionBindings.Add($roleDefinition);  
	$item.RoleAssignments.Add($roleAssignment)  
	$item.SystemUpdate();
}

# Garbage Collection
$web.Dispose()
$site.Dispose()