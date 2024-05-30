import './components/polyfills';
import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version, Environment } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart, IPropertyPaneConfiguration, PropertyPaneTextField } from '@microsoft/sp-webpart-base';
import * as strings from 'questionnaire-form-locale';
import { IWebpart } from '../../interfaces';
import Main from './components/form';

export default class WebPart extends BaseClientSideWebPart<IWebpart> {

  public render(): void {
    const entry_point: React.ReactElement = React.createElement(
      Main, { context: this.context, env_type: Environment.type }
    );
    ReactDom.render(entry_point, this.domElement);    
  }
 
  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("desc", {
                  label: strings.DescriptionFieldLabel, value: strings.DescriptionFieldValue, multiline: true, disabled: true
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
