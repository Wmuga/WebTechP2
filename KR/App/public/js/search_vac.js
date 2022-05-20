function placedata(items){
    let container = document.getElementById("items")
    container.innerText=""
    for (let item of items){
      let vac = document.createElement('div')
      vac.id = `i${item.id}`
      vac.classList.add('item')
      
      let a = document.createElement('a')
      a.href = `/vacancy?id=${item.id}`
      a.classList.add('no-decoration')
      let title = document.createElement('h3')
      title.innerText = `Название: ${item.vacancy}`
      a.appendChild(title)
      vac.appendChild(a)
      
      let sal = document.createElement('span')
      sal.classList.add('sal')
      sal.innerText = `Заработная плата: ${item.salary}`
      vac.appendChild(sal)
      vac.append(document.createElement('br'))
      vac.append(document.createElement('br'))

      for(let keyword of item.keywords){
        let keyw = document.createElement('span')
        keyw.classList.add('keyword')
        keyw.innerText = keyword
        vac.appendChild(keyw)
      }
      if (show){
        vac.append(document.createElement('br'))
        vac.append(document.createElement('br'))

        let delbtn = document.createElement('input')
        delbtn.type="button"
        delbtn.name=`del${item.id}`
        delbtn.id=`del${item.id}`
        delbtn.value="Удалить"
        delbtn.onclick = ()=>{deleteVac(item.id)}
        vac.appendChild(delbtn)
      }
      container.appendChild(vac)
    }
  }

  function searchdata(){
    let req = new XMLHttpRequest()
    req.open("POST","/search",false)
    req.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
    req.send(`keywords=${document.getElementById('keywords').value}`)
    placedata(JSON.parse(req.responseText))
  }

  function deleteVac(id){
    let req = new XMLHttpRequest()
    req.open("DELETE",`/vacancy?id=${id}`,false)
    req.send()
    if(req.status==204) {
      let child = document.getElementById(`i${id}`)
      child.parentNode.removeChild(child)
    }
  }