import * as Yup from 'yup';
import { fields } from './fields';
import { Notification_Send_To } from '../../../enums';

const validation = Yup.object().shape({
  [fields.notification_subject.key]: Yup.string().required("required"),
  [fields.notification_body.key]: Yup.string().required("required"),
  [fields.notification_send_to.key]: Yup.string().required("required"),
  [fields.notification_call_to_action.key]: Yup.string().required("required").max(35),
  [fields.notification_others.key]: Yup.string().when(fields.notification_send_to.key, {
    is: Notification_Send_To.Others,
    then: Yup.string().required("required"),
    otherwise: Yup.string().notRequired()
  }),
  otherwise: Yup.string().notRequired()
});
export default validation;
