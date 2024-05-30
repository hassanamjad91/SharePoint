import * as React from 'react';
import { IWebpart } from '../../../interfaces';
import styles from '../styles/style.module.scss';
import { EnvironmentType } from '@microsoft/sp-core-library';
import * as dropdowns from './dropdowns';
import * as maps from './maps';
import * as fields from './fields';
import config from './config';
import validation from './validation';
import { Get, Post, Url_Params, Key_Value_Pair, UUID_v4, CKEditor4_Config } from '../../../helpers';
import { Formik, Form, Field, FieldArray, getIn, FormikValues, ArrayHelpers, FieldArrayRenderProps } from 'formik';
import { TextField, Toggle, Label, PrimaryButton, DefaultButton, IIconProps, Separator } from 'office-ui-fabric-react/lib';
import { Dropdown, IDropdownOption, CommandBar, ICommandBarItemProps, ITextFieldStyles, MessageBar } from 'office-ui-fabric-react/lib';
import { Card, ICard, ICardItem, ICardTokens, ICardSectionStyles } from '@uifabric/react-cards';
import { LogType, HTTP_Method, Base_Template, Entity_Type, Field_Type, Data_Type, Rule } from '../enums/Enum';
import { IField_Props, ILog, IUrl, ISP_List, ISP_View, ISP_Field, IFormatting_Rule, IHTTP_Exception, ILookup, IPerson, IQuestionnaire, IQuestion } from '../interfaces/Interface';
import { AxiosResponse, AxiosPromise } from 'axios';
import CKEditor from 'ckeditor4-react';

class Main extends React.Component<IWebpart, {}> {

  public form: Formik;
  public values: FormikValues;
  
  public state = {
    error: false,
    pre_render: false,
    auto_saving: false,
    questionnaire_distributed: false,
    questionnaire_ready: false,
    questionnaire_exist: false
  };

  public prop = {
    submitting: false,
    invalid: false,
    questions_deleted: [],
    questions_updated: [],
    auto_save: null,
    auto_save_interval: 15000,
    url_params: Url_Params(),
    ref_questions: [],
    ref_err: React.createRef<HTMLDivElement>(),
    validation_errs: {}
  };

  public Field(key: string, value: any, e: IField_Props) {
    return (
      <Field
        name={key}
        value={value}
        render={(props) => {
          const { field } = props;
          const { errors, handleChange } = props.form;
          const attributes = e.attributes ? { ...e.attributes } : {};
          const invalid = getIn(errors, key) ? true : false;
          const invalid_class = invalid ? styles.invalid : "";
          let disabled = e.readonly || this.Formatting({ rule: Rule.Disabled }) ?
            true : this.Formatting({ rule: Rule.Disabled_Field, target: key });
          const disabled_class = disabled ? styles.disabled : "";
            
          switch (e.input) {
            case maps.input_type.text: {
              // This field can handle types: IPerson and ILookup in readonly mode
              if (typeof (value) === "object") {
                const person: IPerson = value;
                const lookup: ILookup = value;
                if (person && person.Title) { value = person.Title; }
                else if (lookup && lookup.Title) { value = lookup.Title; }
                else { value = ""; }
                disabled = true;
              }
              return (
                <div className={e.class ? e.class : styles.col_12}>
                  {e.label ? <Label>{e.label}</Label> : null}
                  <TextField
                    {...field}
                    {...attributes}
                    value={value}
                    title={value}
                    autoComplete={"off"}
                    disabled={disabled}
                    className={[invalid_class, disabled_class].join(" ").trim()}
                    onChange={(event, val: string) => {
                      const set_value = async (k, v) => {
                        await this.form.setFieldValue(k, v);
                        this.On_Change(key);
                      };
                      val = val.trim() === "" ? val.trim() : val;
                      if (this.form) set_value(key, val.length > 256 ? val.substring(0, 256) : val);
                    }} />
                </div>
              );
            }
            case maps.input_type.number: {
              return (
                <div className={e.class ? e.class : styles.col_12}>
                  {e.label ? <Label>{e.label}</Label> : null}
                  <TextField
                    {...field}
                    {...attributes}
                    type={e.input}
                    autoComplete={"off"}
                    disabled={disabled}
                    className={[invalid_class, disabled_class].join(" ").trim()}
                    onChange={(event) => { handleChange(event); this.On_Change(key); }} />
                </div>
              );
            }
            case maps.input_type.note: {
              return (
                <div className={e.class ? e.class : styles.col_12}>
                  {e.label ? <Label>{e.label}</Label> : null}
                  <TextField
                    {...field}
                    {...attributes}
                    autoComplete={"off"}
                    disabled={disabled}
                    multiline={true}
                    className={[invalid_class, disabled_class].join(" ").trim()}
                    onChange={(event) => { handleChange(event); this.On_Change(key); }}
                  />
                </div>
              );
            }
            case maps.input_type.rich_text: {
              return (
                <div className={e.class ? e.class : styles.col_12}>
                  {e.label ? <Label>{e.label}</Label> : null}
                  <div className={[styles.ckeditor4, invalid_class, disabled_class].join(" ").trim()}>
                    <CKEditor
                      data={value}
                      readOnly={disabled}
                      config={CKEditor4_Config}
                      onLoaded={(event) => {
                        event.editor.on("beforeCommandExec", (_event) => {
                          // Show the paste dialog for the paste buttons and right-click paste
                          if (_event.data.name == "paste") {
                            _event.editor._.forcePasteDialog = true;
                          }
                        });
                      }}
                      onChange={(event) => {
                        const text = event.editor.getData();
                        const set_value = async (k, v) => {
                          await this.form.setFieldValue(k, v);
                          this.On_Change(key);
                        };
                        set_value(key, text);
                      }}
                    />
                  </div>
                </div>
              );
            }
            case maps.input_type.toggle: {
              return (
                <div className={e.class ? e.class : styles.col_12}>
                  <Toggle label={e.label ? e.label : ""} {...field} {...attributes} disabled={disabled}
                    checked={Boolean(field.value)}
                    onText="Yes"
                    offText="No"
                    onChange={(event: React.ChangeEvent, checked) => {
                      const set_value = async (k, v) => {
                        await this.form.setFieldValue(k, v ? "Yes" : "No");
                        this.On_Change(key);
                      };
                      set_value(key, checked);
                    }}
                  />
                </div>
              );
            }
            case maps.input_type.dropdown: {
              // This field can render arrays of following types:
              // - "ILookup" or any type that is superset of "ILookup"
              // - "string[]"
              let options: IDropdownOption[] = [{
                key: typeof (value) === "number" ? 0 : "",
                text: "Select an option",
                disabled: true
              }];
              if (e.options && e.options.length) {
                if (typeof (e.options[0]) === "object") {
                  e.options.forEach((option) => {
                    let _option: ILookup = option;
                    options.push({ key: _option.Id, text: _option.Title });
                  });
                }
                else {
                  e.options.forEach((option) => { options.push({ key: option, text: option }); });
                }
              }
              const style = { root: { border: invalid ? "1px solid #ff4a5a" : "inherit" } };
              return (
                options.length ?
                  <div className={e.class ? e.class : styles.col_12}>
                    {e.label ? <Label>{e.label}</Label> : null}
                    <Dropdown
                      {...field}
                      {...attributes}
                      styles={style}
                      disabled={disabled}
                      options={options}
                      selectedKey={value}
                      onChange={(event, option: IDropdownOption) => {
                        const set_value = async (k, v) => {
                          await this.form.setFieldValue(k, v);
                          this.On_Change(key);
                        };
                        set_value(key, option.key);
                      }}
                    />
                  </div> : null
              );
            }
            default: {
              return null;
            }
          }
        }}
      />
    );
  }

  public Render_Questionnaire() {
    const error = this.state.error;
    const submitting = this.prop.submitting;
    const invalid = this.prop.invalid;
    const disabled = invalid || this.Formatting({ rule: Rule.Disabled });
    const questionnaire_distributed = this.state.questionnaire_distributed;
    const back_icon: IIconProps = { iconName: "Back" };

    return (
      <div className={styles.row}>
        {
          this.state.questionnaire_ready ?
            <div>
              <div className={styles.col_12}>
                <div className={styles.subTitle}>{"Questionnaire: " + this.values[fields.questionnaire.questionnaire_title.key]}</div>
                <Separator styles={{ root: { lineHeight: 5 } }} />
                <MessageBar>Questionnaires can take a long time to design. Don't worry, we'll save your progress automatically every few seconds.</MessageBar>
              </div>
              {this.Field(fields.questionnaire.questionnaire_heading.key, this.values[fields.questionnaire.questionnaire_heading.key], { input: maps.input_type.text, label: "Heading", class: styles.col_12 })}
              {this.Field(fields.questionnaire.questionnaire_group.key, this.values[fields.questionnaire.questionnaire_group.key], { input: maps.input_type.dropdown, label: "Group", options: dropdowns.groups, class: styles.col_2 })}
              {this.Field(fields.questionnaire.questionnaire_year.key, this.values[fields.questionnaire.questionnaire_year.key], { input: maps.input_type.text, label: "Year", class: styles.col_2 })}
              {this.Field(fields.questionnaire.questionnaire_author.key, this.values[fields.questionnaire.questionnaire_author.key], { input: maps.input_type.text, label: "Created By", readonly: true, class: styles.col_2 })}
              {this.Field(fields.questionnaire.questionnaire_statement.key, this.values[fields.questionnaire.questionnaire_statement.key], { input: maps.input_type.rich_text, label: "Acknowledgement Statement", class: styles.col_12 })}
              {this.Render_Questions()}
              <div className={styles.col_12}>
                <PrimaryButton className={styles.button} disabled={false} iconProps={back_icon} onClick={() => { this.On_Close(); }}>Go Back</PrimaryButton>
              </div>
              <div className={styles.col_12}>
                <PrimaryButton className={styles.button} disabled={true} onClick={() => { this.On_Submit(false); }}>Save & Close</PrimaryButton>
              </div>              
              {
                invalid ?
                  <div className={styles.col_12}>
                    <div className={styles.error}>Please make sure highlighted fields are filled out.</div>
                  </div> : null
              }
              {
                submitting && !error ?
                  <div className={styles.col_12}>
                    <div className={styles.info}>Please wait while we save your changes.</div>
                  </div> : null
              }
              {
                questionnaire_distributed && !error ?
                  <div className={styles.col_12}>
                    <div className={styles.info}>Questionnaire cannot be modified once it's sent out to end users.</div>
                  </div> : null
              }
            </div> :
            this.Render_Questionnaire_Start()
        }
      </div>
    );
  }

