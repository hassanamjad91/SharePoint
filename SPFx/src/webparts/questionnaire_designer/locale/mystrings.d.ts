declare interface IWebpart_string {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  DescriptionFieldValue: string;
}

declare module 'questionnaire-wizard-locale' {
  const strings: IWebpart_string;
  export = strings;
}
