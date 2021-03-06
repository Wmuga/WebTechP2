function placedata(items){
    let container = document.getElementById("items")
    container.innerText=""
    for (let item of items){
      let res = document.createElement('div')
      res.id = `i${item.id}`
      res.classList.add('item')
      
      let a = document.createElement('a')
      a.href = `/resume?id=${item.id}`
      a.classList.add('no-decoration')
      let title = document.createElement('h3')
      title.innerText = item.resume
      a.appendChild(title)
      res.appendChild(a)

      let uname = document.createElement('span')
      uname.innerText= item.resname
      res.append(uname)
      
      if (show){
        res.append(document.createElement('br'))

        let delbtn = document.createElement('input')
        delbtn.type="button"
        delbtn.name=`del${item.id}`
        delbtn.id=`del${item.id}`
        delbtn.value="Удалить"
        delbtn.onclick = ()=>{deleteRes(item.id)}
        res.appendChild(delbtn)
      }
      container.appendChild(res)
    }
  }


  function deleteRes(id){
    let req = new XMLHttpRequest()
    req.open("DELETE",`/resume?id=${id}`,false)
    req.send()
    if(req.status==204) {
      let child = document.getElementById(`i${id}`)
      child.parentNode.removeChild(child)
    }
  }