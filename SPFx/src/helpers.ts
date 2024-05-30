import axios, { AxiosError } from 'axios';
import { List_Title_Logs } from './constants';
import { Log_Type } from './enums';

export const Get = (url: string) => {
  const headers = {
    "Accept": "application/json;odata=nometadata"
  };
  return axios({
    url: url,
    method: "GET",
    timeout: 30000,
    headers: headers
  });
};

export const Post = (api_url: string, web_url: string, method: string, data: any = {}, stringify: boolean = true) => {
  const headers = {};
  return axios({
    url: web_url + "/_api/contextinfo",
    method: "POST",
    timeout: 30000,
    headers: headers
  }).then((res) => {
    method = method ? method.toUpperCase() : "POST";
    headers["Accept"] = "application/json;odata=nometadata";
    headers["IF-MATCH"] = "*";
    headers["X-HTTP-Method"] = method;
    headers["X-RequestDigest"] = res.data.FormDigestValue;

    if (method === "DELETE") {
      return axios({
        url: api_url,
        method: "POST",
        timeout: 30000,
        headers: headers
      });
    }
    else {
      headers["Content-Type"] = data.__metadata ? "application/json;odata=verbose" : "application/json;odata=nometadata";
      return axios({
        url: api_url,
        method: "POST",
        timeout: 30000,
        data: stringify ? JSON.stringify(data) : data,
        headers: headers
      });
    }
  });
};

export const Get_Digest = (web_url) => {
  const headers = {
    "Accept": "application/json;odata=nometadata"
  };
  return axios({
    url: web_url + "/_api/contextinfo",
    method: "POST",
    timeout: 30000,
    headers: headers
  });
};

export const Log = (log: any, log_type: Log_Type, app_title: string, web_url: string) => {
  const url = web_url + "/_api/web/lists/getbytitle('" + List_Title_Logs + "')/items";
  log = !log ? "" : typeof(log) === "object" ? Object.keys(log).length ? JSON.stringify(log) : log.toString() : log.toString();

  const body = {
    Title: app_title,
    Log: log,
    LogType: log_type
  };
  return Post(url, web_url, "post", body);
};

export const HTTP_Exception = (e: AxiosError) => {
  // define global application behavior rules based on http code
  switch (e.request.status) {
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
};

export const Exception = async (err: any, app_title: string, web_url: string, callback_func?: Function) => {  
  // log to console
  console.log("Error occured in application: ", app_title, '\n', err);
  // log to list
  await Log(err.reponse !== undefined ? err.response : err, Log_Type.Error, app_title, web_url);
  // check if this is an http error
  if (err.request !== undefined && err.request.status != undefined) {
    // optional: further processing based on http response code
    HTTP_Exception(err);
  }
  if (callback_func) {
    callback_func(err);
  }
};

export const Is_Object_Empty = (obj) => {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop))
      return false;
  }
  return true;
};

export const SP_List_Item_Type = (name) => {
  return (
    "SP.Data." + name.charAt(0).toUpperCase() + name.split(" ").join("").slice(1)
      .replace("-", "")
      .replace("_", "_x005f_") + "ListItem"
  );
};

export const Url_Params = (url?) => {
  url = !url ? url = window.location.href : url;
  var params = {};
  var parser = document.createElement('a');
  parser.href = url;
  var query = parser.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    params[pair[0]] = decodeURIComponent(pair[1]);
  }
  return params;
};

export const Key_Value_Pair = (object: object): object => {
  let obj = {};
  Object.keys(object).map((key) => { obj[object[key].key] = object[key].value; });
  return obj;
};

export const Redirect = (url: string, no_delay?: boolean) => {
  setTimeout(() => {
    window.location.href = url;
  }, no_delay ? 0 : 1500);
};

export const UUID_v4 = () => {
  // note: for a more robust solution consider node-uuid: github.com/uuidjs/node-uuid
  return (
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    })
  );
};

export const CKEditor4_Config = {
  allowedContent: true,
  resize_enabled: false,
  enterMode: 3,
  shiftEnterMode: 2,
  // Note: some ckeditor4 built-in plugins require additional polyfills
  plugins: "toolbar,wysiwygarea,sourcearea,basicstyles,clipboard,removeformat,format,font,colorbutton,undo,list,listblock,liststyle,indent,indentblock,justify,link,table,tabletools,tableselection,tableresize,horizontalrule,showborders",
  removeButtons: 'Subscript,Superscript',
  toolbar: [
    ["Cut", "Copy", "Undo", "Redo", "RemoveFormat"],
    ["Bold", "Italic", "Underline", "Strike"],
    ["TextColor", "BGColor"],
    ["NumberedList", "BulletedList"],
    ["Outdent", "Indent", "Align"],
    ["JustifyLeft", "JustifyCenter", "JustifyRight", "JustifyBlock"],
    ["Format", "Font", "FontSize"],
    ["Link", "Unlink", "HorizontalRule", "Table"],
    ["Source"]
  ]
};
