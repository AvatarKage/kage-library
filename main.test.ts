import { config } from "./app.config.js";

/* 
————————————————————————————————————————————————————————————————
Logger
———————————————————————————————————————————————————————————————— 
*/

import Logger from "./typescript/_common/classes/logger.js";

// Recommended to export per server
export const log = new Logger({
    path: "/logs/sandbox", 
    useNerdFonts: config.useNerdFonts
});

log.test.info("This text will be saved to the logs folder").save();
log.test.info("This text won't be saved to the logs folder");

/* 
————————————————————————————————————————————————————————————————
Snowflake
———————————————————————————————————————————————————————————————— 
*/

import Snowflake from "./typescript/backend/_common/classes/snowflake.js";

// Recommended to export per server (unique machine per server)
const snowflake = new Snowflake(
    config.generation.epoch, 
    config.generation.machine
);

const snowflakeId = snowflake.gen();

log.snowflake.info("Generated snowflake:", snowflakeId);
log.snowflake.info("Decoded snowflake:", snowflake.decode(snowflakeId));

/* 
————————————————————————————————————————————————————————————————
Database
———————————————————————————————————————————————————————————————— 
*/

import Database from "./typescript/backend/_common/classes/database.js";

const db = {
    audits: new Database("data/databases/audits.sqlite"),
    // contributors: new Database("data/databases/contributors.sqlite"),
    metadata: new Database("data/databases/metadata.sqlite")
};

// Populate databases on first run
// db.contributors.transaction((query) => {
    // if (!query("SELECT * FROM contributors LIMIT 1").success) { 
    //     query(`${config.folders.sql}/contributors.sql`); 
    // };
// });

// log.db.debug(db.contributors.query("SELECT * FROM contributors"));

/* 
————————————————————————————————————————————————————————————————
Identifier
———————————————————————————————————————————————————————————————— 
*/

import Identifier from "./typescript/backend/_common/classes/identifier.js";

// Recommended to export with the server managing databases
const id = new Identifier(db.audits);
const generatedHash = id.gen("HASH");

log.id.info("Generated identifier:", generatedHash);
log.id.info("Identifier type:", id.get(generatedHash));

/* 
————————————————————————————————————————————————————————————————
Url
———————————————————————————————————————————————————————————————— 
*/

import URL from "./typescript/backend/_common/classes/url.js";

const url = new URL("http://guthib.io/about?page=1#top");
url.updateProtocol("https");
url.updateSubdomain("www");
url.updateDomain("github.com");
url.updatePath("search");
url.updateQuery("page", "2");
url.updateHash("bottom");

log.network.info(url);

/* 
————————————————————————————————————————————————————————————————
Webclient
———————————————————————————————————————————————————————————————— 
*/

import Webclient from "./typescript/backend/_common/classes/webclient.js";
import parseDuration from "./typescript/backend/_common/helpers/parseDuration.js";

// Recommended to export with the server managing databases
const wc = new Webclient(config.crawler, db.metadata);

log.network.info(await wc.getMetadata(url.href));

// Recommended to run with cron
log.network.info(wc.clearCache(parseDuration("1d")));

/* 
————————————————————————————————————————————————————————————————
Backup
———————————————————————————————————————————————————————————————— 
*/

// import backupService from "./typescript/backend/_common/services/backup.service.js";

// backupService(config.folders.data, config.folders.backups);

/* 
————————————————————————————————————————————————————————————————
I18n
———————————————————————————————————————————————————————————————— 
*/

import I18nService from "./typescript/backend/_common/services/i18n.service.js";

const i18n = await I18nService.load(
    { 
        localesPath: "/public/locales", 
        locale: "en", 
        defaultLocale: config.metadata.locale 
    }
);

log.i18n.info(i18n.t("maintenance.reason"))