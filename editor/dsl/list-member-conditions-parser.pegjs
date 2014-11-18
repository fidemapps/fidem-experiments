/*
  List Member Conditions Rules
  ============================

    DATE_CRITERIA : last X time, between start_date end_date
    NUMBER_CRITERIA : >, <, =, <=, >=, *IN()
    STRING_CRITERIA : =, !=, *IN()
    COORDINATE_CRITERIA: = *lat,long, *around circle, *within square

    // Member related
    member tag CODE NUMBER_CRITERIA
    member level CODE NUMBER_CRITERIA
    member segment CODE NUMBER_CRITERIA

    member city STRING_CRITERIA
    member state STRING_CRITERIA
    member country STRING_CRITERIA
    member postal_code STRING_CRITERIA

    member created DATE_CRITERIA


    // Action related
    action CODE
    * action CODE with data attributes GENERIC_CRITERIA
    * action CODE with data attributes GENERIC_CRITERIA with coordinates COORDINATE_CRITERIA

    // FILTER
    only top X by member points LEVEL_CODE
    * only top X by member level LEVEL_CODE
    * only top X by member tag TAG
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
    = conditions;

conditions
    = first:simple_condition? reminders:(S* "and" S* simple_condition)* S* filter:filter?
    {
      return  {
          conditions: buildList(first, reminders, 3),
          filter: filter
      };
    }

simple_condition
    = scope:"member" S* sub:("tag" / "level" / "points" / "segment") S* code:code S* operator:(">=" / "<=" / "=" / ">" / "<") S* value:NUMBER
    {
        return {
            scope: "member",
            sub_scope: sub,
            code: code,
            operator: operator,
            value: value
        };
    }
    / scope:"member created" S* condition:"last" S* qty:NUMBER S* timeframe:timeframe
    {
        return {
            scope: "member",
            sub_scope: "created",
            condition: condition,
            quantity: qty,
            timeframe: timeframe
        };
    }
    / scope:"member created" S* condition:"between" S* date1:string S* date2:string
    {
        return {
            scope: "member",
            sub_scope: "created",
            condition: condition,
            date1: date1,
            date2: date2
        };
    }
    / scope:"member" S* sub:("city" / "state" / "zip" / "country") S* operator:("=" / "!=") S* value:string
    {
        return {
            scope: "member",
            sub_scope: sub,
            operator: operator,
            value: value
        };
    }
    / scope:"action" S* code:code S* firstCondition:("with" S* condition)? conditions:(S* "and" S* condition)*
    {
        return {
            scope: "action",
            code: code,
            conditions: buildList(firstCondition ? firstCondition[2] : null, conditions, 3)
        };
    }

filter
    = "only top" S* quantity:NUMBER S* "by member" S* type:("points" / "level") S* levelCode:code
    {
        return {
            quantity: quantity,
            type: type,
            levelCode: levelCode
        };
    }

condition
    = name:code S* operator:(">=" / "<=" / "=" / ">" / "<") S* value:stringOrNumber
    {
      return {
          name: name,
          operator: operator,
          value: value
      }
    }

timeframe
    = value:("minutes" / "minute" / "hours" / "hour" / "days" / "day" / "weeks" / "week" / "months" / "month" / "years" / "year" )
    {
        return value.replace(/s/g,'');
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

stringOrNumber
  = string / NUMBER

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

STRING "string"
    = string:string
    {
        return string;
    }
