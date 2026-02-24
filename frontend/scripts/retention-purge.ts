import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  const suppressions = await prisma.suppression.findMany({
    select: { linkedinUrl: true },
  });
  const suppressedUrls = new Set(suppressions.map((row) => row.linkedinUrl));

  const expiredPeople = await prisma.person.findMany({
    where: {
      dataExpiresAt: { lt: now },
      prospect: { isNot: null },
    },
    select: {
      id: true,
      linkedinUrl: true,
      prospect: {
        select: { id: true },
      },
    },
  });

  let purgedPeople = 0;
  let purgedNotes = 0;

  for (const person of expiredPeople) {
    if (suppressedUrls.has(person.linkedinUrl)) {
      continue;
    }

    if (person.prospect) {
      const deleted = await prisma.prospectNote.deleteMany({
        where: { prospectId: person.prospect.id },
      });
      purgedNotes += deleted.count;
    }

    await prisma.person.update({
      where: { id: person.id },
      data: {
        about: null,
        experience: Prisma.DbNull,
        education: Prisma.DbNull,
        languages: Prisma.DbNull,
        linkedinPosts: Prisma.DbNull,
        linkedinActivity: Prisma.DbNull,
        activityFetchedAt: null,
        dataExpiresAt: null,
      },
    });

    purgedPeople += 1;
  }

  console.log(
    JSON.stringify(
      {
        success: true,
        checked: expiredPeople.length,
        purgedPeople,
        purgedNotes,
        skippedSuppressed: expiredPeople.length - purgedPeople,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
