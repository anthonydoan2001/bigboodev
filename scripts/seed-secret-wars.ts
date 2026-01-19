import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeriesBookEntry {
  series: string;
  issues: string[];
}

interface PhaseData {
  phase: string;
  entries: SeriesBookEntry[];
}

// Secret Wars reading order based on the screenshot
const SECRET_WARS_READING_ORDER: PhaseData[] = [
  {
    phase: 'Avengers World',
    entries: [
      { series: 'Astonishing Tales', issues: ['1', '2', '3', '4', '5', '6'] },
      { series: 'Shang-Chi Master of Kung Fu Super Issue', issues: ['1'] },
      { series: 'New Avengers', issues: ['1', '2', '3'] },
      { series: 'Avengers', issues: ['1', '2', '3', '4'] },
      { series: 'New Avengers', issues: ['4'] },
      { series: 'Avengers', issues: ['5'] },
      { series: 'New Avengers', issues: ['5', '6'] },
      { series: 'Avengers', issues: ['6', '7', '8', '9', '10', '11', '12', '13'] },
      { series: 'New Avengers', issues: ['7'] },
    ],
  },
  {
    phase: 'Infinity',
    entries: [
      { series: 'Avengers', issues: ['14', '15', '16', '17'] },
      { series: 'New Avengers', issues: ['8'] },
      { series: 'Infinity', issues: ['1'] },
      { series: 'Avengers', issues: ['18'] },
      { series: 'New Avengers', issues: ['9'] },
      { series: 'Infinity', issues: ['2'] },
      { series: 'Avengers', issues: ['19'] },
      { series: 'New Avengers', issues: ['10'] },
      { series: 'Infinity', issues: ['3'] },
      { series: 'Avengers', issues: ['20'] },
      { series: 'Infinity', issues: ['4'] },
      { series: 'Avengers', issues: ['21'] },
      { series: 'New Avengers', issues: ['11'] },
      { series: 'Infinity', issues: ['5'] },
      { series: 'Avengers', issues: ['22', '23'] },
      { series: 'Infinity', issues: ['6'] },
      { series: 'New Avengers', issues: ['12', '13'] },
    ],
  },
  {
    phase: 'The Incursions',
    entries: [
      { series: 'New Avengers', issues: ['14', '15'] },
      { series: 'Avengers', issues: ['24', '25', '26', '27', '28'] },
      { series: 'New Avengers', issues: ['16', '17'] },
      { series: 'Avengers', issues: ['29', '30', '31', '32', '33', '34'] },
      { series: 'New Avengers', issues: ['18', '19', '20', '21', '22', '23'] },
    ],
  },
  {
    phase: 'Time Runs Out',
    entries: [
      { series: 'Avengers', issues: ['35'] },
      { series: 'New Avengers', issues: ['24'] },
      { series: 'Avengers', issues: ['36'] },
      { series: 'New Avengers', issues: ['25'] },
      { series: 'Avengers', issues: ['37'] },
      { series: 'New Avengers', issues: ['26'] },
      { series: 'Avengers', issues: ['38'] },
      { series: 'New Avengers', issues: ['27'] },
      { series: 'Avengers', issues: ['39'] },
      { series: 'New Avengers', issues: ['28'] },
      { series: 'Avengers', issues: ['40'] },
      { series: 'New Avengers', issues: ['29'] },
      { series: 'Avengers', issues: ['41'] },
      { series: 'New Avengers', issues: ['30'] },
      { series: 'Avengers', issues: ['42'] },
      { series: 'New Avengers', issues: ['31', '32'] },
      { series: 'Avengers', issues: ['43'] },
      { series: 'New Avengers', issues: ['33'] },
      { series: 'Avengers', issues: ['44'] },
    ],
  },
];

async function main() {
  console.log('🌱 Seeding Secret Wars collection...\n');

  // Check if collection already exists
  const existingCollection = await prisma.collection.findFirst({
    where: { name: 'Secret Wars' },
  });

  if (existingCollection) {
    console.log('⚠️  Secret Wars collection already exists!');
    console.log(`   Collection ID: ${existingCollection.id}`);
    console.log('\n   To recreate it, delete the existing collection first.');
    process.exit(0);
  }

  // Create the collection
  const collection = await prisma.collection.create({
    data: {
      name: 'Secret Wars',
      description: "Jonathan Hickman's Secret Wars reading order",
    },
  });

  console.log(`✅ Created collection: ${collection.name} (ID: ${collection.id})\n`);

  // Create items - we'll add them as series references since we can't search Komga from here
  // The user will need to manually match them or use the API endpoint after logging in
  const items: Array<{ collectionId: string; seriesId: string | null; bookId: string | null; phase: string; order: number }> = [];
  let globalOrder = 0;

  for (const phaseData of SECRET_WARS_READING_ORDER) {
    console.log(`📚 Processing phase: ${phaseData.phase}`);
    
    for (const entry of phaseData.entries) {
      // For now, we'll create placeholder items with just the series name
      // The user will need to match these with actual Komga series/book IDs
      // Or they can use the API endpoint which searches Komga automatically
      
      // We'll create items that reference series by name in a comment/description
      // Actually, let's just create the structure and note that series/book IDs need to be filled in
      for (const issue of entry.issues) {
        items.push({
          collectionId: collection.id,
          seriesId: null, // Will need to be filled in via API or manually
          bookId: null, // Will need to be filled in via API or manually
          phase: phaseData.phase,
          order: globalOrder++,
        });
      }
    }
  }

  console.log(`\n📝 Created ${items.length} placeholder items.`);
  console.log('\n⚠️  Note: These items need to be matched with actual Komga series/book IDs.');
  console.log('   You can either:');
  console.log('   1. Use the API endpoint: POST /api/komga/collections/seed/secret-wars (after logging in)');
  console.log('   2. Manually update the collection_items table with series_id or book_id values');
  console.log('\n   The API endpoint will automatically search your Komga server and match series/books.\n');

  // Don't create empty items - instead, let's delete the collection and tell them to use the API
  await prisma.collection.delete({
    where: { id: collection.id },
  });

  console.log('❌ Collection creation cancelled.');
  console.log('\n💡 To properly seed the collection with actual Komga data:');
  console.log('   1. Make sure your dev server is running: npm run dev');
  console.log('   2. Log in at http://localhost:3000/login');
  console.log('   3. Open browser console and run:');
  console.log('      fetch("/api/komga/collections/seed/secret-wars", { method: "POST" })');
  console.log('        .then(r => r.json())');
  console.log('        .then(console.log)');
  console.log('\n   Or visit the endpoint directly in your browser after logging in.\n');

  await prisma.$disconnect();
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
