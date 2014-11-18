/*
  Gamification Rules
  ==================

 time_period (minute, hour, day, week, month, year)

 Rewards Scripts Parameters:
  member -> Member object
  value -> number
  reward_code -> string (Reward Object)
  Call the RewardObject implementation to affect the Member

 give x 'POINTS_LEVEL_LIST'
 give x 'BADGE_1'
 give x '10_PERCENT_REBATE'
 give x 'MEMBER_TAG'

 Activation "NEVER CHANGE STATUS" Scripts Parameters:
  member -> Member object
  triggerObjectType -> 'actionEvent', 'memberEvent' (new level)
  triggerObject -> ActionJson, Member object

  returns TRUE if must give the rewards

 challenge 'CHALLENGE_CODE'
 challenge 'CHALLENGE_CODE' x times
 challenge 'CHALLENGE_CODE' x times   within x time_period

 action 'ACTION_CODE'
 action 'ACTION_CODE' x times
 action 'ACTION_CODE' x times   within x time_period
 action 'ACTION_CODE' with TAG 'TAG_NAME'
 action 'ACTION_CODE' x times   with TAG 'TAG_NAME'
 action 'ACTION_CODE' x times   within x time_period   with TAG 'TAG_NAME'

 member "level" 'LEVEL_LIST' x
 member "level" 'LEVEL_LIST' x with TAG 'TAG_NAME'
 member "points" 'LEVEL_LIST' x
 member "points" 'LEVEL_LIST' x with TAG 'TAG_NAME'
 member "tag" 'TAG_NAME' x
 member "tag" 'TAG_NAME' x with TAG 'TAG_NAME'

 member "new level" 'LEVEL_LIST'
 member "new level" 'LEVEL_LIST' x times    within x time_period
 member "new level" 'LEVEL_LIST' with TAG 'TAG_NAME'
 member "new level" 'LEVEL_LIST' x times   with TAG 'TAG_NAME'
 member "new level" 'LEVEL_LIST' x times   within x time_period   with TAG 'TAG_NAME'

 */
{
    function extractOptional(optional, index) {
        return optional ? optional[index] : null;
    }

    function extractList(list, index) {
        var result = [], i;

        for (i = 0; i < list.length; i++) {
            if (list[i][index] !== null) {
                result.push(list[i][index]);
            }
        }

        return result;
    }

    function buildList(first, rest, index) {
        return (first !== null ? [first] : []).concat(extractList(rest, index));
    }
}

start
    = rules;

rules
    = first:simple_rule reminders:(S* "and" S* simple_rule)+ rewards:(S* simple_reward)+
    {
        return {
            rules: buildList(first, reminders, 3),
            rewards: buildList(null, rewards, 1)
        };
    }

    / rule:simple_rule rewards:(S* simple_reward)+
    {
        return  {
            rules: [rule],
            rewards: buildList(null, rewards, 1)
        }
    }

simple_rule
    = scope:"action" S* code:code conditions:(S* condition)* filters:(S* filter)*
    {
        return {
            scope: scope,
            code: code,
            conditions: buildList(null, conditions, 1),
            filters: buildList(null, filters, 1)
        };
    }
    / scope:"challenge" S* code:code conditions:(S* condition)* filters:(S* filter)*
    {
        return {
            scope: scope,
            code: code,
            conditions: buildList(null, conditions, 1),
            filters: buildList(null, filters, 1)
        };
    }
    / scope:"member" S* type:("level" / "point" / "tag") S* levelCode:code S* value:NUMBER S* filter:withTag?
    {
        var theRule = {
            scope: scope,
            type: type,
            levelCode: levelCode,
            conditions: [ {type: type, value: value} ],
            filters: filter ? [ filter ] : []
        };

        return theRule;
    }
    / scope:"member" S* type:"level up" S* levelCode:code conditions:(S* condition)* S* filter:withTag?
    {
        return {
            scope: scope,
            type: type,
            levelCode: levelCode,
            conditions: buildList(null, conditions, 1),
            filters: filter ? [ filter ] : []
        };
    }

condition
    = (withinTimeframe / numberOfTimes)

filter
    = withTag

withTag
    = "with tag" S* tag:code S* value:("=" S* qty:NUMBER)?
    {
        return {
            type: 'tag',
            tag: tag,
            value: value ? value[2] : null
        };
    }

numberOfTimes
    = value:NUMBER S* "times"
    {
        return {
          type: 'times',
          value: value
        }
    }

withinTimeframe
    = value:NUMBER S* "times" S* "within" S* duration:NUMBER S* durationScope:timeframe
    {
        return {
          type: 'times_within_timeframe',
          value: value,
          duration: duration,
          durationScope: durationScope
        }
    }

timeframe
    = value:("minutes" / "minute" / "hours" / "hour" / "days" / "day" / "weeks" / "week" / "months" / "month" / "years" / "year" )
    {
        return value.replace(/s/g,'');
    }

simple_reward
    = "give" S* qty:NUMBER S* code:code
    {
        return {
            quantity: qty,
            code: code
        };
    }

string1
    = '"' chars:([^\n\r\f\\"] / "\\" )* '"'
    {
        return chars.join("");
    }

string2
    = "'" chars:([^\n\r\f\\'] / "\\" )* "'"
    {
        return chars.join("");
    }

string
    = string1 / string2

path_start
    = [_a-z]i

path_char
    = [_a-z0-9-\.]i

path
    = start:path_start chars:path_char*
    {
        return start + chars.join("");
    }

name
    = chars:path_char+
    {
        return chars.join("");
    }

code
    = chars:path_char+
    {
        return chars.join("");
    }

NUMBER "number"
    = [+-]? (DIGIT* "." DIGIT+ / DIGIT+)
    {
        return parseFloat(text());
    }

DIGIT "digit"
    = [0-9]

s
    = [ \t\r\n\f]+

S "whitespace"
    = s

NULL_VALUE "<null>"
 = 'n' 'u' 'l' 'l'
 {
    return null;
 }

STRING "string"
    = string:string
    {
        return string;
    }

PATH "path"
    = path:path
    {
        return path;
    }

HASH "hash"
    = "#" name:name
    {
        return name;
    }

date_full_year
    = $(DIGIT DIGIT DIGIT DIGIT)

date_month
    = $(DIGIT DIGIT)

date_day
    = $(DIGIT DIGIT)

time_hour
    = $(DIGIT DIGIT)

time_minute
    = $(DIGIT DIGIT)

time_second
    = $(DIGIT DIGIT)

DATE "date"
    = year:date_full_year "-" month:date_month "-" day:date_day
    {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

DATE_TIME "datetime"
    = year:date_full_year "-" month:date_month "-" day:date_day "T" hour:time_hour ":" minute:time_minute ":" second:time_second
    {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second), 0);
    }
