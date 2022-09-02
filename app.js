const http = require('http')
const express = require('express')
const app = express()
const mysql = require('mysql2')
const db = require('./models/index.js')
const keylist = require('./keylist.json')
const keyCrolling = require('./keycorlling.json')
const titleIdList = require('./idtitlelist.json')
const contentState = require('./contentState.json')
const boxnumberAndIp = require('./boxnumber-ip.json')
const boxVotedNumber = require('./boxvotednumber.json')
const keywordExplanationList = require('./keywordexplanation.json')
const { News } = db
const cors = require('cors')
const contents = require('./contents.json')
const newscontents = require('./newscontents.json')
let hotkeyword = require('./hotkeyword.json')
const bodyParser = require('body-parser')
const fs = require('fs')
const { listenerCount } = require('process')

/** cors, bodyparsing, static data <client image> */
app.use(cors())
app.use(bodyParser.json())
app.use(express.static('staticdata'))

/** Sending client news list with query which is current news number in client  */
app.get('/defaultcontentdata', (request, response) => {
  const currentNumber = request.query.curnum
  const endNumber = currentNumber + 10
  const contentsContinuing = [...contentState['진행 중']].reverse()
  const contentsEnd = [...contentState['끝!']].reverse()
  const totalContentId = [...contentsContinuing, ...contentsEnd]
  const idToSend = totalContentId.slice(
    currentNumber,
    Math.min(totalContentId.length, endNumber),
  )
  const possibleToSendNext = endNumber >= totalContentId.length ? false : true
  const contentToSend = [possibleToSendNext]
  idToSend.forEach((id) => {
    contentToSend.push(contents[id - 1])
  })
  const contentsJson = JSON.stringify(contentToSend)
  response.send(contentsJson)
})

/** Sending key list to clent to use search engine */
app.get('/keylist', (request, response) => {
  const keylistJson = JSON.stringify(keylist)
  response.send(keylistJson)
})

/** Sending news list depending on keyword in parameters when client request on search box */
app.get('/keybox/:keyword', (request, response) => {
  const { keyword } = request.params
  if (keyword in keyCrolling) {
    let boxNums = keyCrolling[keyword]
    const continueContents = []
    const ambiguitiousContents = []
    const endContents = []
    let result
    for (let number of [...boxNums].reverse()) {
      let cur = contents[number - 1]
      if (cur['state'] == '진행 중') {
        continueContents.push(cur)
      } else {
        endContents.push(cur)
      }
    }
    result = [...continueContents, ...ambiguitiousContents, ...endContents]
    response.send(JSON.stringify(result))
  } else {
    response.send(JSON.stringify([]))
  }
})

app.get('/keywordExplanation/:keyname', (request, response) => {
  const { keyname } = request.params
  const keywordExplanation = keywordExplanationList[keyname]
  response.send(JSON.stringify(keywordExplanation))
})

/**  */
app.get('/newscontent/:id', (request, response) => {
  const { id } = request.params
  let newsToSend
  if (newscontents.length >= id - 1) {
    newsToSend = newscontents[id - 1]
  } else {
    newsToSend = []
  }
  response.send(JSON.stringify(newsToSend))
})

app.get('/hotkeyword', (request, response) => {
  const keylistContinue = []
  const keylistEnd = []
  hotkeyword.map((obj) => {
    if (obj['left'] > 0) {
      keylistContinue.push({ keyword: obj['keyword'], left: true })
    } else {
      keylistEnd.push({ keyword: obj['keyword'], left: false })
    }
  })
  const jsonToSend = [keylistContinue, keylistEnd]
  response.send(JSON.stringify(jsonToSend))
  console.log('잘 보내진 듯?')
})

app.post('/datachanger', (request, response) => {
  const requestData = request.body
  console.log(requestData)
  let {
    title,
    subtitle,
    termStart,
    termEnd,
    state,
    key,
    summary,
    aComment,
    bComment,
    linkList,
    userName,
  } = requestData
  if (userName != '김민재') {
    response.send('passworderror')
  } else {
    try {
      const requestKeys = key.split(',')
      const curId = contents.length + 1
      const newIdTitle = {
        id: curId,
        title: title,
        state: state,
      }
      const newContent = {
        id: curId,
        title: title,
        subtitle: subtitle,
        termStart: termStart,
        termEnd: termEnd,
        state: state,
        key: key,
      }
      const newNewsContent = {
        id: curId,
        title: title,
        summary: summary,
        A: aComment,
        B: bComment,
        linkList: linkList,
      }
      titleIdList.push(newIdTitle)
      fs.writeFileSync('./idtitlelist.json', JSON.stringify(titleIdList))

      const currentState = state != '진행 중' ? '끝!' : state
      contents.push(newContent)
      contentState[currentState].push(curId)
      fs.writeFileSync('./contents.json', JSON.stringify(contents))
      fs.writeFileSync('./contentState.json', JSON.stringify(contentState))

      newscontents.push(newNewsContent)
      fs.writeFileSync('./newscontents.json', JSON.stringify(newscontents))
      requestKeys.forEach((currentKey) => {
        if (currentKey in keyCrolling) {
          keyCrolling[currentKey].push(curId)
        } else {
          keyCrolling[currentKey] = [curId]
        }
        if (!keylist['keylist'].includes(currentKey)) {
          console.log('iamhere4')
          keylist['keylist'].push(currentKey)
        }
      })
      fs.writeFileSync('./keycorlling.json', JSON.stringify(keyCrolling))
      fs.writeFileSync('./keylist.json', JSON.stringify(keylist))

      boxVotedNumber[curId] = [1, 1]
      boxnumberAndIp[curId] = new Set()
      response.send('good')
    } catch (e) {
      response.send('문제 있음')
    }
  }
})

