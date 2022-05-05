require('dotenv').config()
const path = require('path')
const express = require('express')

const app = express()
const urlEncoded = express.urlencoded({ extended: false })

const PORT = process.env.PORT || 3000
const PUBLIC = path.join(__dirname, "public")

// Create the form
app.use(express.static(PUBLIC))

// Handle the form submission, using multiple middleware
// functions
app.post(
  "/dont-treat",
  logBody,
  treatForm
)
app.post(
  "/treat",
  logBody,
  urlEncoded,
  logBody,
  treatForm
)


app.listen(PORT, () => {
  console.log(
    `Ctrl-click to visit site at http://localhost:${PORT}`
  )
})


function logBody(request, response, next) {
  const body = request.body

  if (!body) {
    console.log("<<<<<")
  } else {
    console.log("\n  (end of treatment by urlEncoded)\n")
  }

  console.log("request.url:", request.url)
  console.log("request.body:", body)

  next()
}


function treatForm(request, response, next) {
  // console.log("request:", request);
  // See request.txt for output when Don't Treat Form is clicked.
  
  console.log("treatForm called in index.js")
  const string = JSON.stringify(request.body, null, "  ")
  response.send(`<!doctype html>Form received: ${string}`)
  console.log("treatForm completed in index.js")
  console.log(">>>>>")
}