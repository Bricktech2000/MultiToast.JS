multiToast = {
  register: function(name, func){
    this[name] = func;
  },
  Toast: class {
    constructor(){
      this.toastElement = document.createElement('div');
      this.core = {};
      /*this.core.createResolveParameter = function(){
        return {
          buttons: [], inputs: []
        };
      }*/
    }
    //https://stackoverflow.com/questions/6396046/unlimited-arguments-in-a-javascript-function
    setColor(type, ...params){
      switch(type){
        case 'background':
          this.toastElement.backgroundColor = params[0];
          break;
        case 'accent':
          this.toastElement.borderLeftColor = params[0];
          break;
        case 'text':
          this.toastElement.color = params[0];
          break;
        default:
          console.warn('Warning: multiToast received an unexpected color type: ' + type);
      }
      return this;
    }
    addItem(type, ...params){
      switch(type){
        case 'text':
          var p = document.createElement('p');
          p.innerHTML = params[0];
          this.toastElement.appendChild(p);
          break;
        case 'button':
          var button = document.createElement('button');
          //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_objects/Function/bind
          button.innerHTML = params[0];
          button.onclick = params[1].bind(this);
          this.toastElement.appendChild(button);
          break;
        case 'input':
          var input = document.createElement('input');
          input.type = 'text';
          input.placeHolder = params[0] !== undefined ? params[0] : '';
          this.toastElement.appendChild(input);
          break;
      }
      return this;
    }
    show(timeout){
      /*return new Promise(resolve, reject){
        resolve()
      }*/
      document.body.appendChild(this.toastElement);
      return new Promise((resolve, reject) => {
        this.return = function(res){
          resolve({ type: 'return', value: res });
        }
        if(timeout !== undefined)
          setTimeout(resolve, timeout, {type: 'timeout', value: undefined });
      });
    }
  }
}

multiToast.timeout = 5000;
multiToast.register('info', function(message){
  return new multiToast.Toast()
    .setColor('background', '#ccc')
    .setColor('accent', '#aaa')
    .setColor('text', '#000')
    .addItem('text', message)
    .addItem('button', 'Ok', function(){ this.return(null) })
    .show(multiToast.timeout);
});
multiToast.register('prompt', function(message){
  return new multiToast.Toast()
    .setColor('background', '#ccc')
    .setColor('accent', '#aaa')
    .setColor('text', '#000')
    .addItem('text', message)
    .addItem('input')
    .addItem('button', 'Ok', function(){ this.return(this.inputs[0]) })
    .addItem('button', 'Cancel', function(){ this.return(null) })
    .show(multiToast.timeout);
});

/*
ret = await multiToast.info('Info');
ret = await multiToast.prompt('Prompt');
console.log('toast returned: ', ret);
*/
