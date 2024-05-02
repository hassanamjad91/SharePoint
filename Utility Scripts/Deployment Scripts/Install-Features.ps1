## Get XML configuration file parameters
param 
(
    [string]$ConfigFile = "C:\Contoso\DeploymentPackage\Configuration\Install-Features.xml"
	##[string]$ConfigFile = $(throw '- Need parameter input file (e.g. "c:\PowerShellDeployment\Install-Sandbox-Solutions.xml")')
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
$SandboxSolutions = $item.SandboxSolutions
$SolutionsFolder = Resolve-Path $item.SolutionsFolder
$SandboxSolutionsFolder = $item.SandboxSolutionsFolder
$TargetSiteUrl = $item.TargetSiteUrl.TrimEnd("/")
$Features = $item.Features
$FeatureActivationEnabled = [System.Convert]::ToBoolean($Features.GetAttribute("ActivationEnabled"))
$FeatureReceivers = $item.FeatureReceivers
$FeatureReceiversEnabled = [System.Convert]::ToBoolean($FeatureReceivers.GetAttribute("ActivationEnabled"))
$ContentTypeUpdates = $item.ContentTypeUpdates
$ContentTypeUpdatesActivationEnabled = [System.Convert]::ToBoolean($ContentTypeUpdates.GetAttribute("ActivationEnabled"))
$CustomScriptExec = $item.CustomScript
$CustomScriptExecActivationEnabled = [System.Convert]::ToBoolean($CustomScriptExec.GetAttribute("ActivationEnabled"))



## This method deploys a sandbox solution based on its solution id, path and target site/subsite
function DeploySandboxSolution
{
	param ([string]$solutionID, [string]$solutionPath, [string]$siteUrl, [string]$solType)
	$filename = $solutionPath + "\" + $solutionID
	Write-Host -f White "siteUrl: "  $siteUrl
	Write-Host -f White "SolutionID: "  $solutionID
	
	If ($solType -eq "New")
	{
		Write-Host -f Green "Installing $solutionID"
		Add-SPUserSolution -LiteralPath $filename -Site $siteUrl
		Install-SPUserSolution -Identity $solutionID -Site $siteUrl
		##Install-SPSolution –Identity $solutionID -GACDeployment -Force
	}

	if($solution.LastOperationResult -like "*Failed*")
	{ 
		throw "An error occurred during the solution adding, installing, or update."
	}
	Write-Host -f Green "Solution $solutionID operation completed"
}

## This method deploys a sandbox solution based on its solution id, path and target site/subsite
function InstallSandboxSolutions
{
	if(test-path $SandboxSolutionsFolder)
	{
		foreach($solution in $SandboxSolutions.ChildNodes)
		{
			if($solution)
			{
				if(ActivationEnabled($solution))
				{
					$scoped = $solution.GetAttribute("Scoped")
					$solutionName = $solution.InnerText
					$type = $solution.GetAttribute("Type")
					
					#Write-Host -f White "Solution $solutionName is scoped" 
					DeploySandboxSolution -solutionID $solutionName -solutionPath $SandboxSolutionsFolder -siteUrl $TargetSiteUrl -solType $type
				}
			}
		}
	}
	else
	{
		Write-Host -f Red "The solution directory path $SolutionsFolder is invalid. Please verify the configurations."
	}
}

## This method activates features based on the feature name and target site/subsite
function InstallFeatures
{
	foreach($feature in $Features.ChildNodes)
	{
		if(ActivationEnabled($feature))
		{
			$scope = $feature.GetAttribute("Scope")
			$featureName = $feature.GetAttribute("Name")
			$featureType = $feature.GetAttribute("Type")
			##$featureId = $feature.GetAttribute("Id")
			$featureTarget = $feature.GetAttribute("Target")
			
			if ($featureType -eq "New")
			{
				if($scope -eq "Site")
				{
					##write-host -f Green "Install feature"
					##Install-SPFeature $featureName -force
					Write-Host "Enabling feature $featureName"
					#stsadm.exe -o activatefeature -name $featureName -url $TargetSiteUrl
					Enable-SPFeature -Identity $featureName -Url $TargetSiteUrl
				}
				elseif($scope -eq "Web")
				{
					#write-host -f Green "Install feature"
					#Install-SPFeature $featureName -force
					
					if($featureTarget -eq "Root")
					{
						Write-Host "Enabling feature $featureName on $TargetSiteUrl"
						#stsadm.exe -o activatefeature -name $featureName -url $TargetSiteUrl
						Enable-SPFeature -Identity $featureName -Url $TargetSiteUrl
					}
					elseif($featureTarget -eq "Property")
					{
						# get a sitecollection object(SPWeb)
						$SPWeb = Get-SPWeb -Identity $TargetSiteUrl
						$List = $TargetWeb.Lists["InventoryRegions"]
					
						foreach ($item in $List.items)
						{
							$WebURL = $item["SiteURL"].tostring()
							Write-Host "Enabling feature $featureName on $WebURL"
							#stsadm.exe -o activatefeature -name $featureName -url $WebURL
							Enable-SPFeature $featureName -Url $WebURL -Confirm:$false
						}
						# cleanup 
						$SPWeb.Dispose() 
					}
				}
			}
		}
	}
}

## This method checks if activation flag of a feature is set to true or false
function ActivationEnabled([System.Xml.XmlElement] $element)
{
	$activationEnabled = $element.GetAttribute("ActivationEnabled")
	
	return ([string]::IsNullOrEmpty($activationEnabled) -or
		[System.Convert]::ToBoolean($activationEnabled))
}

## This method waits for solution to be deployed
function WaitForJobToFinish([string]$SolutionFileName)
{ 
}

## This method installs and deploys a solution based on its solution id, path and web application
## If the solution should be deployed globally just leave the web application empty
function DeploySolution
{
}

## start retract, delete, install and deploy all solutions found in the config xml file. When the
## Scoped atrribute is set to true, the solution is retracted and deployed globally
function UninstallSolutions
{
}

## start retract, delete, install and deploy all solutions found in the config xml file. When the
## Scoped atrribute is set to true, the solution is retracted and deployed globally
function InstallSolutions
{
}

## This method is used to activate feature recievers
function FeatureReceiversConfig
{
}

## This method is updates site content types
function UpdateContentTypes
{
}

## This method activates site content types
function AddFieldinContentType
{
}

## This method can be used to other stuff that do not fit in rest of the functions
function CustomScript
{
}

## This method retracts and deletes a solution based on its solution id, path and web application
function DeleteSolution
{
}

# Check if folder exists
if (Test-Path $SolutionsFolder)
{
	$TargetWeb = Get-SPWeb $TargetSiteUrl -ea SilentlyContinue
	$WebApplicationURL = $TargetWeb.Site.WebApplication.Url.TrimEnd("/")
	
	##InstallSandboxSolutions
	
	if($FeatureActivationEnabled)
	{
		InstallFeatures
	}
	
	if($CustomScriptExecActivationEnabled)
	{
		CustomScript
	}
	
	if($FeatureReceiversEnabled)
	{
		FeatureReceiversConfig
	}

	if ($ContentTypeUpdatesActivationEnabled)
	{
		UpdateContentTypes
	}
	write-host "Solution pack upgrade completed successfully...!"
}
else
{
	write-host " No shared/local folder found! Please check the shared location path!"
}