Add-PSSnapin Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue
 
Function Customize-DocumentProps($Props) {
    if($Props.ContainsKey('DocStatus')) {
        $Props['DocuStatus'] = $Props['DocStatus']   
        $Props.remove('DocStatus')  
    }
    return $Props
}

Function CopyItem-Permissions($SourceItem, $TargetItem)
{
    if ($SourceItem.HasUniqueRoleAssignments)
    {
        write-host "Copying unique permissions from source to target item" -ForegroundColor Green

        $TargetItem.SystemUpdate($true)

	    #break role inheritance of target item
        $TargetItem.BreakRoleInheritance($false)
         
        foreach ($Role in $SourceItem.RoleAssignments)
        {
           $TargetItem.RoleAssignments.Add($Role)
        }           
        $TargetItem.SystemUpdate($false)

        write-host "Unique Permissions copied successfuly" -ForegroundColor Green
    }
}

#Copy Files from Source Folder to Target
Function Copy-Files($SourceFolder, $TargetFolder, $IsCopyPermissions)
{
    write-host "Copying Files from:$($SourceFolder.URL) to $($TargetFolder.URL)"
   
    #Get Each File from the Source
    $SourceFilesCollection = $SourceFolder.Files
    
    write-host "File Count: $($SourceFilesCollection.Count)"
    
    #Iterate through each item from the source
    Foreach($SourceFile in $SourceFilesCollection)
    {
        $File = $Web.GetFile("$($TargetFolder.URL)$($SourceFile.Name)")
        if ($File.Exists)
        {
             write-host "File: "$SourceFile.Name " already exists in target folder" -ForegroundColor Yellow
        }
        else 
        { 
            $CountFileVersions = $SourceFile.Versions.Count
            #Get the created by and created
            $CreatedBy = $SourceFile.Author
            #Convert the "TimeCreated" property to local time
            $CreatedOn = $SourceFile.TimeCreated
        
            #Loop Through Each File Version
            for ($i = 0; $i -le $CountFileVersions; $i++) {
                #Initialize variables
                $SourceProp
                $FileStream
                $ModifiedBy
                $ModifiedOn
                $VersionComment = ""
                $MajorVer = $False
                #If Index is not the Last Published Version
                if ($i -lt $CountFileVersions) {
                    #Get all versions file, history, properties, createdBy, checkInComment
                    $fileSourceVer = $SourceFile.Versions[$i]
                    $SourceProp = $fileSourceVer.Properties;                     
                    $ModifiedBy = if ($i -eq 0) { $CreatedBy } else { $fileSourceVer.CreatedBy }
                    $ModifiedOn = $fileSourceVer.Created
                    $VersionComment = $fileSourceVer.CheckInComment
                    $MajorVer = if ($fileSourceVer.VersionLabel.EndsWith("0")) { $true } else { $false }
                    $FileStream = $fileSourceVer.OpenBinaryStream()
                }
                else {
                    #Get current versions file, history, properties, createdBy, checkInComment
                    $ModifiedBy = $SourceFile.ModifiedBy;
                    $ModifiedOn = $SourceFile.TimeLastModified
                    $SourceProp = $SourceFile.Properties
                    $VersionComment = $SourceFile.CheckInComment
                    $IsMajorVer = If ($SourceFile.MinorVersion -eq 0) { $true } Else { $false }
                    $FileStream = $SourceFile.OpenBinaryStream()
                }
                #customize source document properties
                $SourceProp = Customize-DocumentProps $SourceProp

                #URL library destination
                $DestFileURL = $TargetFolder.URL + '/' + $SourceFile.Name
                
                #Add initial File to destination library
                $TargetFile = $TargetFolder.Files.Add($DestFileURL, $FileStream, $SourceProp, $CreatedBy, $ModifiedBy, $CreatedOn, $ModifiedOn, $VersionComment, $true)            
            
                #If Major Version Publish it
                if ($IsMajorVer) {
                    $TargetFileItem = $TargetFile.Item
                    $TargetFileItem["Created"] = $CreatedOn
                    $TargetFileItem["Modified"] = $ModifiedOn
                    $TargetFileItem.UpdateOverwriteVersion()   

                    #Note: publish is only supported on minor-version enabled lists
                    #$TargetFile.Publish($strVerComment);
                }   
                else {
                    $TargetFileItem = $TargetFile.Item
                    $TargetFileItem["Created"] = $CreatedOn
                    $TargetFileItem["Modified"] = $ModifiedOn
                    $TargetFileItem.UpdateOverwriteVersion()
                }
                #Copy unique permissions from source to target item        
                if($IsCopyPermissions) {
                    if ($i -eq $CountFileVersions) {                
                        CopyItem-Permissions $SourceFile.item $TargetFile.Item                           
                    }            
                }
            }     
            Write-host "File: "$SourceFile.Name " uploaded successfully with version history." -ForegroundColor Green        
        }
    }
    #Process SubFolders
    Foreach($SubFolder in $SourceFolder.SubFolders)
    {
        if($SubFolder.Name -ne "Forms")
        {
            #Check if Sub-Folder exists in the Target Library!
            $NewTargetFolder = $TargetFolder.ParentWeb.GetFolder($SubFolder.Name)
  
            if ($NewTargetFolder.Exists -eq $false)
            {
                #Create a Folder
                $NewTargetFolder = $TargetFolder.SubFolders.Add($SubFolder.Name)
            }
            #Call the function recursively
            Copy-Files $SubFolder $NewTargetFolder $true
        }
    }
}
 
#Variables for Processing
$WebURL = "http://usoxf-shp13d01:1515/"
$SourceLibraryURI = "SourceLibrary"
$TargetLibraryURI = "DestinationLibrary"
 
#Get Objects
$Web = Get-SPWeb $WebURL
$SourceFolder = $Web.GetFolder($SourceLibraryURI)
$TargetFolder = $Web.GetFolder($TargetLibraryURI)

write-host "Note: script only supports copying major versions of documents"

#Copy all files
Copy-Files $SourceFolder $TargetFolder $true