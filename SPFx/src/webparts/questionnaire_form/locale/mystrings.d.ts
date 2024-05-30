declare interface IWebpart_strings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  DescriptionFieldValue: string;
  QuestionnaireSubmitSuccess: string;
  QuestionnaireDraftSuccess: string;
  Loading: string;
}

declare module 'questionnaire-form-locale' {
  const strings: IWebpart_strings;
  export = strings;
}
