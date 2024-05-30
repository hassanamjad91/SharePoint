import * as Yup from 'yup';
import * as fields from './fields';
import { Question_Type } from '../../../enums';

const questions = Yup.object().shape({
  [fields.question.answer.key]: Yup.string().when(fields.question.question_type.key, {
    is: Question_Type.Static,
    then: Yup.string().notRequired(),
    otherwise: Yup.string().when(fields.question.__display.key, {
      is: true,
      then: Yup.string().when(fields.question.__required.key, {
        is: true,
        then: Yup.string().required(),
        otherwise: Yup.string().notRequired()
      }),
      otherwise: Yup.string().notRequired(),
    }),
  }),
});

const validation = Yup.object().shape({
  [fields.questionnaire.questions.key]: Yup.array().of(questions)
});

export default validation;
