// Safety guard for maintenance scripts that touch the database.
//
// Destructive / bulk scripts only run when NODE_ENV=development AND the Mongo URI points
// at localhost, unless `--force` is passed explicitly.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const getMongoUri = () => process.env.MONGO_URI || process.env.mongoURI || "";

// Parse host(s) and database name without ever printing credentials.
const describeMongoUri = (uri) => {
  const match = /^mongodb(\+srv)?:\/\/(?:[^@/]*@)?([^/?]+)(?:\/([^?]*))?/.exec(uri || "");
  if (!match) return { hosts: [], dbName: "", srv: false };
  const hosts = match[2].split(",").map((h) => h.replace(/:\d+$/, "").toLowerCase());
  return { hosts, dbName: decodeURIComponent(match[3] || ""), srv: Boolean(match[1]) };
};

const isLocalUri = (uri) => {
  const { hosts, srv } = describeMongoUri(uri);
  return !srv && hosts.length > 0 && hosts.every((h) => LOCAL_HOSTS.has(h));
};

const assertSafeTarget = ({ scriptName, destructive = true } = {}) => {
  const uri = getMongoUri();
  if (!uri) {
    console.error(`[${scriptName}] MONGO_URI is not set.`);
    process.exit(1);
  }
  const force = process.argv.includes("--force");
  const local = isLocalUri(uri);
  const dev = process.env.NODE_ENV === "development";
  const { dbName } = describeMongoUri(uri);

  if (destructive && !force && !(dev && local)) {
    console.error(
      `[${scriptName}] Refusing to run: this script modifies/reads bulk data and the target ` +
        `database "${dbName || "(default)"}" is ${local ? "local" : "NOT local"} with NODE_ENV=${
          process.env.NODE_ENV || "(unset)"
        }.\n` +
        `Run it with NODE_ENV=development against a localhost MongoDB, or pass --force if you are certain.`,
    );
    process.exit(1);
  }

  console.log(`[${scriptName}] Target database: "${dbName || "(default)"}" (${local ? "local" : "remote"})`);
  return uri;
};

module.exports = { assertSafeTarget, isLocalUri, describeMongoUri, getMongoUri };
