const { Server } = require("@hocuspocus/server");
const { PrismaClient } = require("@prisma/client");
const Y = require("yjs");

const prisma = new PrismaClient();

const server = new Server({
  port: 1234,
  debounce: 5000, // Save 5 seconds after the last change
  async onAuthenticate(data) {
    return {
      user: {
        id: data.connection?.identifier || Math.random().toString(),
        name: data.token || "Anonymous",
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      },
    };
  },
  async onLoadDocument(data) {
    // Check if we have a version in the DB
    try {
      const latestVersion = await prisma.documentVersion.findFirst({
        where: { nodeId: data.documentName },
        orderBy: { createdAt: "desc" },
      });

      if (latestVersion && latestVersion.content) {
        const uint8Array = Buffer.from(latestVersion.content, "base64");
        Y.applyUpdate(data.document, uint8Array);
      }
    } catch (error) {
      console.error("Error loading document from DB:", error);
    }
    return data.document;
  },
  async onStoreDocument(data) {
    try {
      const state = Y.encodeStateAsUpdate(data.document);
      const base64State = Buffer.from(state).toString("base64");

      // We just create a new row every time we save. 
      // A more complex system would update a 'draft' row and only create a snapshot every 5 minutes.
      await prisma.documentVersion.create({
        data: {
          nodeId: data.documentName,
          content: base64State,
        },
      });
      console.log(`Saved snapshot for document ${data.documentName}`);
    } catch (error) {
      console.error("Error saving document to DB:", error);
    }
  },
});

server.listen();
console.log("Hocuspocus Server listening on ws://127.0.0.1:1234");
