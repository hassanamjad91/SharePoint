if((Get-PSSnapIn -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null)
{ Add-PSSnapIn Microsoft.SharePoint.PowerShell }

function UpdateAuthor
{ 
    param ($WebURL, $ListName, $ItemID, $NewAuthor, $PermissionLevel) 
    try
    {
        #Get the Web
        $web = Get-SPWeb -Identity $WebURL
         
        if($web -ne $null)
        {
            if ($web.Lists[$ListName] -eq $null) 
            { 
                write-Host "List '$ListName' doesn't exists!" -ForegroundColor Red
            } 
            else 
            {
                $list = $web.Lists[$ListName]

                $Query = New-Object Microsoft.SharePoint.SPQuery
                $Query.Query = "@<Where><Eq><FieldRef Name='ID' /><Value Type='Counter'>" + $ItemID + "</Value></Eq></Where>"
 
                $listItems = $list.GetItems($Query)                

                if($listItems.count -eq 0) 
                {
                    write-Host "List Item with ItemID '$ItemID' doesn't exists!" -ForegroundColor Red
                }
                else
                {
                    ForEach($item in $listItems) 
                    {
                        write-Host $item.ID " : " $item.Title " : " $item["Author"]                    

                        try {
                            $user = $web.EnsureUser($NewAuthor)
                        }
                        catch [System.Exception] {
                            write-Host "User '$NewAuthor' doesn't exists!" -ForegroundColor Red
                            write-host $_.Exception.ToString() -ForegroundColor Red
                        }

                        if($user -ne $null) 
                        {
                            if($permissionLevel -ne "") {

                                $collRoleDefinitions = $web.RoleDefinitions

                                $collRoleAssignments = $item.RoleAssignments
                        
                                $roleAssignment = new-object Microsoft.SharePoint.SPRoleAssignment($user)
                        
                                $collRoleDefinitionBindings = $roleAssignment.RoleDefinitionBindings
                        
                                $collRoleDefinitionBindings.Add($collRoleDefinitions[$permissionLevel])
                        
                                $collRoleAssignments.Add($roleAssignment)

                                $item.SystemUpdate($false)

                                write-Host "Author: $NewAuthor has been updated and permissing assigned successfully!" -ForegroundColor Green
                            }
                            else {

                                $item["Author"] = $user
                                
                                $item.SystemUpdate($false)

                                write-Host "Author: $NewAuthor has been updated successfully!" -ForegroundColor Green
                            }
                        }
                    }                    
                }
            }

            $web.Dispose()
        }
    }
    catch [System.Exception]
    {
        write-host $_.Exception.ToString() -ForegroundColor Red
    }
}
