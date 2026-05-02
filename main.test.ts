import { 
    // Classes
    Database,
    Identifier,
    Logger,
    Snowflake,
    URL,
    WebClient,
    // WsClient (FRONTEND-ONLY),

    // Helpers
    cleanJSON,
    convertNumber,
    formatNumber,
    // getReqUrl,
    pad,
    parseDuration,
    // shutdownServer,

    // Services
    // backupService,
    // I18nService
} from "kage-library";

/* 
————————————————————————————————————————————————————————————————
Logger
———————————————————————————————————————————————————————————————— 
*/

// Recommended to export per server
export const log = new Logger({
    path: "/logs/sandbox", 
    useNerdFonts: true // https://nerdfonts.com
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
    "2026-01-01T00:00:00.000Z", 
    0
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
WebClient
———————————————————————————————————————————————————————————————— 
*/

// Recommended to export with the server managing databases
const wc = new WebClient({ 
    crawler: {
        name: "Example",
        version: "1.0",
        website: "https://example.com",
        contact: "admin@example.com"
    }, 
    database: db.metadata,
    useSecureSSL: false
});

const metadata = await wc.getMetadata(url.href)

log.network.info(metadata);

// Recommended to run with cron
log.network.info(wc.clearCache(parseDuration("1d")));

/* 
————————————————————————————————————————————————————————————————
Backup
———————————————————————————————————————————————————————————————— 
*/

// import backupService from "./typescript/backend/_common/services/backup.service.js";

// backupService("/my-app/data", "/my-app/backups");

/* 
————————————————————————————————————————————————————————————————
I18n
———————————————————————————————————————————————————————————————— 
*/

// const i18n = await I18nService.load(
//     { 
//         localesPath: "/public/locales", 
//         locale: "en", 
//        defaultLocale: "en-US"
//     }
// );

// log.i18n.info(i18n.t("maintenance.reason"))

/* 
————————————————————————————————————————————————————————————————
Helpers
———————————————————————————————————————————————————————————————— 
*/

log.test.info(cleanJSON(metadata)) // Removes all empty and undefined/null entries
log.test.info(convertNumber("One apple", "numbers")) // 1 apple
log.test.info(formatNumber(1234567)) // { string: "1,234,567", short: "1.2M", long: "1.2 Million" }
log.test.info(pad(42, 5)) // "00042"
log.test.info(parseDuration("7d")) // 604800000