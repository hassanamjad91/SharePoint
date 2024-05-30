export const question_type = {
  toggle: "toggle",
  radio: "radio",
  dropdown: "dropdown",
  text: "text",
  note: "note",
  static: "static"
};

export const questionnaire_status = {
  in_progress: "In Progress",
  completed: "Completed"
};

export const input_type = {
  number: "number",
  rich_text: "rich_text",
  ...question_type
};

export const params = {
  questionnaire_id: "q_id",
  debug: "debug",
  src: "src"
};

export const sp_cols = {
  _generic: {
    Id: "Id",
    Title: "Title",
    LinkTitle: "LinkTitle",
    Author: "Author",
    Modified: "Modified",
    Created: "Created",
    AttachmentFiles: "AttachmentFiles",
    Name: "Name",
    Email: "Email",
    EMail: "EMail"
  },
  questionnaire: {
    Year: "Year",
    Heading: "Heading",
    Status: "Status",
    Statement: "Statement",
    Group: "Group",
    AnswersListTitle: "AnswersListTitle",
    AnswersListUrl: "AnswersListUrl"
  },
  questions: {
    Heading: "Heading",
    Question: "Question",
    OrderNo: "OrderNo",
    ShowIFParentAnswer: "ShowIFParentAnswer",
    Questionnaire: "Questionnaire",
    ParentQuestion: "ParentQuestion",
    AnswerColumnName: "AnswerColumnName",
    Required: "Required",
    QuestionType: "QuestionType",
    Choices: "Choices"
  },
  log: {
    Log: "Log",
    UserId: "UserId",
    LogType: "LogType"
  }
};

export const sp_lists = {
  questionnaire: { id: "", uri: "Questionnaire", title: "Questionnaires" },
  questions: { id: "", uri: "Questions", title: "Questions" },
  notification: { uri: "SendNotification", title: "Send Notification" },
  groups: { id: "", uri: "Groups", title: "Groups" },
  log: { id: "", uri: "Logs", title: "Logs" }
};

export default {};
