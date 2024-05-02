## Get XML configuration file parameters
param 
(
    [string]$ConfigFile = "\\svrspapp01\C$\Contoso\DeploymentPackage\Configuration\Install-Farm-Solutions.xml"
	##[string]$ConfigFile = $(throw '- Need parameter input file (e.g. "c:\PowerShellDeployment\Install-Farm-Solutions.xml")')
)
## check to ensure Microsoft.SharePoint.PowerShell is loaded if not using the SharePoint Management Shell 
$snapin = Get-PSSnapin | Where-Object {$_.Name -eq 'Microsoft.SharePoint.Powershell'} 
if ($snapin -eq $null) 
{    
	Write-Host "Loading SharePoint Powershell Snapin"    
	Add-PSSnapin "Microsoft.SharePoint.Powershell" 
}

## get the node Config in the configuration file
$xmlinput = [xml] (get-content $ConfigFile)
$item = $xmlinput.Config

## Read the Farm parameters
$Solutions = $item.Solutions
$SolutionsFolder = Resolve-Path $item.SolutionsFolder
$TargetSiteUrl = $item.WebApplicationUrl.TrimEnd("/")
$Features = $item.Features
$FeatureActivationEnabled = [System.Convert]::ToBoolean($Features.GetAttribute("ActivationEnabled"))
$FeatureReceivers = $item.FeatureReceivers
$FeatureReceiversEnabled = [System.Convert]::ToBoolean($FeatureReceivers.GetAttribute("ActivationEnabled"))
$CustomScriptExec = $item.CustomScript
$CustomScriptExecActivationEnabled = [System.Convert]::ToBoolean($CustomScriptExec.GetAttribute("ActivationEnabled"))

## This method waits for solution to be deployed
function WaitForJobToFinish([string]$SolutionFileName)
{ 
    $JobName = "*solution-deployment*$SolutionFileName*"
    $job = Get-SPTimerJob | ?{ $_.Name -like $JobName }
    if ($job -eq $null) 
    {
        Write-Host '`nTimer job not found!'
    }
    else
    {
        $JobFullName = $job.Name
        Write-Host -NoNewLine "`nWaiting to finish job $JobFullName"
        
        while ((Get-SPTimerJob $JobFullName) -ne $null) 
        {
            Write-Host -NoNewLine .
            Start-Sleep -Seconds 2
        }
        Write-Host "`nFinished waiting for job..."
    }
}

## This method retracts and deletes a solution based on its solution id, path and web application
function DeleteSolution
{
	param ([string]$solutionID, [string]$webApplication)

	$farm = Get-SPFarm

	$sol = $farm.Solutions[$solutionID]
	
	if($sol)
	{
		if ($webApplication -eq "")
		{
			Write-Host -f Yellow "Uninstalling $solutionID"
			Uninstall-SPSolution -Identity $solutionID -Confirm:$false
			WaitForJobToFinish $solutionID

			Write-Host -f Yellow "Removing $solutionID"
			Remove-SPSolution -Identity $solutionID -Force -Confirm:0
		}
		else
		{
			Write-Host -f Yellow "Uninstalling $solutionID"
			Uninstall-SPSolution -Identity $solutionID -WebApplication $WebApplicationURL -Confirm:$false
			WaitForJobToFinish $solutionID

			Write-Host -f Yellow "Removing $solutionID"
			Remove-SPSolution -Identity $solutionID -Force -Confirm:0
		}
	}
	else
	{
		Write-Host -f Yellow "Solution $solutionID not found"
	}
}

## This method checks if activation flag of a feature is set to true or false
function ActivationEnabled([System.Xml.XmlElement] $element)
{
	$activationEnabled = $element.GetAttribute("ActivationEnabled")
	
	return ([string]::IsNullOrEmpty($activationEnabled) -or
		[System.Convert]::ToBoolean($activationEnabled))
}

