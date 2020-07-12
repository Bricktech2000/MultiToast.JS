multiToast = {
  register: function(name, func){
    //https://stackoverflow.com/questions/32496825/proper-way-to-dynamically-add-functions-to-es6-classes
    this.Toast.prototype[name] = function(...params){
      var ret = func.bind(this)(...params);
      if(ret && ret.then) return ret; //promise
      return this;
    }
    this[name] = function(...params){
      var toast = new this.Toast();
      var ret = func.bind(toast)(...params);
      if(ret && ret.then) return ret; //promise
      return toast;
    }
    return
  },
  modal: -1,
  ok: 1,
  cancel: -1,
  yes: 2,
  no: -2,
  core: {
    toastStack: [],
    syncToastQueue: []
  },
  defaultTimeout: 3000,
  Toast: class {
    constructor(){
      this.toastElement = document.createElement('div');
      this.toastElement.classList.add('multiToast');
      this.core = {};
      this.core.getValue = function(val){
        //https://stackoverflow.com/questions/798340/testing-if-value-is-a-function
        if(typeof val === 'function') return val();
        return val;
      }
      this.core.warn = function(message){
        console.warn('MultiToast Warning: ' + message);
      }
      this.core.err = function(message){
        throw 'MultiToast Error: ' + message;
      }
      this.core.checkParamCount = function(func, params, min, max){
        if(min == max) var count = min;
        else var count = min + ' to ' + max;
        if(params.length > max){
          this.core.warn(func + ' received ' + params.length + ' parameters, but only ' + count + ' expected.');
          return 1;
        }
        if(params.length < min){
          this.core.err(func + ' received ' + params.length + ' parameters, but minimum ' + count + ' expected.');
          return 1;
        }
        return 0;
      }.bind(this);
      this.core.showModalBackground = function(){
        multiToast.toastContainer.style.backgroundColor = 'rgba(0, 0, 0, .25)';
        multiToast.toastContainer.style.pointerEvents = 'all';
      }
      this.core.hideModalBackground = function(){
        multiToast.toastContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        multiToast.toastContainer.style.pointerEvents = 'none';
      }
      this.core.params = {
        timeout: undefined,
        modal: false,
        sync: true,
      };
      this.core.paramSet = {};
      this.core.setParam = function(param, value, keep = false){
        value = this.core.getValue(value);
        if(keep && !this.core.paramSet[param] || keep == false){
          this.core.paramSet[param] = true;
          this.core.params[param] = value;
        }
      }.bind(this);
      this.inputCount = 0;
      this.inputs = [];
    }
    //https://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function
    setParam(type, ...params){
      if(type == 'background' || type == 'accent' || type == 'text')
          this.core.checkParamCount('setParam(' + type + ')', params, 1, 1);
      switch(type){
        case 'background':
          this.toastElement.style.backgroundColor = params[0];
          return this;
        case 'accent':
          this.toastElement.style.borderLeftColor = params[0];
          return this;
        case 'text':
          this.toastElement.style.color = params[0];
          return this;
        case 'modal':
        case 'sync':
        case 'timeout':
          this.core.checkParamCount('setParam(' + type + ')', params, 1, 2);
          this.core.setParam(type, ...params);
          return this;
      }
      this.core.warn('setParam received an invalid type: ' + type);
    }
    addItem(type, ...params){
      switch(type){
        case 'text':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 1);
          var p = document.createElement('p');
          p.innerHTML = this.core.getValue(params[0]);
          this.toastElement.appendChild(p);
          return this;
        case 'button':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 2);
          var button = document.createElement('button');
          //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
          button.innerHTML = this.core.getValue(params[0]);
          button.onclick = params[1] !== undefined ? params[1].bind(this) : null;
          this.toastElement.appendChild(button);
          return this;
        case 'submit':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 2);
          var submit = document.createElement('button');
          //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
          submit.innerHTML = this.core.getValue(params[0]);
          submit.onclick = params[1] !== undefined ? params[1].bind(this) : null;
          this.toastElement.addEventListener('keypress', function(e){
            if(e.keyCode == 13) submit.click();
          })
          this.toastElement.appendChild(submit);
          return this;
        case 'input':
        case 'pass':
          this.core.checkParamCount('addItem(' + type + ')', params, 0, 1);
          this.inputs.push(undefined);
          var input = document.createElement('input');
          input.type = 'text'; if(type == 'pass') input.type = 'password';
          input.placeholder = params[0] !== undefined ? this.core.getValue(params[0]) : '';
          var inputCount = this.inputCount;
          input.onkeyup = function(){this.inputs[inputCount] = input.value;}.bind(this);
          this.toastElement.appendChild(input);
          this.inputCount++;
          return this;
        case 'icon':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 1);
          var img = document.createElement('img');
          img.src = this.core.getValue(params[0]);
          this.toastElement.appendChild(img);
          return this;
      }
      this.core.warn('addItem received an invalid type: ' + type);
    }
    show(){
      var showNextToast = function(){
        var that;
        if(multiToast.core.syncToastQueue.length > 0)
          that = multiToast.core.syncToastQueue[0];
        else if(multiToast.core.toastStack.length > 0)
          that = multiToast.core.toastStack[multiToast.core.toastStack.length - 1];
        else return;

        setTimeout(function(){
          that.toastElement.classList.add('visible');
          that.toastElement.classList.remove('background');
        }, 100);
        if(that.core.params.modal)
          that.core.showModalBackground();
        if(multiToast.core.syncToastQueue.length > 0) that.startTimeout();
        var input = that.toastElement.getElementsByTagName('input')[0] || that.toastElement.getElementsByTagName('button')[0];
        if(input) input.focus();
      }.bind(this);
      function hideToastStack(){
        if(multiToast.core.toastStack.length > 0){
          var that = multiToast.core.toastStack[multiToast.core.toastStack.length - 1];
          that.toastElement.classList.add('background');
        }
      }
      var arraysEmpty = false;
      if(multiToast.core.toastStack.length == 0 && multiToast.core.syncToastQueue.length == 0)
        arraysEmpty = true;
      var promise = new Promise((resolve, reject) => {
        var end = function(type, res){
          if(this.hasReturned) return; this.hasReturned = true;
          this.toastElement.classList.remove('visible');
          setTimeout(function(){
            multiToast.toastContainer.removeChild(this.toastElement);
          }.bind(this), 500);
          this.core.hideModalBackground();
          if(this.core.params.sync)
            multiToast.core.syncToastQueue.shift(); //pop_front()
          else
            multiToast.core.toastStack.pop();
          showNextToast();

          resolve({ type: type, value: res });
        }.bind(this);
        var to;
        this.startTimeout = function(){
          if(this.core.params.timeout !== undefined && !to)
            to = setTimeout(end, this.core.getValue(this.core.params.timeout), 'timeout', undefined);
        }.bind(this);
        this.return = function(res){
          if(to) clearTimeout(to);
          end('return', res);
        }.bind(this);
      });

      multiToast.toastContainer.appendChild(this.toastElement);
      if(this.core.params.sync){
        hideToastStack();
        multiToast.core.syncToastQueue.push(this);
        showNextToast();
      }else{
        hideToastStack();
        multiToast.core.toastStack.push(this);
        this.startTimeout();
        showNextToast();
      }
      return promise;
    }
  }
}

