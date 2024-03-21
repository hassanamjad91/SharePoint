Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
if ( (Get-PSSnapin -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null ) {  
    Add-PSSnapin Microsoft.SharePoint.Powershell  
}  

$farm = Get-SPFarm
$dirName = "c:\AAJ\Hassan\WSPs" 
Write-Host Exporting solutions to $dirName  

foreach ($solution in $farm.Solutions)
{  
    $id = $Solution.SolutionID  
    $title = $Solution.Name  
    $filename = $Solution.SolutionFile.Name 
    Write-Host "Exporting ‘$title’ to …\$filename" -nonewline  

    try {  
        $solution.SolutionFile.SaveAs("$dirName\$filename")  
        Write-Host " – done" -foreground green  
    }  
    catch  
    {  
        Write-Host " – error : $_" -foreground red  
    }  
}