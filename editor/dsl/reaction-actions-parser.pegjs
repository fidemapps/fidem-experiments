/*
  Reaction Actions Rules
  ======================

    Give reward QUANTITY REWARD_CODE from PROGRAM_ID to LIST_ID

    Send message text 'TEXT' to list LIST_ID
    Send message template TEMPLATE_ID to list LIST_ID

    Send message text 'TEXT' to emails EMAIL,EMAIL,EMAIL
    Send message template TEMPLATE_ID to emails EMAIL,EMAIL,EMAIL

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
    = simple_action;

simple_action
    = "give reward" S* quantity:NUMBER S* rewardCode:code S* "from program" S* programId:code S* "to list" S* listId:code
    {
        return {
            action: "giveReward",
            rewardCode: rewardCode,
            quantity: quantity,
            programId: programId,
            listId: listId
        };
    }
    / "send message text" S* text:string S* "to list" S* listId:code
    {
        return {
            action: "sendTextMessage",
            messageText: text,
            listId: listId
        };
    }
    / "send message text" S* text:string S* "to emails" S* emailFirst:email emailReminders:(S* "," S* email)*
    {
        return {
            action: "sendTextMessage",
            messageText: text,
            emails: buildList(emailFirst, emailReminders, 3)
        };
    }
    / "send message template" S* templateId:code S* "to list" S* listId:code
    {
        return {
            action: "sendTemplateMessage",
            messageTemplateId: templateId,
            listId: listId
        };
    }
    / "send message template" S* templateId:code S* "to emails" S* emailFirst:email emailReminders:(S* "," S* email)*
    {
        return {
            action: "sendTemplateMessage",
            messageTemplateId: templateId,
            emails: buildList(emailFirst, emailReminders, 3)
        };
    }

email
    = user:code "@" domain:code
    {
        return user + "@" + domain;
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
