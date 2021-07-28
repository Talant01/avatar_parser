import fs from 'fs'
import puppeteer from 'puppeteer';

const getData = async (page, profileURL) => {
    try {
        await page.goto(profileURL)
        page.on('console', consoleObj => console.log(consoleObj.text()));
        await page.waitForSelector('.header-content-wrapper identifier-image div')
        
        await page.waitForTimeout(4000)

        const has = await page.evaluate(() => {
            return !!document.querySelector('.header-content-wrapper identifier-image div.empty')
        })

        if (has) return { profileURL }
        else {
            await page.waitForSelector('.header-content-wrapper identifier-image img')

            const data = await page.evaluate(() => {
                const data = {}

                const img = document.querySelector('header identifier-image img')

                if (img != undefined)
                    data.avatarUrl = img.getAttribute('src')

                return data
            })
            data.profileURL = profileURL
            return data
        }
    } catch (e) {
        console.log(e)
        return await getData(page, profileURL)
    }
}

const start = async () => {
    const browser = await puppeteer.launch({
        headless: false,
        slowMo: 10
    });
    const data = JSON.parse(await fs.readFileSync('to-get-avatar-url.json'))
    const page = await browser.newPage()

    await page.setViewport({ width: 1200, height: 768 })
    await data.reverse()

    let prevData = JSON.parse(await fs.readFileSync('avatar-url.json'))
    let start = prevData.length

    console.log(start)

    for (let i = start; i < Math.min(start + 5000, data.length); i++) {
        console.log(data[i] + ' - ' + i)
        let curData = data[i];
        curData = await getData(page, data[i])
        prevData = JSON.parse(await fs.readFileSync('avatar-url.json'))
        prevData.push(curData)
        await fs.writeFileSync('avatar-url.json', JSON.stringify(prevData))
    }
    browser.close()
}

start()
