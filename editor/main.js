var $ = require('./bower_components/jquery/dist/jquery.js');
window.jQuery = $;
require('./bower_components/jquery-textcomplete/dist/jquery.textcomplete.js');

var availabilityRulesParser = require('./parsers/availability-rules-parser');
var listMemberConditionsParser = require('./parsers/list-member-conditions-parser');
var reactionActionsParser = require('./parsers/reaction-actions-parser');
var rulesParser = require('./parsers/rules-parser');
var triggerConditionsParser = require('./parsers/trigger-conditions-parser');

$('#rule').textcomplete([{
  match: /(\s?)([^\s]*)$/,
  search: function (term, callback) {
    var choices = [];

    console.log(term);

    try {
      availabilityRulesParser.parse($('#rule').val());
    } catch (e) {
      choices = e.expected
      .filter(function (choice) {
        return choice.type === 'literal';
      })
      .map(function (choice) {
        return choice.value;
      });

      console.log(choices);
    }

    choices = $.map(choices, function (word) {
      if (!word) return null;
      return word.indexOf(term.trim()) === 0 ? word : null;
    });

    callback(choices);
  },
  index: 2,
  replace: function (word) {
    return '$1' + word + ' ';
  }
}]).on('textComplete:select', function () {
  setTimeout(function () {
    $('#rule').textcomplete('trigger');
  }, 0);
});
