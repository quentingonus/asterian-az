require('dotenv').config();
const rp = require('request-promise');
const cheerio = require('cheerio');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 80;
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello there, welcome from Asterian Lyric API.")
});

app.post('/', (req, res) => {
    const query = req.body.query || null;
    const apikey = req.body.apikey || null;
    if (!apikey) {
        return res.send({
            status: 403,
            message: "Access Denied : API Key is required.",
            lyric: []
        });
    }
    if (apikey != process.env.APIKEY) {
        return res.send({
            status: 403,
            message: "Access Denied : Invalid API Key.",
            lyric: []
        });
    }
    if (!query) {
        return res.send({
            status: 400,
            message: "Query is required",
            lyric: []
        });
    }
    let requestLink = process.env.BASEURL + query;
    requestLink = requestLink.replace(" ", "+")

    rp(requestLink)
        .then(html => {
            const ci1 = cheerio.load(html);
            const lyricLink = ci1('td')[0].children[1].attribs.href;
            rp(lyricLink)
                .then(lyricData => {
                    const ci2 = cheerio.load(lyricData);
                    let lyricDiv = ci2('.col-xs-12.col-lg-8.text-center');
                    ci3 = cheerio.load(lyricDiv.html());
                    lyricDiv = ci3("div")[5].children;
                    let lyricArr = [];
                    lyricDiv.forEach(item => {
                        try {
                            const lrc = item.data.replace("\n", "");
                            if (!(lrc.includes("azlyrics"))) {
                                lyricArr.push(lrc);
                            }
                        } catch (e) {

                        }
                    })
                    lyricArr.shift();
                    res.send({
                        status: 200,
                        message: "Success",
                        lyric: lyricArr
                    })
                })
        });
});

// Rubber Data
app.get('/rubber', async (req, res) => {
    let shfe_data = null;
    let tocom_data = null;
    rp('http://www.shfe.com.cn/data/delaymarket_ru.dat')
        .then(function (data) {
            shfe_data = JSON.parse(data);
            rp('https://cf.market-info.jp/jpx/json/commodity_value?lang=en')
                .then(function (data) {
                    tocom_data = JSON.parse(data)['RSS3 Rubber Futures'];
                    res.send({
                        shfe_data,
                        tocom_data
                    });
                });
        });
});

app.listen(port, () => {
    console.log(`Server started on ${port}`);
})