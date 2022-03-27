'use strict'

const fs = require('fs')
const path = require('path')

function isExist(filePath) {
  return fs.existsSync(filePath)
}

function isDirectory(filePath) {
  return fs.statSync(filePath).isDirectory()
}

function isFile(filePath) {
  return fs.statSync(filePath).isFile()
}

function isEmptyFile(filePath) {
  return !isExist(filePath) || !fs.readFileSync(filePath).toString()
}

function readFileContent(filePath) {
  return fs.readFileSync(filePath).toString()
}

function writeFileContent(filePath, content) {
  fs.writeFileSync(filePath, content)
}

function reduceReaddirFactory(reducer) {
  return function (filePath, result) {
    const files = fs.readdirSync(filePath)
    return files.reduce((target, fileName, index) => {
      const currFilePath = path.resolve(filePath, fileName)
      return reducer(target, currFilePath, index)
    }, result)
  }
}

const readDirectories = reduceReaddirFactory((result, filePath) => {
  if (isDirectory(filePath)) {
    result.push(filePath)
  }
  return result
})

const readFiles = reduceReaddirFactory((result, filePath) => {
  if (isFile(filePath)) {
    result.push(filePath)
  }
  return result
})

module.exports = {
  isExist,
  isDirectory,
  isFile,
  isEmptyFile,

  readFileContent,
  writeFileContent,

  reduceReaddirFactory,

  readFiles,
  readDirectories,
}
