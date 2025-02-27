const cheerio = require('cheerio')
const dayjs = require('dayjs')
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)

const channels = {
  tv3: 'https://www.3cat.cat/Ccma/standalone/tv3_programacio_canal-tvc/graellacatchup/graella_tv3_{day}/0/0/',
  324: 'https://www.3cat.cat/Comu/standalone/tv3_programacio_canal-324/contenidor/divgraella_324_{day}/0/0/',
  sx3: 'https://www.3cat.cat/Comu/standalone/tv3_programacio_canal-sx3/contenidor/divgraella_cs3_{day}/0/0/',
  c33: 'https://www.3cat.cat/Comu/standalone/tv3_programacio_canal-33/contenidor/divgraella_c33_{day}/0/0/',
  esport3:
    'https://www.3cat.cat/Comu/standalone/tv3_programacio_canal-esport3/contenidor/divgraella_es3_{day}/0/0/',
  tv3cat:
    'https://www.3cat.cat/Comu/standalone/tv3_programacio_canal-tv3cat/contenidor/divgraella_tvi_{day}/0/0/'
}

module.exports = {
  site: '3cat.cat',
  url({ channel, date }) {
    const num = getDateNumber(date)
    return channels[channel.site_id].replace('{day}', num)
  },
  parser({ content }) {
    const $ = cheerio.load(content)
    const programs = []

    const entries = $('ul.programes > li')
    entries.each((i, el) => {
      const start = dayjs($(el).attr('data-date'), 'DD/MM/YYYY HH:mm:ss')
      const nextEl = entries[i + 1]
      let stop

      if (nextEl) {
        stop = dayjs($(nextEl).attr('data-date'), 'DD/MM/YYYY HH:mm:ss')
      } else {
        stop = start.startOf('day').add(6, 'hours')
      }

      programs.push({
        title: $(el).find('.informacio-programa strong').text(),
        start,
        stop,
        icon: $(el).find('img').attr('src')
      })
    })
    return programs
  },
  channels() {
    return Object.keys(channels).map(site_id => ({
      site_id,
      name: site_id.toUpperCase(),
      lang: 'ca'
    }))
  }
}

function getDateNumber(date) {
  const today = dayjs().startOf('day')
  const targetDate = dayjs(date).startOf('day')

  const diffDays = targetDate.diff(today, 'day')

  return diffDays + 1
}
