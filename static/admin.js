const status = document.getElementById('admin-status')
const open = document.getElementById('open-play')
const link = document.getElementById('play-link')
link.value = new URL('/ext/beanshow/play', location.href).href
document.getElementById('copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(link.value); status.textContent = 'Player link copied.' }
  catch { link.focus(); link.select(); status.textContent = 'Select and copy the player link.' }
})
window.beanBridge().then(bridge => {
  open.disabled = false
  status.textContent = 'Ready · Free play'
  open.addEventListener('click', async () => {
    open.disabled = true
    try { await bridge.request('navigation.replace', {path: '/ext/beanshow/play'}) }
    catch (error) { status.textContent = error.message; open.disabled = false }
  })
}).catch(error => { status.textContent = error.message })