## This method installs and deploys a solution based on its solution id, path and web application
## If the solution should be deployed globally just leave the web application empty
function DeploySolution
{
	param ([string]$solutionID, [string]$solutionPath, [string]$webApplication, [string]$solType)

	$filename = $solutionPath + "\" + $solutionID
	
	Write-Host -f White "filename : " $filename
	Write-Host -f White "WebApplicationURL : " $webApplication
	Write-Host -f White "type : " $solType
	
	If ($solType -eq "New")
	{
		Write-Host -f Green "Adding solution $solutionID"
		Write-Host -f White "Filename: " $filename
		Add-SPSolution $filename
		Write-Host -f Green "Solution $solutionID added"
	}

	$farm = Get-SPFarm
	$sol = $farm.Solutions[$solutionID]

	if($sol)
	{
		If ($solType -eq "New")
		{
			if ( $webApplication -eq "" )
			{
				Write-Host -f Green "Installing $solutionID"
				Install-SPSolution –Identity $solutionID -GACDeployment -Force
			}
			else
			{
				Write-Host -f Green "Installing $solutionID on web application"
				Install-SPSolution –Identity $solutionID –WebApplication $webApplication -GACDeployment -Force
			}
		}
		else
		{
			Write-Host -f Green "Updating $solutionID from path $filename"
			Update-SPSolution –Identity $solutionID –LiteralPath $filename –GacDeployment
		}
		
		WaitForJobToFinish($solutionID)
		if($solution.LastOperationResult -like "*Failed*")
		{ 
			throw "An error occurred during the solution adding, installing, or update."
		}

		Write-Host -f Green "Solution $solutionID operation completed"
	}
	else
	{
		Write-Host -f Red "Installing $solutionID has failed. Solution is not found."
	}
}

## start retract, delete, install and deploy all solutions found in the config xml file. When the
## Scoped atrribute is set to true, the solution is retracted and deployed globally
function UninstallSolutions
{
	foreach($solution in $Solutions.ChildNodes)
	{
		if($solution)
		{
			$scoped = $solution.GetAttribute("Scoped")
			$solutionName = $solution.InnerText
			$type = $solution.GetAttribute("Type")

			If ($type -eq "New")
			{
				if ($scoped -eq $TRUE)
				{
					#Write-Host -f White "Solution $solutionName is scoped"
					DeleteSolution -solutionID $solutionName -webApplication $WebApplicationURL
				}
				else
				{
					#Write-Host -f White "Solution $solutionName is not scoped"
					DeleteSolution -solutionID $solutionName -webApplication ""
				}
			}
		}
	}
}

## start retract, delete, install and deploy all solutions found in the config xml file. When the
## Scoped atrribute is set to true, the solution is retracted and deployed globally
function InstallSolutions
{
	if(test-path $SolutionsFolder)
	{
		foreach($solution in $Solutions.ChildNodes)
		{
			if($solution)
			{
				if(ActivationEnabled($solution))
				{
					$scoped = $solution.GetAttribute("Scoped")
					$solutionName = $solution.InnerText
					$type = $solution.GetAttribute("Type")
					
					if ($scoped -eq $TRUE)
					{
						Write-Host -f White "Solution $solutionName is scoped" 
						DeploySolution -solutionID $solutionName -solutionPath $SolutionsFolder -webApplication $WebApplicationURL -solType $type
					}
					else
					{
						Write-Host -f White "Solution $solutionName is not scoped"
						DeploySolution -solutionID $solutionName -solutionPath $SolutionsFolder -webApplication "" -solType $type
					}
				}
			}
		}
	}
	else
	{
		Write-Host -f Red "The solution directory path $SolutionsFolder is invalid. Please verify the configurations."
	}
}

## This method activates features by feature name on the target site
function InstallFeatures
{
}

## This method activates features recievers on the target site
function FeatureReceiversConfig
{
}

## This method can be used to other stuff that do not fit in rest of the functions
function CustomScript
{	
}

# Check if folder exists
if (Test-Path $SolutionsFolder)
{
	$TargetWeb = Get-SPWeb $TargetSiteUrl -ea SilentlyContinue
	$WebApplicationURL = $TargetWeb.Site.WebApplication.Url.TrimEnd("/")
	
	InstallSolutions
	
	if($FeatureActivationEnabled)
	{
		InstallFeatures
	}
	
	if($FeatureReceiversEnabled)
	{
		FeatureReceiversConfig
	}
	
	if($CustomScriptExecActivationEnabled)
	{
		CustomScript
	}
	write-host "Solution pack installation completed successfully...!"
}
else
{
	write-host " No shared/local folder found! Please check the shared location path!"
}