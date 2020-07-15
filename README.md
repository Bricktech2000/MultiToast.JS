# MultiToast.JS
A highly customizable JavaScript toast library

## Requirements
* Any browser with HTML5 support

## Setup

* Download and include `multiToast.js`
* Download and include `multiToast.css`
* Download `multiToastIcons` in the same parent folder

## Minimal Example
Note: this minimal example must be copied in an `HTML` file in the same parent folder as the other library dependencies.
```HTML
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Minimal MultiToast Example</title>
    <script src="MultiToast.js"></script>
    <link rel="stylesheet" href="MultiToast.css">
    <script type="text/javascript">
      multiToast.log().toast('This is MultiToast!');
    </script>
  </head>
</html>
```

## Usage

```
usage: [<return> = ]multiToast<category><settings><type>
  <category>:
    [.log()]      //grey '>' icon
    [.info()]     //blue 'i' icon
    [.warn()]     //yellow '!' icon
    [.error()]    //red 'x' icon
    [.success()]  //green '√' icon

  <settings>:
    [.modal(bool)]    //disables the rest of the page
    [.sync()]         //important, synchronous
    [.async()]        //non-important, asynchronous
    [.timeout(time)]  //disappears after 'time' ms

  <type>:
    .toast(<text>) |                    //no buttons
    .alert(<text>) |                    //'Ok' button
    .prompt(<text>[, <placeholder>]) |  //text input, 'Ok' button, 'Cancel' button
    .ask(<text>) |                      //'Yes' button, 'No' button
    .auth(<text>[, <placeholder>]) |    //pasword input, 'Ok' button, 'Cancel' button
    .login(<text>[, <placeholder1>[, <placeholder2>]]) |  //text input, password input, 'Ok' button, 'Cancel' button

  <return>: {type: <return_type>, value: <return_value>}  //the returned object
    <return_type>: 'timeout' | 'return'
    <return_value>:
      multiToast.ok |      //the user clicked 'Ok'
      multiToast.cancel |  //the user clicked 'Cancel'
      multiToast.close |   //the user clicked 'Close'
      multiToast.yes |     //the user clicked 'Yes'
      multiToast.no |      //the user clicked 'No'
      <input string(s)>    //a string or array of strings containing text input values
```
Yeah this is nonsense just check out `example/example.html` for real-life examples that are actually understandable.
