# Demo of how `express.urlencoded()` reads form POST data

This is a barebones demo of submitting data to an Express server via a form.

It uses `express.static()` to create a simple form, and a `treatForm` function that is triggered when the form is `POST`ed by a click on a button.

In order to access the data sent by the form, the ` express.urlencoded()` middleware is used. See [How form data is treated by the server](#2-how-form-data-is-treated-by-the-server) below for details.

> **NOTE: `node_modules/` has not been added to `.gitignore` for this repository, because certain files in `node_modules` have been edited in order to log the process of reading the form data stream in the Console.**
> 
> **If _by mistake_ you run** `npm install`**, then these edited files will be overwritten. To repair this, simply clone the repository again.**


## 1. How form data is sent
By default, HTML form data is sent to the server with an encoding of `application/x-www-form-urlencoded`. You can confirm this with the following steps:

1. Run `npm start`
2. Visit the site at http://localhost:3000
3. Press the green Treat Form button
4. Open the Developer Tools
5. Select the Network tab
6. In the Name column (or the File column in Firefox) on the left, select `treat`
7. In the pane on the right, select the Headers tab
8. Scroll to Request Headers
9. Find the entry `Content-Type: application/x-www-form-urlencoded`

To see what the data looks like when it is received by the server:

### Google Chrome
10. Select the Payload tab
11. Ensure that the `view source` option is selected. (When it is, you should see the link to the alternative: "view parsed".)

### Mozilla Firefox
10. Select the Request tab
11. Select the Raw slider checkbox

You should see that the data sent to the server looks like this:

`who=Colonel+Mustard&how=Candlestick&where=Kitchen`

## 2. How form data is treated by the server

The data sent to a server by a form may be a single byte or several megabytes (for example: when you upload an image file). For this reason, the server needs to read the incoming data from a [_stream_](https://nodesource.com/blog/understanding-streams-in-nodejs/), with new chunks of data being treated asynchronously as they arrive from the Internet.

---
> You can check that the `request` argument does not contain any
> immediately readable form data by following these steps:
> 1. In `index.js`, uncomment line 54:  
>    // console.log("request:", request);
> 2. Visit http://localhost:3000.
> 3. Click on the grey Don't Treat Form button.
> 4. Check through the output in the Console; you won't find any mention of "Colonel Mustard".
> 5. Don't forget to comment out line 54 again so that it doesn't spam your Console all the time.
>
> Alternatively, you could just check the `request.txt` file, which contains output previously logged by line 54.
---

**How do you get a custom Express server to read the form data stream?**

The short answer is to use the `express.urlEncoded()` middleware function.

The `express.urlEncoded()` middleware function uses the `raw-body` node module to read the incoming POST stream, and when all the data has arrived, it converts the *urlencoded* string into a JavaScript object, which it then assigns to `request.body`. 

### Testing

The web page with the Colonel Mustard form has a green Treat Form button. This sends the form data to the `"/treat"` endpoint in the Express server.

```javascript
app.post("/treat", logBody, urlEncoded, logBody, treatForm)
```

The first time `logBody` is called, the output in the console shows that `request.body` does not yet have a value:

```bash
request.url: /treat
request.body: undefined
```

After the `urlEncoded` middleware function is called, `logBody` is called a second time, and you can see than `request.body` has been set to a JavaScript object containing the form data:

```bash
request.url: /treat
request.body: [Object: null prototype] {
  who: 'Colonel Mustard',
  how: 'Candlestick',
  where: 'Kitchen'
}
```

In between these two console logs from `logBody`, you will see some custom logging that has been added to certain node_module scripts, to show that the process of reading the POST stream occurs asynchronously. This shows that the `treatForm` middleware function is not called until the whole of the POST stream has been received and dealt with.

## TLDR;

Express is installed with a number of dependencies, including `body-parser` and `qs`

```json
{ 
  ...,
  "dependencies": {
    "accepts": "~1.3.8",
    ...,
    "body-parser": "1.20.0",
    ...,
    "qs": "6.10.3",
    ...,
    "vary": "~1.1.2"
  },
  ...
}
```

`qs` is the query string parser that is used by `urlEncoded` if the `{ extended: true }` option is used. `qs` is more powerful and more popular than Node.js's built-in `query-string` parser, which is used if the `{ extended: false }` option is used. However, for working with forms, the built-in `querystring` module does everything you need. You can read more about the differences [here](https://stackoverflow.com/a/50199038).

The `body-parser` module has its own dependencies, including `raw-body`:

```json
{
  "dependencies": {
    "bytes": "3.1.2",
    ...
    "qs": "6.10.3",
    "raw-body": "2.5.1",
    ...,
    "unpipe": "1.0.0"
  },
  ...
}
```

The `raw-body` module contains the code that handles the streaming data.

When the `urlEncoded` middleware is called, the `getRawBody` function in the `raw-body` module will call a `readStream` function. This sets a callback and starts an asynchronous "read" process. When the final chunk of data sent by the form is read in, the callback will be triggered, and as a result the `parse` method of the native Node.js [`querystring` module](https://github.com/nodejs/node/blob/v16.15.0/lib/querystring.js) will convert the url-encoded POST string to an object.

The key moments of this process are logged in Console. To see the exact lines where the console-logging occurs, you can run the app in debug mode (from the Run menu > Start Debugging):

```bash
About to call getBody in body-parser > lib > read.js > read   node_modules/body-parser/lib/read.js:82
readStream called by getRawBody in raw-body > index.js        node_modules/raw-body/index.js:150
getBody completed in body-parser > lib > read.js > read       node_modules/body-parser/lib/read.js:154
onData called in raw-body > index.js > readStream             node_modules/raw-body/index.js:255
done() called in rawbody > index.js > readStream              node_modules/raw-body/index.js:211
queryParse called in body-parser > lib > urlencoded.js > simpleparser with
'body' = who=Colonel+Mustard&how=Candlestick&where=Kitchen    node_modules/body-parser/lib/types/urlencoded.js:260
In the callback for getBody at body-parser > lib > read.js    node_modules/body-parser/lib/read.js:136
  request.body is now {
  "who": "Colonel Mustard",
  "how": "Candlestick",
  "where": "Kitchen"
}
```

## The Key Take-away

You need to use the `express.urlEncoded()` middleware in order to use form data sent to the server in your server-side JavaScript code. It will be accessible as `request.body` after the `express.urlEncoded()` middleware function has been executed.