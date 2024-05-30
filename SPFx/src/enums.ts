export const Questionnaire_Statuses = [
  "In Progress",
  "Completed"
];

export enum Questionnaire_Status {
  In_Progress = "In Progress",
  Completed = "Completed"
}

export enum Notification_Status {
  Draft = "Draft",
  In_Progress = "In Progress",
  Sent = "Sent",
  Canceled = "Canceled"
}

export enum Task_Status {
  Not_Started = "Not Started",
  Draft = "Draft",
  Submitted = "Submitted",
}

export enum Log_Type {
  Error = "Error",
  Trace = "Trace",
}

export enum Question_Type {
  Toggle = "toggle",
  Radio = "radio",
  Dropdown = "dropdown",
  Text = "text",
  Note = "note",
  Static = "static"
}

export enum Input_Type {
  Text = "Text",
  Rich_Text = "RichText",
  Note = "Note",
  Number = "Number",
  Radio = "Radio",
  Dropdown = "Dropdown",
  Toggle = "Toggle",
  Checkbox = "Checkbox",
  Person = "Person",
  File = "File"
}

export enum Notification_Send_To {
  Entire_Dist_List = "Entire Distribution List",
  Non_Respondents = "Non-Respondents",
  Others = "Others"
}

export enum App_State {
  Error = "Error",
  Pre_Rendering = "Pre_Rendering",
  Pre_Render_Complete = "Pre_Render_Complete",
  Not_Found = "Not_Found",
  UnAuthorized = "UnAuthorized"
}
