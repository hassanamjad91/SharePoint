import * as Yup from 'yup';
import * as fields from './fields';
import { question_type } from './maps';

const default_message = "required";

const questions = Yup.object().shape({
  [fields.question.question_desc.key]: Yup.string().trim().required(default_message),
  [fields.question.question_type.key]: Yup.string().trim().required(default_message),
  [fields.question.question_show_if_parent.key]: Yup.string().when(fields.question.question_order_no.key, {
    is: (order_no: string) => order_no.split(".").length > 1,
    then: Yup.string().required(default_message),
    otherwise: Yup.string().notRequired()
  }),
  [fields.question.answer_choices.key]: Yup.array().when(fields.question.question_type.key, {
    is: (val) => val === question_type.dropdown || val === question_type.radio,
    then: Yup.array().of(Yup.string().trim().required(default_message)).required(default_message),
    otherwise: Yup.array().of(Yup.string().notRequired()).notRequired()
  })
});

const validation = Yup.object().shape({
  [fields.questionnaire.questionnaire_title.key]: Yup.string().trim().required(default_message),
  [fields.questionnaire.questionnaire_heading.key]: Yup.string().when(fields.questionnaire.questionnaire_id.key, {
    is: 0,
    then: Yup.string().notRequired(),
    otherwise: Yup.string().trim().required(default_message)
  }),
  [fields.questionnaire.questionnaire_year.key]: Yup.string().when(fields.questionnaire.questionnaire_id.key, {
    is: 0,
    then: Yup.string().notRequired(),
    otherwise: Yup.string().trim().required(default_message)
  }),
  [fields.questionnaire.questionnaire_group.key]: Yup.number().when(fields.questionnaire.questionnaire_id.key, {
    is: 0,
    then: Yup.number().notRequired(),
    otherwise: Yup.number().moreThan(0, default_message)
  }),
  [fields.questionnaire.questions.key]: Yup.array().of(questions)
});
export default validation;
