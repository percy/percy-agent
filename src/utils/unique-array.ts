let unique = (rawArray: Array<any>): Array<any> => {
  return Array.from(new Set(rawArray))
}

export default unique
