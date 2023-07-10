const puppeteer = require('puppeteer')
const qrcode = require('qrcode-terminal')
const { Client, LocalAuth, MessageMedia, MessageAck } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    // Generate and scan this code with your phone
    qrcode.generate(qr, { small: true })
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('Client is ready!');
});

const incomingMessages = []

//! On Message Event :

client.on('message', async msg => {

    incomingMessages.push(msg);

    if (incomingMessages.length > 0) {
        respondToNextMessage(incomingMessages);
    }


});
// while (messageBufferArr.length > 0) {
//     console.log(messageBufferArr)
// }
function respondToNextMessage(arr) {
    arr.forEach(async (msg) => {

        console.log(msg)
        if (msg.hasQuotedMsg) {

            //Todo: IF this message is a reply to another message :
            const quotedMessage = await msg.getQuotedMessage();
            if (quotedMessage) {
                const quotedMessageContent = quotedMessage.body;

                const num = Number(msg.body);

                //! Look for the requested url in the quoted message:
                const regex = /\[(.*?)\]/g;
                const matches = quotedMessageContent.match(regex);

                if (matches) {
                    const extractedStrings = matches.map((match) => match.slice(1, -1));


                    //? Take FullPage screenshot of the website and Send it Back : 
                    await takeScreenshot(extractedStrings[num - 1], 1)

                    //? Send Screenshot :
                    const media = MessageMedia.fromFilePath('./screenshot1.png')
                    await client.sendMessage(msg.from, media)

                }

            }
        } else {

            //Todo: This message is a normall message :
            const content = msg.body
            const contact = await msg.getContact();

            //Todo: Greeting :
            if (content == 'hey') {
                client.sendMessage(msg.from, `Hi There, ${contact.name}`)

            }

            //Todo: Google search :
            else if (content.startsWith('Google ')) {

                const searchArr = await googleSearch(content);
                client.sendMessage(msg.from, `Here is the top google results :\n \n ${searchArr[0]}\n ${searchArr[1]}\n ${searchArr[2]}\n ${searchArr[3]}\n ${searchArr[4]}\n `)
            }
            //Todo: Take screenshot :
            else if (content.startsWith('Scrn ')) {

                const contentUrl = `http://${content.replace(/^Scrn /, '')}`
                await takeScreenshot(contentUrl, 2)
                const media = MessageMedia.fromFilePath('./screenshot2.png')
                await client.sendMessage(msg.from, media)
            }
            else
                client.sendMessage(msg.from, 'List of commands : \n \n 1-1 Google : For Google Search . \n 1-2 Reply ( 1-5 ) to choose search result . \n 2- Scrn : To screenshot a Url .')
        }
    })
}

client.initialize();

//? Google search :
const googleSearch = async (searchTerm) => {
    const searchUrl = `https://www.google.com/search?q=${searchTerm.replace(/^Google /, '').replace(/\s+/g, '+')}`;

    const browser = await puppeteer.launch({ headless: "new" });

    const page = await browser.newPage();

    await page.goto(searchUrl);

    const results = await page.evaluate(() => {

        const searchResults = [];
        const resultElements = document.querySelectorAll('div.yuRUbf');

        for (let i = 0; i < 5 && i < resultElements.length; i++) {
            const resultElement = resultElements[i];
            const titleElement = resultElement.querySelector('h3');
            const urlElement = resultElement.querySelector('a');

            if (titleElement && urlElement) {
                const title = titleElement.innerText;
                const url = urlElement.href;

                const paragraph = `${i + 1}. ${title}   \n URL: [${url}]`;
                searchResults.push(paragraph);
            }
        }

        return searchResults;
    });


    await browser.close();
    return results
}

//? Take Screenshot of any Url :

const takeScreenshot = async (url, sNum) => {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto(url);
    await page.screenshot({ path: `./screenshot${sNum}.png`, });
    await browser.close();
};