  public Render_Questionnaire_Start() {
    const error = this.state.error;
    const submitting = this.prop.submitting;
    const title = this.values[fields.questionnaire.questionnaire_title.key];
    const questionnaire_exist = this.state.questionnaire_exist;
    const disabled = !title || this.prop.invalid || this.Formatting({ rule: Rule.Disabled });
    
    const q_title_style: Partial<ITextFieldStyles> = {
      field: {
        fontSize: 36,
        textAlign: "center",
        borderBottom: "2px solid #ddd",

        selectors: {
          "::placeholder": {
            fontSize: 25,
            fontStyle: "italic"
          },
          ":-ms-input-placeholder": {
            fontSize: 25,
            fontStyle: "italic"
          },
          "&:focus": {
            borderBottom: "2px solid #ddd"
          },
          "&:hover": {
            borderBottom: "2px solid #ddd"
          },
          "&:disabled": {
            backgroundColor: "white"
          }
        },
      },
      fieldGroup: {
        height: "auto",
        border: "none"
      }
    };

    const start_btn_style = {
      fontSize: 40,
      height: "auto",
      border: "2px solid #ddd",
      padding: 20,
      marginTop: 15
    };
    
    return (
      !error ? 
        <div className={styles.row} style={{ verticalAlign: "middle", textAlign: "center" }}>
          <div className={styles.col_12}>
            <div className={styles.col_12}>
              <div className={styles.title} style={{ fontSize: 40 }}>Let's Get Started</div>
              <Separator />
            </div>
            <div className={styles.col_12}>
              {this.Field(fields.questionnaire.questionnaire_title.key, this.values[fields.questionnaire.questionnaire_title.key], { input: maps.input_type.text, class: styles.col_12, attributes: { placeholder: "Please provide a name for your Questionnaire..", styles: q_title_style } })}
            </div>
            <div className={styles.col_12}>
              <DefaultButton style={start_btn_style} disabled={disabled} text="Start" onClick={() => { this.Formatting({ rule: Rule.Questionnaire_Start }); }} />
            </div>
            {
              questionnaire_exist && !submitting && !error ?
                <div className={styles.col_12}>
                  <div style={{ textAlign: "center" }}>
                    <div className={styles.warning}>This name has already been taken. Please provide a different name</div>
                  </div>
                </div> : null
            }
            {
              submitting && !error ?
                <div className={styles.col_12}>
                  <div>
                    <div className={styles.info}>Please wait while we set things up for you..</div>
                  </div>
                </div> : null
            }
          </div>
        </div> : null
    );
  }

