import mongoose from "mongoose";
import dns from "node:dns";

let isConnected = false;

const configureDns = () => {
  const configuredServers = process.env.MONGODB_DNS_SERVERS?.split(",")
    .map((server) => server.trim())
    .filter(Boolean);

  if (configuredServers?.length) {
    dns.setServers(configuredServers);
    return;
  }

  const nodeDnsServers = dns.getServers();
  const usesLocalDns = nodeDnsServers.some((server) => server === "127.0.0.1" || server === "::1");

  if (usesLocalDns) {
    dns.setServers(["1.1.1.1", "8.8.8.8"]);
  }
};

const DbConnect = async () => {
  if (isConnected) return;
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is missing");
    }

    configureDns();
    await mongoose.connect(uri);

    isConnected = true;

    console.log("MongoDB connected successfully");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("failed to connect to db", message);
    throw error;
  }
};

export default DbConnect;
