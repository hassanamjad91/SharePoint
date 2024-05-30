import { EnvironmentType } from '@microsoft/sp-core-library';

const config = {
  app: "Questionnaire Designer",
  env: EnvironmentType.Local,
  user: { Id: 0, Name: "", Title: "" },
  paths: {
    api: "https://localhost:4444",
    web: "/",
    site: "/",    
    current: window.location.href
  }
};

export default config;
