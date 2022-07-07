(function (win, doc, undefined) {
  var App = {
    Init: function () {
      var self = this;
      App.Helper.Import(self);
    },
    Helper: {
      Import: function (self) {
        var obj;
        for (obj in self) {
          if (self.hasOwnProperty(obj)) {
            var _method = self[obj];
            if (_method.selector !== undefined && _method.init !== undefined) {
              if (document.querySelector(_method.selector)) {
                _method.init();
              }
            }
          }
        }
      },
    },
    Default: {
      selector: 'body',
      code: null,
      html: null,
      css: null,
      js: null,
      console: null,
      init: function () {
        const el = this;
        el.code = document.getElementById('code').contentWindow.document;
        el.console = document.getElementById('console');

        el.html = CodeMirror.fromTextArea(document.querySelector('#html'), {
          lineNumbers: true,
          matchBrackets: false,
          extraKeys: { 'Ctrl-Space': 'autocomplete' },
          autoCloseTags: true,
          lint: true,
          theme: 'night',
          mode: 'xml',
          matchClosing: true,
          htmlMode: true,
          styleActiveLine: true,
          gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        });
        el.html.on('focus', function () {
          document.querySelector('.editors').classList.add('active-html');
        });
        el.html.on('blur', function () {
          document.querySelector('.editors').classList.remove('active-html');
        });
        el.js = CodeMirror.fromTextArea(document.querySelector('#js'), {
          lineNumbers: true,
          matchBrackets: true,
          mode: 'javascript',
          theme: 'night',
          extraKeys: { 'Ctrl-Space': 'autocomplete' },
          gutters: ['CodeMirror-lint-markers'],
          dragDrop: true,
          lint: { options: { esversion: 2021 } },
        });
        el.js.on('focus', function () {
          document.querySelector('.editors').classList.add('active-js');
        });
        el.js.on('blur', function () {
          document.querySelector('.editors').classList.remove('active-js');
        });
        el.css = CodeMirror.fromTextArea(document.querySelector('#css'), {
          lineNumbers: true,
          matchBrackets: true,
          highlightNonStandardPropertyKeywords: true,
          mode: 'css',
          autoCloseTags: true,
          theme: 'night',
          extraKeys: { 'Ctrl-Space': 'autocomplete' },
          value: document.documentElement.innerHTML,
          gutters: ['CodeMirror-lint-markers'],
          dragDrop: true,
          lint: true,
        });
        el.css.on('focus', function () {
          document.querySelector('.editors').classList.add('active-css');
        });
        el.css.on('blur', function () {
          document.querySelector('.editors').classList.remove('active-css');
        });

        const scripts = localStorage.getItem('scripts');
        const activeIndex = localStorage.getItem('activeIndex');
        if (scripts) {
          el.getSelectOptions();
        }
        if (activeIndex) {
          document.getElementById('activeIndex').value = activeIndex;
          if (localStorage.getItem('activeIndex') != '') {
            document.querySelector('[name="history"]').value = activeIndex;
          }
          App.GetHistoryByIndexData(activeIndex);
        }
      },
      minimize: function () {
        const classList = document.querySelector('.app').classList;
        if (!classList.contains('minimize-editors-animate')) {
          classList.add('minimize-editors');
          setTimeout(() => {
            classList.add('minimize-editors-animate');
          }, 300);
        } else {
          classList.remove('minimize-editors-animate');
          setTimeout(() => {
            classList.remove('minimize-editors');
          }, 300);
        }
      },
      codeControl: function () {
        const el = this;
        let error = 0;
        el.js.operation(function () {
          error = this.JSHINT.errors.length;
          App.Console.add(this.JSHINT.errors);
        });
        el.html.operation(function () {
          //error = this.JSHINT.errors.length;
          //App.Console.add(this.JSHINT);
        });
        return error;
      },
      compile: function () {
        const el = this;
        if (el.codeControl() === 0) {
          console.log('Reloaded');
          el.code.open();
          el.code.writeln(el.html.getValue() + '<style>' + el.css.getValue() + '</style><script>' + el.js.getValue() + '</script>');
          el.code.close();
        }
      },
      getSelectOptions: function () {
        const el = this;
        const allData = JSON.parse(localStorage.getItem('scripts'));
        const select = document.querySelector('[name="history"]');

        for (const option of [...select.options]) {
          if (option.value != '') {
            option.remove();
          }
        }

        allData.map(function (opt, i) {
          let option = document.createElement('option');
          option.value = i;
          option.innerText = opt.name;
          select.appendChild(option);
        });
      },
      save: function () {
        const el = this;
        let allData = JSON.parse(localStorage.getItem('scripts'));
        if (localStorage.getItem('activeIndex')) {
          allData[localStorage.getItem('activeIndex')].html = el.html.getValue();
          allData[localStorage.getItem('activeIndex')].js = el.js.getValue();
          allData[localStorage.getItem('activeIndex')].css = el.css.getValue();
          localStorage.setItem('scripts', JSON.stringify(allData));
        } else {
          let fileName = prompt('Please enter file name', '');
          if (fileName != '') {
            let newData = {
              name: fileName,
              html: el.html.getValue(),
              js: el.js.getValue(),
              css: el.css.getValue(),
            };
            let data = [];
            data.push(newData);
            if (allData) {
              allData.forEach((item) => {
                data.push(item);
              });
            }
            localStorage.setItem('scripts', JSON.stringify(data));
            el.getSelectOptions();
            document.querySelector('[name="history"]').value = 0;
          } else {
            alert('File name required!');
            return false;
          }
        }
        document.getElementById('saveBtn').innerText = 'Saving...';
        setTimeout(() => {
          document.getElementById('saveBtn').innerText = 'SAVE';
        }, 1000);
      },
    },
    GetHistoryData: function (el) {
      localStorage.setItem('activeIndex', el.value);
      document.getElementById('activeIndex').value = el.value;
      if (el.value != '') {
        App.GetHistoryByIndexData(el.value);
      } else {
        App.Default.html.setValue('');
        App.Default.js.setValue('');
        App.Default.css.setValue('');
        App.Default.compile();
      }
    },
    GetHistoryByIndexData: function (index) {
      const allData = JSON.parse(localStorage.getItem('scripts'));
      App.Default.html.setValue(allData[index].html);
      App.Default.js.setValue(allData[index].js);
      App.Default.css.setValue(allData[index].css);
      App.Default.compile();
    },
    Console: {
      selector: '.console__body',
      error: 'errorLength',
      clear: function () {
        const el = this;
        document.querySelector(el.selector).innerHTML = '';
        document.getElementById(el.error).innerHTML = '';
      },
      toggle: function () {
        const classList = document.querySelector('.app').classList;
        if (!classList.contains('show-console-animate')) {
          classList.add('show-console');
          setTimeout(() => {
            classList.add('show-console-animate');
          }, 300);
        } else {
          classList.remove('show-console-animate');
          setTimeout(() => {
            classList.remove('show-console');
          }, 300);
        }
      },
      add: function (errors) {
        const el = this;
        if (errors.length > 0) {
          document.getElementById(el.error).innerHTML = errors.length;
          errors.forEach((item, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.reason}</span> <span>Line: ${item.line},${item.character}</span>`;
            App.Default.console.appendChild(li);
          });
        } else {
          document.getElementById(el.error).innerHTML = '';
        }
      },
    },
  };
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.keyCode == 83 && (navigator.platform.match('Mac') ? event.metaKey : event.ctrlKey)) {
        event.preventDefault();
        App.Default.save();
      } else if (event.keyCode == 82 && (navigator.platform.match('Mac') ? event.metaKey : event.ctrlKey)) {
        event.preventDefault();
        App.Default.compile();
      }
    },
    false
  );
  window.addEventListener('beforeunload', function (e) {
    const activeData = localStorage.getItem('scripts') && JSON.parse(localStorage.getItem('scripts'))[localStorage.getItem('activeIndex')];
    if (activeData) {
      if (
        activeData.html != App.Default.html.getValue() ||
        activeData.css != App.Default.css.getValue() ||
        activeData.js != App.Default.js.getValue()
      ) {
        e.preventDefault();
        e.returnValue = '';
      }
    } else if (
      document.getElementById('activeIndex').value.length < 1 &&
      (App.Default.html.getValue() != '' || App.Default.js.getValue() != '' || App.Default.css.getValue() != '')
    ) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  document.addEventListener('DOMContentLoaded', function () {
    App.Init();
    win.App = App;
  });
})(window, document);
