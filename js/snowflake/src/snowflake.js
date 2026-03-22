import config from "../../../config/index.js";
import log from "../../logging/index.js";
class Snowflake {
    epoch;
    sequence;
    lastTimestamp;
    machineId;
    constructor(epoch = 1577836800000, machine = 0) {
        if (machine < 0 || machine > 1024) {
            throw new Error('Machine ID must be between 0 and 1024');
        }
        this.machineId = machine;
        this.epoch = BigInt(epoch);
        this.sequence = 0n;
        this.lastTimestamp = 0n;
    }
    currentTime() {
        return BigInt(Date.now());
    }
    decode(id) {
        const bigintId = BigInt(id);
        const timestamp = (bigintId >> 22n) + this.epoch;
        return new Date(Number(timestamp));
    }
    generate() {
        let timestamp = this.currentTime();
        if (timestamp === this.lastTimestamp) {
            this.sequence = (this.sequence + 1n) & 0xfffn;
            if (this.sequence === 0n) {
                while (timestamp <= this.lastTimestamp) {
                    timestamp = this.currentTime();
                }
            }
        }
        else {
            this.sequence = 0n;
        }
        this.lastTimestamp = timestamp;
        const id = ((timestamp - this.epoch) << 22n) | (BigInt(this.machineId) << 12n) | this.sequence;
        if (config.debug.snowflake) {
            log.snowflake.trace(`Generated: ${id.toString()}`);
        }
        return id.toString();
    }
}
export default Snowflake;
//# sourceMappingURL=snowflake.js.map