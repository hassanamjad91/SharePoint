import { Task_Status } from '../../../enums';

// make sure that "key" prop is equal to object key
export const question = {
  question_id: { key: "question_id", value: 0 },
  question_desc: { key: "question_desc", value: "" },
  question_is_active: { key: "question_is_active", value: false },
  question_show_if_parent: { key: "question_show_if_parent", value: true },
  question_order_no: { key: "question_order_no", value: "" },
  question_type: { key: "question_type", value: "" },
  question_heading: { key: "question_heading", value: "" },
  answer: { key: "answer", value: "" },
  answer_column: { key: "answer_column", value: "" },
  answer_choices: { key: "answer_choices", value: "" },
  __required: { key: "__required", value: false },
  __display: { key: "__display", value: false }
};

export const questionnaire = {
  submission_id: { key: "submission_id", value: 0 },
  submission_status: { key: "submission_status", value: Task_Status.Not_Started, label: "Status" },
  questionnaire_id: { key: "questionnaire_id", value: 0 },
  questionnaire_heading: { key: "questionnaire_heading", value: "Questionnaire", label: "Select" },
  questionnaire_status: { key: "questionnaire_status", value: "", label: "Status" },
  questionnaire_statement: { key: "questionnaire_statement", label: "Acknowledgement Statement", value: "" },
  questionnaire_allow_draft: { key: "questionnaire_allow_draft", value: false },
  answers_list_title: { key: "answers_list_title", value: "" },
  answers_list_url: { key: "answers_list_url", value: "" },
  answer_id: { key: "answer_id", value: 0 },
  submitter: { key: "submitter", value: { Id: 0, Title: "" }, label: "Submitter" },
  questions: { key: "questions", value: [], label: "Questions List" },
  __submit: { key: "__submit", value: 0 },
  __is_submitted: { key: "__is_submitted", value: false }
};
