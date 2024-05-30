import { Question_Type, Questionnaire_Status } from '../../../enums';

// only initialize props that you need
// make sure that "key" prop is equal to object key

export const question = {
  question_id: { key: "question_id", value: 0 },
  question_desc: { key: "question_desc", value: "" },
  question_heading: { key: "question_heading", value: "" },
  question_show_if_parent: { key: "question_show_if_parent", value: "" },
  question_order_no: { key: "question_order_no", value: "1" },
  question_type: { key: "question_type", value: Question_Type.Note },
  question_parent_id: { key: "question_parent_id", value: 0 },
  answer_column: { key: "answer_column", value: "" },
  answer_choices: { key: "answer_choices", value: ["Choice 1", "Choice 2", "Choice 3"] },
  answer_required: { key: "answer_required", value: false },
  guid: { key: "guid", value: "" } // non-persistent unique identifier
};

// initialize keys and default values
export const questionnaire = {
  questionnaire_id: { key: "questionnaire_id", value: 0 },
  questionnaire_title: { key: "questionnaire_title", value: "" },
  questionnaire_heading: { key: "questionnaire_heading", value: "" },
  questionnaire_year: { key: "questionnaire_year", value: "" },
  questionnaire_answer_list: { key: "questionnaire_answer_list", value: { title: "", url: "" } },
  questionnaire_statement: { key: "questionnaire_statement", value: "" },
  questionnaire_author: { key: "questionnaire_author", value: { Id: 0, Title: "" } },
  questionnaire_status: { key: "questionnaire_status", value: Questionnaire_Status.In_Progress },
  questionnaire_group: { key: "questionnaire_group", value: 0 },
  questions: { key: "questions", value: [] },
  __updated: { key: "__updated", value: false },
};
