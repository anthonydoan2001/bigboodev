import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🖼️  Setting Secret Wars collection image...\n');

  // Find Secret Wars collection
  const collection = await prisma.collection.findFirst({
    where: { name: 'Secret Wars' },
  });

  if (!collection) {
    console.error('❌ Secret Wars collection not found!');
    console.log('   Please seed the collection first by clicking "Seed Secret Wars" on the collections page.\n');
    process.exit(1);
  }

  // Update with image URL
  const imageUrl = '/collections/secret-wars.jpg';
  
  const updatedCollection = await prisma.collection.update({
    where: { id: collection.id },
    data: {
      imageUrl,
    },
  });

  console.log('✅ Successfully set Secret Wars collection image!');
  console.log(`   Collection: ${updatedCollection.name}`);
  console.log(`   Image URL: ${updatedCollection.imageUrl}\n`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
