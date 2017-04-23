// ==UserScript==
// @name         Mitbbs-bot-blocker
// @namespace    http://tampermonkey.net/
// @version      0.6
// @description  Manages and blocks bot generated content. Inspired by Smalltalk80's original GM script, http://userscripts-mirror.org/scripts/review/78633
// @author       术版小吃
// @match        http://www.mitbbs.com/*
// @match        https://www.mitbbs.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

const storageKey = 'mitbbs.blocklist'
let pageType = locationGuesser()

function locationGuesser () {
  let pageType
  let url = window.location.href
  if (url.indexOf('article') > -1) {
    pageType = 1
  } else if (url.indexOf('bbsdoc') > -1) {
    pageType = -1
  } else {
    pageType = 0
  }

  return pageType
}

function getBlocklist () {
  let blockList = localStorage.getItem(storageKey)
  if (blockList === null) {
    setBlocklist([])
    blockList = localStorage.getItem(storageKey)
  }

  try {
    blockList = JSON.parse(blockList)
  } catch (error) {
    blockList = []
    setBlocklist(blockList)
  }

  blockList = Array.isArray(blockList) ? blockList : []
  return blockList
}

function setBlocklist (idNameList) {
  // remove duplicate items
  // todo: babel output for this one doesn't really work, have to revert back to old fashion way
  // idNameList = [...new Set(idNameList)]
  let uniqueidNameList = idNameList.filter((elem, index, self) => {
    return index === self.indexOf(elem)
  })
  localStorage.setItem(storageKey, JSON.stringify(uniqueidNameList))
}

function getBlockFlag () {
  let blockFlag = (localStorage.getItem(storageKey + '.flag'))
  if (blockFlag === null) {
    setBlockFlag(0)
    blockFlag = localStorage.getItem(storageKey + '.flag')
  }
  //  js, just being js
  return parseInt(blockFlag)
}

function setBlockFlag (flag) {
  localStorage.setItem(storageKey + '.flag', flag)
}

function changePostVisibility () {
  let blockList = getBlocklist()
  let flag = getBlockFlag()
  // if list is not empty
  let counter = 0
  if (blockList) {
    let taolunDiv = document.querySelector('td.taolun_leftright tbody')
    // yeah yeah yeah magic number, whatever
    // this will miss the first one though, nice try langfang coder
    let userIDtdNodeList = taolunDiv.querySelectorAll('td:nth-child(5)')
    userIDtdNodeList.forEach(td => {
      // damn, now i miss jquery/zepto
      let id = td.querySelector('a.news') ? td.querySelector('a.news').innerHTML.replace(/\s/g, '') : null

      //  reset all reply to visible. This is a hack-ish method to fix content not being displayed after userID has been removed from blocklist.
      //  TODO: maybe in the near future, we should keep a local copy of blocklist so that we can compare the changes and show/hide content intelligently, maybe
      td.parentNode.style.display = ''

      //  yeah, nested if statements
      if (blockList.indexOf(id) > -1) {
        if (flag) {
          td.parentNode.style.display = 'none'
          counter += 1
        } else {
          td.parentNode.style.display = ''
        }
      }
    })
    counter = flag ? counter : 0
    document.getElementById('blockCounter').innerHTML = counter
  }
}

function changeReplyVisibility () {
  //  now we on individual post page
  let blockList = getBlocklist()
  let flag = getBlockFlag()
  let counter = 0
  let sideBarBG = document.querySelectorAll('td.wenzhang_bg')
  sideBarBG.forEach(reply => {
    let post = reply.parentElement.parentElement.parentElement.parentElement.parentElement
    //  another magic number!
    let userMenu = post.querySelector('td.jiahui-4 td[width="83%"]')
    let userID = post.querySelector('td.wenzhang strong a').innerHTML.replace(/\s/g, '')
    let hasButton = userMenu.lastChild.innerHTML !== undefined
    if (!hasButton) {
      let blockButton = document.createElement('span')
      blockButton.setAttribute('class', 'buttonHolder')
      blockButton.innerHTML = '&nbsp;&nbsp;<button class="addToBlock" title="' + userID + '">屏蔽！</button>'
      userMenu.appendChild(blockButton)
    }
    //  reset all reply to visible. This is a hack-ish method to fix content not being displayed after userID has been removed from blocklist.
    //  TODO: maybe in the near future, we should keep a local copy of blocklist so that we can compare the changes and show/hide content intelligently, maybe
    post.style.display = ''

    if (blockList.indexOf(userID) > -1) {
      if (flag) {
        post.style.display = 'none'
        counter += 1
      } else {
        post.style.display = ''
      }
    }
    counter = flag ? counter : 0
    document.getElementById('blockCounter').innerHTML = counter
  })

  let allBlockButton = document.querySelectorAll('.addToBlock')
  Array.from(allBlockButton).forEach(button => {
    let userID = button.getAttribute('title')
    button.addEventListener('click', () => {
      let yesBlock = confirm('Block ' + userID + ' ?')
      if (yesBlock) {
        blockList.push(userID)
        setBlocklist(blockList)
        document.getElementById('blockListInput').value = getBlocklist().join()
        toggleBlockedContent()
      }
    })
  })
}

