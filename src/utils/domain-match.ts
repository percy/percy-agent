import { URL } from 'url'

function domainCheck(domain: string, host: string, isWild: boolean) {
  if (domain === host) {
    return true
  }

  if (isWild && host) {
    const last = host.lastIndexOf(domain)
    return (last >= 0 && ((last + domain.length) === host.length))
  }

  return false
}

function pathCheck(pathprefix: string, pathname: string) {
  return pathname.indexOf(pathprefix) === 0
}

export default function domainMatch(pattern: string, siteUrl: string) {
  if (pattern === '*') {
    return true
  } else if (!pattern) {
    return false
  }

  const isWild = ((pattern.indexOf('*.') === 0) || (pattern.indexOf('*/') === 0))

  // tslint:disable-next-line
  let slashed = pattern.split('/') // tslint wants this to be `const` even though it's mutated
  let domain = slashed.shift() as string

  const pathprefix = `/${slashed.join('/')}`
  const parsedUrl = new URL(siteUrl)

  if (isWild) {
    domain = domain.substr(2)
  }

  return (domainCheck(domain, parsedUrl.hostname, isWild) && pathCheck(pathprefix, parsedUrl.pathname))
}