app.post('/hotkeywordpost', (request, response) => {
  const requestData = request.body
  hotkeyword = requestData
  fs.writeFileSync('./hotkeyword.json', JSON.stringify(hotkeyword))
  response.send('goood')
})

app.get('/getidtitlelist', (request, response) => {
  response.send(JSON.stringify(titleIdList))
})

app.get('/contentstorevise/id/:valueToRevise', (request, response) => {
  const { valueToRevise } = request.params
  console.log(valueToRevise)
  const contentsToSend = contents[valueToRevise - 1]
  response.send(JSON.stringify(contentsToSend))
})

app.get('/contentstorevise/title/:valueToRevise', (request, response) => {
  const { valueToRevise } = request.params
  console.log(valueToRevise)
  console.log(contents)
  const contentsToSend = contents.filter(
    (content) => (content['title'] = valueToRevise),
  )
  response.send(JSON.stringify(...contentsToSend))
})

app.post('/contentstorevise', (request, response) => {
  const requestData = request.body
  const {
    id,
    title,
    subtitle,
    termStart,
    termEnd,
    state,
    key,
    newsSummary,
    aComment,
    bComment,
    linkList,
  } = requestData
  const beforecontent = { ...contents[id - 1] }
  const newsContentToRevise = newscontents[id - 1]
  contents[id - 1] = requestData
  if (beforecontent['state'] != state) {
    beforestate = beforecontent['state']
    const beforeStateToFind = beforestate != '진행 중' ? '끝!' : beforestate
    const stateToFind = state != '진행 중' ? '끝!' : state
    if (beforeStateToFind !== stateToFind) {
      ;(contentState[beforeStateToFind] = contentState[
        beforeStateToFind
      ].filter((i) => {
        return i !== id
      })),
        contentState[stateToFind].push(id)
    }
    titleIdList[id - 1]['state'] = state
    fs.writeFileSync('./contentState.json', JSON.stringify(contentState))
    fs.writeFileSync('./idtitlelist.json', JSON.stringify(titleIdList))
  }
  if (beforecontent['key'] != key) {
    const newKeyList = key.split(',')
    newKeyList.forEach((k) => {
      if (!beforecontent['key'].includes(k)) {
        if (k in keyCrolling) {
          keyCrolling[k].push(id)
        } else {
          keyCrolling[k] = [id]
        }
      }
    })
    fs.writeFileSync('./keycorlling.json', JSON.stringify(keyCrolling))
  }
  fs.writeFileSync('./contents.json', JSON.stringify(contents))
  newsContentToRevise['A'] = aComment
  newsContentToRevise['B'] = bComment
  newsContentToRevise['summary'] = newsSummary
  newsContentToRevise['linkList'] = linkList
  response.send('잘 됨')
})

app.get('/checkIpVoted', (request, response) => {
  const { ip, boxNumber } = request.query
  console.log(boxNumber)
  const [leftVoted, rightVoted] = boxVotedNumber[boxNumber]
  if (ip in boxnumberAndIp[boxNumber]) {
    const jsonToSend = {
      voted: boxnumberAndIp[boxNumber][ip],
      leftVoted: leftVoted,
      rightVoted: rightVoted,
    }
    response.send(JSON.stringify(jsonToSend))
  } else {
    const jsonToSend = {
      voted: false,
      leftVoted: leftVoted,
      rightVoted: rightVoted,
    }
    response.send(JSON.stringify(jsonToSend))
  }
})

app.post('/addVotingIp', (request, response) => {
  const { ip, part, boxNumber } = request.body
  console.log(ip)
  if (ip in boxnumberAndIp[boxNumber]) {
    response.send('false')
  } else {
    boxnumberAndIp[boxNumber][ip] = part
    const index = part === 'left' ? 0 : 1
    boxVotedNumber[boxNumber][index] += 1
    response.send('true')
  }
  fs.writeFileSync('./boxnumber-ip.json', JSON.stringify(boxnumberAndIp))
  fs.writeFileSync('./boxvotednumber.json', JSON.stringify(boxVotedNumber))
})

app.get('/getimage', (request, response) => {
  response.sendFile('/Users/yungangseog/Desktop/project_server/screenshot.png')
})

app.listen(3000, () => {
  console.log('돌아가는 중')
})
