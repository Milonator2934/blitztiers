export function cleanUsername(username: string) {
  return username.trim()
}

export function validateUsername(username: string) {
  if (username.length < 3 || username.length > 24) {
    return 'Usernames must be 3 to 24 characters long.'
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Use only letters, numbers, and underscores.'
  }

  return null
}

export function usernameToAuthEmail(username: string) {
  return `${username.toLowerCase()}@users.blitztiers.local`
}
