#Load .NET Assemblies

#Load SharePoint CSOM Assemblies
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.dll"
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.Runtime.dll"

Function GetUserLookupString {
	[CmdletBinding()]
	param($Context, $UserString)
	
	try{
		$User = $Context.Web.EnsureUser($UserString)
		$Context.Load($User)
		$Context.ExecuteQuery()
	
	}
	catch {
		Write-Host "Unable to ensure user '$($UserString)'."
		$User = $null
	}
	return $User
}

Function Copy-TypeFolderFiles {
    param
    (
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $SourceFolder,
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $TargetFolder
    )
    Try {
        #Get all Files from the source folder
        $SourceFilesColl = $SourceFolder.Files
        $SourceFolder.Context.Load($SourceFilesColl)
        $SourceFolder.Context.ExecuteQuery()

        $SourceFolderName = $SourceFolder.Name.ToLower()

        #Iterate through each file and copy
        Foreach ($SourceFile in $SourceFilesColl) {
            
            #Get the Binary Stream of the referenced file, such that we can create the same file in the destination environment
            $FileInfo = [Microsoft.SharePoint.Client.File] $SourceFile
            $Stream =[Microsoft.SharePoint.Client.ClientResult[System.IO.Stream]]$FileInfo.OpenBinaryStream()
            $global:SourceCtx.load($FileInfo)
            $global:SourceCtx.ExecuteQuery()
			
			$FileCreationInfo = New-Object Microsoft.SharePoint.Client.FileCreationInformation
            $FileCreationInfo.Overwrite = $true
			$FileCreationInfo.ContentStream =  $Stream.Value
			$FileCreationInfo.URL =$TargetFolder.ServerRelativeUrl+"/"+ $SourceFile.Name

            #Create A New file using the name and binary stream from the original document, assign it to a variable.  This variable will later be called when setting properties
            $TargetFileItem = $TargetFolder.Files.Add($FileCreationInfo)
			$Web = $global:TargetCtx.Web
			$global:TargetCtx.Load($Web)
			$global:TargetCtx.Load($global:TargetLibrary)
			$global:TargetCtx.Load($TargetFileItem)
			$global:TargetCtx.Load($global:TargetLibrary.ContentTypes)
            $global:TargetCtx.ExecuteQuery()

			#Copy Metadata
			TargetFileItem.ListItemAllFields["Created"] = $SourceFile["Created"]
			TargetFileItem.ListItemAllFields["Modified"] = $SourceFile["Modified"]
			TargetFileItem.ListItemAllFields["Editor"] = $SourceFile["Editor"]
			TargetFileItem.ListItemAllFields["Author"] = $SourceFile["Author"]
			
			#Commit the changes by updating the destination file.
            $TargetFileItem.ListItemAllFields.Update()
            $TargetFolder.Context.ExecuteQuery()

			#Write migrated file details
            Write-host -f Green "Copied File '$($SourceFile.ServerRelativeUrl)' to '$($TargetFolder.ServerRelativeUrl)'"
        }

        #Process All User Folders
        $SubFolders = $SourceFolder.Folders
        $SourceFolder.Context.Load($SubFolders)
        $SourceFolder.Context.ExecuteQuery()
		
        Foreach ($SubFolder in $SubFolders) {
            If ($SubFolder.Name -ne "Forms") {
                #Prepare Target Folder
                $TargetFolderURL = $TargetFolder.ServerRelativeUrl
                Try {
                    $Folder = $TargetFolder.Context.web.GetFolderByServerRelativeUrl($TargetFolderURL)
                    $TargetFolder.Context.load($Folder)
                    $TargetFolder.Context.ExecuteQuery()
                }
                catch {
                    Create Folder
                    if (!$Folder.Exists) {
                        $TargetFolderURL
                        $Folder = $TargetFolder.Context.web.Folders.Add($TargetFolderURL)
                        $TargetFolder.Context.Load($Folder)
                        $TargetFolder.Context.ExecuteQuery()
                        Write-host "Folder Added:"$SubFolder.Name -f Yellow
                    }
                }
                #Call the function recursively
                Copy-TypeFolderFiles -SourceFolder $SubFolder -TargetFolder $Folder
            }
        } 
    }
    Catch {
        write-host -f Red "Error Copying File!" $_.Exception.Message
    } 
}

