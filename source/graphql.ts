const fragment = `
    id
    title
    bodyText
    comments(first: 100) {
        nodes {
            bodyText
        }
    }
    commits(first: 250) {
        nodes {
            commit {
                message
            }
        }
    }
`

export const getPullRequestQuery = `
    query ($number: Int!, $name: String!, $owner: String!) {
        repository(name: $name, owner: $owner) {
            pullRequest(number: $number) {
                ${fragment}
            }
        }
    }
`

export const getPullRequestsQuery = `
    query ($branch: String!, $name: String!, $owner: String!) {
        repository(name: $name, owner: $owner) {
            pullRequests(headRefName: $branch, first: 1) {
                nodes {
                    ${fragment}
                }
            }
        }
    }
`

export const updatePullRequestTitle = `
    mutation ($title: String!, $pullRequestId: String!) {
        updatePullRequest(input: { title: $title, pullRequestId: $pullRequestId }) {
            __typename
        }
    }
`
