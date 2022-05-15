function testPass(){
  let btn = document.getElementById("submit")
  if(document.getElementById("password").value.length>0 && document.getElementById("login").value.length>0){
    btn.disabled=false
  }
  else{
    btn.disabled=true
  }
}

window.addEventListener('load',()=>{
  setInterval(testPass,100)
})