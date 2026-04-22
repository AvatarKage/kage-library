import "./typescript/extensions/string.js"
import "./typescript/extensions/object.js"

import Snowflake from "./typescript/classes/snowflake.js";
import { config } from "./typescript/modules/config/readConfig.js";
import formatNumber from "./typescript/helpers/formatNumber.js";
import URL from "./typescript/classes/url.js";
import { toMs } from "./typescript/helpers/misc.js";
import Database from "./typescript/classes/database.js";
import Identifier from "./typescript/classes/identifier.js";
import { log } from "./typescript/modules/logging/log.js";
import toArray from "./typescript/helpers/toArray.js";
import WebClient from "./typescript/classes/webClient.js";
import parseDuration from "./typescript/helpers/parseDuration.js";
import { convertNumber } from "./typescript/helpers/convertNumber.js";

export const snowflake = new Snowflake(config.generation.epoch);

log.snowflake.info(snowflake.decode("36566882404270080"));
log.number.info(toArray(formatNumber(8946518965)));

const url = new URL("http://www.example.org/test?q=78541#top");
url.updateQuery("q", "confirmed");
url.updateQuery("a", "bro");
url.updateHash("cc");
url.updateDomain("example.com");
url.updateSubdomain("");
url.updatePath("premium");
url.updateProtocol("https");

log.url.info(url);

log.number.info(toMs(1));

export const db = {
    audits: new Database("data/audits.sqlite"),
    contributors: new Database("data/contributors.sqlite"),
    metadata: new Database("data/metadata.sqlite")
};

// Populate databases on first run
db.audits.transaction((query) => {
    if (!query("SELECT * FROM identifiers LIMIT 1").success) { query("./sql/identifiers.sql"); };
});

db.contributors.transaction((query) => {
    if (!query("SELECT * FROM contributors LIMIT 1").success) { query("./sql/contributors.sql"); };
});

db.metadata.transaction((query) => {
    if (!query("SELECT * FROM metadata LIMIT 1").success) { query("./sql/metadata.sql"); };
});

log.db.debug(db.contributors.query("SELECT * FROM contributors"));

export const id = new Identifier(db.audits);
const shortlink = id.generate("SHORTLINK");

log.id.success(shortlink);
log.id.info(id.get(shortlink));

const wc = new WebClient(db.metadata);
log.crawler.success(await wc.getMetadata(url.href));
log.crawler.success(await wc.callAPI("https://api.ipify.org?format=json"));

// Better if in a cron
log.crawler.success(wc.clearCache(parseDuration("1d")));

log.c.info(convertNumber("1", "words"))