function toggleBlockedContent () {
  document.getElementById('isBlocking').checked ? setBlockFlag(1) : setBlockFlag(0)
  switch (pageType) {
    case 1:
      changeReplyVisibility()
      break
    case -1:
      changePostVisibility()
      break
  }
}

function changeBlockListVisibility () {
  let notVisible = document.getElementById('blockListPop').style.display === 'none'
  if (notVisible) {
    document.getElementById('blockListInput').value = getBlocklist().join()
    document.getElementById('blockListPop').style.display = ''
  } else {
    document.getElementById('blockListPop').style.display = 'none'
  }
}

function updateBlockList () {
  let newBlockList = document.getElementById('blockListInput').value
  //  remove line break, space, trailing comma
  newBlockList = newBlockList.replace(/(\r\n|\n|\r)/gm, '').replace(/\s/g, '').replace(/,+$/, '')
  newBlockList = newBlockList.split(',')
  setBlocklist(newBlockList)

  // re-filter existing content
  toggleBlockedContent()
}

function hideBlockList () {
  document.getElementById('blockListPop').style.display = 'none'
}

function prepPage () {
  let flag = getBlockFlag()
  getBlocklist()
  if (flag) {
    document.getElementById('isBlocking').checked = true
    toggleBlockedContent()
  }
}

function pageOnLoad () {
  //  build blocker control gui
  let blockerDiv = document.createElement('div')
  blockerDiv.innerHTML = '<button id="showBlocklist">黑名单</button><input type="checkbox" id="isBlocking" /><span id="blockCounter" title="Currently Blocked"></span>'
  blockerDiv.style.cssText = 'position:fixed; bottom:2em; right:0.5em; width:9em; padding:0.5em; border-radius:0.25em; background-color:#D7EAF9; box-shadow:2px 2px 4px 0px rgba(0,0,0,0.5); text-align:center; cursor:pointer;'
  document.body.appendChild(blockerDiv)

  document.getElementById('showBlocklist').addEventListener('click', changeBlockListVisibility)
  document.getElementById('blockCounter').style.cssText = 'padding:0 4px; font-weight:bold'
  document.getElementById('isBlocking').addEventListener('change', toggleBlockedContent)

  //  block list
  let blockListDiv = document.createElement('div')
  blockListDiv.setAttribute('id', 'blockListPop')
  blockListDiv.innerHTML = '<span>修改ID，用逗号分隔,大小写敏感！</span>' +
    '<br/>' +
    '<textarea rows="10" cols="40" id="blockListInput"></textarea>' +
    '<br/>' +
    '<button id="updateBlockList">Update</button><span style="width:2em"></span><button id="closePop">Close</button>'
  blockListDiv.style.cssText = 'position:fixed; bottom:5.3em; right:0.5em; padding:0.5em; border-radius:0.25em; background-color:#D7EAF9; box-shadow:2px 2px 4px 0px rgba(0,0,0,0.5); text-align:center; display:none'
  document.body.appendChild(blockListDiv)

  document.getElementById('updateBlockList').addEventListener('click', updateBlockList)
  document.getElementById('closePop').addEventListener('click', hideBlockList)

  prepPage()
}

function ready (fn) {
  if (document.readyState !== 'loading') {
    fn()
  } else {
    document.addEventListener('DOMContentLoaded', fn)
  }
}

ready(pageOnLoad)
