import * as React from 'react';
import { Fragment } from 'react';
import * as _ from 'lodash';
import { EnvironmentType } from '@microsoft/sp-core-library';
import styles from '../styles/style.module.scss';
import validation from './validation';
import { fields } from './fields';
import { App_State, Input_Type, Notification_Status, Notification_Send_To } from '../../../enums';
import { Get, Post, Url_Params, Exception, CKEditor4_Config } from '../../../helpers';
import { TextField, Label, PrimaryButton, Separator, ActionButton, IIconProps, Icon } from 'office-ui-fabric-react/lib';
import { ChoiceGroup, Dropdown, IChoiceGroupOption, IDropdownOption } from 'office-ui-fabric-react/lib';
import { IWebpart, IField, IFile, IList_Attachment, ILookup, IEmail_Template, IPerson } from '../../../interfaces';
import { PeoplePicker, PrincipalType, IPeoplePickerUserItem } from '@pnp/spfx-controls-react/lib/PeoplePicker';
import { Formik, Form, Field, getIn, FormikValues } from 'formik';
import CKEditor from 'ckeditor4-react';

import {
  SP_Rest_Proxy,
  App_Title_Questionnaire_Notification,
  List_Title_Questionnaire,
  List_Title_Send_Notification,
  List_Title_Email_Templates,
  Columns_SharePoint,
  Columns_Notification_List,
  Columns_Questionnaire_List,
  Columns_Email_Template_List,
  Black_List_File_Extension,
  Choices_Notification_Send_To,
  URL_Parameters,
  User_Message_App_Loading,
  User_Message_Invalid_Form,
  User_Message_Saved,
  User_Message_Saving,
  User_Message_Error,
  User_Message_UnAuthorized,
  User_Message_Not_Found,   
} from '../../../constants';

class Main extends React.Component<IWebpart, {}> {

  public state = {
    app_state: App_State.Pre_Rendering
  };

  // render props - these props will be set at render time
  public form: Formik;
  public values: FormikValues = {};
  public is_submitting: boolean = false;
  public is_form_invalid: boolean = false;
  public is_submit: boolean = false;
  public is_disable_form: boolean = false;
  public file_input_ref = React.createRef<HTMLInputElement>();
  public poeple_input_ref = React.createRef<HTMLInputElement>();
  
  // static props
  public url_params = Url_Params();
  public user: IPerson = { Id: 0, Title: "" };
  public email_templates: IEmail_Template[] = [];
  public src_url = this.url_params[URL_Parameters.Source];
  public send_icon: IIconProps = { iconName: "Send" };
  public back_icon: IIconProps = { iconName: "Back" };
  public save_icon: IIconProps = { iconName: "Save" };  
  public web_url = this.props.env_type === EnvironmentType.Local || this.props.env_type === EnvironmentType.Test ? SP_Rest_Proxy : this.props.context.pageContext.site.absoluteUrl;  

