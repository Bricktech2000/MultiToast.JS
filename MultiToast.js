multiToast = {
  register: function(name, func){
    this[name] = func;
  },
  modal: -1,
  Toast: class {
    constructor(){
      this.toastElement = document.createElement('div');
      this.core = {};
      /*this.core.createResolveParameter = function(){
        return {
          buttons: [], inputs: []
        };
      }*/
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
    }
    //https://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function
    setColor(type, ...params){
      this.core.checkParamCount('setColor', params, 1, 1);
      switch(type){
        case 'background':
          this.toastElement.backgroundColor = params[0];
          return this;
        case 'accent':
          this.toastElement.borderLeftColor = params[0];
          return this;
        case 'text':
          this.toastElement.color = params[0];
          return this;
      }
      this.core.warn('setColor received an invalid type: ' + type);
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
        case 'input':
          this.core.checkParamCount('addItem(' + type + ')', params, 0, 1);
          var input = document.createElement('input');
          input.type = 'text';
          input.placeholder = params[0] !== undefined ? this.core.getValue(params[0]) : '';
          this.toastElement.appendChild(input);
          return this;
      }
      this.core.warn('addItem received an invalid type: ' + type);
    }
    /*setParam(type, ...params){
      switch(type){
        case 'modal':
          this.core.checkParamCount('setParam(' + type + ')', params, 1, 1);
          this.modal = this.core.getValue(params[0]);
          return this;
      }
      this.core.warn('setParam received an invalid type: ' + type);
    }*/
    show(timeout){
      /*return new Promise(resolve, reject){
        resolve()
      }*/
      var modal = document.createElement('p');
      modal.innerHTML = '[[MODAL]]';
      if(timeout == multiToast.modal) this.toastElement.appendChild(modal);
      document.body.appendChild(this.toastElement);

      return new Promise((resolve, reject) => {
        var end = function(type, res){
          document.body.removeChild(this.toastElement);
          resolve({ type: type, value: res });
        }.bind(this);
        if(timeout !== undefined && timeout != multiToast.modal)
          var to = setTimeout(end, this.core.getValue(timeout), 'timeout', undefined);
        this.return = function(res){
          end('return', res);
          if(to) clearTimeout(to);
        }
      });
    }
  }
}

multiToast.infoToast = function(message){
  return new multiToast.Toast()
    .setColor('background', '#ccc')
    .setColor('accent', '#aaa')
    .setColor('text', '#000')
    .addItem('text', message)
    .addItem('button', 'Ok', function(){ this.return(null) })
}
multiToast.promptToast = function(message){
  return new multiToast.Toast()
    .setColor('background', '#ccc')
    .setColor('accent', '#aaa')
    .setColor('text', '#000')
    .addItem('text', message)
    .addItem('input')
    .addItem('button', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(null) })
}

multiToast.timeout = 5000;
multiToast.register('info', function(message){
  return multiToast.infoToast(message).show(() => {return multiToast.timeout});
});
multiToast.register('modalInfo', function(message){
  return multiToast.infoToast(message).show(multiToast.modal);
});
multiToast.register('prompt', function(message){
  return multiToast.promptToast(message).show(() => {return multiToast.timeout});
});
multiToast.register('modalPrompt', function(message){
  return multiToast.promptToast(message).show(multiToast.modal);
});
function showExampleToast(type){
  var ret = multiToast[type](type);
  console.log(ret);
}
window.onload = function(){
  showExampleToast('info');
  showExampleToast('modalInfo');
  showExampleToast('prompt');
  showExampleToast('modalPrompt');
}
/*
ret = await multiToast.info('Info');
ret = await multiToast.prompt('Prompt');
console.log('toast returned: ', ret);
*/
