import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ownerUserId = process.env.SEED_OWNER_USER_ID;
  if (!ownerUserId) {
    throw new Error("SEED_OWNER_USER_ID env var is required");
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: "moshicrea" },
    update: {},
    create: {
      name: "Moshicrea",
      slug: "moshicrea",
    },
  });

  await prisma.tenantMember.upsert({
    where: {
      tenant_id_user_id: {
        tenant_id: tenant.id,
        user_id: ownerUserId,
      },
    },
    update: {},
    create: {
      tenant_id: tenant.id,
      user_id: ownerUserId,
      role: "owner",
    },
  });

  console.log(`Seeded: tenant "${tenant.name}" (${tenant.id})`);
  console.log(`Seeded: owner member → user ${ownerUserId}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