  public Field(field: IField) {
    return (
      <Fragment key={field.key}>
        <Field
          name={field.key}
          value={field.value}
          render={(props) => {
            const { _props } = props;
            const { errors, handleChange } = props.form;
            let disabled = field.readonly ? true : this.Is_Disable_Field(field.key);
            const display = this.Is_Display_Field(field.key);
            const invalid = getIn(errors, field.key) ? true : false;
            const invalid_class = invalid ? styles.invalid : "";
            const disabled_class = disabled ? styles.disabled : "";
            
            // Return null if field is not found in fields obj
            if (!fields[field.key]) return null;
            // Return null if field is set to hidden
            if (!display) return null;

            switch (field.type) {
              case Input_Type.Text: {
                // This field can display complex types like IPerson and ILookup in readonly mode
                if (typeof (field.value) === "object") {
                  let person: IPerson = field.value;
                  let lookup: ILookup = field.value;
                  if (person && person.Title) { field.value = person.Title; }
                  else if (lookup && lookup.Title) { field.value = lookup.Title; }
                  else { field.value = ""; }
                  disabled = true;
                }
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {field.label ? <Label>{field.label}</Label> : null}
                    <TextField
                      {..._props}
                      value={field.value}
                      title={field.value}
                      disabled={disabled}
                      className={[invalid_class, disabled_class].join(" ").trim()}
                      onChange={(event) => {
                        handleChange(event);
                        this.On_Change(field.key);
                      }}
                    />
                  </div>
                );
              }
              case Input_Type.Note: {
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {field.label ? <Label>{field.label}</Label> : null}
                    <TextField
                      {..._props}
                      autoComplete={"off"}
                      disabled={disabled}
                      title={field.value}
                      multiline={true}
                      className={[invalid_class, disabled_class].join(" ").trim()}
                      onChange={(event) => {
                        handleChange(event);
                        this.On_Change(field.key);
                      }}
                    />
                  </div>
                );
              }
              case Input_Type.Rich_Text: {
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {field.label ? <Label>{field.label}</Label> : null}
                    <div className={[styles.ckeditor4, invalid_class, disabled_class].join(" ").trim()}>
                      {
                        this.values[fields.__ckeditor_loaded.key] == false ? <Label>Loading...</Label> : null
                      }
                      <CKEditor
                        data={field.value}
                        readOnly={disabled}
                        config={CKEditor4_Config}
                        onLoaded={(event) => {
                          event.editor.on("beforeCommandExec", (_event) => {
                            // Show the paste dialog for the paste buttons and right-click paste
                            if (_event.data.name == "paste") {
                              _event.editor._.forcePasteDialog = true;
                            }
                          });
                          // silently update ckeditor-loaded flag
                          this.form.setFieldValue(fields.__ckeditor_loaded.key, true, false);
                        }}
                        onChange={(event) => {
                          const text = event.editor.getData();
                          const set_value = async (k, v) => {
                            await this.form.setFieldValue(k, v);
                            this.On_Change(field.key);
                          };
                          set_value(field.key, text);
                        }}
                      />
                    </div>
                  </div>
                );
              }
              case Input_Type.Dropdown: {
                // This field can render arrays of following types:
                // - "ILookup" or any type that is superset of "ILookup"
                // - "string[]"
                let options: IDropdownOption[] = [{ key: "", text: "Select an option", disabled: true }];
                if (field.options && field.options.length) {
                  if (typeof (field.options[0]) === "object") {
                    field.options.forEach((option) => {
                      let _option: ILookup = option;
                      options.push({ key: _option.Id.toString(), text: _option.Title });
                    });
                  }
                  else {
                    field.options.forEach((option) => { options.push({ key: option, text: option }); });
                  }
                }
                if (!field.value) { field.value = ""; }
                if (typeof (field.value) === "number") { field.value = field.value.toString(); }
                const style = { dropdown: { border: invalid ? "1px solid #ff4a5a" : "inherit" } };
                return (
                  options.length ?
                    <div className={field.class ? field.class : styles.col_12}>
                      {field.label ? <Label>{field.label}</Label> : null}
                      <Dropdown
                        {..._props}
                        styles={style}
                        disabled={disabled}
                        options={options}
                        selectedKey={field.value}
                        onChange={(event, option: IDropdownOption) => {
                          const set_value = async (k, v) => {
                            await this.form.setFieldValue(k, v);
                            this.On_Change(field.key);
                          };
                          set_value(field.key, option.key);
                        }}
                      />
                    </div> : null
                );
              }
              case Input_Type.Radio: {
                // This field can render arrays of following types:
                // - "ILookup" or any type that is superset of "ILookup"
                // - "string[]"
                let options: IChoiceGroupOption[] = [];
                if (field.options && field.options.length) {
                  if (typeof (field.options[0]) === "object") {
                    field.options.forEach((option) => {
                      let _option: ILookup = option;
                      options.push({ key: _option.Id.toString(), text: _option.Title });
                    });
                  }
                  else {
                    field.options.forEach((option) => { options.push({ key: option, text: option }); });
                  }
                }
                if (!field.value) { field.value = ""; }
                if (typeof (field.value) === "number") { field.value = field.value.toString(); }

                let style = { flexContainer: { selectors: {} } };
                let orientation = options.length < 4 ? "horizontal" : "vertical";
                if (orientation === "horizontal") {
                  style.flexContainer["display"] = "flex";
                  style.flexContainer.selectors[".ms-ChoiceField"] = { marginRight: 10, marginTop: 0 };
                }
                else if (orientation === "vertical") {
                  style.flexContainer.selectors[".ms-ChoiceField:first-child"] = { marginTop: 0 };
                }
                if (invalid) {
                  style.flexContainer.selectors[".ms-ChoiceField-field::before"] = { border: "2px solid #ff4a5a" };
                }
                return (
                  options.length ?
                    <div className={field.class ? field.class : styles.col_12}>
                      {field.label ? <Label>{field.label}</Label> : null}
                      <ChoiceGroup
                        {..._props}
                        styles={style}
                        disabled={disabled}
                        selectedKey={field.value}
                        options={options}
                        onChange={(event, option: IChoiceGroupOption) => {
                          const set_value = async (k, v) => {
                            await this.form.setFieldValue(k, v);
                            this.On_Change(field.key);
                          };
                          set_value(field.key, option.key);
                        }}
                      />
                    </div> : null
                );
              }
              case Input_Type.Person: {
                let people: IPerson[] = field.value;
                let people_emails: string[] = [];
                people.map((person: IPerson) => { if (person.Email) { people_emails.push(person.Email); } });
                // Note: This control doesn't work in local workbench
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {field.label ? <Label>{field.label}</Label> : null}
                    <div className={[styles.people_picker, invalid_class, disabled_class].join(" ").trim()}>
                      <PeoplePicker
                        {..._props}
                        context={this.props.context}
                        personSelectionLimit={200}
                        groupName={""}
                        showtooltip={false}
                        disabled={disabled}
                        ensureUser={true}
                        showHiddenInUI={false}
                        principalTypes={[PrincipalType.User]}
                        defaultSelectedUsers={people_emails}
                        selectedItems={(items: IPeoplePickerUserItem[]) => {
                          people = items.map((person: IPeoplePickerUserItem) => {
                            let _person: IPerson = { Id: Number(person.id), Title: person.loginName, Email: person.secondaryText };
                            return _person;
                          });
                          if (this.poeple_input_ref.current) {
                            this.poeple_input_ref.current.click();
                          }
                        }}
                      />
                    </div>
                    <input style={{ display: "none" }} ref={this.poeple_input_ref}
                      onClick={() => {
                        // Due to a bug in Poeple Picker control,
                        // the values are being set using this dummy input field
                        const set_value = async (k, v) => {
                          await this.form.setFieldValue(k, v);
                          this.On_Change(field.key);
                        };
                        set_value(field.key, people);
                      }}
                    />
                    {
                      this.props.env_type === EnvironmentType.Local ?
                        <div className={styles.warning}>People picker won't work in local workbench</div> : null
                    }
                  </div>
                );
              }
              case Input_Type.File: {
                const files: IFile[] = field.value;
                const mark_file_deleted = (index: number) => {
                  files[index].native ? files.splice(index) : files[index].__deleted = true;
                  this.form.setFieldValue(field.key, files);
                };
                const attach_icon: IIconProps = { iconName: "Upload" };
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {
                      files.length ?
                        files.map((file_obj: IFile, i: number) => (
                          !file_obj.__deleted ?
                            file_obj.uploaded ?
                              <div key={i} className={styles.file}>
                                <a className={styles.file_uploaded} title={file_obj.uploaded.FileName} href={file_obj.uploaded.ServerRelativeUrl} target="_blank" data-interception="off" >
                                  {file_obj.uploaded.FileName}
                                </a>
                                {
                                  !disabled ? <div className={styles.file_uploaded_remove} onClick={() => { mark_file_deleted(i); }}><Icon iconName="ChromeClose" /></div> : null
                                }
                              </div> :
                              file_obj.native ?
                                <div key={i} className={styles.file}>
                                  <div className={styles.file_native} title={file_obj.native.name}>
                                    {file_obj.native.name}
                                  </div>
                                  {
                                    !disabled ? <div className={styles.file_native_remove} onClick={() => { mark_file_deleted(i); }}><Icon iconName="ChromeClose" /></div> : null
                                  }
                                </div> : null : null
                        )) : null
                    }
                    {
                      files.length && !files.every((item: IFile) => { return item.__deleted; }) ?
                        <Separator styles={{ root: { lineHeight: "1px" } }} /> : null
                    }
                    <ActionButton iconProps={attach_icon} allowDisabledFocus disabled={disabled} text={field.label}
                      onClick={() => {
                        // Simulate click of hidden file input below
                        if (this.file_input_ref.current) {
                          this.file_input_ref.current.click();
                        }
                      }}
                    />
                    <input
                      name={field.key}
                      type={"file"}
                      ref={this.file_input_ref}
                      style={{ display: "none" }}
                      multiple
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const set_value = async (k, v) => {
                          await this.form.setFieldValue(k, v);
                          this.On_Change(field.key);
                        };
                        let files_obj: IFile[] = getIn(this.values, field.key);
                        _.forEach(event.currentTarget.files, ((file: File) => {
                          const file_name_split = file.name.split(".");
                          const file_ext = file_name_split[file_name_split.length - 1];
                          if (Black_List_File_Extension.indexOf(file_ext.toLowerCase()) === - 1) {
                            let file_obj: IFile = { native: file, __deleted: false };
                            files_obj.push(file_obj);

                            // If duplicate exists, mark it for deletion
                            for (let i = 0; i < files_obj.length; i++) {
                              if (files_obj[i].uploaded) {
                                if (files_obj[i].uploaded.FileName === file.name) {
                                  files_obj[i].__deleted = true;
                                  break;
                                }
                              }
                            }
                          }
                        }));
                        set_value(field.key, files);
                        event.target.value = null;
                      }}
                    />
                  </div>
                );
              }
              default: {
                return null;
              }
            }
          }}
        />
      </Fragment>
    );
  }

  public Render_Fields() {    
    return (
      <div className={styles.row}>
        <div className={styles.col_12}>
          <div className={styles.subTitle} style={{ padding: "0" }}>Questionnaire</div>
          <Separator styles={{ root: { lineHeight: "1px" } }} />
        </div>
        <div className={styles.col_12}>
          {this.Field({ key: fields.questionnaire_title.key, value: this.values[fields.questionnaire_title.key], type: Input_Type.Text, label: fields.questionnaire_title.label, class: styles.col_6, readonly: true })}
          {this.Field({ key: fields.questionnaire_author.key, value: this.values[fields.questionnaire_author.key], type: Input_Type.Text, label: fields.questionnaire_author.label, class: styles.col_2, readonly: true })}
        </div>
        <div className={styles.col_12}>
          <div className={styles.subTitle} style={{ padding: "0" }}>Notification Configuration</div>
          <Separator styles={{ root: { lineHeight: "1px" } }} />
        </div>
        <div className={styles.col_12}>
          {this.Field({ key: fields.notification_status.key, value: this.values[fields.notification_status.key], type: Input_Type.Text, label: fields.notification_status.label, class: styles.col_2, readonly: true })}
          {this.Field({ key: fields.notification_author.key, value: this.values[fields.notification_author.key], type: Input_Type.Text, label: fields.notification_author.label, class: styles.col_2, readonly: true })}
        </div>
        <div className={styles.col_12}>
          {this.Field({ key: fields.notification_send_to.key, value: this.values[fields.notification_send_to.key], type: Input_Type.Radio, label: fields.notification_send_to.label, options: Choices_Notification_Send_To, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_others.key, value: this.values[fields.notification_others.key], type: Input_Type.Note, label: fields.notification_others.label, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_template.key, value: this.values[fields.notification_template.key], type: Input_Type.Dropdown, label: fields.notification_template.label, options: this.email_templates, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_subject.key, value: this.values[fields.notification_subject.key], type: Input_Type.Text, label: fields.notification_subject.label, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_body.key, value: this.values[fields.notification_body.key], type: Input_Type.Rich_Text, label: fields.notification_body.label, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_call_to_action.key, value: this.values[fields.notification_call_to_action.key], type: Input_Type.Text, label: fields.notification_call_to_action.label, class: styles.col_12, readonly: false })}
          {this.Field({ key: fields.notification_attachments.key, value: this.values[fields.notification_attachments.key], type: Input_Type.File, label: fields.notification_attachments.label, class: styles.col_12, readonly: false })}
        </div>
      </div>
    );
  }

  public async Get_Current_User() {
    // Get: current user data
    const response = await Get(this.web_url + "/_api/web/currentuser");

    // Process: current user data
    const data: IPerson = response.data;
    this.user = { Id: data.Id, Title: data.Title };
    fields.notification_author.value = { Id: data.Id, Title: data.Title };
    fields.questionnaire_author.value = { Id: data.Id, Title: data.Title };
  }

  public async Get_Attachments(id: number) {
    // Get: attachments data
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items(" + id + ")/" +
      Columns_SharePoint.AttachmentFiles);

    // Process: attachments data
    const data: IList_Attachment[] = response.data.value;
    data.map((file: IList_Attachment) => {
      const _file: IFile = {
        uploaded: { FileName: file.FileName, ServerRelativeUrl: file.ServerRelativeUrl },
        __deleted: false
      };
      fields.notification_attachments.value.push(_file);
    });
  }

  public async Get_Questionnaire(id: number) {
    // Get: questionnaire data
    const reponse = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questionnaire + "')/items(" + id + ")" +
      "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Title + "," +
      Columns_Questionnaire_List.Year + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Name + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Title + "," +
      Columns_Questionnaire_List.EmailTemplates + "/" + Columns_SharePoint.Id +
      "&$expand=" +
      Columns_SharePoint.Author + "," +
      Columns_Questionnaire_List.EmailTemplates);
     
    // Process: questionnaire data          
    const data = reponse.data;
    if (data[Columns_SharePoint.Author]) {
      const auth: IPerson = data[Columns_SharePoint.Author];
      fields.questionnaire_author.value = { Id: auth.Id, Title: auth.Title };
    }
    if (data[Columns_SharePoint.Id]) fields.questionnaire_id.value = data[Columns_SharePoint.Id];
    if (data[Columns_SharePoint.Title]) fields.questionnaire_title.value = data[Columns_SharePoint.Title];
    if (data[Columns_Questionnaire_List.Status]) fields.questionnaire_status.value = data[Columns_Questionnaire_List.Status];
    if (data[Columns_Questionnaire_List.EmailTemplates]) fields.questionnaire_year.value = data[Columns_Questionnaire_List.Year];

    let email_template_ids = [];
    if (data[Columns_Questionnaire_List.EmailTemplates]) {
      email_template_ids = data[Columns_Questionnaire_List.EmailTemplates].map(v => v.Id);
    }
    // return data fragment required by subsequent async functions
    return email_template_ids;
  }

  public async Get_Notification(id: number) {
    // Get: notification data
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items(" + id + ")" +
      "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Name + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Title + "," +
      Columns_Notification_List.Body + "," +
      Columns_Notification_List.Subject + "," +
      Columns_Notification_List.NotificationSendTo + "," +
      Columns_Notification_List.SendEmail + "," +
      Columns_Notification_List.Status + "," +
      Columns_Notification_List.Others + "," +
      Columns_Notification_List.CallToActionText + "," +
      Columns_Notification_List.Questionnaire + "/" + Columns_SharePoint.Id +
      "&$expand=" +
      Columns_SharePoint.Author + "," +      
      Columns_Notification_List.Questionnaire);

    // Process: notification data
    const data = response.data; 
    if (data[Columns_SharePoint.Id]) fields.notification_id.value = data[Columns_SharePoint.Id];
    if (data[Columns_Notification_List.Subject]) fields.notification_subject.value = data[Columns_Notification_List.Subject];
    if (data[Columns_Notification_List.Body]) fields.notification_body.value = data[Columns_Notification_List.Body];
    if (data[Columns_Notification_List.CallToActionText]) fields.notification_call_to_action.value = data[Columns_Notification_List.CallToActionText];

    if (data[Columns_Notification_List.Others]) fields.notification_others.value = data[Columns_Notification_List.Others];
    if (data[Columns_SharePoint.Author]) {
      const auth: IPerson = data[Columns_SharePoint.Author]; fields.notification_author.value = { Id: auth.Id, Title: auth.Title };
    }
    if (data[Columns_Notification_List.Questionnaire]) fields.questionnaire_id.value = data[Columns_Notification_List.Questionnaire][Columns_SharePoint.Id];
    if (data[Columns_Notification_List.NotificationSendTo]) fields.notification_send_to.value = data[Columns_Notification_List.NotificationSendTo];
    if (data[Columns_Notification_List.Status]) fields.notification_status.value = data[Columns_Notification_List.Status];

    // Return data fragment required by subsequent async functions
    return fields.questionnaire_id.value; 
  }

  public async Get_Email_Templates(ids : number[]) {
    // Reset dropdown
    this.email_templates.length = 0;

    // Get: email templates data
    await Promise.all(
      ids.map(async (id) => {
        const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Email_Templates + "')/items(" + id + ")" +
          "?$select=" +
          Columns_SharePoint.Id + "," +
          Columns_SharePoint.Title + "," +
          Columns_Email_Template_List.Subject + "," +
          Columns_Email_Template_List.Body + "," +
          Columns_Email_Template_List.CallToActionText);

        // Process: email template data
        const data: IEmail_Template = response.data;
        const option: IEmail_Template = {
          Id: data[Columns_SharePoint.Id],
          Title: data[Columns_SharePoint.Title],
          Subject: data[Columns_Email_Template_List.Subject],
          Body: data[Columns_Email_Template_List.Body],
          CallToActionText: data[Columns_Email_Template_List.CallToActionText]
        };
        this.email_templates.push(option);
      })
    );
  }

  public async Update_Notification_Status(id: number, is_submit: boolean) {
    // make sure this function is executed after attachments are saved
    if (is_submit) {
      const url = this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items(" + id + ")";
      const data = {
        [Columns_Notification_List.SendEmail]: true, // triggers notification workflow
        [Columns_Notification_List.Status]: Notification_Status.In_Progress
      };
      await Post(url, this.web_url, "merge", data, true);      
    }
  }

  public async Save_Attachments(id: number, attachments: IFile[]) {
    const attachments_new = attachments.filter(file => file.native && !file.__deleted);
    const attachments_marked_delete = attachments.filter(file => file.uploaded && file.__deleted);
    const attachments_endpoint = this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items(" + id + ")/" + Columns_SharePoint.AttachmentFiles;

    await Promise.all(attachments_marked_delete.map(async (attachment) => {
      const _attachment = attachment.uploaded;
      await Post(attachments_endpoint + "/getByFileName('" + _attachment.FileName + "') ", this.web_url, "delete");
    }));

    await Promise.all(attachments_new.map(async (attachment) => {
      await new Promise((resolve) => {
        const _attachment = attachment.native;
        const reader = new FileReader();
        reader.readAsArrayBuffer(_attachment);
        reader.onload = () => {
          const data = reader.result;
          resolve(Post(attachments_endpoint + "/add(FileName = '" + _attachment.name + "')", this.web_url, "post", data, false));
        };       
      });
    }));    
  }

  public async Create_Notification(id: number, e: FormikValues) {
    let url = this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items";
    url = id ? url + "(" + id + ")" : url;
    let method = id ? "merge" : "post";

    const data = {
      [Columns_SharePoint.Title]: "Notification",
      [Columns_Notification_List.Subject]: e[fields.notification_subject.key],
      [Columns_Notification_List.CallToActionText]: e[fields.notification_call_to_action.key],
      [Columns_Notification_List.Body]: e[fields.notification_body.key],
      [Columns_Notification_List.Others]: e[fields.notification_others.key],
      [Columns_Notification_List.Questionnaire + Columns_SharePoint.Id]: e[fields.questionnaire_id.key],
      [Columns_Notification_List.NotificationSendTo]: e[fields.notification_send_to.key],
      [Columns_Notification_List.Status]: Notification_Status.Draft,
      [Columns_Notification_List.SendEmail]: false
    };
    const response = await Post(url, this.web_url, method, data, true);
    return response.data[Columns_SharePoint.Id];
  }

  public On_Change(target: string) {
    switch (target) {
      case fields.notification_template.key: {
        this.Copy_From_Email_Template();
        break;
      }
    }
  }

  public On_Submit(e: FormikValues) {
    let notification_id = e[fields.notification_id.key];
    const attachments: IFile[] = e[fields.notification_attachments.key];
    
    (async () => {
      notification_id = await this.Create_Notification(notification_id, e);      
      await this.Save_Attachments(notification_id, attachments);
      await this.Update_Notification_Status(notification_id, this.is_submit);
      await this.form.setFieldValue(fields.__submitted.key, true);
      this.Close_App();
    })().catch((err) => {
      Exception(err, App_Title_Questionnaire_Notification, this.web_url, this.Set_Error_State);      
    });
  }

  public Set_Error_State(err?) {
    if (err && err.request) {
      switch (err.request.status) {
        case 401: {
          this.setState({ app_state: App_State.UnAuthorized });
          break;
        }
        case 403: {
          this.setState({ app_state: App_State.UnAuthorized });
          break;
        }
        case 404: {
          this.setState({ app_state: App_State.Not_Found });
          break;
        }
        default: {
          this.setState({ app_state: App_State.Error });
        }
      }
    }
    else {
      this.setState({ app_state: App_State.Error });
    }
  }

  public Copy_From_Email_Template() {
    const selected_template = Number(getIn(this.values, fields.notification_template.key));
    const template = this.email_templates.filter((item: IEmail_Template) => { return item.Id === selected_template; });
    if (template.length === 1) {
      const _template: IEmail_Template = template[0];
      this.form.setFieldValue(fields.notification_subject.key, _template.Subject);
      this.form.setFieldValue(fields.notification_body.key, _template.Body);
      this.form.setFieldValue(fields.notification_call_to_action.key, _template.CallToActionText);
    }
  }

  public Is_Disable_Form(): boolean {
    let is_disabled = false;
    is_disabled = this.is_submitting ? true : is_disabled;
    is_disabled = this.values[fields.notification_status.key] !== Notification_Status.Draft ? true : is_disabled;
    is_disabled = !this.values[fields.notification_id.key] && !this.values[fields.questionnaire_id.key] ? true : is_disabled;    
    return is_disabled;
  }

  public Is_Disable_Field(key: string): boolean {
    let is_disabled = false;
    if (fields[key]) {
      const field_props: IField = fields[key];
      switch (key) {
        // Field Specific Rules
        case fields.notification_others.key: {
          const send_to = getIn(this.values, fields.notification_send_to.key);
          is_disabled = send_to !== Notification_Send_To.Others ? true : is_disabled;
          break;
        }
      }
      // Disable field if the entire form is suppose to be disabled
      is_disabled = this.is_disable_form;      
    }
    return is_disabled;
  }

  public Is_Display_Field(key: string) : boolean {
    let is_display = true;
    if (fields[key]) {
      switch (key) {
        case fields.notification_others.key: {
          const send_to = getIn(this.values, fields.notification_send_to.key);
          is_display = send_to !== Notification_Send_To.Others ? false : is_display;
          break;
        }
      }
    }
    return is_display;
  }

  public Init_Values(): FormikValues {
    const values = {};
    Object.keys(fields).forEach(key => {
      const field: {key: string, value: any} = fields[key];
      if (key === field.key) {
        values[field.key] = field.value;
      }
    });
    return values;
  }

  public Close_App(no_delay?: boolean) {
    setTimeout(() => {
      window.location.href = this.src_url ? this.src_url : this.web_url;
    }, no_delay ? 0 : 1500);
  }

  public componentDidMount() {
    if (this.state.app_state === App_State.Pre_Rendering) {
      (async () => {
        // Get URL parameters
        const notification_id_param = parseInt(this.url_params[URL_Parameters.Notification_Id]);
        const questionnaire_id_param = parseInt(this.url_params[URL_Parameters.Questionnaire_Id]);

        await this.Get_Current_User();
        if (notification_id_param) {
          const questionnaire_id = await this.Get_Notification(notification_id_param);
          await Promise.all(
            [
              this.Get_Attachments(notification_id_param),
              this.Get_Email_Templates(
                await this.Get_Questionnaire(questionnaire_id)
              )
            ]
          );
        }
        else if (questionnaire_id_param) {
          await this.Get_Email_Templates(
            await this.Get_Questionnaire(questionnaire_id_param)
          );
        }
        this.setState({ app_state: App_State.Pre_Render_Complete });
      })().catch((err) => {
        Exception(err, App_Title_Questionnaire_Notification, this.web_url, this.Set_Error_State);        
      });
    }
  }

  public render() {
    switch (this.state.app_state) {
      case App_State.Pre_Render_Complete: {
        return (
          <Formik
            validateOnChange={true}
            validateOnBlur={true}
            validationSchema={validation}
            enableReinitialize={false}
            onSubmit={(e) => { this.On_Submit(e); }}
            initialValues={this.Init_Values()}
            ref={(e) => { this.form = e; }}
            render={({ values, errors, isSubmitting, submitForm }) => {
              // set render props
              this.values = values; 
              this.is_submitting = isSubmitting;
              this.is_disable_form = this.Is_Disable_Form();
              this.is_form_invalid = Object.keys(errors).length > 0;
              const is_submitted = getIn(this.values, fields.__submitted.key);

              return (
                <div className={styles.app}>
                  <Form>
                    <div className={styles.grid}>
                      <div className={styles.row}>
                        <div className={styles.col_8}>
                          <div className={styles.title}>
                            {App_Title_Questionnaire_Notification}
                          </div>
                        </div>
                      </div>
                      {
                        this.Render_Fields()
                      }
                      {
                        this.is_form_invalid ?
                          <div className={styles.row}>
                            <div className={styles.col_8}>
                              <div className={styles.error}>{User_Message_Invalid_Form}</div>
                            </div>
                          </div> : null
                      }
                      {
                        this.is_submitting && !is_submitted ?
                          <div className={styles.row}>
                            <div className={styles.col_8}>
                              <div className={styles.warning}>{User_Message_Saving}</div>
                            </div>
                          </div> : null
                      }
                      {
                        is_submitted ?
                          <div className={styles.row}>
                            <div className={styles.col_8}>
                              <div className={styles.success}>{User_Message_Saved}</div>
                            </div>
                          </div> : null
                      }
                      <div className={styles.row}>
                        <div className={styles.col_8}>
                          <PrimaryButton className={styles.button} iconProps={this.back_icon} disabled={isSubmitting} onClick={() => { this.Close_App(true); }}>Go Back</PrimaryButton>
                          {
                            this.values[fields.notification_status.key] !== Notification_Status.Sent ?
                              <PrimaryButton className={styles.button} disabled={this.is_disable_form || isSubmitting || this.is_form_invalid} iconProps={this.save_icon} onClick={() => { this.is_submit = false; submitForm(); }}>Draft</PrimaryButton> : null
                          }
                          {
                            this.values[fields.notification_status.key] !== Notification_Status.Sent ?
                              <PrimaryButton className={styles.button} iconProps={this.send_icon} disabled={this.is_disable_form || this.is_submitting || this.is_form_invalid} onClick={() => { this.is_submit = true; submitForm(); }}>Send</PrimaryButton> : null
                          }
                        </div>
                      </div>
                    </div>
                  </Form>
                  {
                    this.url_params[URL_Parameters.Debug] ?
                      <div className={styles.grid}>
                        <pre>
                          {JSON.stringify(values, null, 2)}
                        </pre>
                        <pre>
                          {JSON.stringify(errors, null, 2)}
                        </pre>
                      </div> : null
                  }
                </div>
              );
            }}
          />
        );
      }
      case App_State.Pre_Rendering: {
        return (
          <div>{User_Message_App_Loading}</div>
        );
      }
      case App_State.UnAuthorized: {
        return (
          <div className={styles.app}>
            <div className={styles.row}>
              <div className={styles.col_12}>
                <div className={styles.error}>{User_Message_UnAuthorized}</div>
              </div>
            </div>
          </div>
        );
      }
      case App_State.Not_Found: {
        return (
          <div className={styles.app}>
            <div className={styles.row}>
              <div className={styles.col_12}>
                <div className={styles.error}>{User_Message_Not_Found}</div>
              </div>
            </div>
          </div>
        );
      }
      case App_State.Error: {
        return (
          <div className={styles.row}>
            <div className={styles.col_8}>
              <div className={styles.error}>{User_Message_Error}</div>
            </div>
          </div>
        );
      }
      default: {
        return null;
      }
    }
  }
}

export default Main;
