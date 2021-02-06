import { functionRule, tokenRule } from './tokenizer'
import scape from 'escape-string-regexp'
import { Duration } from 'luxon'
import parseDuration from 'parse-duration'

export function cleanTitle(currentTitle: string, durationPattern: string, titlePattern: string): string {
    const currentDuration = parseDuration(currentTitle, 'millisecond') ?? 31540000000 // 1 year
    const fakeDuration = Duration.fromMillis(currentDuration).toFormat(durationPattern)
    const generatedRegularExpression = scape(fakeDuration)
        .replace(/\d/g, '\\d+') // replace any number with \d+
        .replace(/(\\d\+){2,}/g, '\\d+') // remove possible duplicates of \d+

    const firstMatch = currentTitle.match(new RegExp(generatedRegularExpression))?.[0] ?? '.'

    const extractTitleExpression = scape(titlePattern)
        .replace(/(([a-zA-Z_]+)\\?\((:title)\\?\))/, '(.*)')
        .replace(/(([a-zA-Z_]+)\\?\((:duration)\\?\))/, scape(firstMatch))
        .replace(/:title/, '(.*)')
        .replace(/:duration/, scape(firstMatch))
        .replace(new RegExp(functionRule, 'g'), '.*')
        .replace(new RegExp(tokenRule, 'g'), '.*')

    return currentTitle.replace(new RegExp(extractTitleExpression), '$1')
}
