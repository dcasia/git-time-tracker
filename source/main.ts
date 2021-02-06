import * as core from '@actions/core'
import * as github from '@actions/github'
import { IssueComment, Maybe, PullRequest, PullRequestCommit, Repository } from '@octokit/graphql-schema'
import parseDuration from 'parse-duration'
import { Duration } from 'luxon'
import { getPullRequestsQuery, getPullRequestQuery, updatePullRequestTitle } from './graphql'
import { compile } from './tokenizer'
import { cleanTitle } from './helpers'

async function run(): Promise<void> {
    const token = core.getInput('token')
    const durationPattern = core.getInput('durationPattern')
    const titlePattern = core.getInput('titlePattern')
    const scanComments = core.getInput('scanComments') === 'true'
    const scanPullRequestBody = core.getInput('scanPullRequestBody') === 'true'
    const octokit = github.getOctokit(token)

    const branch = getBranchName()
    const name = github.context.payload.repository?.name
    const owner = github.context.payload.repository?.owner.name ?? github.context.payload.repository?.owner.login
    const number = getPullRequestNumber()

    let response: { repository: Repository }

    if (number) {
        response = await octokit.graphql<{ repository: Repository }>(getPullRequestQuery, { name, owner, number })
    } else {
        response = await octokit.graphql<{ repository: Repository }>(getPullRequestsQuery, { name, owner, branch })
    }

    console.log('response', JSON.stringify(response))

    const pullRequest = response.repository.pullRequest ?? response.repository.pullRequests.nodes?.[0]

    if (pullRequest) {
        const commits = pullRequest.commits.nodes!
        const comments = pullRequest.comments.nodes!
        const pullRequestId = pullRequest.id
        const currentTitle = pullRequest.title

        let total = getTotal(extractCommitMessages(commits))

        if (scanComments) {
            total += getTotal(extractCommentMessages(comments))
        }

        if (scanPullRequestBody) {
            total += getTotal(extractPullRequestBodyMessage(pullRequest))
        }

        const duration = Duration.fromMillis(total).toFormat(durationPattern)
        const title = compile(titlePattern, {
            duration,
            title: cleanTitle(currentTitle, durationPattern, titlePattern),
        })

        const response = await octokit.graphql(updatePullRequestTitle, { title, pullRequestId })

        console.log(response)
    }
}

function getTotal(messages: string[]): number {
    return messages
        .map(commitMessage => parseDuration(commitMessage, 'millisecond') ?? 0)
        .reduce((left, right) => left + right, 0)
}

/**
 * Extract all commits messages from pull request list
 */
function extractCommitMessages(commits: Maybe<PullRequestCommit>[]): string[] {
    const messages = []

    for (const message of commits) {
        if (message) {
            messages.push(message.commit.message)
        }
    }

    return messages
}

function extractPullRequestBodyMessage(pullRequest: PullRequest): string[] {
    return [pullRequest.bodyText]
}

function extractCommentMessages(comments: Maybe<IssueComment>[]): string[] {
    const messages = []

    for (const comment of comments) {
        if (comment) {
            messages.push(comment.bodyText)
        }
    }

    return messages
}

function getBranchName(): string | null {
    switch (github.context.eventName) {
        case 'pull_request':
            return github.context.payload.pull_request?.head?.ref
        case 'push':
            return github.context.payload.ref.replace('refs/heads/', '')
    }

    return null
}

function getPullRequestNumber(): number | null {
    switch (github.context.eventName) {
        case 'pull_request':
            return github.context.payload.pull_request?.number!
        case 'issue_comment':
            return github.context.payload.issue?.number!
    }

    return null
}

/**
 * Only run code if its any of the following events
 */
if (['pull_request', 'issue_comment', 'push'].includes(github.context.eventName)) {
    run().then(() => console.log('Completed.'))
} else {
    console.log('This run was ignored due that it is none of the supported events...')
}
