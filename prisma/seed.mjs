import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DIRECT_URL;

if (!connectionString?.match(/^postgres(?:ql)?:\/\//)) {
  throw new Error("DIRECT_URL must be configured before seeding.");
}

const prisma = new PrismaClient({
  datasourceUrl: connectionString,
});

async function main() {
  await prisma.team.upsert({
    where: { slug: "a-and-a" },
    update: {},
    create: {
      name: "A&A",
      slug: "a-and-a",
    },
  });
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
