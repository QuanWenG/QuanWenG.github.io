export function updateYear() {
  //By luanyaolingwu©
  console.log('Updating year...')
  function setCookie(name, value, minutes) {
    const date = new Date()
    date.setTime(date.getTime() + (minutes * 60 * 1000))
    const expires = `expires=${date.toUTCString()}`
    document.cookie = `${name}=${value};${expires};path=/`
  }

  function getCookie(name) {
    const nameEQ = `${name}=`
    const ca = document.cookie.split(';')
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === ' ') c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0)
        return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
  }

  function updateYear() {
    const currentYear = new Date().getFullYear()
    if (currentYear >= 2025)
      document.getElementById('yearSpan').textContent = ` - ${currentYear}`
  }

  function fetchYearWithFallback() {
    let attempts = 0
    const maxAttempts = 3

    function fetchYear() {
      fetch('https://worldtimeapi.org/api/timezone/Etc/UTC')
        .then(response => response.json())
        .then((data) => {
          const currentYear = new Date(data.datetime).getFullYear()
          if (currentYear >= 2025)
            document.getElementById('yearSpan').textContent = ` - ${currentYear}`

          setCookie('get_time_from', `web_${Date.now()}`, 1)
        })
        .catch((error) => {
          attempts++
          if (attempts < maxAttempts) {
            fetchYear()
          }
          else {
            console.error('Error fetching the year:', error)
            updateYear()
            setCookie('get_time_from', `local_${Date.now()}`, 1)
          }
        })
    }

    fetchYear()
  }

  const cookieValue = getCookie('get_time_from')
  if (cookieValue) {
    const [source, timestamp] = cookieValue.split('_')
    const currentTime = Date.now()
    if (currentTime - Number.parseInt(timestamp) < 60000) { // 1 minute timeout
      if (source === 'web')
        fetchYearWithFallback()
      else
        updateYear()
    }
    else {
      deleteCookie('get_time_from')
      fetchYearWithFallback()
    }
  }
  else {
    fetchYearWithFallback()
  }
}
//copy => quanweng:非常好 very good