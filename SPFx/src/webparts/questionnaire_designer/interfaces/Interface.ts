import { WebPartContext } from '@microsoft/sp-webpart-base';
import { Environment } from '@microsoft/sp-core-library';
import { AxiosResponse, AxiosError } from 'axios';
import { LogType, Field_Type, View_Type, Entity_Type, Base_Template, Rule } from '../enums/Enum';

export interface IWebpart {
  context: WebPartContext;
  env_type: Environment;
}

export interface IField_Props {
  input?: string;
  label?: string;
  class?: string; //CSS class
  options?: ILookup[] | any[];
  readonly?: boolean;
  attributes?: object;
}

export interface IFormatting_Rule {
  rule: Rule;
  target?: string;
  data?: any;
}

export interface IHTTP_Exception {
  error: AxiosResponse | AxiosError;
  status: number;
}

export interface ISP_Field
{
  __metadata: { type: Entity_Type.Field; };
  FieldTypeKind: Field_Type;
  Title: string;
  Description: string;
  SchemaXml?: string;
}

// suitable for creating complex fields like lookup
export interface ISP_Field_Xml {
  parameters:
  {
    SchemaXml: string;
  };
}

export interface ISP_List {
  __metadata: { type: Entity_Type.List; };
  BaseTemplate: Base_Template;
  Title: string;
  Description: string;
  Hidden: boolean;
}

export interface ISP_View {
  __metadata: { type: Entity_Type.View; };
  Title?: string;
  ViewType?: View_Type;
  PersonalView?: boolean;
  ViewQuery?: string;
}

export interface IUrl {
  title: string;
  url: string;
}

export interface ILog {
  type: LogType;
  log: string | object;
}

// Lookup Definition: Generic
export interface ILookup {
  Id: number;
  Title?: string;
}

// Lookup Definition: Person Field
export interface IPerson {
  Id: number;
  Title?: string;
  Name?: string;
  Email?: string;
}

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
