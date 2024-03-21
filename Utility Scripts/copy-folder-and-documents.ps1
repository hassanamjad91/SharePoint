#Load .NET Assemblies
Add-Type -Path "C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.6.1\System.dll"

#Load SharePoint CSOM Assemblies
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.dll"
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.Runtime.dll"
Add-Type -Path "C:\Program Files\Common Files\Microsoft Shared\Web Server Extensions\16\ISAPI\Microsoft.SharePoint.Client.Taxonomy.dll"

Function Copy-TypeFolderFiles {
    param
    (
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $SourceFolder
    )
    
	try {
        #Get all Files from the source folder
        $SourceFilesColl = $SourceFolder.Files
        $SourceFolder.Context.Load($SourceFilesColl)
        $SourceFolder.Context.ExecuteQuery()
        
		#Process All User Folders
        $SubFolders = $SourceFolder.Folders
        $SourceFolder.Context.Load($SubFolders)
        $SourceFolder.Context.ExecuteQuery()
        
		Foreach ($SubFolder in $SubFolders) {
            If ($SubFolder.Name -ne "Forms") {
                Try {
                }
                catch {                                  }
                #Call the function recursively
                Copy-TypeFolderFiles -SourceFolder $SubFolder -TargetFolder $Folder
            }
        } 
    }
    catch {
        write-host -f Red "Error Copying File!" $_.Exception.Message
    } 
}
Function Copy-Files {
    param
    (
        [Parameter(Mandatory = $true)] [Microsoft.SharePoint.Client.Folder] $SourceFolder
    )
    try {
        #Process All User Folders
        $SubFolders = $SourceFolder.Folders
        $SourceFolder.Context.Load($SubFolders)
        $SourceFolder.Context.ExecuteQuery()
        Foreach ($SubFolder in $SubFolders) {
            If ($SubFolder.Name -ne "Forms") {
                #Call the function to Process Type Folders
                Copy-TypeFolderFiles -SourceFolder $SubFolder -TargetFolder $Folder
            }
        } 
    }
    catch {
        write-host -f Red "Error Copying File!" $_.Exception.Message
    } 
}

#Set Parameter values
$SourceSiteURL = "http://10.69.100.89:8000/"

$SourceLibraryName = "Applicant"

try{
#Setup Credentials to connect
#$Cred= Get-Credential
$Credentials = New-Object System.Net.NetworkCredential("<username>", "<password>")

#Setup the contexts
$SourceCtx = New-Object Microsoft.SharePoint.Client.ClientContext($SourceSiteURL)
$SourceCtx.Credentials = $Credentials
     
#Get the source library and Target Libraries
$SourceLibrary = $SourceCtx.Web.Lists.GetByTitle($SourceLibraryName)
$SourceCtx.Load($SourceLibrary)
$SourceCtx.Load($SourceLibrary.RootFolder)
$SourceCtx.ExecuteQuery();

#Call the function 
Copy-Files -SourceFolder $SourceLibrary.RootFolder -TargetFolder $TargetLibrary.RootFolder
}catch {
    write-host -f Red "Error Copying File!" $_.Exception.Message
}
