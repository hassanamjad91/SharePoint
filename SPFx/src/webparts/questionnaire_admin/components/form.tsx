import * as React from 'react';
import { Fragment } from 'react';
import { EnvironmentType } from '@microsoft/sp-core-library';
import styles from '../styles/style.module.scss';
import { fields } from './fields';
import validation from './validation';
import { Input_Type, App_State } from '../../../enums';
import { Exception, Get, Post, Url_Params } from '../../../helpers';
import { IWebpart, IField, IUrl, ILookup, IPerson, IUserSubmission, INotification } from '../../../interfaces';
import { Formik, Form, Field, getIn, FormikValues } from 'formik';
import { TextField, Label, IIconProps, Separator, Fabric, ActionButton } from 'office-ui-fabric-react/lib';
import { IDropdownOption, Dropdown, SelectionMode, DetailsListLayoutMode, IColumn, DetailsList } from 'office-ui-fabric-react/lib';
import { CommandBar, ICommandBarItemProps, ChoiceGroup, IChoiceGroupOption } from 'office-ui-fabric-react/lib';
import { PeoplePicker, PrincipalType, IPeoplePickerUserItem } from '@pnp/spfx-controls-react/lib/PeoplePicker';

import {
  SP_Rest_Proxy,
  App_Title_CNDS_Dashboard,
  List_Title_User_Submission,
  List_Title_Questionnaire,
  List_Title_Send_Notification,
  List_URI_Dist_List,
  List_URI_Logs,
  List_URI_Email_Templates,
  Path_Questionnaire_Designer_App,
  Path_Questionnaire_Notification_App,    
  Columns_SharePoint,
  Columns_Notification_List,
  Columns_Questionnaire_List,
  Columns_User_Submissions_List,
  URL_Parameters,
  User_Message_App_Loading,
  User_Message_Invalid_Form,
  User_Message_Error,
  User_Message_UnAuthorized,
  User_Message_Not_Found  
} from '../../../constants';

class Main extends React.Component<IWebpart, {}> {

  public state = {
    app_state: App_State.Pre_Rendering
  };

  // render props - these props will be set at render time
  public form: Formik;
  public values: FormikValues = {};
  public is_submitting = false;
  public is_disable_form = false;
  public is_form_invalid = false;
  public poeple_input_ref = React.createRef<HTMLInputElement>();

  // static props
  public url_params = Url_Params();
  public user: IPerson = { Id: 0, Title: "" };
  public questionnaires: ILookup[] = [];
  public web_url = this.props.env_type === EnvironmentType.Local || this.props.env_type === EnvironmentType.Test ? SP_Rest_Proxy : this.context.pageContext.site.absoluteUrl;  

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
            
            // Return null if field is not found in fieds obj
            if (!fields[field.key]) return null;
            // Return null if field is set to hidden
            if (!display) return null;
           
