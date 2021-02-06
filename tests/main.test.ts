import { compile } from '../source/tokenizer'
import { Duration } from 'luxon'
import { cleanTitle } from '../source/helpers'

type Configuration = {
    title: string
    durationPattern: string
    titlePattern: string
    duration: string
}

function setup(configuration: Partial<Configuration> = {}): string {
    const options: Configuration = {
        title: 'fix super important bug',
        durationPattern: `[h'h'm'm']`,
        titlePattern: `:duration • :title`,
        duration: '',
        ...configuration,
    }

    if (options.duration === '') {
        options.duration = Duration.fromObject({ hour: 1, minutes: 30 }).toFormat(options.durationPattern)
    }

    return compile(options.titlePattern, {
        duration: options.duration,
        title: options.title,
    })
}

test('title meets expectations', async () => {
    expect(setup({ title: 'fix super important bug' })).toBe('[1h30m] • fix super important bug')
})

test('capitalize function works', async () => {
    expect(setup({ title: 'fix super important bug', titlePattern: ':duration • capitalize(:title)' })).toBe(
        '[1h30m] • Fix super important bug'
    )
})

test('title function works', async () => {
    expect(
        setup({ title: 'this is a very cool title and too long perhaps', titlePattern: ':duration • title(:title)' })
    ).toBe('[1h30m] • This Is a Very Cool Title and Too Long Perhaps')
})

test('trim function works', async () => {
    expect(setup({ title: ' title ', titlePattern: ':title' })).toBe(' title ')
    expect(setup({ title: ' title ', titlePattern: 'trim(:title)' })).toBe('title')
    expect(setup({ title: ' title ', titlePattern: 'trimLeft(:title)' })).toBe('title ')
    expect(setup({ title: ' title ', titlePattern: 'trimRight(:title)' })).toBe(' title')

    expect(setup({ title: ' title ', titlePattern: ':duration :title' })).toBe('[1h30m]  title ')
    expect(setup({ title: ' title ', titlePattern: ':duration trim(:title)' })).toBe('[1h30m] title')
    expect(setup({ title: ' title ', titlePattern: ':duration trimLeft(:title)' })).toBe('[1h30m] title ')
    expect(setup({ title: ' title ', titlePattern: ':duration trimRight(:title)' })).toBe('[1h30m]  title')
})

test('composing function works', async () => {
    expect(setup({ title: ' title ', titlePattern: 'capitalize(trim(:title))' })).toBe('Title')
})

test('invalid functions has no effect', async () => {
    expect(setup({ title: 'random title', titlePattern: 'invalid(:title)' })).toBe('invalid(random title)')
})

test('duration pattern does not overflow', async () => {
    const durationPattern = `d 'days' h 'hours' m 'minutes' s 'seconds'`
    const duration = Duration.fromObject({ months: 2, hours: 3, minutes: 15, seconds: 12 }).toFormat(durationPattern)

    expect(setup({ title: 'short title', durationPattern, duration })).toBe(
        '60 days 3 hours 15 minutes 12 seconds • short title'
    )
})

test('title is cleaned properly', async () => {
    const currentTitle = `[12h30m] • short title`
    const durationPattern = `[h'h'm'm'] •`
    const titlePattern = `:duration :title`

    expect(cleanTitle(currentTitle, durationPattern, titlePattern)).toBe('short title')
})

test('title is trimmed during cleaning', async () => {
    const currentTitle = `[12h30m] • short title`
    const durationPattern = `[h'h'm'm']`
    const titlePattern = `:duration • :title`

    expect(cleanTitle(currentTitle, durationPattern, titlePattern)).toBe('short title')
})

test('duration can be placed anywhere', async () => {
    const currentTitle = `Title • [12h30m]`
    const durationPattern = `• [h'h'm'm']`
    const titlePattern = `:title :duration`
    const duration = Duration.fromObject({ hour: 5, minutes: 20 }).toFormat(durationPattern)
    const title = cleanTitle(currentTitle, durationPattern, titlePattern)

    expect(duration).toBe('• [5h20m]')
    expect(title).toBe('Title')
    expect(setup({ title, durationPattern, titlePattern, duration })).toBe('Title • [5h20m]')
})

test('title pattern accepts any arbitrary text', async () => {
    const currentTitle = `Duration: 0h1m, Title: New feature added.`
    const durationPattern = `h'h'm'm'`
    const titlePattern = `Duration: :duration, Title: capitalize(:title).`
    const duration = Duration.fromObject({ hour: 5, minutes: 20 }).toFormat(durationPattern)
    const title = cleanTitle(currentTitle, durationPattern, titlePattern)

    expect(duration).toBe('5h20m')
    expect(title).toBe('New feature added')
    expect(setup({ title, durationPattern, titlePattern, duration })).toBe('Duration: 5h20m, Title: New feature added.')
})

test('works with uninitialized title', async () => {
    const currentTitle = `new amazing feature`
    const durationPattern = `h'h'm'm'`
    const titlePattern = `:duration title(:title).`
    const title = cleanTitle(currentTitle, durationPattern, titlePattern)

    expect(title).toBe('new amazing feature')
    expect(setup({ title, durationPattern, titlePattern })).toBe('1h30m New Amazing Feature.')
})