multiToast.register('modal', function(value = true){
  this.setParam('modal', value);
});
multiToast.register('sync', function(value = true){
  this.setParam('sync', value);
});
multiToast.register('async', function(value = true){
  this.setParam('sync', !value);
});
multiToast.register('timeout', function(value = () => {return multiToast.defaultTimeout}){
  this.setParam('timeout', value);
});

(function(){
  var types = [
    {name: 'log', color: '#ddd'},
    {name: 'info', color: '#00d'},
    {name: 'warn', color: '#dd0'},
    {name: 'error', color: '#d00'},
    {name: 'success', color: '#0d0'},
  ];
  for(var type of types){
    multiToast.register(type.name, function(type){
      return function(icon = true){
        this.setParam('accent', type.color);
        if(icon)
          this.addItem('icon', './multiToastIcons/' + type.name + '.svg');
      }
    }(type));
  }
})();

multiToast.register('toast', function(text = ''){
  return this.setParam('timeout', () => {return multiToast.defaultTimeout}, true)
    .setParam('sync', false, true)
    .addItem('text', text)
    .show()
});
multiToast.register('alert', function(text = ''){
  return this
    .addItem('text', text)
    .addItem('submit', 'Ok', function(){ this.return(multiToast.ok) })
    .show()
});
multiToast.register('ask', function(text = ''){
  return this
    .addItem('text', text)
    .addItem('submit', 'Yes', function(){ this.return(multiToast.yes) })
    .addItem('button', 'No', function(){ this.return(multiToast.no) })
    .show()
});
multiToast.register('prompt', function(text = '', placeholder = ''){
  return this
    .addItem('text', text)
    .addItem('input', placeholder)
    .addItem('submit', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(multiToast.cancel) })
    .show()
});
multiToast.register('auth', function(text = '', placeholder = ''){
  return this
    .addItem('text', text)
    .addItem('pass', placeholder)
    .addItem('submit', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(multiToast.cancel) })
    .show()
});
multiToast.register('login', function(text = '', placeholder1 = '', placeholder2 = ''){
  return this
    .addItem('text', text)
    .addItem('input', placeholder1)
    .addItem('pass', placeholder2)
    .addItem('submit', 'Ok', function(){ this.return({user: this.inputs[0], pass: this.inputs[1]}) })
    .addItem('button', 'Cancel', function(){ this.return(multiToast.cancel) })
    .show()
});



//https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
var vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty('--vh', vh + 'px');

window.addEventListener('load', function(){
  var container = document.createElement('div');
  container.classList.add('multiToastContainer');
  document.body.appendChild(container);

  multiToast.toastContainer = container;
})