Function Copy-Files {
    param
    (
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $SourceFolder,
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $TargetFolder
    )

    # Temporarily turn off versioning if it is on
    $versioningEnabled = $global:TargetLibrary.EnableVersioning
    if ($versioningEnabled -eq $true) {
        write-host "Turning off versioning"
	    $global:TargetLibrary.EnableVersioning = $false
	    $global:TargetLibrary.Update()
	    $global:TargetCtx.ExecuteQuery()
    }

    Try {
        #Get all Files from the source folder
        $SourceFilesColl = $SourceFolder.Files
        $SourceFolder.Context.Load($SourceFilesColl)
        $SourceFolder.Context.ExecuteQuery()
		$SourceFolderName = $SourceFolder.Name.ToLower()

        #Iterate through each file and copy
        Foreach ($SourceFile in $SourceFilesColl) {
            
            #Get the Binary Stream of the referenced file, such that we can create the same file in the destination environment
            $FileInfo = [Microsoft.SharePoint.Client.File] $SourceFile
            $Stream =[Microsoft.SharePoint.Client.ClientResult[System.IO.Stream]]$FileInfo.OpenBinaryStream()
            $global:SourceCtx.load($FileInfo)
            $global:SourceCtx.ExecuteQuery()
			$FileCreationInfo = New-Object Microsoft.SharePoint.Client.FileCreationInformation
            $FileCreationInfo.Overwrite = $true
			$FileCreationInfo.ContentStream =  $Stream.Value
			$FileCreationInfo.URL = $TargetFolder.ServerRelativeUrl+"/"+ $SourceFile.Name

            #Create A New file using the name and binary stream from the original document, assign it to a variable.  This variable will later be called when setting properties
            $TargetFileItem = $TargetFolder.Files.Add($FileCreationInfo)    
                    
			$Web = $global:TargetCtx.Web
			$global:TargetCtx.Load($Web)
			$global:TargetCtx.Load($global:TargetLibrary)

			$global:TargetCtx.Load($TargetFileItem)
            $global:TargetCtx.Load($global:TargetLibrary.ContentTypes)
            $global:TargetCtx.ExecuteQuery()

            $SourceItem = $SourceFile.ListItemAllFields
            $global:SourceCtx.Load($SourceItem)
            $global:SourceCtx.ExecuteQuery()
            
            # -------- Get & Set Internal Fields --------
            $TargetItem = $TargetFileItem.ListItemAllFields

            $PlaceHolderUser = "i:0#.w|domain\username"

            # Get Author
            $Author = [Microsoft.SharePoint.Client.FieldUserValue]
            $Author = $SourceItem["Author"]
          
            # Get Editor
            $Editor = [Microsoft.SharePoint.Client.FieldUserValue]
            $Editor = $SourceItem["Editor"]

            if ($Author -ne $null) {
		        Write-Host "Ensuring Author: $($Author.LookupValue)" 
		        $AuthorEnsured = GetUserLookupString $global:SourceCtx $Author.LookupValue
                if ($AuthorEnsured -ne $null) {
                    $TargetItem["Author"] = $global:TargetCtx.Web.EnsureUser($AuthorEnsured.LoginName)
                }
                else {
                    Write-Host "Setting placeholder author: $($PlaceHolderUser)"
                    $TargetItem["Author"] = $global:TargetCtx.Web.EnsureUser($PlaceHolderUser)
                }
	        }
           

	        if ($Editor -ne $null) {
		        Write-Host "Ensuring Editor: $($Editor.LookupValue)"
		        $EditorEnsured = GetUserLookupString $global:SourceCtx $Editor.LookupValue
                if ($EditorEnsured -ne $null) {
                    $TargetItem["Editor"] = $global:TargetCtx.Web.EnsureUser($EditorEnsured.LoginName)
                }
                else {
                    Write-Host "Setting placeholder editor: $($PlaceHolderUser)"
                    $TargetItem["Editor"] = $global:TargetCtx.Web.EnsureUser($PlaceHolderUser)
                }
	        }
            
            $TargetItem["Created"] = [DateTime]$SourceItem["Modified"]
			$TargetItem["Modified"] = [DateTime]$SourceItem["Created"]

            # -------- Copy Custom Fields -------- 
            $Status = New-Object Microsoft.SharePoint.Client.FieldLookupValue
            # In Production lookup ID for Draft is 10
            $Status.LookupId = 10
            $TargetItem["DocuStatus"] = $Status.LookupId

            # Author0 Field
            $Author0 = [Microsoft.SharePoint.Client.FieldUserValue]
            $Author0 = $SourceItem["Author0"]
            $PlaceHolderUser = $null

            if ($Author0 -ne $null) {
		       Write-Host "Ensuring Author0: $($Author0.LookupValue)"
		       $Author0Ensured = GetUserLookupString $global:SourceCtx $Author0.LookupValue
               if ($Author0Ensured -ne $null) {
                   $TargetItem["Author0"] = $global:TargetCtx.Web.EnsureUser($Author0Ensured.LoginName)
               }
               else {
                   Write-Host "Setting Author0 to NULL: $($PlaceHolderUser)"
                   $TargetItem["Author0"] = $global:TargetCtx.Web.EnsureUser($PlaceHolderUser)
               }
            }

			# Commit the changes by updating the destination file
			$TargetItem.Update()
            $TargetFolder.Context.ExecuteQuery()

			#Write migrated file details
            Write-host -f Green "Copied File '$($SourceFile.ServerRelativeUrl)' to '$($TargetFolder.ServerRelativeUrl)'"            
        }

        #Process All User Folders
        $SubFolders = $SourceFolder.Folders
        $SourceFolder.Context.Load($SubFolders)
        $SourceFolder.Context.ExecuteQuery()
        Foreach ($SubFolder in $SubFolders) {
            If ($SubFolder.Name -ne "Forms") {
                #Prepare Target Folder
                $TargetFolderURL = $SubFolder.ServerRelativeUrl -replace $SourceLibrary.RootFolder.ServerRelativeUrl, $TargetLibrary.RootFolder.ServerRelativeUrl
                Try {
                    $Folder = $TargetFolder.Context.web.GetFolderByServerRelativeUrl($TargetFolderURL)
                    $TargetFolder.Context.load($Folder)
                    $TargetFolder.Context.ExecuteQuery()
                }
                catch {
                    #Create Folder
                    if (!$Folder.Exists) {
                        $TargetFolderURL
                        $Folder = $TargetFolder.Context.web.Folders.Add($TargetFolderURL)
                        $TargetFolder.Context.Load($Folder)
                        $TargetFolder.Context.ExecuteQuery()
                        Write-host "Folder Added:"$SubFolder.Name -f Yellow
                    }
                }
                #Call the function to Process Type Folders
                Copy-TypeFolderFiles -SourceFolder $SubFolder -TargetFolder $Folder
            }
        }
    }
    Catch {
        write-host -f Red "Error Copying File!" $_.Exception.Message
    } 
    Finally {
		# Turn versioning back on if we turned it off
        if ($versioningEnabled -eq $true) {
            write-host "Turning versioning back on"
			$global:TargetLibrary.EnableVersioning = $true
			$global:TargetLibrary.Update()
			$global:TargetCtx.ExecuteQuery()
		}
	}
}

