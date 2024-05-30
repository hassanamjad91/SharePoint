import { Questionnaire_Statuses } from '../../../enums';

// only initialize props that you need
// make sure that "key" prop is equal to object key

export const fields = {
  questionnaire_id: { key: "questionnaire_id", value: 0, label: "Questionnaire Select" },
  questionnaire_author: { key: "questionnaire_author", value: { Id: 0, Title: "" }, label: "Created By" },
  questionnaire_status: { key: "questionnaire_status", value: "", label: "Change Status", options: Questionnaire_Statuses },
  questionnaire_answer_list: { key: "questionnaire_answer_list", value: { title: "", url: "" } },
  user_submissions: { key: "user_submissions", value: [], label: "Submission Status" },
  notifications: { key: "notifications", value: [], label: "Notification History" }
};
