import { prisma } from "../src/db";

async function main() {
  const existing = await prisma.site.findFirst({ where: { url: "https://example.com" } });
  if (existing) {
    console.log("Demo site already exists, skipping.");
    return;
  }

  await prisma.site.create({
    data: {
      name: "Example (demo)",
      url: "https://example.com",
      checkIntervalSeconds: 60,
    },
  });
  console.log("Seeded demo site: https://example.com");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
