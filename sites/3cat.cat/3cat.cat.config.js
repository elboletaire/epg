const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
const customParseFormat = require('dayjs/plugin/customParseFormat')

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const TZ = 'Europe/Madrid'
const DATE_FORMAT = 'DD/MM/YYYY HH:mm:ss'

// site_id => canal code used by the api behind https://www.3cat.cat/tv3/programacio/canal-*/
const channels = {
  tv3: 'CAD_TV3',
  324: 'CAD_324',
  c33: 'CAD_C33',
  33: 'CAD_C33',
  sx3: 'CAD_SX3',
  esport3: 'CAD_ES3',
  tv3cat: 'CAD_TVI'
}

module.exports = {
  site: '3cat.cat',
  days: 2,
  url({ channel, date }) {
    const canal = channels[channel.site_id]
    if (!canal) throw new Error(`Unknown 3cat.cat channel: ${channel.site_id}`)

    return `https://api.3cat.cat/v2/graellatvfutur?_format=json&canal=${canal}&data_emissio=${date.format(
      'DD/MM/YYYY'
    )}&pagina=1&sdom=img&version=2.0&master=yes`
  },
  parser({ content }) {
    const items = parseItems(content)

    return items.map((item, i) => {
      const start = dayjs.tz(item.data_emissio, DATE_FORMAT, TZ)
      const next = items[i + 1]
      // the api returns whole days, so the last programme runs until midnight
      const stop = next
        ? dayjs.tz(next.data_emissio, DATE_FORMAT, TZ)
        : start.add(1, 'day').startOf('day')

      return {
        title: item.titol || item.titol_tdt,
        sub_title: parseSubTitle(item),
        description: (item.entradeta || '').trim(),
        icon: item.url_imatge_destacat,
        start,
        stop
      }
    })
  },
  channels() {
    return Object.keys(channels)
      .filter(site_id => site_id !== '33')
      .map(site_id => ({
        site_id,
        name: site_id.toUpperCase(),
        lang: 'ca'
      }))
  }
}

function parseItems(content) {
  try {
    const data = typeof content === 'string' ? JSON.parse(content) : content
    const items = data?.resposta?.items?.item
    if (!Array.isArray(items)) return []

    return items
      .filter(item => item.data_emissio)
      .sort(
        (a, b) =>
          dayjs.tz(a.data_emissio, DATE_FORMAT, TZ).valueOf() -
          dayjs.tz(b.data_emissio, DATE_FORMAT, TZ).valueOf()
      )
  } catch {
    return []
  }
}

// films come as `titol: "Pel·lícula"` + `titol_tdt: "Pel·lícula - Real title"`
function parseSubTitle(item) {
  if (!item.titol_tdt || !item.titol) return null
  const prefix = `${item.titol} - `

  return item.titol_tdt.startsWith(prefix) ? item.titol_tdt.slice(prefix.length) : null
}
