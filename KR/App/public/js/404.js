const ar = [[0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
[0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,1,1,1,1,1,0,0],
[0,0,0,0,1,1,0,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,1,1,0,0],
[0,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,1,1,0,0],
[0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0],
[0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0],
[0,1,1,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,0,1,1,0,0,0,0,1,1,0,0],
[1,1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,1,1,0,0],
[1,1,1,1,1,1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1,1,1,1,1,1],
[1,1,1,1,1,1,1,1,1,1,1,0,0,1,1,0,0,0,0,0,1,1,0,0,1,1,1,1,1,1,1,1,1,1,1],
[0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
[0,0,0,0,0,0,0,1,1,0,0,0,0,0,1,1,1,0,1,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,0],
[0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0]]

HTMLCollection.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

function changeOpacity(){
  const changable = 5
  let notcolored = document.getElementsByClassName('tempnocolor')
  let colored = document.getElementsByClassName('color')
  if(notcolored.length){
    for(let i = 0;i<Math.min(changable,notcolored.length);i++){
      if (Math.random()>0.5){
        let elem = notcolored.random()
        elem.classList.remove('tempnocolor')
      }
    }
  }
  for(let i = 0;i<Math.min(changable,colored.length);i++){
   if (Math.random()>0.5){
     let elem = colored.random()
     elem.classList.add('tempnocolor')
    }
  }
}

function createTable(){
  let table = document.getElementById("art")
  for (let line of ar){
    let tr = document.createElement('tr')
    for (let pix of line){
      let td = document.createElement('td')
      if (pix) td.classList.add("color")
      tr.appendChild(td)
    }
    table.appendChild(tr)
  }
  setInterval(changeOpacity,2000)
}

window.addEventListener('load',()=>createTable())