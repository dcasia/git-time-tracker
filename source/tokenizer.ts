import Tokenizr, { Token } from 'tokenizr'
import titleCase from 'title'

const functions: Record<string, (value: string) => string | null | void> = {
    title: (value: string) => titleCase(value),
    capitalize: (value: string) => value.charAt(0).toUpperCase() + value.slice(1),
    trim: (value: string) => value.trim(),
    trimLeft: (value: string) => value.trimLeft(),
    trimRight: (value: string) => value.trimRight(),
    upper: (value: string) => value.toUpperCase(),
    lower: (value: string) => value.toLowerCase(),
}

export const tokenRule = /\:([a-zA-Z_]+)/
export const functionRule = /(([a-zA-Z_]+)\((.*)\))/
export const charRule = /./

function setRules(lexer: Tokenizr, data: Record<string, any>, includeFunctionRule: boolean) {
    lexer.rule(tokenRule, (context, match) => {
        context.accept('token', data[match[1]])
    })

    if (includeFunctionRule) {
        lexer.rule(functionRule, (context, match) => {
            const functionName = functions[match[2]]
            const content = match[3]

            if (functionName) {
                context.accept('function', functionName(compile(content, data)))
            } else {
                context.accept('function', compile(match[0], data, false))
            }
        })
    }

    lexer.rule(charRule, (context, match) => context.accept('char', match[0]))
}

function concatenate(tokens: Token[]): string {
    let final = ''

    for (const token of tokens) {
        final += token.value
    }

    return final
}

export function compile(text: string, data: Record<string, any>, functions = true) {
    const lexer = new Tokenizr()

    setRules(lexer, data, functions)

    return concatenate(lexer.input(text).tokens())
}