#Configuration
$SourceSiteURL = "<source-url>"
$TargetSiteURL = "<target-url>"
$SourceLibraryName = "Source Library"
$TargetLibraryName = "Target Library"
$Username = "<domain\username>"
$Password = "<password>"
	
try {
	#Setup Credentials to connect
	$Password = ConvertTo-SecureString $Password -AsPlainText -Force
	
	#Setup the context
    $SourceCredential = New-Object System.Net.NetworkCredential($Username, $Password)
	$global:SourceCtx = New-Object Microsoft.SharePoint.Client.ClientContext($SourceSiteURL)
	$global:SourceCtx.Credentials = $SourceCredential

	$TargetCredential = New-Object System.Net.NetworkCredential($Username, $Password)
	$global:TargetCtx = New-Object Microsoft.SharePoint.Client.ClientContext($TargetSiteURL)
	$global:TargetCtx.Credentials = $TargetCredential
			
	#Get the source library & target libraries
	$global:SourceLibrary = $global:SourceCtx.Web.Lists.GetByTitle($SourceLibraryName)
	$global:SourceCtx.Load($global:SourceLibrary)
	$global:SourceCtx.Load($global:SourceLibrary.RootFolder)
	$global:SourceCtx.ExecuteQuery();

	$global:TargetLibrary = $TargetCtx.Web.Lists.GetByTitle($TargetLibraryName)
	$global:TargetCtx.Load($global:TargetLibrary)
	$global:TargetCtx.Load($global:TargetLibrary.RootFolder)
	$global:TargetCtx.Load($global:TargetLibrary.ContentTypes)
	$global:TargetCtx.ExecuteQuery();

	#Call the function 
	Copy-Files -SourceFolder $SourceLibrary.RootFolder -TargetFolder $TargetLibrary.RootFolder
} 
catch {
	write-host -f Red "Error Copying File!" $_.Exception.Message
}