import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Environment } from '@microsoft/sp-core-library';
import { Question_Type } from './enums';

export interface IWebpart {
  context: WebPartContext;
  env_type: Environment;
}

// sharepoint's list attachment schema
export interface IList_Attachment {
  ServerRelativeUrl: string;
  FileName: string;
}

// custom interface used by file attachment component
export interface IFile {
  native?: File;
  uploaded?: IList_Attachment;
  __deleted: boolean;
}

// sharepoint's 'Person' object schema
export interface IPerson {
  Id: number;
  Title?: string;  
  Email?: string;
  EMail?: string;
}

// sharepoint's generic lookup column schema
export interface ILookup {
  Id: number;
  Title: string;
}

// sharepoint's url column schema
export interface IUrl {
  title: string;
  url: string;
}

// sharepoint's 'Send Notification' list schema
export interface INotification {
  Id: number;
  Status: string;
  Author: IPerson;
  NotificationSendTo: string;
  Created: string;
}

// sharepoint's 'User Submission' list schema
export interface IUserSubmission {
  Id: number;
  Status: string;
  Author: IPerson;
  Submitter: IPerson;
  Created: string;
}

// generic form field schema
export interface IField {
  key: string;
  value: any;
  type?: string;
  label?: string;
  class?: string; //CSS class
  options?: ILookup[] | any[];
  readonly?: boolean;
}

// question form field schema
export interface IQuestion_Field {
  key: string;
  value: any;
  type: Question_Type;
  label?: string;  
  class?: string;  
  options?: string[];
}

// sharepoint 'Email Templates' list schema
export interface IEmail_Template {
  Id: number;
  Title: string;
  Subject: string;
  Body: string;
  CallToActionText: string;
}

// sharepoint's 'Questions' list schema
export interface IQuestion {
  Id: number;
  Title: string;
  Question: string;
  Heading: string;
  OrderNo: string;
  ShowIFParentAnswer: boolean;
  AnswerColumnName: string;
  QuestionType: string;
  Required: boolean;
  Choices: string;
  ParentQuestion: ILookup;
}

// sharepoint's 'Questionnaire' list schema
export interface IQuestionnaire {
  Id: number;
  Title: string;
  Heading: string;
  Status: string;
  Year: string;
  AnswersListTitle: string;
  AnswersListUrl: string;
  Statement: string;
  Author: IPerson;
  Submit: boolean;
}
