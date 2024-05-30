export enum LogType {
  Error = "Error",
  Trace = "Trace",
}

export enum HTTP_Method {
  CONNECT = "CONNECT",
  DELETE = "DELETE",
  GET = "GET",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
  POST = "POST",
  MERGE = "MERGE",
  PUT = "PUT",
  TRACE = "TRACE"
}

export enum Rule {
  Questionnaire_Start = "questionnaire start",
  Questionnaire_Update = "mark questionnaire for updation",
  Question_Add = "add new to the questions list",
  Question_Update = "mark question for updation",
  Question_Delete = "mark question for deletion and then remove it from the form",
  Question_Move = "swap two questions that are siblings", 
  Choice_Add = "add new choice option",
  Choice_Delete = "delete choice option",
  Disabled_Field = "disable rules that apply for all/specific field(s)",
  Disabled = "disable rules that apply to all form elements"
}

// field type id needed when creating sp columns using REST API
// search for "FieldType Enum SharePoint" on docs.microsoft.com
export enum Field_Type {
  Text = 2,
  Note = 3,
  Lookup = 7
}

// field data types is needed for creating sp columns using REST API
// search for "Field element (Field)" on docs.microsoft.com
export enum Data_Type {
  Lookup = "Lookup",
  Note = "Note"
}

// base templates is needed for creating sp lists using REST API
// search for "Base Templates" on docs.microsoft.com
export enum Base_Template {
  Custom_List = 100
}

// view type is needed for creating sp views using REST API
// search for "Lists and list items REST API" on docs.microsoft.com
export enum View_Type {
  HTML = "HTML",
  GANTT = "GANTT",
  GRID = "GRID",
  CHART = "CHART",
  CALENDAR = "CALENDAR",
  RECURRENCE = "RECURRENCE"
}

// POST rest api calls require entity type in POST body
export enum Entity_Type {
  List = "SP.List",
  View = "SP.View",
  Field = "SP.Field",
  FieldXml = "SP.XmlSchemaFieldCreationInformation"
}

export default {};
