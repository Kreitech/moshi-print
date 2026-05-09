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
    create: { name: "Moshicrea", slug: "moshicrea" },
  });

  await prisma.tenantMember.upsert({
    where: { tenant_id_user_id: { tenant_id: tenant.id, user_id: ownerUserId } },
    update: {},
    create: { tenant_id: tenant.id, user_id: ownerUserId, role: "owner" },
  });

  // Seed printers
  const fdmPrinter = await prisma.printer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      tenant_id: tenant.id,
      name: "Bambu Lab P1S",
      type: "FDM",
      model_name: "P1S",
    },
  });

  const resinPrinter = await prisma.printer.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      tenant_id: tenant.id,
      name: "Elegoo Saturn 3",
      type: "resin",
      model_name: "Saturn 3 Ultra",
    },
  });

  // Seed materials
  const pla = await prisma.material.upsert({
    where: { id: "00000000-0000-0000-0000-000000000010" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000010",
      tenant_id: tenant.id,
      name: "PLA Blanco",
      brand: "Bambu",
      type: "PLA",
      color: "#FFFFFF",
    },
  });

  const petg = await prisma.material.upsert({
    where: { id: "00000000-0000-0000-0000-000000000011" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000011",
      tenant_id: tenant.id,
      name: "PETG Transparente",
      brand: "Bambu",
      type: "PETG",
      color: "#E0F0FF",
    },
  });

  const resinMat = await prisma.material.upsert({
    where: { id: "00000000-0000-0000-0000-000000000012" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000012",
      tenant_id: tenant.id,
      name: "Resina ABS-Like Gris",
      brand: "Elegoo",
      type: "resin",
      color: "#808080",
    },
  });

  console.log(`Seeded: tenant "${tenant.name}" (${tenant.id})`);
  console.log(`Seeded: owner member → user ${ownerUserId}`);
  console.log(`Seeded: printers — ${fdmPrinter.name}, ${resinPrinter.name}`);
  console.log(`Seeded: materials — ${pla.name}, ${petg.name}, ${resinMat.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
