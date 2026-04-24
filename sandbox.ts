import Snowflake from "./typescript/backend/classes/snowflake.js";
import { config } from "./typescript/backend/config/readConfig.js";
import formatNumber from "./typescript/backend/helpers/formatNumber.js";
import URL from "./typescript/backend/classes/url.js";
import { toMs } from "./typescript/backend/helpers/misc.js";
import Database from "./typescript/backend/classes/database.js";
import Identifier from "./typescript/backend/classes/identifier.js";
import { log } from "./typescript/backend/modules/logging/log.js";
import toArray from "./typescript/backend/helpers/toArray.js";
import WebClient from "./typescript/backend/classes/webClient.js";
import parseDuration from "./typescript/backend/helpers/parseDuration.js";
import { convertNumber } from "./typescript/backend/helpers/convertNumber.js";

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

log.id.info(shortlink);
log.id.info(id.get(shortlink));

const wc = new WebClient(db.metadata);
log.crawler.info(await wc.getMetadata(url.href));
log.crawler.info(await wc.callAPI("https://api.ipify.org?format=json"));

// Better if in a cron
log.crawler.info(wc.clearCache(parseDuration("1d")));

log.c.info(convertNumber("1", "words"))

log.sandbox.info("This text will save to file").save();

log.crawler.info(await wc.ping("https://avatarkage.com"))