import * as React from 'react';
import { Fragment } from 'react';
import styles from '../styles/style.module.scss';
import { EnvironmentType } from '@microsoft/sp-core-library';
import validation from './validation';
import * as fields from './fields';
import { App_State, Task_Status, Question_Type } from '../../../enums';
import { Get, Post, Url_Params, Key_Value_Pair, Exception } from '../../../helpers';
import { IWebpart, IQuestion_Field, IPerson, ILookup } from '../../../interfaces';
import { TextField, Toggle, Label, Separator, PrimaryButton } from 'office-ui-fabric-react/lib';
import { ChoiceGroup, IChoiceGroupOption, Dropdown, IDropdownOption } from 'office-ui-fabric-react/lib';
import { getIconClassName } from '@uifabric/styling';
import { Formik, Form, Field, FieldArray, getIn, FormikValues } from 'formik';
import * as strings from 'questionnaire-form-locale';

import {
  SP_Rest_Proxy,
  App_Title_Questionnaire_Form,
  List_Title_User_Submission,
  List_Title_Questionnaire,
  List_Title_Questions,
  URL_Parameters,
  User_Message_App_Loading,
  User_Message_Invalid_Form,
  User_Message_Questions_Not_Found,
  User_Message_Saving,
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
  public is_submitting: boolean = false;
  public is_form_invalid: boolean = false;
  public is_disable_form: boolean = false;

  // static props
  public url_params = Url_Params();
  public src_url = this.url_params[URL_Parameters.Source];
  public check_icon = "SkypeCircleCheck";
  public user: IPerson = { Id: 0, Title: "" };
  public web_url = this.props.env_type === EnvironmentType.Local || this.props.env_type === EnvironmentType.Test ? SP_Rest_Proxy : this.props.context.pageContext.site.absoluteUrl;  

  public Question(field: IQuestion_Field) {
    return (
      <Fragment key={field.key}>
        <Field
          name={field.key}
          value={field.value}
          render={(props) => {
            const { _props } = props;
            const { errors, handleChange } = props.form;
            let disabled = this.Is_Disable_Field(field.key);
            const display = this.Is_Display_Field(field.key);
            const invalid = getIn(errors, field.key) ? true : false;
            const invalid_class = invalid ? styles.invalid : "";
            const disabled_class = disabled ? styles.disabled : "";
            const label = field.label ? field.label.indexOf("\n") !== -1 || field.label.indexOf("\r") !== -1 ?
              <TextField
                borderless={true}
                style={{ paddingLeft: "0", paddingRight: "0" }}
                allowFullScreen={true}
                autoAdjustHeight={true}
                resizable={false}
                readOnly={true}
                multiline={true}
                value={field.label}
              /> :
              <Label>{field.label}</Label> : null;

            switch (field.type) {
              case Question_Type.Text: {
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
                    {label}
                    <TextField
                      {..._props}
                      value={field.value}
                      type={field.type}
                      disabled={disabled}
                      className={[invalid_class, disabled_class].join(" ").trim()}
                      onChange={(e) => {
                        handleChange(e);
                        this.On_Change(field.key);
                      }}
                    />
                  </div>
                );
              }
              case Question_Type.Note: {
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {label}
                    <TextField
                      {..._props}
                      value={field.value}
                      type={field.type}
                      disabled={disabled}
                      multiline={true}
                      className={[invalid_class, disabled_class].join(" ").trim()}                      
                      onChange={(e) => {
                        handleChange(e);
                        this.On_Change(field.key);
                      }}
                    />
                  </div>
                );
              }
              case Question_Type.Radio: {
                let options: IChoiceGroupOption[] = [];
                field.options ? field.options.map((v) => { options.push({ key: v, text: v }); }) : options = [];
                let orientation = options.length < 3 ? "horizontal" : "vertical";
                let style = { flexContainer: { selectors: {} } };
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
                      {label}
                      <ChoiceGroup
                        {..._props}
                        disabled={disabled}
                        defaultSelectedKey={field.value}
                        options={options}
                        styles={style} onChange={(e, option: IChoiceGroupOption) => {
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
              case Question_Type.Dropdown: {
                let options: IDropdownOption[] = [{ key: "", text: "Select an option", disabled: true }];
                field.options ? field.options.forEach((v) => { options.push({ key: v, text: v }); }) : options = [];
                const style = { dropdown: { border: invalid ? "1px solid #ff4a5a" : "inherit" } };
                return (
                  options.length ?
                    <div className={field.class ? field.class : styles.col_12}>
                      {label}
                      <Dropdown
                        {..._props}
                        disabled={disabled}
                        options={options}
                        selectedKey={field.value}
                        styles={style} onChange={(e, option: IDropdownOption) => {
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
              case Question_Type.Toggle: {
                field.value = field.value === "Yes" ? true : false;
                return (
                  <div className={field.class ? field.class : styles.col_12}>
                    {label}
                    <Toggle
                      {..._props}
                      disabled={disabled}
                      checked={field.value}
                      onText="Yes"
                      offText="No"
                      onChange={(e, checked: boolean) => {
                        const set_value = async (k, v) => {
                          await this.form.setFieldValue(k, v ? "Yes" : "No");
                          this.On_Change(field.key);
                        };
                        set_value(field.key, checked);
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

  public Render_Questions() {
    return (
      <div className={styles.row}>
        <Fragment key={fields.questionnaire.questions.key}>
          {
            !this.values[fields.questionnaire.questions.key].length ?
              <div className={styles.col_12}>
                <div className={styles.warning}>{User_Message_Questions_Not_Found}</div>
              </div> :
              <FieldArray
                name={fields.questionnaire.questions.key}
                render={() => {
                  return (
                    this.values[fields.questionnaire.questions.key].map((q, i) => (
                      <div key={i}>
                        {
                          q[fields.question.__display.key] ?
                            <div>
                              {
                                q[fields.question.question_heading.key] ?
                                  <div className={styles.col_12}>
                                    <div className={styles.subTitle}>
                                      {q[fields.question.question_heading.key]}
                                    </div>
                                    <Separator styles={{ root: { height: "5px" } }} />
                                  </div> : null
                              }
                              {
                                q[fields.question.question_type.key] === Question_Type.Static ?
                                  <div className={styles.col_12}>
                                    <TextField
                                      value={q[fields.question.question_desc.key]}
                                      borderless={true}
                                      style={{ paddingLeft: "0", paddingRight: "0" }}
                                      allowFullScreen={true}
                                      autoAdjustHeight={true}
                                      resizable={false}
                                      readOnly={true}
                                      multiline={true}
                                    />
                                  </div> :
                                  this.Question({
                                    key: `${fields.questionnaire.questions.key}.${i}.${fields.question.answer.key}`,
                                    value: q[fields.question.answer.key],
                                    label: q[fields.question.question_desc.key],
                                    type: q[fields.question.question_type.key],
                                    options: q[fields.question.answer_choices.key],
                                    class: styles.col_12
                                  })
                              }
                            </div> : null
                        }
                      </div>
                    ))
                  );
                }}
              />
          }
          {
            this.values[fields.questionnaire.questions.key].length > 0 && this.values[fields.questionnaire.questionnaire_statement.key] ?
              <div className={styles.col_12}>
                <Label>{fields.questionnaire.questionnaire_statement.label}</Label>
                <TextField
                  value={this.values[fields.questionnaire.questionnaire_statement.key]}
                  readOnly={true}
                  borderless={true}
                  allowFullScreen={true}
                  autoAdjustHeight={true}
                  style={{ background: "#f4f4f4" }}
                  resizable={false}
                  multiline={true}
                />
              </div> : null
          }
        </Fragment>
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

  public async Get_Submission_Task(task_id: number) {
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_User_Submission + "')/items(" + task_id + ")" +
      "?$select=*,Submitter/Id,Submitter/Title,Questionnaire/Id" +
      "&$expand=Questionnaire,Submitter");
    const data = response.data;
    fields.questionnaire.submission_id.value = data.Id ? data.Id : 0;
    fields.questionnaire.submission_status.value = data.Status;
    fields.questionnaire.questionnaire_id.value = data.Questionnaire ? data.Questionnaire.Id : 0;
    fields.questionnaire.submitter.value = data.Submitter ? data.Submitter : fields.questionnaire.submitter.value;

    return fields.questionnaire.questionnaire_id.value;
  }

  public async Get_Questionnaire(questionnaire_id: number) {
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questionnaire + "')/items(" + questionnaire_id + ")");
    const result = response.data;
    fields.questionnaire.questionnaire_id.value = result.Id ? result.Id : 0;
    fields.questionnaire.questionnaire_status.value = result.Status ? result.Status : "";
    fields.questionnaire.questionnaire_heading.value = result.Heading ? result.Heading : "";
    fields.questionnaire.questionnaire_statement.value = result.Statement ? result.Statement : "";
    fields.questionnaire.questionnaire_allow_draft.value = result.AllowUserToSaveAsDraft ? result.AllowUserToSaveAsDraft : false;
    fields.questionnaire.answers_list_title.value = result.AnswersListTitle ? result.AnswersListTitle : "";
    fields.questionnaire.answers_list_url.value = result.AnswersListUrl ? result.AnswersListUrl : "";

    return fields.questionnaire.answers_list_title.value;
  }

  public async Get_Questions(questionnaire_id: number) {
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_Questions + "')/items" +
      "?$select=*,Questionnaire/Id" +
      "&$orderby=OrderNo" +
      "&$expand=Questionnaire" +
      "&$filter=Questionnaire/Id eq " + questionnaire_id + " and IsActive eq 1");      
    const data = response.data.value;
    const questions = [];
    data.map(v => {
      const question_obj = Key_Value_Pair(fields.question);
      question_obj[fields.question.question_id.key] = v.Id ? v.Id : 0;
      question_obj[fields.question.question_type.key] = v.QuestionType ? v.QuestionType : "";
      question_obj[fields.question.question_show_if_parent.key] = v.ShowIFParentAnswer ? v.ShowIFParentAnswer : "";
      question_obj[fields.question.question_desc.key] = v.Question;
      question_obj[fields.question.question_order_no.key] = v.OrderNo ? v.OrderNo : "";
      question_obj[fields.question.question_is_active.key] = v.IsActive ? v.IsActive : false;
      question_obj[fields.question.question_heading.key] = v.Heading ? v.Heading : "";
      question_obj[fields.question.answer_column.key] = v.AnswerColumnName ? v.AnswerColumnName : "";
      question_obj[fields.question.answer_choices.key] = v.Choices ? v.Choices.split(";") : [];
      question_obj[fields.question.__required.key] = v.Required ? v.Required : false;
      questions.push(question_obj);
    });
    fields.questionnaire.questions.value = questions;
  }

  public async Get_Answers(list_title: string) {    
    const response = await Get(this.web_url + "/_api/web/lists/getbytitle('" + list_title + "')/items" +
      "?$select=*,Author/Title" +
      "&$expand=Author" +
      "&$filter=AuthorId eq " + fields.questionnaire.submitter.value.Id);      
    const data = response.data.value[0];
    fields.questionnaire.answer_id.value = data.Id;
    // Map Answer Columns In Answers List To Questions
    fields.questionnaire.questions.value.map((question, i) => {
      let answer = data[question[fields.question.answer_column.key]];
      answer = answer ? answer : "";
      if (answer !== undefined) {
        // Store Answer In Current Question
        fields.questionnaire.questions.value[i][fields.question.answer.key] = answer;
      }
    });      
  }

  public On_Change(target: string) {
    // If target belongs to a field array then we must extract field key
    // An array field key is formated like: "array_key.index.field_key"
    const keys = target.split(".");
    const field_key = keys[keys.length - 1];
    
    switch (field_key) {
      case fields.question.answer.key: {        
        this.Is_Display_Question(this.values[fields.questionnaire.questions.key], target);
        break;
      }
    }
  }

  public On_Submit(e: FormikValues) {
    (async () => {
      const question_ans = e[fields.questionnaire.questions.key];
      const is_submit = e[fields.questionnaire.__submit.key];

      const data = {
        Title: "Answer"
      };
      question_ans.map(v => {
        if (v[fields.question.question_type.key] !== Question_Type.Static) {
          data[v[fields.question.answer_column.key]] = v[fields.question.__display.key] ? v[fields.question.answer.key] : "";
        }
      });
      await Post(this.web_url + "/_api/web/lists/getbytitle('" + e[fields.questionnaire.answers_list_title.key] + "')/items" +
        e[fields.questionnaire.answer_id.key] ? "" : "(" + e[fields.questionnaire.answer_id.key] + ")", this.web_url, e[fields.questionnaire.answer_id.key] ? "merge" : "post", data);
      
      const task_data = {
        Status: is_submit === 1 ? Task_Status.Submitted : Task_Status.Draft
      };
      await Post(this.web_url + "/_api/web/lists/getbytitle('" + List_Title_User_Submission + "')/items(" + e[fields.questionnaire.submission_id.key] + ")", this.web_url, "merge", task_data);

      await this.form.setFieldValue(fields.questionnaire.__is_submitted.key, true);
      if (is_submit === 0) this.Close_App();
    })().catch((err) => {
      Exception(err, App_Title_Questionnaire_Form, this.web_url, this.Set_Error_State);
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

  public Is_Display_Question(questions: any[], field_key?: string) {
    const is_display = (index: number, display = true) => {
      const p_index = this.Question_Parent_Index(index, questions);
      if (p_index !== index) {
        console.log('Parent of question no:', questions[index][fields.question.question_order_no.key], 'is', questions[p_index][fields.question.question_order_no.key]);

        const show_if_parent = questions[index][fields.question.question_show_if_parent.key];

        // check if 'Show If Parent' condition = output/response of its parent question
        display = show_if_parent != questions[p_index][fields.question.answer.key] ? false : display;

        // Check If the parent question has another parent
        const _p_index = this.Question_Parent_Index(p_index, questions);
        if (_p_index !== p_index) {
          // output/response of top most parent question has highest precedence
          // re-run the rule for next parent
          return is_display(p_index, display);
        }
      }
    };
    if (field_key) {
      // calculate display property of current question on item edit event
      const keys = field_key.split(".");
      const index = parseInt(keys[1]);
      const has_childs = this.Question_Has_Child(index, questions);

      const order_no: string = questions[index][fields.question.question_order_no.key];
      const depth_level: number = order_no.split(".").length - 1;

      if (has_childs) {
        let _index = index + 1;
        do {
          const _order_no: string = questions[_index][fields.question.question_order_no.key];
          const _depth_level: number = _order_no.split(".").length - 1;

          // this logic will only run on dependents of current question
          if (_order_no.indexOf(order_no) === 0 && _depth_level > depth_level) {
            this.form.setFieldValue(fields.questionnaire.questions.key + "." + _index + "." + fields.question.__display.key, is_display(_index));
            _index++;
          }
          else {
            _index = -1;
          }
        }
        while (_index < questions.length || _index === -1);
      }
    }
    else {
      // calculate display property of all questsions on form load
      questions.map((question, index) => {
        question[fields.question.__display.key] = is_display(index);
      });
    }
  }

  public Is_Disable_Form(): boolean {
    let is_disabled = false;
    is_disabled = !this.values[fields.questionnaire.submission_id.key] ? true : is_disabled;
    is_disabled = !this.values[fields.questionnaire.questionnaire_id.key] ? true : is_disabled;
    is_disabled = this.values[fields.questionnaire.submitter.key].Id !== this.user.Id ? true : is_disabled;
    is_disabled = this.values[fields.questionnaire.submission_status.key] === Task_Status.Submitted ? true : is_disabled;
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
      is_disabled = this.is_disable_form ? true : is_disabled;
    }
    return is_disabled;
  }

  public Is_Display_Field(field_key: string): boolean {
    let is_disabled = false;

    return is_disabled;
  }

  public Question_Has_Child(index: number, questions: any[]) {
    // get question based on index
    const question_current: object = questions[index];
    const question_next: object = questions[index + 1];
    let has_child: boolean = false;

    if (question_next) {
      // get order no of next question
      const question_next_order_no: string = question_next[fields.question.question_order_no.key];
      const question_next_order_no_stem = question_next_order_no.split(".").slice(0, -1).join(".");
      // get order no of current question
      const question_cur_order_no: string = question_current[fields.question.question_order_no.key];
      // check if next question is a child
      has_child = question_cur_order_no === question_next_order_no_stem;
    }
    return has_child;
  }

  public Question_Parent_Index(index: number, questions: any[]) {
    const order_no = questions[index][fields.question.question_order_no.key];
    
    let _index = index - 1;
    while (_index >= 0) {
      const _question = questions[_index];
      const _order_no = _question[fields.question.question_order_no.key];
      if (order_no.indexOf(_order_no) === 0) break;
      else {
        _index--;
      }
    }
    return _index === -1 ? index : _index;
  }

  public Init_Values() {
    let values = {};
    Object.keys(fields.questionnaire).forEach(key => {
      const field: { key: string, value: any } = fields.questionnaire[key];
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
        const task_id = parseInt(this.url_params[URL_Parameters.Task_Id]);
        if (!task_id) {
          this.setState({ app_state: App_State.Not_Found });
          return;
        }
        await this.Get_Current_User();
        const quetionnaire_id = await this.Get_Submission_Task(task_id);

        if (fields.questionnaire.submitter.value.Id === this.user.Id) {
          const answer_list_title = await this.Get_Questionnaire(quetionnaire_id);
          await this.Get_Questions(quetionnaire_id);
          await this.Get_Answers(answer_list_title);

          // This function rule will set display prop of each question          
          this.Is_Display_Question(fields.questionnaire.questions.value);
          this.setState({ app_state: App_State.Pre_Render_Complete });
        }
        else {
          Exception("Submission task Id: '" + task_id + "' belongs to user: " + fields.questionnaire.submitter.value.Title, App_Title_Questionnaire_Form, this.web_url);
          this.setState({ app_state: App_State.UnAuthorized });
        }
      })().catch((err) => {
        Exception(err, App_Title_Questionnaire_Form, this.web_url, this.Set_Error_State);
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
            ref={(e) => { this.form = e; /* Pass formik reference to global variable */ }}
            render={({ values, errors, setFieldValue, isSubmitting, submitForm }) => {

              this.values = values; // Pass formik values reference to global variable
              this.is_submitting = isSubmitting; // Pass formik isSubmitting reference to global variable
              this.is_disable_form = this.Is_Disable_Form();
              this.is_form_invalid = Object.keys(errors).length > 0 ? true : false;

              const is_submitted = values[fields.questionnaire.__is_submitted.key];
              const is_draft = this.values[fields.questionnaire.__submit.key] === 0 ? true : false;
              const submit_btn_disabled = isSubmitting || this.is_form_invalid || is_submitted ? true : false;

              return (
                <div className={styles.app}>
                  <Form>
                    {
                      !is_submitted ?
                        <div className={styles.grid}>
                          <div className={styles.row}>
                            <div className={styles.col_12}>
                              <div className={styles.title}>
                                {
                                  this.values[fields.questionnaire.questionnaire_heading.key]
                                }
                              </div>
                            </div>
                          </div>
                          {
                            this.Render_Questions()
                          }
                          {
                            this.is_form_invalid ?
                              <div className={styles.row}>
                                <div className={styles.col_12}>
                                  <div className={styles.error}>{User_Message_Invalid_Form}</div>
                                </div>
                              </div> : null
                          }
                          {
                            isSubmitting ?
                              <div className={styles.row}>
                                <div className={styles.col_12}>
                                  <div className={styles.warning}>{User_Message_Saving}</div>
                                </div>
                              </div> : null
                          }                         
                          {
                            !this.is_disable_form ?
                              <div className={styles.row}>
                                <div className={styles.col_12}>
                                  {
                                    values[fields.questionnaire.submission_status.key] !== Task_Status.Submitted ?
                                      <PrimaryButton className={styles.button} disabled={submit_btn_disabled} onClick={() => { setFieldValue(fields.questionnaire.__submit.key as never, 1, false); submitForm(); }}>Submit</PrimaryButton> : null
                                  }
                                  {
                                    values[fields.questionnaire.submission_status.key] !== Task_Status.Submitted && values[fields.questionnaire.questionnaire_allow_draft.key] === true ?
                                      <PrimaryButton className={styles.button} disabled={submit_btn_disabled} onClick={() => { setFieldValue(fields.questionnaire.__submit.key as never, 0, false); submitForm(); }}>Save as Draft</PrimaryButton> : null
                                  }
                                </div>
                              </div> : null
                          }
                        </div> :
                        <div className={styles.row} style={{ verticalAlign: "middle", textAlign: "center" }}>
                          <div className={styles.col_12}>
                            <div className={styles.title}>
                              <i className={getIconClassName(this.check_icon)} style={{ fontSize: 70 }} aria-hidden="true"></i>
                              <br />
                              <span style={{ fontSize: 50 }}>
                                {
                                  is_draft ? strings.QuestionnaireDraftSuccess : strings.QuestionnaireSubmitSuccess 
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                    }
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
          <div>
            {
              User_Message_App_Loading
            }
          </div>
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
          <div className={styles.app}>
            <div className={styles.row}>
              <div className={styles.col_12}>
                <div className={styles.error}>{User_Message_Error}</div>
              </div>
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
