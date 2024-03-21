install-module azuread
import-module azuread

Connect-AzureAD 
$GroupId = Get-AzureADGroup -Filter "DisplayName eq 'Contoso'" | Select ObjectId
$Emails = Get-AzureADGroupMember -ObjectId $GroupId.ObjectId -All $true | Select UserPrincipalName
$Emails | Export-Csv -Path C:\Test.csv -NoTypeInformation