//the library namespace
multiToast = {
  //used to register a modifier or a show-er function
  register: function(name, func){
    //https://stackoverflow.com/questions/32496825/proper-way-to-dynamically-add-functions-to-es6-classes
    //add the function to 'Toast'
    this.Toast.prototype[name] = function(...params){
      var ret = func.bind(this)(...params);
      if(ret && ret.then) return ret; //promise
      return this;
    }
    //add the function to 'this' and reate new toast if it was called on multiToast
    this[name] = function(...params){
      var toast = new this.Toast();
      var ret = func.bind(toast)(...params);
      if(ret && ret.then) return ret; //promise
      return toast;
    }
    return
  },
  //some button constants
  ok: 1,
  cancel: -1,
  yes: 2,
  no: -2,
  //a toast stack and a toast queue for async and sync toasts respectively
  core: {
    toastStack: [],
    syncToastQueue: []
  },
  //default timeout for toasts
  defaultTimeout: 3000,
  iconPath: './multiToastIcons/',
  //the toast class, instantiated to get a new toast
  Toast: class {
    //constructor...
    constructor(){
      //create the toast element itself
      this.toastElement = document.createElement('div');
      this.toastElement.classList.add('multiToast');

      this.core = {};
      //many values can be passed as a lambda, this function extracts them
      this.core.getValue = function(val){
        //https://stackoverflow.com/questions/798340/testing-if-value-is-a-function
        if(typeof val === 'function') return val();
        return val;
      }
      //a core warning function
      this.core.warn = function(message){
        console.warn('MultiToast Warning: ' + message);
      }
      //a core error function
      this.core.err = function(message){
        throw 'MultiToast Error: ' + message;
      }
      //a function to check the amount of parameters passed to a function
      //takes the function name, the parameters passed to it, and the parameter count range
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
      //shows the modal background: greyes out the background and disables the page
      this.core.showModalBackground = function(){
        multiToast.toastContainer.style.backgroundColor = 'rgba(0, 0, 0, .25)';
        multiToast.toastContainer.style.pointerEvents = 'all';
      }
      //hide the modal background
      this.core.hideModalBackground = function(){
        multiToast.toastContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        multiToast.toastContainer.style.pointerEvents = 'none';
      }
      //default parameters for the toast
      this.core.params = {
        timeout: undefined,
        modal: false,
        sync: true,
      };
      //an object of bools to represent if a parameter was set or not
      //useful when you want to keep a parameter if it is already set
      this.core.paramSet = {};
      //a function to set a parameter in this.core.params
      //takes the parameter name, the parameter value and a 'keep' flag
      this.core.setParam = function(param, value, keep = false){
        value = this.core.getValue(value);
        if(keep && !this.core.paramSet[param] || keep == false){
          this.core.paramSet[param] = true;
          this.core.params[param] = value;
        }
      }.bind(this);
      //variable keeping track of the number of text inputs in the toast
      this.inputCount = 0;
      //array keeping track of the values of the text inputs
      this.inputs = [];
    }
    //https://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function
    //a public API function to set a 'parameter'
    setParam(type, ...params){
      if(type == 'background' || type == 'accent' || type == 'text')
          this.core.checkParamCount('setParam(' + type + ')', params, 1, 1);
      switch(type){
        //set the background color of the toast
        case 'background':
          this.toastElement.style.backgroundColor = params[0];
          return this;
        //set the accent color of the toast
        case 'accent':
          this.toastElement.style.borderLeftColor = params[0];
          return this;
        //set the text color of the toast
        case 'text':
          this.toastElement.style.color = params[0];
          return this;
        //set actual parameters in this.core.params using setParam()
        case 'modal':
        case 'sync':
        case 'timeout':
          this.core.checkParamCount('setParam(' + type + ')', params, 1, 2);
          this.core.setParam(type, ...params);
          return this;
      }
      this.core.warn('setParam received an invalid type: ' + type);
    }
    //add an item to the toast
    addItem(type, ...params){
      switch(type){
        //add a paragraph (text)
        case 'text':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 1);
          var p = document.createElement('p');
          p.innerHTML = this.core.getValue(params[0]);
          this.toastElement.appendChild(p);
          return this;
        //add a clickable button
        case 'button':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 2);
          var button = document.createElement('button');
          //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
          button.innerHTML = this.core.getValue(params[0]);
          button.onclick = params[1] !== undefined ? params[1].bind(this) : null;
          this.toastElement.appendChild(button);
          return this;
        //add a submit button, can be activated with the 'enter' key
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
        //add a text input (normal input or password input)
        case 'input':
        case 'pass':
          this.core.checkParamCount('addItem(' + type + ')', params, 0, 1);
          this.inputs.push('');
          var input = document.createElement('input');
          input.type = 'text'; if(type == 'pass') input.type = 'password';
          input.placeholder = params[0] !== undefined ? this.core.getValue(params[0]) : '';
          var inputCount = this.inputCount;
          input.onkeyup = function(){this.inputs[inputCount] = input.value;}.bind(this);
          this.toastElement.appendChild(input);
          this.inputCount++;
          return this;
        //add an icon using a path
        case 'icon':
          this.core.checkParamCount('addItem(' + type + ')', params, 1, 1);
          var img = document.createElement('img');
          img.src = this.core.getValue(params[0]);
          this.toastElement.appendChild(img);
          return this;
      }
      this.core.warn('addItem received an invalid type: ' + type);
    }
    //a function to 'show' the toast
    //it adds the toast to the queue or stack and shows the relevent toast
    show(){
      //a function to show the next toast
      var showNextToast = function(){
        //get the next toast (the queue has priority over the stack)
        var that;
        if(multiToast.core.syncToastQueue.length > 0)
          that = multiToast.core.syncToastQueue[0];
        else if(multiToast.core.toastStack.length > 0)
          that = multiToast.core.toastStack[multiToast.core.toastStack.length - 1];
        else return;

        //make the toast visible
        setTimeout(function(){
          that.toastElement.classList.add('visible');
          that.toastElement.classList.remove('background');
        }, 100);
        //show the modal background if the toast is a modal toast
        if(that.core.params.modal)
          that.core.showModalBackground();
        //start the toast timeout if it is from the synchronous queue
        if(multiToast.core.syncToastQueue.length > 0) that.startTimeout();
        //focus on the first input element of the toast if it is a modal toast
        var input = that.toastElement.getElementsByTagName('input')[0] || that.toastElement.getElementsByTagName('button')[0];
        if(input && this.core.params.modal) input.focus();
      }.bind(this);
      //function to hide the last element of the toast stack (usually to show a synchronous toast)
      function hideToastStack(){
        if(multiToast.core.toastStack.length > 0){
          var that = multiToast.core.toastStack[multiToast.core.toastStack.length - 1];
          that.toastElement.classList.add('background');
        }
      }
      //make the promise that will later be returned by this function
      var promise = new Promise((resolve, reject) => {
        //a function to remove the current toast
        //takes the return type ('return' or 'timeout')
        var end = function(type, res){
          //make sure the toast has not already returned
          if(this.hasReturned) return; this.hasReturned = true;
          //hide the toast and remove it from the DOM
          this.toastElement.classList.remove('visible');
          setTimeout(function(){
            multiToast.toastContainer.removeChild(this.toastElement);
          }.bind(this), 500);
          //hide the modal background (or not if it was not present)
          this.core.hideModalBackground();
          //remove the toast from the queue or stack
          if(this.core.params.sync)
            multiToast.core.syncToastQueue.shift(); //pop_front()
          else
            multiToast.core.toastStack.pop();
          //show the next toast
          showNextToast();
          //resolve the promise
          resolve({ type: type, value: res });
        }.bind(this);
        var to;
        //function to start the timeout before calling 'end' (with 'timeout' return type)
        this.startTimeout = function(){
          if(this.core.params.timeout !== undefined && !to)
            to = setTimeout(end, this.core.getValue(this.core.params.timeout), 'timeout', undefined);
        }.bind(this);
        //function to return immediately (with 'return' return type)
        this.return = function(res){
          if(to) clearTimeout(to);
          end('return', res);
        }.bind(this);
      });

      //add the toast to the toast container
      multiToast.toastContainer.appendChild(this.toastElement);
      //add the toast to the stack or queue
      hideToastStack();
      if(this.core.params.sync){
        multiToast.core.syncToastQueue.push(this);
      }else{
        hideToastStack();
        multiToast.core.toastStack.push(this);
        if(multiToast.core.syncToastQueue.length > 0){
          this.toastElement.classList.add('visible');
          hideToastStack();
        }
        this.startTimeout();
      }
      //show the next toast and return
      showNextToast();
      return promise;
    }
  }
}

