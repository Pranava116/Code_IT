const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");

/**
 * Builds a map of all nodes for a project, then constructs their full paths.
 * Returns an array of objects: { node, fullPath }
 */
async function getProjectFiles(projectId) {
  const nodes = await prisma.node.findMany({
    where: { projectId, deletedAt: null },
  });

  const nodeMap = new Map();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const getPath = (node) => {
    let current = node;
    let parts = [];
    while (current) {
      parts.unshift(current.name);
      if (current.parentId) {
        current = nodeMap.get(current.parentId);
      } else {
        current = null;
      }
    }
    return path.join(...parts);
  };

  const files = nodes.map((n) => ({
    node: n,
    fullPath: getPath(n),
  }));

  return files;
}

module.exports = { getProjectFiles, prisma };
