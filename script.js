// javascript part will be here.

// inputs
let inputForm = document.querySelector('#inputs')
let inputText = document.querySelector('#input-text')
let replacedText = document.querySelector('#replaced-text')
let replacementSymbol = document.querySelector('#replacement')
let processButton = document.querySelector('#submit')

// outputs
let outputText = document.querySelector('#new-text')
let result = document.querySelector('#resultText')
let scanned = document.querySelector('#scanned')
let scrambled = document.querySelector('#scrambled')
let time = document.querySelector('#time')
let loader = document.querySelector('#loader')
let copyText = document.querySelector('#copy')

inputForm.addEventListener('submit', filterText)

function filterText(e){

   result.innerHTML = ''
   loader.style.display = "block"

   
   setTimeout(() => {
      // timer for when the process start running
      let startTime = Date.now()
      loader.style.display = "none"

      let oldText = inputText.value
   
      if (replacedText.value != ""){
         // split words to scan for using commas (,), whitespace (or commas and whitespace)
         let searchText = replacedText.value.split(/[\s,]\s?/)
         let wordsScrambled = 0
         
         let scan;
         for (let i = 0; i < searchText.length; i++){
            let re = new RegExp(searchText[i], 'gi')
   
            if (replacementSymbol.value != ""){
               scan = oldText.replaceAll(re, `${replacementSymbol.value}`)
            } else {
               scan = oldText.replaceAll(re, "***")
            }
   
            // words scrambled
            wordsScrambled += oldText.match(re).length
      
            oldText = scan
         }
   
         // words scanned
         let wordsScanned = oldText.split(/[ ,]/).length
         scanned.innerHTML = wordsScanned
      
         let newText = oldText;
      
         result.innerHTML = `${newText}`
         scrambled.innerHTML = `${wordsScrambled}`
   
         // timer for when the process completes
         let endTime = Date.now()
   
         // console.log(startTime)
         // console.log(endTime)

         let totalTime = ((endTime - startTime) / 10)
         // console.log(totalTime)
         time.innerHTML = `${totalTime}s`
   
      } else {
         // words scanned
         let wordsScanned = oldText.split(/[ ,]/).length
         scanned.innerHTML = wordsScanned
         
         result.innerHTML = oldText
      }
      
   }, (Math.random() * 2000))
   e.preventDefault();
}

// copy new text to clipboard
copyText.onclick = () => {
   console.log(result.innerHTML)
   navigator.clipboard.writeText(result.innerHTML)
   copyText.innerHTML = 'COPIED'
   
   setTimeout(() => {
      copyText.innerHTML = 'COPY'
   }, 3000)
}
