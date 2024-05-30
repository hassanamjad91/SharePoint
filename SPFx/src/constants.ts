export const SP_Rest_Proxy = "https://localhost:4444";

export const App_Title_Questionnaire_Designer = "Questionnaire Designer";
export const App_Title_Questionnaire_Notification = "Questionnaire Notification";
export const App_Title_Questionnaire_Form = "Questionnaire Form";
export const App_Title_CNDS_Dashboard = "Central Administration";

export const Path_Current_Folder = window.location.href.split("/").slice(0, -1).join("/");
export const Path_Home = Path_Current_Folder + "/" + "Home.aspx";
export const Path_Questionnaire_App = Path_Current_Folder + "/" + "Questionnaire.aspx";
export const Path_Questionnaire_Notification_App = Path_Current_Folder + "/" + "Notification.aspx";
export const Path_Questionnaire_Designer_App = Path_Current_Folder + "/" + "Designer.aspx";
export const Path_CNDS_Dashboard_App = Path_Current_Folder + "/" + "Dashboard.aspx";
export const Path_Site_Contents_Page = "/_layouts/15/viewlsts.aspx";

export const List_Title_Questionnaire = "Questionnaires";
export const List_Title_Questions = "Questions";
export const List_Title_Send_Notification = "Send Notification";
export const List_Title_Email_Templates = "Email Templates";
export const List_Title_User_Submission = "User Submission";
export const List_Title_Dist_List = "Distribution List";
export const List_Title_Logs = "Logs";

export const List_URI_Questionnaire = "Questionnaire";
export const List_URI_Questions = "Questions";
export const List_URI_Send_Notification = "SendNotification";
export const List_URI_Email_Templates = "EmailTemplates";
export const List_URI_User_Submission = "UserSubmission";
export const List_URI_Dist_List = "DistributionList";
export const List_URI_Logs = "Logs";

export const User_Message_App_Loading = "Loading Application. Please Wait...";
export const User_Message_Saving = "Saving changes..";
export const User_Message_Saved = "Changes Saved Successfully";
export const User_Message_UnAuthorized = "Sorry! You are not allowed to access this resource.";
export const User_Message_Not_Found = "Sorry! The resource you are trying to access could not be found.";
export const User_Message_Error = "Sorry! something went wrong. We're working on it.";
export const User_Message_Invalid_Form = "Please make sure all highlighted fields are filled out.";
export const User_Message_Questions_Not_Found = "No questions to display here.";

export const Columns_SharePoint = {
  // internal columns of sharepoint
  Id: "Id",
  Title: "Title",
  Author: "Author",
  Created: "Created",
  Modified: "Modified",  
  AttachmentFiles: "AttachmentFiles",
  Name: "Name",
  Email: "Email",
  EMail: "EMail"
};

export const Columns_Questionnaire_List = {
  Year: "Year",
  Heading: "Heading",
  Status: "Status",
  EmailTemplates: "EmailTemplates",
  AnswersListTitle: "AnswersListTitle",
  AnswersListUrl: "AnswersListUrl"
};

export const Columns_Notification_List = {
  NotificationSendTo: "NotificationSendTo",
  Others: "Others",
  EmailTemplate: "EmailTemplate",
  Questionnaire: "Questionnaire",
  EmailContent: "EmailContent",
  Body: "Body",
  Subject: "Subject",
  Status: "Status",
  SendEmail: "SendEmail",
  CallToActionText: "CallToActionText"
};
export const Columns_Email_Template_List = {
  Subject: "Subject",
  Body: "Body",
  CallToActionText: "CallToActionText"
};

export const Columns_Log_List = {
  Log: "Log",
  LogType: "LogType"
};

export const Columns_User_Submissions_List = {
    Questionnaire: "Questionnaire",
    Submitter: "Submitter",
    Status: "Status"
};

export const URL_Parameters = {
  Notification_Id: "n_id",
  Questionnaire_Id: "q_id",
  Task_Id: "item",
  Debug: "debug",
  Source: "src"  
};

export const Black_List_File_Extension = [
  "exe",
  "bat",
  "msi",
  "js",
  "html"
];

export const Choices_Notification_Send_To = [
  "Entire Distribution List",
  "Non-Respondents",
  "Others"
];
