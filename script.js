const repos = [
  {partialUrl: 'alphagov/govuk-prototype-kit', name: 'kit'},
  {partialUrl: 'alphagov/govuk-prototype-kit-docs', name: 'docs'},
  {partialUrl: 'alphagov/govuk-prototype-kit-step-by-step', name: 'step-by-step'},
  {partialUrl: 'alphagov/govuk-prototype-kit-common-templates', name: 'common-templates'},
  {partialUrl: 'alphagov/govuk-prototype-kit-task-list', name: 'task-list'}
]

function ensureGithubLink (url) {
  if (url.startsWith('/')) {
    return ['https://github.com', url].join('')
  }
  return url
}
function createLink(href, text, target) {
  const link = document.createElement('a')
  link.setAttribute('href', href)
  link.innerText = text
  if (target) {
    link.setAttribute('target', target)
  }
  return link
}
function createParagraph(text) {
  const paragraph = document.createElement('p')
  paragraph.innerText = text
  return paragraph
}
async function fetchData() {
  const resultsElem = document.getElementById('results')
  const allResults = await Promise.all(repos.map(async repo => {
    const repoLink = `https://github.com/${repo.partialUrl}/pulls?q=is%3Apr+is%3Aopen+draft%3Afalse`;
    const res = await fetch(repoLink);
    const html = await res.text()
    const response = document.createElement('div')
    response.innerHTML = html

    return [...response.querySelectorAll('[aria-label=Issues] .Box-row')]
      .map(x => {
        const headline = x.querySelector('.h4')
        const testStatusElem = x.querySelector('.commit-build-statuses a');
        return ({
          repoName: repo.name,
          repoLink: ensureGithubLink(repoLink),
          issueName: headline.innerText,
          issueLink: ensureGithubLink(headline.getAttribute('href')),
          by: x.querySelector('[data-hovercard-type=user]').innerText,
          datetime: x.querySelector('[datetime]').getAttribute('datetime'),
          testStatus: testStatusElem && testStatusElem.getAttribute('aria-label')
        })
      })
  }))
  const allResultsFlat = []
  allResults.forEach(x => x.forEach(y => allResultsFlat.push(y)))
  allResultsFlat.sort((left, right) => {
    if (left.datetime === right.datetime) {
      return 0
    }
    if (left.datetime > right.datetime) {
      return -1
    }
    return 1
  })
  resultsElem.innerHTML = ''
  allResultsFlat.map(x => {
    console.log(x)
    const row = document.createElement('tr')
    const repo = document.createElement('td')
    const pr = document.createElement('td')
    const by = document.createElement('td')

    repo.appendChild(createLink(x.repoLink, x.repoName, '_blank'))
    
    pr.appendChild(createLink(x.issueLink, x.issueName, '_blank'))
    if (x.testStatus) {
      pr.appendChild(createParagraph(x.testStatus))
    } else {
      pr.appendChild(createParagraph('no test status'))
    }
    
    by.innerText = [x.by, ... x.datetime.split('Z')[0].split('T')].join('\n')

    row.appendChild(repo)
    row.appendChild(pr)
    row.appendChild(by)
    return row
  }).forEach(x => resultsElem.appendChild(x))
}

fetchData();

