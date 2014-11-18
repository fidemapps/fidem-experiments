/*
  Trigger Conditions Rules
  ========================

    X (days/hours/minutes) (before|after) (sales|curtain) of EVENT_ID

    Tier TIER_CODE ticket sales < 50% of EVENT_ID
    Ticket sales < 50% of EVENT_ID

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
    = first:simple_condition reminders:(S* "and" S* simple_condition)* S* "of" S* eventId:code
    {
        return {
            eventId: eventId,
            conditions: buildList(first, reminders, 3)
        }
    }

simple_condition
    = duration:NUMBER S* durationScope:timeframe S* qualifier:("after" / "before") S* eventQualifier:("sales" / "curtain")
    {
        return {
            type: "time",
            duration: duration,
            durationScope: durationScope,
            qualifier: qualifier,
            eventQualifier: eventQualifier
        };
    }
    / "tier" S* tierCode:code S* "ticket sales" S* operator:(">=" / "<=" / "=" / ">" / "<") S* value:NUMBER percent:"%"?
    {
        return {
            type: "tierSales",
            tierCode: tierCode,
            operator: operator,
            value: value,
            percent: (percent !== null)
        };
    }
    / "ticket sales" S* operator:(">=" / "<=" / "=" / ">" / "<") S* value:NUMBER percent:"%"?
    {
        return {
            type: "eventSales",
            operator: operator,
            value: value,
            percent: (percent !== null)
        };
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