  public Render_Questions() {
    const questions: object[] = this.values[fields.questionnaire.questions.key];
    const disabled = this.Formatting({ rule: Rule.Disabled });
    
    // S: Icons Definations
    const add: IIconProps = { iconName: "Add" };
    const del: IIconProps = { iconName: "Delete" };
    const right: IIconProps = { iconName: "ChevronRight" };
    const right_double: IIconProps = { iconName: "DoubleChevronRight" };
    // E: Icons Definations

    // S: Style Definations
    const card: ICard = {
      root: {
        maxWidth: "inherit",
        marginTop: 8,
        border: "1px solid #F4F4F4"
      }
    };
    const card_tokens: ICardTokens = {
      childrenMargin: 12,
      boxShadow: "0px 0px 1px 1px #999999"
    };
    const content: ICardSectionStyles = {
      root: {
        width: "100%"
      }
    };
    const order_no_body: ICardItem = {
      root: {
        width: 100,
        textAlign: "center",
        background: "#f4f4f4",
        border: "1px solid #2a3638",
        color: "2a3638",
        selectors: {
          h2: {
            margin: 10,
            overflow: "hidden",
            textOverflow: "ellipsis"
          }
        }
      }
    };
    const order_no_head: ICardItem = {
      root: {
        background: "#2a3638",
        padding: 2,
        border: "1px solid #2a3638",
        fontSize: 14,
        fontWeight: "bold",
        color: "white"
      }
    };
    const separator = {
      root: { lineHeight: 5 }
    };
    // S: Style Definations

    // Command Bar Defination
    const command_bar = (i: number, arr_helpers: ArrayHelpers) => {
      // S: Icon Definations
      const up: IIconProps = { iconName: "ChevronUp" };
      const down: IIconProps = { iconName: "ChevronDown" };
      const remove: IIconProps = { iconName: "Cancel" };
      // E:  Icon Definations

      const _question = questions[i];
      const order_no: string = _question[fields.question.question_order_no.key];
      const order_no_split: string[] = order_no.split(".");
      const next_child_no = ` (${order_no}.1)`;
      
      const items: ICommandBarItemProps[] = [
        {
          key: "newItem",
          text: "New",
          iconProps: add,
          disabled: disabled,
          subMenuProps: {
            items: [
              {
                key: "question_sibling",
                text: "Question",
                iconProps: right,
                onClick: () => {
                  this.Formatting({ rule: Rule.Question_Add, data: { index: i, child: false, arr_helpers: arr_helpers } });
                },
              },
              {
                key: "question_child",
                text: "Follow Up Question" + next_child_no,
                iconProps: right_double,
                onClick: () => {
                  this.Formatting({ rule: Rule.Question_Add, data: { index: i, child: true, arr_helpers: arr_helpers } });
                },
              }
            ]
          }
        },
        {
          key: "move_up",
          text: "Move Up",
          iconProps: up,
          disabled: disabled,
          onClick: () => {
            this.Formatting({ rule: Rule.Question_Move, data: { index: i, up: true, arr_helpers: arr_helpers } });
          }
        },
        {
          key: "move_down",
          text: "Move Down",
          iconProps: down,
          disabled: disabled,
          onClick: () => {
            this.Formatting({ rule: Rule.Question_Move, data: { index: i, up: false, arr_helpers: arr_helpers } });
          },
        },
        {
          key: "remove",
          text: "Remove",
          iconProps: remove,
          disabled: disabled,
          onClick: () => {
            this.Formatting({ rule: Rule.Question_Delete, data: { index: i, arr_helpers: arr_helpers } });
          }
        }
      ];
      return (
        <CommandBar className={styles.command_bar} items={items} />
      );
    };

    // drag drop event handlers
    const choice_drag_drop = {
       on_drop: (event: React.DragEvent<HTMLDivElement>) => {
        
        const target_key = event.currentTarget.dataset.key;
        const target_index = Number(event.currentTarget.dataset.index);
        const dragged_index = Number(event.dataTransfer.getData(target_key));

        if (dragged_index >= 0 && dragged_index !== target_index) {
          const question_index = Number(event.currentTarget.dataset.qindex);
          const question = questions[question_index];
          const choices: string[] = question[fields.question.answer_choices.key];
          const swap_val = choices[dragged_index];
          choices[dragged_index] = choices[target_index];
          choices[target_index] = swap_val;
          const key = `${fields.questionnaire.questions.key}.${question_index}.${fields.question.answer_choices.key}`;
          this.form.setFieldValue(key, choices);
          // mark question for update
          this.Formatting({ rule: Rule.Question_Update, data: { index: question_index } });
        }
        event.currentTarget.classList.remove(styles.drop_zone);
      },
      on_drag_start: (event: React.DragEvent<HTMLDivElement>) => {
        const dragged_index = Number(event.currentTarget.dataset.index);
        event.dataTransfer.setData(event.currentTarget.dataset.key, dragged_index.toString());
      },
      on_drag_enter: (event: React.DragEvent<HTMLDivElement>) => {
        const target_key = event.currentTarget.dataset.key;
        const target_index = Number(event.currentTarget.dataset.index);
        const dragged_index = Number(event.dataTransfer.getData(target_key));
        if (dragged_index !== target_index) {
          event.currentTarget.classList.add(styles.drop_zone);
        }
      },
      on_drag_leave: (event: React.DragEvent<HTMLDivElement>) => {
        event.currentTarget.classList.remove(styles.drop_zone);
      }
    };
    
    return (
      <div>
        <div className={styles.col_12}>
          <div className={styles.subTitle}>Questions List</div>
          <Separator styles={separator} />
        </div>
        <FieldArray
          name={fields.questionnaire.questions.key}
          render={arrayHelpers => { // tslint:disable: no-shadowed-variable
            const refs = this.prop.ref_questions;
            return (
              questions.map((question, i: number) => {
                const type = question[fields.question.question_type.key];
                const order_no = question[fields.question.question_order_no.key];
                const _disabled = getIn(this.prop.validation_errs, `${fields.questionnaire.questions.key}.${i}`) ? true : disabled;

                refs[i] = React.createRef();
                // travel upward and find parent question index of current question
                let p_index = i;
                while (p_index >= 0) {
                  const _question = questions[p_index];
                  const order_no_stem = order_no.split(".").slice(0,-1).join(".");
                  const _order_no: string = _question[fields.question.question_order_no.key];
                  if (_order_no === order_no_stem) break;
                  else {
                    p_index--;
                  }
                }
                return (
                  <div key={i} ref={refs[i]} className={styles.col_12}>
                    <Card horizontal tokens={card_tokens} styles={card}>
                      <Card.Item styles={order_no_body}>
                        <Card.Item styles={order_no_head}>
                          <span>Question #</span>
                        </Card.Item>
                        <Card.Item>
                          <h2>{order_no}</h2>
                        </Card.Item>
                      </Card.Item>
                      <Card.Section styles={content}>
                        <div className={styles.row}>
                          <div className={styles.col_12}>
                            {command_bar(i, arrayHelpers)}
                          </div>
                        </div>
                        <div className={styles.row}>
                          {this.Field(`${fields.questionnaire.questions.key}.${i}.${fields.question.question_desc.key}`, question[fields.question.question_desc.key], { input: maps.input_type.note, label: "Question", class: styles.col_12 })}
                          {this.Field(`${fields.questionnaire.questions.key}.${i}.${fields.question.question_heading.key}`, question[fields.question.question_heading.key], { input: maps.input_type.text, label: "Section Heading (Optional)", class: styles.col_12 })}
                        </div>
                        <div className={styles.row}>
                          <div className={styles.col_6}>
                            <div className={styles.row}>
                              {this.Field(`${fields.questionnaire.questions.key}.${i}.${fields.question.question_type.key}`, question[fields.question.question_type.key], { input: maps.input_type.dropdown, label: "Type", class: styles.col_12, options: dropdowns.question_types })}
                            </div>
                            {
                              type === maps.question_type.radio || type === maps.question_type.dropdown ?
                                <div className={styles.row}>
                                  <div className={styles.col_12}>
                                    <Label>Choices</Label>
                                  </div>
                                  <FieldArray
                                    name={`${fields.questionnaire.questions.key}.${i}.${fields.question.answer_choices.key}`}
                                    render={arrayHelpers => { // tslint:disable: no-shadowed-variable
                                      const choices = question[fields.question.answer_choices.key];
                                      const item_style = { marginBottom: 10, display: "flex" };
                                      return (
                                        <div className={styles.col_12}>
                                          {
                                            choices.map((choice: string, _i: number) => {
                                              const key_choice = `${fields.questionnaire.questions.key}.${i}.${fields.question.answer_choices.key}.${_i}`;
                                              return (
                                                <div key={_i}>
                                                  <div
                                                    draggable={true}
                                                    data-qindex={i}
                                                    data-index={_i}
                                                    data-key={key_choice}
                                                    style={item_style}
                                                    onDrop={choice_drag_drop.on_drop}
                                                    onDragStart={choice_drag_drop.on_drag_start}
                                                    onDragLeave={choice_drag_drop.on_drag_leave}
                                                    onDragEnter={choice_drag_drop.on_drag_enter}
                                                    onDragOver={(event) => { event.preventDefault(); }}>
                                                    <svg width="24" height="30" viewBox="0 0 24 24" style={{ cursor: "pointer" }}>
                                                      <circle cx="9.5" cy="6.5" r="1.5" fill="currentColor"></circle>
                                                      <circle cx="14.5" cy="6.5" r="1.5" fill="currentColor"></circle>
                                                      <circle cx="9.5" cy="12.5" r="1.5" fill="currentColor"></circle>
                                                      <circle cx="14.5" cy="12.5" r="1.5" fill="currentColor"></circle>
                                                      <circle cx="9.5" cy="18.5" r="1.5" fill="currentColor"></circle>
                                                      <circle cx="14.5" cy="18.5" r="1.5" fill="currentColor"></circle>
                                                    </svg>
                                                    {this.Field(key_choice, choice, { input: maps.input_type.text, class: styles.col_8 })}
                                                    <PrimaryButton className={styles.button_option} style={{ marginTop: 0 }} iconProps={del} disabled={_disabled}
                                                      onClick={() => {
                                                        this.Formatting({ rule: Rule.Choice_Delete, data: { index: _i, q_index: i, arr_helpers: arrayHelpers } });
                                                      }}
                                                    />
                                                  </div>
                                                </div>
                                              );
                                            })
                                          }
                                          <div className={styles.col_12}>
                                            <PrimaryButton className={styles.button} text="Choice" style={{ marginTop: 0 }} iconProps={add} disabled={_disabled}
                                              onClick={() => {
                                                this.Formatting({
                                                  rule: Rule.Choice_Add, data: { q_index: i, arr_helpers: arrayHelpers }
                                                });
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    }}
                                  />
                                </div> : null
                              }
                          </div>
                          <div className={styles.col_6}>
                            <div className={styles.row}>
                              {
                                questions[p_index] && (questions[p_index][fields.question.question_type.key] === maps.question_type.dropdown || questions[p_index][fields.question.question_type.key] === maps.question_type.radio) ?
                                  this.Field(`${fields.questionnaire.questions.key}.${i}.${fields.question.question_show_if_parent.key}`, question[fields.question.question_show_if_parent.key], { input: maps.input_type.dropdown, label: "Show If Parent Question Response Is", class: styles.col_12, options: questions[p_index][fields.question.answer_choices.key] })
                                  : null
                              }
                              {this.Field(`${fields.questionnaire.questions.key}.${i}.${fields.question.answer_required.key}`, question[fields.question.answer_required.key], { input: maps.input_type.toggle, label: "Required", class: styles.col_12 })}
                            </div>
                          </div>
                        </div>
                      </Card.Section>
                    </Card>
                  </div>
                );
              })
            );
          }}
        />
      </div>
    );
  }
  
  public Get_Questionnaire(id: number): AxiosPromise {
    let url, select, expand;
    select = "?$select=" +
      maps.sp_cols._generic.Id + "," +
      maps.sp_cols._generic.Title + "," +
      maps.sp_cols._generic.Author + "/" + maps.sp_cols._generic.Id + "," +
      maps.sp_cols._generic.Author + "/" + maps.sp_cols._generic.Title + "," +
      maps.sp_cols.questionnaire.Group + "/" + maps.sp_cols._generic.Id + "," +
      maps.sp_cols.questionnaire.Group + "/" + maps.sp_cols._generic.Title + "," +
      maps.sp_cols.questionnaire.Heading + "," +
      maps.sp_cols.questionnaire.Statement + "," +
      maps.sp_cols.questionnaire.Year + "," +
      maps.sp_cols.questionnaire.AnswersListTitle + "," +
      maps.sp_cols.questionnaire.AnswersListUrl + "," +
      maps.sp_cols.questionnaire.Status;
    expand = "&$expand=" +
      maps.sp_cols._generic.Author + "," +
      maps.sp_cols.questionnaire.Group;
    url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questionnaire.title + "')/items(" + id + ")" + select + expand;
    return Get(url);
  }
  
  public Get_Questions(id: number): AxiosPromise {
    let url, select, filter, orderby, expand;
    url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questions.title + "')/items";
    select = "?$select=" +
      maps.sp_cols._generic.Id + "," +
      maps.sp_cols.questions.Question + "," +
      maps.sp_cols.questions.QuestionType + "," +
      maps.sp_cols.questions.ShowIFParentAnswer + "," +
      maps.sp_cols.questions.OrderNo + "," +
      maps.sp_cols.questions.Heading + "," +
      maps.sp_cols.questions.Choices + "," +
      maps.sp_cols.questions.AnswerColumnName+ "," +
      maps.sp_cols.questions.Required + "," +
      maps.sp_cols.questions.Questionnaire + "/" + maps.sp_cols._generic.Id;
    filter = "&$filter=" + maps.sp_cols.questions.Questionnaire + "/" + maps.sp_cols._generic.Id + " eq " + id;
    orderby = "&$orderby=" + maps.sp_cols.questions.OrderNo;
    expand = "&$expand=" + maps.sp_cols.questions.Questionnaire;
    url = url + select + filter + orderby + expand;
    return Get(url);
  }

  public Get_Notification_Count(id: number): AxiosPromise {
    const filter = "?$filter=" + maps.sp_cols.questions.Questionnaire + "/" + maps.sp_cols._generic.Id + " eq " + id;
    const url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.notification.title + "')/items" + filter;
    return Get(url);
  }

  public Check_Questionnaire_Exists(title: string): AxiosPromise {
    const filter = "?$filter=" + maps.sp_cols._generic.Title + " eq '" + title + "'";
    const url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questionnaire.title + "')/items" + filter;
    return Get(url);
  }
  
  public Save_Questionnaire(method: HTTP_Method): AxiosPromise {
    let url: string, data: object;

    const answer_list: IUrl = this.values[fields.questionnaire.questionnaire_answer_list.key];
    const q_id = this.values[fields.questionnaire.questionnaire_id.key];
    url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questionnaire.title + "')/items";
    url = q_id ? url + "(" + q_id + ")" : url;
    
    data = {
      [maps.sp_cols._generic.Title]: this.values[fields.questionnaire.questionnaire_title.key],
      [maps.sp_cols.questionnaire.Heading]: this.values[fields.questionnaire.questionnaire_heading.key],
      [maps.sp_cols.questionnaire.Year]: this.values[fields.questionnaire.questionnaire_year.key],
      [maps.sp_cols.questionnaire.Status]: this.values[fields.questionnaire.questionnaire_status.key],
      [maps.sp_cols.questionnaire.Statement]: this.values[fields.questionnaire.questionnaire_statement.key],
      [maps.sp_cols.questionnaire.Group + maps.sp_cols._generic.Id]: this.values[fields.questionnaire.questionnaire_group.key],
      [maps.sp_cols.questionnaire.AnswersListTitle]: answer_list.title,
      [maps.sp_cols.questionnaire.AnswersListUrl]: answer_list.url
    };

    switch (method) {
      case HTTP_Method.POST: {
        return Post(url, config.paths.api, method, data);
      }
      case HTTP_Method.MERGE: {
        return Post(url, config.paths.api, method, data);
      }
      default: {
        return null;
      }
    }
  }

  public Save_Question(method: HTTP_Method, question: object): AxiosPromise {
    let url: string, data: object;
    const question_id = question[fields.question.question_id.key];
    const questionnaire_id: number = this.values[fields.questionnaire.questionnaire_id.key];

    const choices: string[] = question[fields.question.answer_choices.key];
    const choices_flat: string = choices.join(";");
    
    url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questions.title + "')/items";
    url = question_id ? url + "(" + question_id + ")" : url;

    data = method === HTTP_Method.DELETE ? {} : {
      [maps.sp_cols._generic.Title]: "Question",
      [maps.sp_cols.questions.Choices]: choices_flat,
      [maps.sp_cols.questions.AnswerColumnName]: question[fields.question.answer_column.key],
      [maps.sp_cols.questions.Required]: question[fields.question.answer_required.key],
      [maps.sp_cols.questions.Question]: question[fields.question.question_desc.key],
      [maps.sp_cols.questions.Heading]: question[fields.question.question_heading.key],
      [maps.sp_cols.questions.OrderNo]: question[fields.question.question_order_no.key],
      [maps.sp_cols.questions.ShowIFParentAnswer]: question[fields.question.question_show_if_parent.key],
      [maps.sp_cols.questions.QuestionType]: question[fields.question.question_type.key],
      [maps.sp_cols.questions.ParentQuestion + maps.sp_cols._generic.Id]: question[fields.question.question_parent_id.key],
      [maps.sp_cols.questions.Questionnaire + maps.sp_cols._generic.Id]: questionnaire_id
    };

    switch (method) {
      case HTTP_Method.POST: {
        return Post(url, config.paths.api, method, data);
      }
      case HTTP_Method.MERGE: {
        return Post(url, config.paths.api, method, data);
      }
      case HTTP_Method.DELETE: {
        return Post(url, config.paths.api, method);
      }
      default: {
        return null;
      }
    }
  }

  public Save_List(method: HTTP_Method, list: string, data: ISP_List): AxiosPromise {
    let url: string = config.paths.api + "/_api/web/lists";
    url = method !== HTTP_Method.POST ? url + "/getbytitle('" + list + "')" : url;
    
    switch (method) {
      case HTTP_Method.DELETE: {
        return Post(url, config.paths.api, method);
      }
      case HTTP_Method.POST: {
        return Post(url, config.paths.api, method);
      }
      default: {
        return null;
      }
    }
  }

  public Save_Column(method: HTTP_Method, list: string, col: string, entity?: Entity_Type, data?: any): AxiosPromise {
    let url: string = config.paths.api + "/_api/web/lists/getbytitle('" + list + "')/fields";
    url = method !== HTTP_Method.POST ?
      url + "/GetByInternalNameOrTitle('" + col + "')" :
      entity === Entity_Type.FieldXml ? url + "/CreateFieldAsXml" : url;

    switch (method) {
      case HTTP_Method.DELETE: {
        return Post(url, config.paths.api, method);
      }
      case HTTP_Method.POST: {
        return Post(url, config.paths.api, method);
      }
      default: {
        return null;
      }
    }
  }

  public Save_View_Column(method: HTTP_Method, list: string, col: string, view?: string): AxiosPromise {
    let url: string, data: object;
    url = config.paths.api + "/_api/web/lists/getbytitle('" + list + "')";
    url = view ? url + "/Views/getbytitle(" + view + ")/ViewFields" : url + "/DefaultView/ViewFields";
    url = method === HTTP_Method.DELETE ? url + "RemoveViewField(" + col + ")" : method === HTTP_Method.POST ? url + "/AddViewField" : url;
    
    switch (method) {
      case HTTP_Method.DELETE: {
        return Post(url, config.paths.api, method);
      }
      case HTTP_Method.POST: {
        return Post(url, config.paths.api, method);
      }
      default: {
        return null;
      }
    }
  }

  public Reset_List_View(method: HTTP_Method.POST, list: string, view?: string): AxiosPromise {
    let url: string;
    url = config.paths.api + "/_api/web/lists/getbytitle('" + list + "')";
    url = view ? url + "/Views/getbytitle(" + view + ")/ViewFields/RemoveAllViewFields" : url + "/DefaultView/ViewFields/RemoveAllViewFields";
    return Post(url, config.paths.api, method);
  }

  public Save_View(method: HTTP_Method, list: string, data: ISP_View, view?: string): AxiosPromise {
    let url: string = config.paths.api + "/_api/web/lists/getbytitle('" + list + "')";
    
    switch (method) {
      case HTTP_Method.POST: {
        url = url + "/Views";
        return Post(url, config.paths.api, method, data);
      }
      case HTTP_Method.MERGE: {
        url = view ? url + "/Views/getbytitle(" + view + ")" : url + "/DefaultView";
        return Post(url, config.paths.api, method, data);
      }
      case HTTP_Method.DELETE: {
        url = url + "/Views/getbytitle(" + view + ")";
        return Post(url, config.paths.api, method);
      }
      default: {
        return null;
      }
    }
  }
  
  public Question_Instance(): object {
    // create new question object
    const question: object = Key_Value_Pair(fields.question);

    // assign a unique identity
    question[fields.question.guid.key] = UUID_v4();

    return question;
  }

  public Question_Has_Child(index: number, questions: object[]) {
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

  public Question_Closest_Sibling_Index(index: number, heirarchy: number, up: boolean, questions: object[]) {
    // get question based on index
    const question: object = questions[index];

    // check if index is valid
    if (!question) return -1;

    // get question order-no
    let order_no: string = question[fields.question.question_order_no.key];
    let order_no_split: string[] = order_no.split(".");
    let order_no_stem: string = order_no_split.slice(0, -1).join(".");

    // set starting index of loop
    let _index = up ? index - 1 : index + 1;

    // check if there is only 1 quesstion
    if (questions.length <= 1) return -1;

    // find index of first sibling of current question
    while (_index >= 0 && _index < questions.length) {
      const _question = questions[_index];
      const _order_no: string = _question[fields.question.question_order_no.key];
      const _order_no_split: string[] = _order_no.split(".");
      const _heirarchy_level: number = _order_no_split.length - 1;
      // check if compared questions are part of the same herirarcy level
      if (_order_no.lastIndexOf((order_no_stem), 0) !== -1) {
        // check if compared questions are siblings
        if (_heirarchy_level === heirarchy) break;
        up ? --_index : ++_index;
      }
      else {
        _index = -1;
        break;
      }
    }
    return _index;
  }

  public Question_Tree_Shift_Order(question_tree: object[], heirarchy: number, up: boolean) {
    // note: this function shifts order no of specified sibling tree
    const questions = this.values[fields.questionnaire.questions.key];

    // the the sibling
    const question = question_tree[0];
    let order_no: string = question[fields.question.question_order_no.key];
    
    // increment or decrement number
    const shift = up ? -1 : 1;
    
    return (async () => {
      return Promise.all(
        question_tree.map(async (_question) => {
          let _order_no: string = _question[fields.question.question_order_no.key];
          const _order_no_split: string[] = _order_no.split(".");
          if (_order_no.lastIndexOf((order_no), 0) !== -1) {
            // change the order no
            _order_no_split[heirarchy] = (Number(_order_no_split[heirarchy]) + shift).toString();
            _order_no = _order_no_split.join(".");

            // get unique identifier of current question
            const guid = _question[fields.question.guid.key];

            // get index of current question by its unique identifier
            const _index = questions.map(q => q[fields.question.guid.key]).indexOf(guid);

            await this.form.setFieldValue(`${fields.questionnaire.questions.key}.${_index}.${fields.question.question_order_no.key}`, _order_no);

            // mark question updated
            this.Formatting({ rule: Rule.Question_Update, data: { index: _index } });
          }
        })
      );
    })();
  }
  
  public Question_Trees_Shift_Order(index: number, heirarchy: number, up: boolean) {
    // note: this function shifts order no of all sibling trees under given index
    const questions = this.values[fields.questionnaire.questions.key];
    const question: object = questions[index];

    // check if index is valid
    if (!question) return -1;

    // get question order-no
    let order_no: string = question[fields.question.question_order_no.key];
    let order_no_split: string[] = order_no.split(".");
    let order_no_stem: string = order_no_split.slice(0, -1).join(".");

    // increment or decrement
    const shift = up ? -1 : 1;
    
    // shift order number by 1 for all siblings (and their childs)
    while (index < questions.length) {
      const _question = questions[index];
      let _order_no: string = _question[fields.question.question_order_no.key];
      const _order_no_split: string[] = _order_no.split(".");
      // check if compared questions are part of the same herirarcy level
      if (_order_no.lastIndexOf((order_no_stem), 0) !== -1) {
        // incrase order-no by 1
        _order_no_split[heirarchy] = (Number(_order_no_split[heirarchy]) + shift).toString();
        _order_no = _order_no_split.join(".");
        
        // set updated new order-no to current subling
        this.form.setFieldValue(`${fields.questionnaire.questions.key}.${index}.${fields.question.question_order_no.key}`, _order_no);
        // mark question updated
        this.Formatting({ rule: Rule.Question_Update, data: { index: index } });

        index++;
      }
      else {
        break;
      }
    }
  }

  public Formatting(e: IFormatting_Rule) {
    switch (e.rule) {
      case Rule.Questionnaire_Start: {
        this.form.setSubmitting(true);
        const time_stamp = new Date().getTime();
        
        const batch = async () => {
          let res: AxiosResponse = null;

          // get the questionnaire title
          let questionnaire_title: string = this.values[fields.questionnaire.questionnaire_title.key].trim();

          // trim the questionnaiare title
          questionnaire_title = questionnaire_title.trim();

          // set trimmed value back to the questionnaire title field
          await this.form.setFieldValue(fields.questionnaire.questionnaire_title.key, questionnaire_title);

          // check if questionnaire with this title already exists
          res = await this.Check_Questionnaire_Exists(questionnaire_title).then(this.Response_Handler);
          if (!res) return;

          if (res.data.value.length > 0) {
            this.setState({ questionnaire_exist: true });
            this.form.setSubmitting(false);
            return;
          }
          else {
            this.setState({ questionnaire_exist: false });
          }

          // define answers list
          const answers_list: IUrl = { title: questionnaire_title, url: "Answers_" + time_stamp };

          // set answer list field
          await this.form.setFieldValue(fields.questionnaire.questionnaire_answer_list.key, answers_list);

          // set questionnaire author field
          await this.form.setFieldValue(fields.questionnaire.questionnaire_author.key, config.user);

          // create questionnaire
          res = await this.Save_Questionnaire(HTTP_Method.POST).then(this.Response_Handler);
          if (!res) return;
          
          // get generated questionnaire-id field
          const questionnaire_id: number = res.data[maps.sp_cols._generic.Id];

          // set questionaire id field
          await this.form.setFieldValue(fields.questionnaire.questionnaire_id.key, questionnaire_id);

          // create new question object
          const question = this.Question_Instance();
          
          // save question to questions list
          res = await this.Save_Question(HTTP_Method.POST, question).then(this.Response_Handler);
          if (!res) return;

          // set generated question id
          question[fields.question.question_id.key] = res.data[maps.sp_cols._generic.Id];

          // set questions field
          await this.form.setFieldValue(fields.questionnaire.questions.key, [question]);

          // define answers list schema
          const answer_list_data: ISP_List = {
            __metadata: { type: Entity_Type.List },
            BaseTemplate: Base_Template.Custom_List,
            Title: answers_list.url,
            Description: "",
            Hidden: true
          };

          // create answers list
          res = await this.Save_List(HTTP_Method.POST, "", answer_list_data).then(this.Response_Handler);
          if (!res) return;

          // function: get left navigation nodes
          const left_navigation_nodes = () => {
            const select = "?$select=Title,Children/Title,Children/Id";
            const expand = "&$expand=Children";
            const url = config.paths.api + "/_api/web/navigation/QuickLaunch" + select + expand;
            return Get(url);
          };

          // function: delete left navigation node
          const left_navigation_node_del = (id: number) => {
            const url = config.paths.api + "/_api/web/navigation/QuickLaunch('" + id + "')";
            return Post(url, config.paths.api, HTTP_Method.DELETE);
          };

          // get left navigation nodes
          res = await left_navigation_nodes().then(this.Response_Handler);
          if (!res) return;
          
          // get answers list navigation node
          const navigation_nodes: { Title: string, Children: { Id: number, Title: string }[] }[] = res.data.value;
          const recents_node = navigation_nodes.filter((node) => node.Title === "Recent").pop();
          const answer_list_node = recents_node && recents_node.Children ? recents_node.Children.filter((node) => node.Title === answers_list.url).pop() : null;
          
          // delete answers list navigation node
          if (answer_list_node) {
            res = await left_navigation_node_del(answer_list_node.Id).then(this.Response_Handler);
            if (!res) return;
          }
          
          // modify title of answers list
          answer_list_data.Title = questionnaire_title;

          // change title of answers list
          res = await this.Save_List(HTTP_Method.MERGE, answers_list.url, answer_list_data).then(this.Response_Handler);
          if (!res) return;

          // set answer column prop of new question
          const answer_col_uri = "Question_" + time_stamp;
          let answer_col_title = question[fields.question.question_order_no.key] + ". " + question[fields.question.question_desc.key];
          answer_col_title = answer_col_title.length > 256 ? answer_col_title.substring(0, 256) : answer_col_title;

          // set answer column prop of new question
          question[fields.question.answer_column.key] = answer_col_uri;

          // define answer column
          const answer_col: ISP_Field = {
            __metadata: { type: Entity_Type.Field },
            FieldTypeKind: Field_Type.Note,
            Title: answer_col_title,
            Description: "",
            SchemaXml: "<Field  Name='" + answer_col_uri + "' DisplayName='" + answer_col_title + "' Type='" + Data_Type.Note + "' />"
          };

          // create answer column in answers list
          res = await this.Save_Column(HTTP_Method.POST, answers_list.title, answer_col_uri, Entity_Type.Field, answer_col).then(this.Response_Handler);
          if (!res) return;

          // set order-by property of default view of answers list
          const view_data: ISP_View = {
            __metadata: { type: Entity_Type.View },
            ViewQuery: "<OrderBy><FieldRef Name='" + maps.sp_cols._generic.Author + "'/></OrderBy>"
          };

          // set order-by property of default view of answers list
          res = await this.Save_View(HTTP_Method.MERGE, answers_list.title, view_data).then(this.Response_Handler);
          if (!res) return;

          // reset submitting flag
          this.form.setSubmitting(false);
          
          // initiate autosave
          // this.Initiate_Auto_Save();

          // questionnaire is ready to display
          this.setState({ questionnaire_ready: true });
        };
        batch().catch(err => this.Error_Handler(err));
        return;
      }
      case Rule.Questionnaire_Update: {
        const questionnaire_id = this.values[fields.questionnaire.questionnaire_id.key];
        // no need to run this rule if questionnaire is not created yet
        if (!questionnaire_id) return;

        this.form.setFieldValue(fields.questionnaire.__updated.key, true);
        return;
      }
      case Rule.Question_Add: {
        const data: { index: number, child: boolean, arr_helpers: FieldArrayRenderProps } = e.data;
        const questions: object[] = this.values[fields.questionnaire.questions.key];
        const question_index: number = data.index;
        const arr_helpers = data.arr_helpers;
        const question: object = questions[question_index];
        
        const add_child: boolean = data.child;
        let insert_index: number = question_index;
        
        // create new question object
        const question_new = this.Question_Instance();

        // create answer column prop for new question
        const answer_col_uri = "Question_" + new Date().getTime();
        let answer_col_title = question_new[fields.question.question_order_no.key] + ". " + question_new[fields.question.question_desc.key];
        answer_col_title = answer_col_title.length > 256 ? answer_col_title.substring(0, 256) : answer_col_title;

        // set answer column prop of new question
        question_new[fields.question.answer_column.key] = answer_col_uri;

        // set default insert index for new question
        insert_index = insert_index + 1;

        // get question order-no
        let order_no: string = question[fields.question.question_order_no.key];

        // get question herirarchy level
        let order_no_split: string[] = order_no.split(".");
        let heirarchy_level: number = order_no_split.length - 1;
        let order_no_leaf: string = order_no_split.pop();
        let order_no_stem: string = order_no_split.join(".");

        if (add_child) {
          // user wnats to create a child question
          // therefore we will set id of this question as parent id of the new question
          question_new[fields.question.question_parent_id.key] = question[fields.question.question_id.key];

          // add new heirarchy level to order-no
          order_no = `${order_no}.${1}`;

          // set order-no of new child question
          question_new[fields.question.question_order_no.key] = order_no;

          // check if current question has any childs
          const has_child = this.Question_Has_Child(question_index, questions);
          if (has_child) {
            // reset heirarchy_level based on new order no
            heirarchy_level = has_child ? heirarchy_level + 1 : heirarchy_level;

            // get index of first child
            const child_index = question_index + 1;

            // increment order no of child questions to make space for new child
            this.Question_Trees_Shift_Order(child_index, heirarchy_level, false);
          }
        }
        else {
          // set order-no of new sibling question
          let order_no_new_question = order_no_stem !== "" ? `${order_no_stem}.${Number(order_no_leaf) + 1}` : `${Number(order_no_leaf) + 1}`;

          // get index of next sibling question
          const sibling_index: number = this.Question_Closest_Sibling_Index(question_index, heirarchy_level, false, questions);

          // set insert index
          insert_index = sibling_index !== -1 ? sibling_index : insert_index;
          
          // set order-no of new sibling question
          question_new[fields.question.question_order_no.key] = order_no_new_question;

          // increment order no of sibling questions to make space for new sibling
          this.Question_Trees_Shift_Order(insert_index,heirarchy_level, false);
        }
        // insert the new question
        (async () => { arr_helpers.insert(insert_index, question_new); })().then(() => {
          if (this.prop.ref_questions[insert_index]) this.Scroll_To_Element(this.prop.ref_questions[insert_index]);
        });
        return;
      }
      case Rule.Question_Update: {
        const data: { index: number } = e.data;
        const question_index = data.index;
        const questions: object[] = this.values[fields.questionnaire.questions.key];
        const question: object = questions[question_index];
        const guid: string = question[fields.question.guid.key];
        
        // check if target question is already in updated questions array
        const matched_index: number = this.prop.questions_updated.indexOf(guid);

        if (matched_index === -1) {
          // insert to the start of array
          this.prop.questions_updated.push(guid);
        }
        else {
          // replace with updated question object
          this.prop.questions_updated[matched_index] = guid;
        }
        return;
      }
      case Rule.Question_Delete: {
        const data: { index: number, arr_helpers: FieldArrayRenderProps } = e.data;
        let questions: object[] = this.values[fields.questionnaire.questions.key];
        const question: object = questions[data.index];
        const index: number = data.index;
        const arr_helpers = data.arr_helpers;
       
        // the questionnaire must have atleast one root question at all times
        // let's check if this is the only root question or not
        if (!question[fields.question.question_parent_id.key]) {
          // this is certainly a root question but is it the only one. let's check
          const root_questions: object[] = questions.filter(q => !q[fields.question.question_parent_id.key]);
          if (root_questions.length === 1) return;
        }

        const order_no: string = question[fields.question.question_order_no.key];
        const order_no_split: string[] = order_no.split(".");
        const heirarchy_level: number = order_no_split.length - 1;
        
        (async () => {
          // get questions to be deleted
          const question_tree = questions.filter(q => q[fields.question.question_order_no.key].lastIndexOf((order_no), 0) !== -1);
          console.log(question_tree);

          for (const _question of question_tree) {
            // mark question for deletion
            const question_id = _question[fields.question.question_id.key];
            if (question_id) this.prop.questions_deleted.push(_question);

            // get unique identifier of current question
            const guid = _question[fields.question.guid.key];

            // get snapshot of questions with updated indexes
            questions = this.values[fields.questionnaire.questions.key];
            
            // get index of current question by its unique identifier
            const _index = questions.map(q => q[fields.question.guid.key]).indexOf(guid);

            // remove question from questions array
            await arr_helpers.remove(_index);
          }
          // get snapshot of questions with updated indexes
          questions = this.values[fields.questionnaire.questions.key];

          // check if deleted quesion had any siblings
          if (questions[index]) {
            const _question: object = questions[index];
            const _order_no: string = _question[fields.question.question_order_no.key];
            const _order_no_split: string[] = _order_no.split(".");
            const _heirarchy_level: number = _order_no_split.length - 1;
            if (heirarchy_level === _heirarchy_level) {
              // shift up order-no of siblings of deleted question
              this.Question_Trees_Shift_Order(index, heirarchy_level, true);
            }
          }
        })();
        return;
      }
      case Rule.Question_Move: {
        const data: { index: number, up: boolean, arr_helpers: FieldArrayRenderProps } = e.data;
        const up = data.up;
        const index: number = data.index;
        let questions: object[] = this.values[fields.questionnaire.questions.key];

        // check which direction the question needs to be shifted
        const shift_index: number = data.up ? data.index - 1 : data.index + 1;

        // ignore if the question is the top/bottom most in the array
        if (shift_index < 0 || shift_index === questions.length) return;
        
        const question = questions[index];
        const order_no: string = question[fields.question.question_order_no.key];
        const question_order_split: string[] = order_no.split(".");
        const heirarchy_level = question_order_split.length - 1;

        // get unique idendifier of current question
        const guid = question[fields.question.guid.key];
        
        // get index of closest sibling question
        const index_sibling: number = this.Question_Closest_Sibling_Index(index, heirarchy_level, up, questions);
        
        // return if no sibling found
        if (index_sibling === -1) return;

        // get subling question
        const question_sibling = questions[index_sibling];
        
        // take a snapshot of sibling question and its childs
        const order_no_sibling = question_sibling[fields.question.question_order_no.key];
        const question_sibling_and_childs = questions.filter(q => q[fields.question.question_order_no.key].lastIndexOf((order_no_sibling), 0) !== -1);

        // take a snapshot of current question and its childs
        const question_cur_and_childs = questions.filter(q => q[fields.question.question_order_no.key].lastIndexOf((order_no), 0) !== -1);
        
        (async () => {
          await Promise.all(
            [
              this.Question_Tree_Shift_Order(question_cur_and_childs, heirarchy_level, up),
              this.Question_Tree_Shift_Order(question_sibling_and_childs, heirarchy_level, !up)
            ]
          );
          // get updated snapshot of questions
          questions = this.values[fields.questionnaire.questions.key];

          // sort the array by order no
          const _questions = questions.sort((q1: object, q2: object) => q1[fields.question.question_order_no.key].localeCompare(q2[fields.question.question_order_no.key]));
          
          // note: setFieldValue is async therefore we must use async-await
          await this.form.setFieldValue(fields.questionnaire.questions.key, _questions);
          
          // scroll to current question. use unique indentifier to track down the question
          const matched_index: number = _questions.map((q: object) => q[fields.question.guid.key]).indexOf(guid);
          if (matched_index !== -1) this.Scroll_To_Element(this.prop.ref_questions[matched_index]);
        })();
        return;
      }
      case Rule.Choice_Add: {
        const data: { q_index: number, arr_helpers: FieldArrayRenderProps } = e.data;
        const question_index = data.q_index;
        const arr_helpers = data.arr_helpers;
        arr_helpers.push("");

        // mark question for update
        this.Formatting({ rule: Rule.Question_Update, data: { index: question_index } });
        
        return;
      }
      case Rule.Choice_Delete: {
        const data: { index: number, q_index: number, arr_helpers: FieldArrayRenderProps } = e.data;
        const arr_helpers = data.arr_helpers;
        const choice_index = data.index;
        const question_index = data.q_index;
        const questions: object[] = this.values[fields.questionnaire.questions.key];
        const question: object = questions[question_index];
        const choices = questions[question_index][fields.question.answer_choices.key];

        // no need to execute this rule if there is just 1 choice
        if (choices.length === 1) return;
        arr_helpers.remove(choice_index);

        // mark question for update
        this.Formatting({ rule: Rule.Question_Update, data: { index: question_index } });

        // get questions id
        const question_id: number = question[fields.question.question_id.key];
        
        // set starting index of loop
        let index = question_index + 1;

        // check if deleted choice was selected in "show if parent response" field of child questions
        while (index < questions.length) {
          let _question = questions[index];
          let _question_parent_id: number = _question[fields.question.question_parent_id.key];
          if (_question_parent_id === question_id) {
            const show_if_parent_response_is: string = _question[fields.question.question_show_if_parent.key];
            if (show_if_parent_response_is.indexOf(choices) === -1) {
              _question[fields.question.question_show_if_parent.key] = "";
              this.form.setFieldValue(`${fields.questionnaire.questions.key}.${index}.${fields.question.question_show_if_parent}`, "");
            }
            index++;
          }
          else {
            break;
          }
        }
        return;
      }
      case Rule.Disabled_Field: {
        let disabled = false;

        // some fields may be part of a field array or object
        const keys = e.target.split(".");
        const key = keys[0];
        const index = keys[1];

        // question fields
        if (key === fields.questionnaire.questions.key) {
          const _key = keys[2];
          switch (_key) {
            case fields.question.question_type.key: {
              break;
            }
          }
          // execute global rules outside switch case
          const question = this.values[fields.questionnaire.questions.key][index];
          const question_id = question[fields.question.question_id.key];
          //disabled = !question_id ? true : disabled;
        }

        // questionnaire fields
        else {
          const _key = key;
          switch (_key) {
            case fields.questionnaire.questionnaire_title.key: {
              break;
            }
          }
        }
        return disabled;
      }
      case Rule.Disabled: {
        let disabled = false;
        disabled = this.prop.submitting ? true : disabled;
        disabled = this.state.error ? true : disabled;
        disabled = this.state.questionnaire_distributed ? true : disabled;
        return disabled;
      }
    }
  }
  
  public Initiate_Auto_Save() {
    this.prop.auto_save = setInterval(() => {
      this.On_Submit(false);
    }, this.prop.auto_save_interval);
  }

  public On_Change(target: string) {
    // some fields may be part of a field array or object
    const keys = target.split(".");
    const key = keys[0];

    // question fields
    if (key === fields.questionnaire.questions.key) {
      switch (key) {
        case fields.question.question_type.key: {
          break;
        }
      }
      // execute global rules outside switch case
      const index = keys[1];
      this.Formatting({ rule: Rule.Question_Update, target: key, data: { index: index } });
    }

    // questionnaire fields
    else {
      switch (key) {
        case fields.questionnaire.questionnaire_title.key: {
          break;
        }
      }
      // execute global rules outside switch case
      this.Formatting({ rule: Rule.Questionnaire_Update, target: key });
    }
  }
  
  public On_Submit(auto_save: boolean)  {
    
    // function: handles manaual & auto save
    const submit = async () => {
      let res: AxiosResponse = null;
      const questions: object[] = this.values[fields.questionnaire.questions.key];
      const questionnaire_id: number = this.values[fields.questionnaire.questionnaire_id.key];
      const answers_list: IUrl = this.values[fields.questionnaire.questionnaire_answer_list.key];
      
      // note: to reduce execution time, the creation of new questions..
      // in questions list is handled at runtime

      // get questionnaire notification count
      res = await this.Get_Notification_Count(questionnaire_id).then(this.Response_Handler);
      if (!res) return;

      // questionnaire cannot be modified once it has been sent out to end users
      const notification_count = res.data.value;
      if (notification_count.length) {
        this.setState({ questionnaire_distributed: true });
        return;
      }

      // function: update questionnaire
      const questionnaire_update = async () => {
        const questionnaire_updated: boolean = this.values[fields.questionnaire.__updated.key];
        if (questionnaire_updated) {
          if (auto_save) {
            // reset the update flag
            this.form.setFieldValue(fields.questionnaire.__updated.key, false);
          }
          const response = await this.Save_Questionnaire(HTTP_Method.MERGE).then(this.Response_Handler);
          return response;
        }
      };

      const questions_create = async () => {
        const questions_created = questions.filter(q => q[fields.question.question_id.key] === 0);
        const results = await Promise.all(
          questions_created.map(async (question) => {
            let response: AxiosResponse = null;

            // save question to questions list
            response = await this.Save_Question(HTTP_Method.POST, question).then(this.Response_Handler);
            if (!response) return response;

            // get unique identifier of question
            const guid: string = question[fields.question.guid.key];

            // assign the returned question id
            const _question = questions.filter((q) => q[fields.question.guid.key] === guid).pop();
            if (_question) {
              // set generated question id
              const question_id = response.data[maps.sp_cols._generic.Id];

              // get unique identifier of question
              const question_guid = _question[fields.question.guid.key];

              // get index of question
              const question_index = questions.map(q => q[fields.question.guid.key]).indexOf(question_guid);

              // set question id form field
              this.form.setFieldValue(`${fields.questionnaire.questions.key}.${question_index}.${fields.question.question_id}`, question_id);

              // set answer column title & url
              const answer_col_uri: string = _question[fields.question.answer_column.key];
              let answer_col_title = _question[fields.question.question_order_no.key] + ". " + _question[fields.question.question_desc.key];
              answer_col_title = answer_col_title.length > 256 ? answer_col_title.substring(0, 256) : answer_col_title;

              // set answer column payload
              const answer_col: ISP_Field = {
                __metadata: { type: Entity_Type.Field },
                FieldTypeKind: Field_Type.Note,
                Title: answer_col_title,
                Description: "",
                SchemaXml: "<Field  Name='" + answer_col_uri + "' DisplayName='" + answer_col_title + "' Type='" + Data_Type.Note + "' />"
              };
              // get answers list
              const answer_list: IUrl = this.values[fields.questionnaire.questionnaire_answer_list.key];

              // create answer column in answers list
              response = await this.Save_Column(HTTP_Method.POST, answer_list.title, answer_col_uri, Entity_Type.Field, answer_col).then(this.Response_Handler);
              return response;
            }
            else {
              // Oops! the question was deleted by user while auto-save was running
              this.prop.questions_deleted.push(question);
            }
          })
        );
        return !results.some((r) => !r);
      };

      // function: delete questions
      const questions_delete = async () => {
        const questions_deleted = this.prop.questions_deleted.splice(0, this.prop.questions_deleted.length - 1);
        const results = await Promise.all(
          questions_deleted.map(async (question) => {
            // delete question from answers list
            let response = await this.Save_Question(HTTP_Method.DELETE, question);
            if (!response) return response;

            // delete answer column from answers list
            const answer_col_uri = question[fields.question.answer_column.key];
            response = await this.Save_Column(HTTP_Method.DELETE, answers_list.title, answer_col_uri);
            return response;
          })
        );
        return !results.some((r) => !r);
      };
      
      // function: update questions
      const questions_update = async () => {
        const questions_updated = this.prop.questions_updated.splice(0, this.prop.questions_updated.length - 1);
        const results = await Promise.all(
          questions_updated.map(async (guid) => {
            let response: AxiosResponse = null;
            const question = questions.filter(q => q[fields.question.guid.key] === guid).pop();

            // skip: question either no longer exists or not assigned an id yet
            if (!question || !question[fields.question.question_id.key]) return true;

            response = await this.Save_Question(HTTP_Method.MERGE, question);
            if (!response) return response;
            
            // update answer column prop of new question
            const answer_col_uri = question[fields.question.answer_column.key];

            // update title of answer columns of all questions
            let answer_col_title = question[fields.question.question_order_no.key] + ". " + question[fields.question.question_desc.key];
            answer_col_title = answer_col_title.length > 0 ? answer_col_title.substring(0, 256) : answer_col_title;

            const answer_col: ISP_Field = {
              __metadata: { type: Entity_Type.Field },
              FieldTypeKind: Field_Type.Note,
              Title: answer_col_title,
              Description: ""
            };
            response = await this.Save_Column(HTTP_Method.MERGE, answers_list.title, answer_col_uri, Entity_Type.Field, answer_col);
            return response;
          })
        );
        return results;
      };

      // parallel tasks: update questionnaire and questions list
      const batch_1 = await Promise.all([questionnaire_update, questions_create(), questions_update(), questions_delete()]);
      if (batch_1.some((r) => !r)) return;
      
      // maintaining answer list view columns on auto-save is not advisable since..
      // this is an expensive task. this logic will only run on manaul save
      if (!auto_save) {
        // questionnaire view column
        const questionnaire_col_uri = maps.sp_cols.questions.Questionnaire;

        // reset default view cols of answers list
        res = await this.Reset_List_View(HTTP_Method.POST, answers_list.title).then(this.Response_Handler);
        if (!res) return;
        
        // add questionnaire lookup column to default view of answers list
        const questionnaire_col = () => this.Save_View_Column(HTTP_Method.POST, answers_list.title, questionnaire_col_uri).then(this.Response_Handler);
        
        // add author column to default view of answers list
        const author_col = () => this.Save_View_Column(HTTP_Method.POST, answers_list.title, maps.sp_cols._generic.Author).then(this.Response_Handler);
        
        // remove title column from default view of answers list
        const remove_title = () => this.Save_View_Column(HTTP_Method.DELETE, answers_list.title, maps.sp_cols._generic.LinkTitle).then(this.Response_Handler);
        
        // add answer cols to default view of answers list
        const add_answer_view_cols = async () => {
          const results = await Promise.all(questions.map(async (question, i) => {
            // answer view column
            const answer_col = question[fields.question.answer_column.key];

            // add author column to default view of answers list
            return await this.Save_View_Column(HTTP_Method.POST, answers_list.title, answer_col).then(this.Response_Handler);
          }));
          return !results.some((r) => !r);
        };
        // parallel tasks: add/remove columns in default view of answers list
        const batch_2 = await Promise.all([questionnaire_col, author_col, remove_title, add_answer_view_cols]);
        if (batch_2.some((r) => !r)) return;
      }
      // reset auto save state
      if (auto_save) this.setState({ auto_saving: false });
      
      // redirect back to source
      const src_url = this.prop.url_params[maps.params.src];
      if (!auto_save) setTimeout(() => { window.location.href = src_url ? src_url : config.paths.web; }, 1500);
    };

    (async () => {
      if (auto_save) {
        if (this.state.auto_saving) return;
        this.setState({ auto_saving: true });
        submit().catch((err) => this.Exception(err));
      }
      else {
        if (Object.keys(this.prop.validation_errs).length > 0) return;
        this.form.setSubmitting(true);
        if (this.state.auto_saving) {
          // wait for auto save to complete
          const wait = setInterval(() => {
            if (!this.state.auto_saving) {
              clearInterval(wait);
              clearInterval(this.prop.auto_save);
              submit().catch((err) => this.Exception(err));
            }
          }, 500);
        }
        else {
          submit().catch((err) => this.Exception(err));
        }
      }
    })().catch((err) => this.Exception(err));
  }

  public Scroll_To_Element(ref: React.RefObject<HTMLDivElement>) {
    if (ref.current) {
      ref.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  public Response_Handler(res: AxiosResponse): AxiosResponse {
    if (res.status >= 400) {
      this.HTTP_Exception({ error: res, status: res.status });
      return null;
    }
    else {
      return res;
    }
  }

  public Error_Handler(err: any): null {
    this.Exception(err);
    return null;
  }

  public Exception(err: any) {
    err.response ?
      this.HTTP_Exception({ error: err.response, status: err.response.status }) :
      this.Log({ log: err, type: LogType.Error });
  }

  public HTTP_Exception(e: IHTTP_Exception) {
    switch (e.status) {
      case 400: {
        break;
      }
      case 401: {
        break;
      }
      case 402: {
        break;
      }
      case 403: {
        break;
      }
      case 404: {
        break;
      }
      case 409: {
        break;
      }
    }
    this.Log({ type: LogType.Error, log: e.error });
  }

  public Log(e: ILog) {
    if (e.log && e.type) {
      let url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.log.title + "')/items";
      e.log = !e.log ? "" : typeof (e.log) === "object" ? Object.keys(e.log).length ? JSON.stringify(e.log) : e.log.toString() : e.log.toString();

      let item = {
        [maps.sp_cols._generic.Title]: config.app,
        [maps.sp_cols.log.Log]: e.log,
        [maps.sp_cols.log.LogType]: e.type,
        [maps.sp_cols.log.UserId]: config.user.Id
      };

      Post(url, config.paths.api, "post", item).then(() => {
        if (e.type === LogType.Error && !this.state.error) {
          this.state.pre_render ? this.setState({ error: true }) : this.setState({ pre_render: true, error: true });
          this.Scroll_To_Element(this.prop.ref_err);
        }
      }).catch((err) => {
        console.log(err);
      });
    }
  }

  public On_Close() {
    const src_url = this.prop.url_params[maps.params.src];
    window.location.href = src_url ? src_url : config.paths.web;
  }

  public Init_Values() {
    let values = {};
    Object.keys(fields.questionnaire).forEach(key => {
      const field = fields.questionnaire[key];
      if (key === field.key) {
        values[field.key] = field.value;
      }
    });
    return values;
  }
  
  public componentDidMount() {
    if (!this.state.pre_render) {
      const params = this.prop.url_params;
      let questionnaire_id: number = params[maps.params.questionnaire_id];
      
      if (!Number(questionnaire_id)) questionnaire_id = 0;

      // set id as default value of questionnaire id field
      fields.questionnaire.questionnaire_id.value = Number(questionnaire_id);

      // Set Environment
      if (this.props.env_type !== EnvironmentType.Local && this.props.env_type !== EnvironmentType.Test) {
        config.env = EnvironmentType.SharePoint;
        config.paths.api = this.props.context.pageContext.web.absoluteUrl;
        config.paths.web = this.props.context.pageContext.web.absoluteUrl;
        config.paths.site = this.props.context.pageContext.site.absoluteUrl;
        config.paths.current = this.props.context.pageContext.site.serverRequestPath;
      }
      
      // Function Declaration: Get Questionnaire List Id
      const get_questionnaire_list_id = () => {
        const url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.questionnaire.title + "')/" + maps.sp_cols._generic.Id;
        return Get(url).then((res) => {
          if (res.data) {
            maps.sp_lists.questionnaire.id = res.data.value;
          }
          return res;
        });
      };

      // Function Declaration: Get Questionnaire Groups
      const get_questionnaire_groups = () => {
        const select = "?$select=Id,Title";
        const url = config.paths.api + "/_api/web/lists/getbytitle('" + maps.sp_lists.groups.title + "')/items" + select;
        return Get(url).then((res) => {
          if (res.data) {
            const results: ILookup[] = res.data.value;
            dropdowns.groups.length = 0;
            dropdowns.groups.push(...results);
          }
          return res;
        });
      };
      
      // Function Declaration: Get Current User
      const get_user = () => {
        const url = config.paths.api + "/_api/web/currentuser";
        return Get(url).then((res) => {
          if (res.data) {
            const usr: IPerson = res.data;
            config.user = { Id: usr.Id, Name: usr.Name, Title: usr.Title };
            fields.questionnaire.questionnaire_author.value = config.user;
          }
          return res;
        });
      };
      
      const batch = async () => {
        let res: AxiosResponse = null;
        res = await get_user().then(this.Response_Handler);
        if (!res) return;
        res = await get_questionnaire_list_id().then(this.Response_Handler);
        if (!res) return;
        res = await get_questionnaire_groups().then(this.Response_Handler);
        if (!res) return;
        if (questionnaire_id) {
          res = await this.Get_Questionnaire(questionnaire_id).then(this.Response_Handler);
          if (!res) return;
          const result: IQuestionnaire = res.data;
          if (result[maps.sp_cols._generic.Id]) fields.questionnaire.questionnaire_id.value = result[maps.sp_cols._generic.Id];
          if (result[maps.sp_cols._generic.Title]) fields.questionnaire.questionnaire_title.value = result[maps.sp_cols._generic.Title];
          if (result[maps.sp_cols.questionnaire.Heading]) fields.questionnaire.questionnaire_heading.value = result[maps.sp_cols.questionnaire.Heading];
          if (result[maps.sp_cols.questionnaire.Year]) fields.questionnaire.questionnaire_year.value = result[maps.sp_cols.questionnaire.Year];
          if (result[maps.sp_cols.questionnaire.Statement]) fields.questionnaire.questionnaire_statement.value = result[maps.sp_cols.questionnaire.Statement];
          if (result[maps.sp_cols.questionnaire.Status]) fields.questionnaire.questionnaire_status.value = result[maps.sp_cols.questionnaire.Status];
          if (result[maps.sp_cols._generic.Author]) fields.questionnaire.questionnaire_author.value = result[maps.sp_cols._generic.Author];
          if (result[maps.sp_cols.questionnaire.Group]) fields.questionnaire.questionnaire_group.value = result[maps.sp_cols.questionnaire.Group][maps.sp_cols._generic.Id];
          if (result[maps.sp_cols.questionnaire.AnswersListTitle]) fields.questionnaire.questionnaire_answer_list.value.title = result[maps.sp_cols.questionnaire.AnswersListTitle];
          if (result[maps.sp_cols.questionnaire.AnswersListUrl]) fields.questionnaire.questionnaire_answer_list.value.url = result[maps.sp_cols.questionnaire.AnswersListUrl];

          res = await this.Get_Questions(questionnaire_id).then(this.Response_Handler);
          if (!res) return;

          const results: IQuestion[] = res.data.value;
          const questions = [];
          results.map((v: IQuestion) => {
            // create new question object
            const question = this.Question_Instance();

            question[fields.question.question_id.key] = v.Id ? v.Id : fields.question.question_id.value;
            question[fields.question.question_type.key] = v.QuestionType ? v.QuestionType : fields.question.question_type.value;
            question[fields.question.question_show_if_parent.key] = v.ShowIFParentAnswer ? v.ShowIFParentAnswer : fields.question.question_show_if_parent.value;
            question[fields.question.question_desc.key] = v.Question ? v.Question : fields.question.question_desc.value;
            question[fields.question.question_order_no.key] = v.OrderNo ? v.OrderNo : fields.question.question_order_no.value;
            question[fields.question.question_heading.key] = v.Heading ? v.Heading : fields.question.question_heading.value;
            question[fields.question.answer_column.key] = v.AnswerColumnName ? v.AnswerColumnName : fields.question.answer_column.value;
            question[fields.question.answer_choices.key] = v.Choices ? v.Choices.split(";") : fields.question.answer_choices.value;
            question[fields.question.answer_required.key] = v.Required ? v.Required : fields.question.answer_required.value;
            questions.push((question));
          });
          fields.questionnaire.questions.value = questions;

          if (results.length === 0) {
            // create a question as a starting point for user
            const question = this.Question_Instance();
            const time_stamp = new Date().getTime();
            
            // save question to questions list
            res = await this.Save_Question(HTTP_Method.POST, question).then(this.Response_Handler);
            if (!res) return;

            // set generated question id
            question[fields.question.question_id.key] = res.data[maps.sp_cols._generic.Id];
            
            // set answer column prop of new question
            const answer_col_uri = "Question_" + time_stamp;
            let answer_col_title = question[fields.question.question_order_no.key] + ". " + question[fields.question.question_desc.key];
            answer_col_title = answer_col_title.length > 256 ? answer_col_title.substring(0, 256) : answer_col_title;

            // set answer column prop of new question
            question[fields.question.answer_column.key] = answer_col_uri;

            // define answer column
            const answer_col: ISP_Field = {
              __metadata: { type: Entity_Type.Field },
              FieldTypeKind: Field_Type.Note,
              Title: answer_col_title,
              Description: "",
              SchemaXml: "<Field  Name='" + answer_col_uri + "' DisplayName='" + answer_col_title + "' Type='" + Data_Type.Note + "' />"
            };
            // const answers list
            const answers_list: IUrl = fields.questionnaire.questionnaire_answer_list.value;

            // create answer column in answers list
            res = await this.Save_Column(HTTP_Method.POST, answers_list.title, answer_col_uri, Entity_Type.Field, answer_col).then(this.Response_Handler);
            if (!res) return;
          }
          res = await this.Get_Notification_Count(questionnaire_id).then(this.Response_Handler);
          if (!res) return;
          const notification_count: number = res.data.value;
          if (notification_count > 0) this.setState({ questionnaire_distributed: true });
        }
        // initiate autosave
        // if (questionnaire_id) this.Initiate_Auto_Save();
        
        // pre-render complete
        this.setState({ pre_render: true, questionnaire_ready: questionnaire_id ? true : false });
      };
      batch().catch(err => this.Error_Handler(err));
    }
  }

  public render() {
    return this.state.pre_render ? (
      <Formik
        validateOnChange={true}
        validateOnBlur={true}
        validationSchema={validation}
        enableReinitialize={false}
        onSubmit={(e) => this.form.setSubmitting(false)}
        initialValues={this.Init_Values()}
        ref={e => this.form = e}
        render={({ values, errors, isSubmitting,  }) => {
          this.values = values;
          const error = this.state.error;
          const submitting = isSubmitting;
          const invalid = Object.keys(errors).length ? true : false;
          const url_params = this.prop.url_params;
          
          // formik props that are needed globally
          this.prop.submitting = submitting;
          this.prop.invalid = invalid;
          this.prop.validation_errs = errors;

          return (
            <div className={styles.app}>
              <Form>
                <div className={styles.grid}>
                  {this.Render_Questionnaire()}
                  {
                    error ?
                      <div className={styles.row}>
                        <div className={styles.col_12}>
                          <div ref={this.prop.ref_err} className={styles.error}>Sorry! something went wrong. We're working on it.</div>
                        </div>
                      </div> : null
                  }
                </div>
              </Form>
              {
                url_params[maps.params.debug] ?
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
    ) : (<div>Loading Application. Please Wait...</div>);
  }
}

export default Main;
