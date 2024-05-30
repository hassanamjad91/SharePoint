export const fields_question = {
  question_id: { name: "question_id", type: "number", value: 0, read_only: true },
  question_desc: { name: "question_desc", type: "textarea", value: "", read_only: true },
  question_is_active: { name: "question_is_active", type: "bool", value: false, read_only: true },
  question_show_if_parent: { name: "question_show_if_parent", type: "bool", value: true, read_only: true },
  question_order_no: { name: "question_order_no", type: "text", value: "", read_only: true },
  question_type: { name: "question_type", type: "text", value: "", read_only: true },
  question_parent_id: { name: "question_parent_id", type: "number", value: 0, read_only: true },
  question_heading: { name: "question_heading", type: "text", value: "", read_only: true },
  answer: { name: "answer", type: "text", value: "", read_only: false },
  answer_column: { name: "answer_column", type: "array", value: "", read_only: true },
  answer_choices: { name: "answer_choices", type: "text", value: "", read_only: true },
  __required: { name: "__required", value: false },
  __display: { name: "__display", type: "bool", value: false, read_only: false }
};

const question_obj = () => {
  let obj = {};
  Object.keys(fields_question).map((key) => { obj[fields_question[key].name] = fields_question[key].value; });
  return obj;
};

export const fields = {
  submission_id: { name: "submission_id", value: 0 },
  submission_status: { label: "Status", name: "submission_status", type: "text", value: "", read_only: true },
  questionnaire_id: { name: "questionnaire_id", value: 0 },
  questionnaire_heading: { label: "Questionnaire", name: "questionnaire_heading", type: "text", value: "Questionnaire", read_only: true },
  questionnaire_year: { label: "Year", name: "questionnaire_year", type: "text", value: "", read_only: true },
  questionnaire_statement: { name: "questionnaire_statement", type: "textarea", value: "", read_only: true },
  answers_list_title: { name: "answers_list_title", value: "" },
  answers_list_url: { name: "answers_list_url", value: "" },
  answer_id: { name: "answer_id", value: 0 },
  answer_author: { label: "Submitter", name: "answer_author", type: "text", value: "", read_only: true },
  questions: {
    label: "Questions List",
    name: "questions",
    type: "fieldarray",
    value: [],
    data: question_obj()
  },
  __submit: { name: "__submit", value: 0 },
  __is_submitted: { label: "", name: "__is_submitted", type: "bool", value: false, read_only: true }
};

export default fields;
