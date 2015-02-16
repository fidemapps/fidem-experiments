var Hogan = require('hogan.js');

// Simple variable remplacent.

var data = {
  screenName: 'dhg'
};

var template = Hogan.compile('Follow @{{screenName}}.');
var output = template.render(data);

// Print "Follow @dhg."
console.log(output);


// Basic condition.

var data = {
  screenName: 'dhg',
  isGood: true
};

var template = Hogan.compile('How is it? {{#isGood}}Good{{/isGood}}');
var output = template.render(data);

// Print "How is it? Good"
console.log(output);


// Reverse condition.

var data = {
  screenName: 'dhg',
  isGood: false
};

var template = Hogan.compile('How is it? {{^isGood}}Bad{{/isGood}}');
var output = template.render(data);

// Print "How is it? Bad"
console.log(output);


// Array of string iteration.

var data = {
  names: ['Greg', 'Sébastien']
};

var template = Hogan.compile('{{#names}}{{.}} {{/names}}');
var output = template.render(data);

// Print "Greg Sébastien"
console.log(output);


// Array of object iteration.

var data = {
  people: [
    {name: 'Greg'},
    {name: 'Sébastien'}
  ]
};

var template = Hogan.compile('{{#people}}{{name}} {{/people}}');
var output = template.render(data);

// Print "Greg Sébastien"
console.log(output);


// Function boolean.

var data = {
  isTrue: function () { return true; }
};

var template = Hogan.compile('{{#isTrue}}it\'s true{{/isTrue}}');
var output = template.render(data);

// Print "it's true"
console.log(output);


// Lambda.

var data = {
  bold: function () {
    return function (text) {
      return '<b>' + text + '</b>';
    };
  }
};

var template = Hogan.compile('{{#bold}}important text{{/bold}}');
var output = template.render(data);

// Print "<b>important text</b>"
console.log(output);
