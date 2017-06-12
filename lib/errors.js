
class CarbonLogError extends Error {
  constructor() {
    super(arguments)
    Error.captureStackTrace(this, CarbonLogError)
  }
}
