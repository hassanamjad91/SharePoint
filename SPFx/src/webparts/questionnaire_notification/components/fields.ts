import { Notification_Status } from '../../../enums';

// only initialize props that you need
// make sure that "key" prop is equal to object key

export const fields = {
  notification_id: { key: "notification_id", value: 0 },
  notification_status: { key: "notification_status", value: Notification_Status.Draft, label: "Status" },
  notification_subject: { key: "notification_subject", value: "", label: "Email Subject" },
  notification_body: { key: "notification_body", value: "", label: "Email Body" },
  notification_author: { key: "notification_author", value: { Id: 0, Title: "" },label: "Created By" },
  notification_attachments: { key: "notification_attachments", value: [], label: "Add Attachments" },
  notification_others: { key: "notification_others", value: "", label: "Others (Enter new-line delimited emails)" },
  notification_send_to: { key: "notification_send_to", value: "", label: "Who To Send?" },
  notification_template: { key: "notification_template", value: 0, label: "Copy From Tempalate" },
  notification_call_to_action: { key: "notification_call_to_action", value: "Start Survey", label: "Call To Action Button Text (35 characters max)" },
  questionnaire_id: { key: "questionnaire_id", value: 0 },
  questionnaire_author: { key: "questionnaire_author", value: { Id: 0, Title: "" }, label: "Created By" },
  questionnaire_status: { key: "questionnaire_status", value: "", label: "Status" },
  questionnaire_year: { key: "questionnaire_year", value: "", label: "Year" },
  questionnaire_title: { key: "questionnaire_title", value: "", label: "Title" },
  __ckeditor_loaded: { key: "__ckeditor_loaded", value: false  },
  __submitted: { key: "__submitted", value: false }
};
