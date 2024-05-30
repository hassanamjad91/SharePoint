declare interface IWebpart_strings {
  PropertyPaneDescription: string;
  BasicGroupName: string;
  DescriptionFieldLabel: string;
  DescriptionFieldValue: string;
}

declare module 'questionnaire-manage-locale' {
  const strings: IWebpart_strings;
  export = strings;
}
