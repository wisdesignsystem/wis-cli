import path from 'node:path'

/**
 * Converts a file path to a POSIX path.
 *
 * @param {string} filePath - The file path to be converted.
 * @returns {string} The converted POSIX path.
 */
export function toPosixPath(filePath) {
  return filePath.replace(new RegExp(path.sep, 'g'), '/')
}

/**
 * Converts the first character of a string to uppercase.
 *
 * @param {string} str - The input string.
 * @returns {string} - The modified string with the first character in uppercase.
 */
export function toFirstUpperCase(str) {
  return str.replace(/^\S/, (c) => c.toUpperCase())
}

/**
 * Replaces the alias in the file path with the corresponding value.
 *
 * @param {Object} alias - The alias object containing the alias names and their corresponding values.
 * @param {string} filePath - The file path to be processed.
 * @returns {string} - The file path with the alias replaced.
 */
export function replaceAlias(alias, filePath) {
  const aliasName = Object.keys(alias).find((name) => {
    return filePath.startsWith(`${name}/`)
  })

  if (aliasName) {
    return filePath.replace(aliasName, alias[aliasName])
  }

  return filePath
}
