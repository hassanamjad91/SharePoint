Use CONTOSO_PORTAL

Select 'https://contoso.com' + '/' + DirName + '/'+ LeafName as Page, 
tp_WebPartTypeID, AllWebParts.tp_Assembly,
tp_WebPartTypeID, AllWebParts.tp_Class,
tp_WebPartTypeID, AllWebParts.tp_ContentTypeId,
tp_WebPartTypeID, AllWebParts.tp_DisplayName,
tp_WebPartTypeID, AllWebParts.tp_ID,
tp_WebPartTypeID, AllWebParts.tp_IsIncluded,
tp_WebPartTypeID, AllWebParts.tp_Level,
tp_WebPartTypeID, AllWebParts.tp_ListId,
tp_WebPartTypeID, AllWebParts.tp_SiteId,
tp_WebPartTypeID, AllWebParts.tp_Source,
tp_WebPartTypeID, AllWebParts.tp_SiteId,
tp_WebPartTypeID, AllWebParts.tp_WebPartIdProperty,
tp_WebPartTypeID, AllWebParts.tp_WebPartTypeId

from AllDocs inner join AllWebParts on AllDocs.Id = AllWebParts.tp_PageUrlID 
where AllWebParts.tp_Assembly like '%contoso%' OR AllWebParts.tp_Class like '%contoso%' OR AllWebparts.tp_DisplayName like '%contoso%'

Delete 
from AllWebParts
--from AllDocs inner join AllWebParts on AllDocs.Id = AllWebParts.tp_PageUrlID 
where AllWebParts.tp_ID = '<target-webpart-id>'