            switch (field.type) {
              case Input_Type.Text: {
                // This field can handle types: IPerson and ILookup in readonly mode
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
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => { handleChange(event); this.On_Change(field.key); }}
                    />
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
                      options.push({ key: _option.Id, text: _option.Title });
                    });
                  }
                  else {
                    field.options.forEach((option) => { options.push({ key: option, text: option }); });
                  }
                }
                field.value = !field.value ? "" : field.value;
                const get_title = () => {
                  let title = field.value;
                  if (typeof (field.options[0]) === "object") {
                    const matched_option: ILookup = field.options.find((option: ILookup) => option.Id === field.value);
                    title = matched_option !== undefined ? matched_option.Title : "";
                  }
                  return title;
                };
                const style = { dropdown: { border: invalid ? "1px solid #ff4a5a" : "inherit" } };
                return (
                  options.length ?
                    <div className={field.class ? field.class : styles.col_12}>
                      {field.label ? <Label>{field.label}</Label> : null}
                      <Dropdown
                        {..._props}
                        styles={style}
                        title={get_title()}
                        disabled={disabled}
                        options={options}
                        selectedKey={field.value}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>, option: IDropdownOption) => {
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
                        {...props}
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
                        context={this.context}
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
    const section_head = (heading: string) => {
      return (
        <div className={styles.col_12}>
          <div className={styles.subTitle} style={{ padding: "0" }}>{heading}</div>
          <Separator styles={{ root: { lineHeight: "1px" } }} />
        </div>
      );
    };    
    return (
      <div className={styles.row}>
        <div className={styles.row}>
          <div className={styles.col_12}>
            {this.Render_Command_Bar()}
          </div>
          <div className={styles.col_12}>
            {this.Field({ key: fields.questionnaire_id.key, value: this.values[fields.questionnaire_id.key], type: Input_Type.Dropdown, label: fields.questionnaire_id.label, class: styles.col_6, options: this.questionnaires })}
            {this.Field({ key: fields.questionnaire_author.key, value: this.values[fields.questionnaire_author.key], type: Input_Type.Text, label: fields.questionnaire_author.label, class: styles.col_2, readonly: true })}
            {this.Field({ key: fields.questionnaire_status.key, value: this.values[fields.questionnaire_status.key], type: Input_Type.Radio, label: fields.questionnaire_status.label, class: styles.col_4 })}
          </div>
          <div className={styles.col_6}>
            {section_head(fields.user_submissions.label)}
            {this.Render_User_Submissions()}
          </div>
          <div className={styles.col_6}>
            {section_head(fields.notifications.label)}
            {this.Render_Notifications()}
          </div>
        </div>
        <div className={styles.row}>
          <div className={styles.col_6}>
          </div>
        </div>
      </div>
    );
  }

  public Render_Command_Bar() {
    const add: IIconProps = { iconName: "Add" };
    const mail: IIconProps = { iconName: "Mail" };
    const mail_options: IIconProps = { iconName: "MailOptions" };
    const dist_list: IIconProps = { iconName: "ContactList" };
    const edit: IIconProps = { iconName: "Edit" };
    const view: IIconProps = { iconName: "View" };
    const logs: IIconProps = { iconName: "BacklogList" };    
    const answers_list: IUrl = getIn(this.values, fields.questionnaire_answer_list.key);
    
    const items: ICommandBarItemProps[] = [
      {
        key: "new_questionnaire",
        text: "New Questionnaire",
        iconProps: add,
        href: Path_Questionnaire_Designer_App
      },
      {
        key: "edit_in_designer",
        text: "Edit In Designer",
        iconProps: edit,
        disabled: this.is_disable_form,
        href: Path_Questionnaire_Designer_App + "?" + URL_Parameters.Questionnaire_Id + "=" + getIn(this.values, fields.questionnaire_id.key) + "&" + URL_Parameters.Source + "=" + window.location.href,
        target: "_blank",
        ["data-interception"]: "off"
      },
      {
        key: "send_notification",
        text: "Send Notification",
        iconProps: mail,
        disabled: this.is_disable_form,
        href: Path_Questionnaire_Notification_App + "?" + URL_Parameters.Questionnaire_Id + "=" + getIn(this.values, fields.questionnaire_id.key) + "&" + URL_Parameters.Source + "=" + window.location.href
      },
      {
        key: "view_submissions",
        text: "View Submissions",
        iconProps: view,
        disabled: this.is_disable_form,
        href: answers_list.url ? this.web_url + "/lists/" + answers_list.url : "javascript:void(0);",
        target: "_blank",
        ["data-interception"]: "off"
      },
      {
        key: "email_template",
        text: "Email Templates",
        iconProps: mail_options,
        href: this.web_url + "/lists/" + List_URI_Email_Templates,
        target: "_blank",
        ["data-interception"]: "off"
      },
      {
        key: "dist_list",
        text: "Distribution Lists",
        iconProps: dist_list,
        href: this.web_url + "/lists/" + List_URI_Dist_List,
        target: "_blank",
        ["data-interception"]: "off"
      },
      {
        key: "logs",
        text: "Logs",
        iconProps: logs,
        href: this.web_url + "/lists/" + List_URI_Logs,
        target: "_blank",
        ["data-interception"]: "off"
      }
    ];
    return (
      <CommandBar className={styles.command_bar} items={items} />
    );
  }

  public Render_User_Submissions() {
    
    const columns: IColumn[] = [
      { key: "name", name: "Name", fieldName: Columns_User_Submissions_List.Submitter, minWidth: 50, maxWidth: 150, isResizable: true, onRender: (e: IUserSubmission) => (e.Submitter.Title) },
      { key: "email", name: "Email", fieldName: Columns_User_Submissions_List.Submitter, minWidth: 50, maxWidth: 150, isResizable: true, onRender: (e: IUserSubmission) => (e.Submitter.EMail) },
      { key: "status", name: "Status", fieldName: Columns_User_Submissions_List.Status, minWidth: 50, maxWidth: 60, isResizable: true }
    ];

    let items :IUserSubmission[] = getIn(this.values, fields.user_submissions.key);
    items = items && items.length ? items : [];

    return (
      <div className={styles.col_12}>
        <Fabric style={{ maxHeight: "300px", overflow: "auto" }}>
          <DetailsList
            compact={false}
            columns={columns}
            items={items}
            selectionMode={SelectionMode.none}
            setKey="none"
            layoutMode={DetailsListLayoutMode.justified}
            isHeaderVisible={true}
            // disables chunked loading
            onShouldVirtualize={() => false}
          />
        </Fabric>
      </div>
    );
  }
  
  public Render_Notifications() {
    const open: IIconProps = { iconName: "OpenInNewWindow" };

    const columns: IColumn[] = [
      // Make sure fieldName prop exists in INotification
      { key: "sent_to", name: "Sent To", fieldName: Columns_Notification_List.NotificationSendTo, minWidth: 50, maxWidth: 100, isResizable: true },
      { key: "created", name: "Created", fieldName: Columns_SharePoint.Created, minWidth: 80, maxWidth: 80, isResizable: true, onRender: (e: string) => new Date(e[Columns_SharePoint.Created]).toLocaleString()},
      { key: "status", name: "Status", fieldName: Columns_Notification_List.Status, minWidth: 50, maxWidth: 50, isResizable: true },
      {
        key: "id", name: "", fieldName: Columns_SharePoint.Id, minWidth: 50, maxWidth: 50, isResizable: true,
        onRender: (e: INotification) => (
          <ActionButton allowDisabledFocus style={{ height: 20, verticalAlign: "middle" }} text="Open"
            href={Path_Questionnaire_Notification_App + "?" + URL_Parameters.Notification_Id + "=" + e.Id + "&" + URL_Parameters.Source + "=" + window.location.href}
            target="_blank" data-interception="off" iconProps={open} disabled={this.is_disable_form}
          />
        )
      }
    ];

    let items: INotification[] = getIn(this.values, fields.notifications.key);
    items = items && items.length ? items : [];
    
    return (
      <div className={styles.col_12}>
        <Fabric style={{ maxHeight: "300px", overflow: "auto" }}>
          {(
            <DetailsList
              compact={false}
              columns={columns}
              items={items}
              selectionMode={SelectionMode.none}
              setKey="none"
              layoutMode={DetailsListLayoutMode.justified}
              isHeaderVisible={true}
              // disables chunked loading
              onShouldVirtualize={() => false}
            />
          )}
        </Fabric>
      </div>
    );
  }

  public async Get_Current_User() {
    // Get: current user data
    const response = await Get(this.web_url + "/_api/web/currentuser");

    // Process: current user data
    const data: IPerson = response.data;
    this.user = { Id: data.Id, Title: data.Title };
  }

  public async Get_Questionnaire(q_id: number) {    
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questionnaire + "')/items(" + q_id + ")" +
      "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Title + "," +
      Columns_Questionnaire_List.AnswersListTitle + "," +
      Columns_Questionnaire_List.AnswersListUrl + "," +
      Columns_Questionnaire_List.Status + "," +
      Columns_Questionnaire_List.Year +
      "&$expand=" +
      Columns_SharePoint.Author
    );

    const data = response.data;
    if (data[Columns_SharePoint.Author]) {
      const auth: IPerson = data[Columns_SharePoint.Author];
      fields.questionnaire_author.value = { Id: auth.Id, Title: auth.Title };
    }
    this.form.setFieldValue(fields.questionnaire_author.key, data[Columns_SharePoint.Author] ? data[Columns_SharePoint.Author] : "");
    this.form.setFieldValue(fields.questionnaire_status.key, data[Columns_Questionnaire_List.Status] ? data[Columns_Questionnaire_List.Status] : "");
    const answers_list: IUrl = {
      title: data[Columns_Questionnaire_List.AnswersListTitle] ? data[Columns_Questionnaire_List.AnswersListTitle] : "",
      url: data[Columns_Questionnaire_List.AnswersListUrl] ? data[Columns_Questionnaire_List.AnswersListUrl] : ""
    };
    this.form.setFieldValue(fields.questionnaire_answer_list.key, answers_list);
  }

  public async Get_Questionnaire_Notifications(q_id: number) {   
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Send_Notification + "')/items" +
      "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Created + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Title + "," +
      Columns_Notification_List.NotificationSendTo + "," +
      Columns_Notification_List.Status + "," +
      Columns_Notification_List.Questionnaire + "/" + Columns_SharePoint.Id +
      "&$expand=" +
      Columns_SharePoint.Author + "," +
      Columns_Notification_List.Questionnaire +
      "&$filter=" +
      Columns_Notification_List.Questionnaire + " eq " + q_id +
      "&$top=5000"
    );
    const data: INotification[] = response.data.value;    
    this.form.setFieldValue(fields.notifications.key,
      data.map((item: INotification): INotification => {
        return { Id: item.Id, Created: item.Created, Author: item.Author, NotificationSendTo: item.NotificationSendTo, Status: item.Status };
      })
    );      
  }

  public async Get_Questionnaire_Submission_Tasks(q_id: number) {
    
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_User_Submission + "')/items" + "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Created + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Id + "," +
      Columns_SharePoint.Author + "/" + Columns_SharePoint.Title + "," +
      Columns_User_Submissions_List.Status + "," +
      Columns_User_Submissions_List.Submitter + "/" + Columns_SharePoint.Id + "," +
      Columns_User_Submissions_List.Submitter + "/" + Columns_SharePoint.Title + "," +
      Columns_User_Submissions_List.Submitter + "/" + Columns_SharePoint.EMail + "," +
      Columns_User_Submissions_List.Questionnaire + "/" + Columns_SharePoint.Id +
      "&$expand=" +
      Columns_User_Submissions_List.Submitter + "," +
      Columns_User_Submissions_List.Questionnaire + "," +
      Columns_SharePoint.Author +
      "&$filter=" +
      Columns_User_Submissions_List.Questionnaire + " eq " + q_id +
      "&$top=5000"
    );
    const data: IUserSubmission[] = response.data.value;
    this.form.setFieldValue(fields.user_submissions.key,
      data.map((item: IUserSubmission): IUserSubmission => {
        return { Id: item.Id, Created: item.Created, Author: item.Author, Status: item.Status, Submitter: item.Submitter };
      })
    );
  }

  public async Get_Questionnaires() {
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questionnaire + "')/items" +
      "?$select=" +
      Columns_SharePoint.Id + "," +
      Columns_SharePoint.Title +
      "&$orderBy=" +
      Columns_SharePoint.Title +
      "&$top=5000"
    );
    const data: ILookup[] = response.data.value;
    this.questionnaires.length = 0;
    this.questionnaires.push(...data);
  }

  public Update_Questionnaire_Status(q_id: number, status: string) {
    (async () => {
      this.form.setSubmitting(true);
      const data = {
        [Columns_Questionnaire_List.Status]: status
      };
      await Post(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questionnaire + "')/items(" + q_id + ")", this.web_url, "merge", data);
      this.form.setSubmitting(false);
    })().catch((err) => {
      Exception(err, App_Title_CNDS_Dashboard, this.web_url, this.Set_Error_State);      
    });    
  }

  public Get_Questionnaire_Detail(q_id: number) {    
    (async () => {
      this.form.setSubmitting(true);
      await this.form.setFieldValue(fields.notifications.key, []);
      await this.form.setFieldValue(fields.user_submissions.key, []);
      await Promise.all(
        [
          this.form.setFieldValue(fields.notifications.key, []),
          this.form.setFieldValue(fields.user_submissions.key, [])          
        ]
      );
      await Promise.all(
        [
          this.Get_Questionnaire(q_id),
          this.Get_Questionnaire_Notifications(q_id),
          this.Get_Questionnaire_Submission_Tasks(q_id)          
        ]
      );
      this.form.setSubmitting(false);
    })().catch((err) => {
      Exception(err, App_Title_CNDS_Dashboard, this.web_url, this.Set_Error_State);
    });
  }

  public On_Change(target: string) {
    if (fields[target]) {
      switch (target) {
        case fields.questionnaire_id.key: {
          this.Get_Questionnaire_Detail(this.values[fields.questionnaire_id.key]);
          break;
        }
        case fields.questionnaire_status.key: {
          this.Update_Questionnaire_Status(
            this.values[fields.questionnaire_id.key],
            this.values[fields.questionnaire_status.key]
          );
          break;
        }
      }
    }
  }
  
  public On_Submit(e: FormikValues) {
    // This form does not have submission.
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

  public Is_Disable_Form(): boolean {
    let is_disabled = false;
    is_disabled = this.is_submitting ? true : is_disabled;
    return is_disabled;
  }

  public Is_Disable_Field(field_key: string): boolean {
    let is_disabled = false;
    if (field_key) {
      switch (field_key) {
        // field specific rules
        case "": {
          break;
        }
      }
    }
    // check if entire form is disabled
    is_disabled = this.is_disable_form ? true : is_disabled;

    // Disable if questionnaire is not selected
    if (field_key !== fields.questionnaire_id.key) {
      is_disabled = !this.values[fields.questionnaire_id.key] ? true : is_disabled;
    }
    return is_disabled;
  }

  public Is_Display_Field(field_key: string): boolean {
    let is_display = true;
    if (field_key) {
      switch (field_key) {
        // field specific rules
        case "": {
          break;
        }
      }
    }
    return is_display;
  }

  public Init_Values() {
    let values = {};
    Object.keys(fields).forEach(key => {
      let field: { key: string, value: any } = fields[key];
      if (key === field.key) {
        values[field.key] = field.value;
      }
    });
    return values;
  }

  public componentDidMount() {
    if (this.state.app_state === App_State.Pre_Rendering) {
      (async () => {
        await this.Get_Current_User();
        await this.Get_Questionnaires();
        this.setState({ app_state: App_State.Pre_Render_Complete });
      })().catch((err) => {
        Exception(err, App_Title_CNDS_Dashboard, this.web_url, this.Set_Error_State);        
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
            onSubmit={this.On_Submit}
            initialValues={this.Init_Values()}
            ref={(e) => { this.form = e; }}
            render={({ values, errors, isSubmitting }) => {
              // set render props
              this.values = values;
              this.is_submitting = isSubmitting;
              this.is_disable_form = this.Is_Disable_Form();
              this.is_form_invalid = Object.keys(errors).length ? true : false;

              return (
                <div className={styles.app}>
                  <Form>
                    <div className={styles.grid}>
                      <div className={styles.row}>
                        <div className={styles.col_12}>
                          <div className={styles.title}>
                            {App_Title_CNDS_Dashboard}
                          </div>
                        </div>
                      </div>
                      {
                        this.Render_Fields()
                      }
                      {
                        this.is_form_invalid ?
                          <div className={styles.row}>
                            <div className={styles.col_12}>
                              <div className={styles.error}>{User_Message_Invalid_Form}</div>
                            </div>
                          </div> : null
                      }
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
            <div className={styles.col_12}>
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
