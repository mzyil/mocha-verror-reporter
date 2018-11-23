import { Runner, utils as MochaUtils, reporters as MochaReporters } from "mocha";
import { VError } from "verror";

export class MochaVErrorReporter extends MochaReporters.Base
{
    private static _DEFAULT_INDENT: string = "    ";
    private static _REMOVE_REPEATED_MESSAGE_REGEX: RegExp = /caused by.+\n/;
    private static _REPLACE_WITH_INDENT_REGEX: RegExp = /\n/g;
    private static _REMOVE_AFTER_FIRST_LINE_REGEX: RegExp = /\n.+/g;
    private static stackFilter = MochaUtils.stackTraceFilter();

    constructor(runner: Runner)
    {
        super(runner);
        runner.on('fail', function(test, err) {
            err.stack = MochaVErrorReporter.stackFilter(MochaVErrorReporter.fullStack(err));
        });
    }

    public static fullStack(error, indent = MochaVErrorReporter._DEFAULT_INDENT, indentationLevel = 1)
    {
        if (typeof error.errors === "function")
        {
            let message = error.stack.replace(MochaVErrorReporter._REMOVE_AFTER_FIRST_LINE_REGEX, "");
            let index = 1;
            const suppressedErrors = error.errors();
            for (const suppressedError of suppressedErrors)
            {
                message += `\n${indent.repeat(indentationLevel)}${index} of ${suppressedErrors.length} suppressed errors: `
                message += `${MochaVErrorReporter.fullStack(suppressedError, indent, indentationLevel+1)}`;
                index++;
            }
            return message;
        }
        if (typeof error.cause === "function")
        {
            const cause = error.cause();
            error.stack = error.stack.replace(MochaVErrorReporter._REMOVE_REPEATED_MESSAGE_REGEX, "\n");
            if (cause)
            {
                return `${error.stack.replace(MochaVErrorReporter._REPLACE_WITH_INDENT_REGEX, "\n" + indent.repeat(indentationLevel))}`
                        + `\n${indent.repeat(indentationLevel)}caused by, ${MochaVErrorReporter.fullStack(cause, indent, indentationLevel+1)}`;
            }
        }
        return VError.fullStack(error).replace(MochaVErrorReporter._REPLACE_WITH_INDENT_REGEX, "\n" + indent.repeat(indentationLevel));
    }
}