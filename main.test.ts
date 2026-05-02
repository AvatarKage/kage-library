import { Database, Identifier, Logger, parseDuration, Snowflake, URL, Webclient } from "kage-library";

import { config } from "./app.config.js";

/* 
————————————————————————————————————————————————————————————————
Logger
———————————————————————————————————————————————————————————————— 
*/

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

// Recommended to export with the server managing databases
const wc = new Webclient({ 
    crawler: config.crawler, 
    database: db.metadata,
    useSecureSSL: config.isProduction
});

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

// const i18n = await I18nService.load(
//     { 
//         localesPath: "/public/locales", 
//         locale: "en", 
//        defaultLocale: config.metadata.locale 
//     }
// );

// log.i18n.info(i18n.t("maintenance.reason"))