//functions to register some parameters
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

//function that registers the color and icon of the toast
(function(){
  //array of objects containing the name of the function and the color it should produce
  var types = [
    {name: 'log', color: '#ddd'},
    {name: 'info', color: '#08e'},
    {name: 'warn', color: '#fc0'},
    {name: 'error', color: '#d00'},
    {name: 'success', color: '#0d0'},
  ];
  //for every type...
  for(var type of types){
    //register it
    multiToast.register(type.name, function(type){
      return function(icon = true){
        //set the accent color to the respective color
        this.setParam('accent', type.color);
        //if the 'icon' flag was true, add an icon to the toast
        if(icon)
          this.addItem('icon', () => {return multiToast.iconPath + type.name + '.svg'});
      }
    }(type));
  }
})();

//some more register stuff...

//'toast' displays an asynchronous, buttonless toast
multiToast.register('toast', function(text = ''){
  return this.setParam('timeout', () => {return multiToast.defaultTimeout}, true)
    .setParam('sync', false, true)
    .addItem('text', text)
    .show()
});
//'alert' displays a toast with an 'Ok' button
multiToast.register('alert', function(text = ''){
  return this
    .addItem('text', text)
    .addItem('submit', 'Ok', function(){ this.return(multiToast.ok) })
    .show()
});
//'ask' displays a toast with 'Yes' and 'No' buttons
multiToast.register('ask', function(text = ''){
  return this
    .addItem('text', text)
    .addItem('submit', 'Yes', function(){ this.return(multiToast.yes) })
    .addItem('button', 'No', function(){ this.return(multiToast.no) })
    .show()
});
//'prompt' displays a toast with a text input, an 'Ok' and a 'Cancel' button
multiToast.register('prompt', function(text = '', placeholder = ''){
  return this
    .addItem('text', text)
    .addItem('input', placeholder)
    .addItem('submit', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(multiToast.cancel) })
    .show()
});
//'auth' displays a toast with a password input, an 'Ok' and a 'Cancel' button
multiToast.register('auth', function(text = '', placeholder = ''){
  return this
    .addItem('text', text)
    .addItem('pass', placeholder)
    .addItem('submit', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(multiToast.cancel) })
    .show()
});
//'login' displays a toast with a user input, a password input, an 'Ok' and a 'Cancel' button
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
//some viewport height magic
(function(){
  var vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', vh + 'px');
})();

//create the toast container when the window loads
window.addEventListener('load', function(){
  var container = document.createElement('div');
  container.classList.add('multiToastContainer');
  document.body.appendChild(container);

  multiToast.toastContainer = container;
})
