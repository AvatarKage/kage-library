import fs from "fs";

export function loadSql(sqlOrFile: string) {
    if (sqlOrFile.endsWith(".sql")) {
        return fs.readFileSync(sqlOrFile, "utf-8");
    }
    return sqlOrFile;
}